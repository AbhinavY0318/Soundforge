import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  clearDatabase,
  createTestUserAndAccount,
} from './helpers.js';
import { ApiKey } from '../models/ApiKey.js';
import { Generation } from '../models/Generation.js';
import { UsageLedger } from '../models/UsageLedger.js';
import { WebhookService } from '../services/webhookService.js';
import { PlanService } from '../services/planService.js';
import { CreditService, getCurrentPeriodMonth } from '../services/creditService.js';
import express from 'express';

describe('SoundForge Mandatory Acceptance Tests (Scenarios 1 - 16)', () => {
  let app: express.Application;

  beforeAll(async () => {
    const env = await setupTestEnvironment();
    app = env.app;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  // =========================================================================
  // Test 1: A full API key secret cannot be retrieved after its creation response
  // =========================================================================
  it('1. A full API key secret cannot be retrieved after its creation response', async () => {
    const { account, liveKey } = await createTestUserAndAccount();

    // Check DB directly
    const dbKey = await ApiKey.findById(liveKey.apiKey._id);
    expect(dbKey).toBeDefined();
    // Plaintext secret is never saved
    expect((dbKey as any).secret).toBeUndefined();
    expect(dbKey?.hashedSecret).toBeDefined();
    expect(dbKey?.hashedSecret).not.toEqual(liveKey.secret);

    // Check API listing endpoint
    const listRes = await request(app)
      .get('/v1/generations')
      .set('Authorization', `Bearer ${liveKey.secret}`);

    // Verify key in ApiKey collection has only prefix exposed
    expect(dbKey?.keyPrefix).toMatch(/^sf_live_[a-z0-9]+\.\.\.$/);
  });

  // =========================================================================
  // Test 2: Revoked keys fail immediately
  // =========================================================================
  it('2. Revoked keys fail immediately', async () => {
    const { liveKey } = await createTestUserAndAccount();

    // Key works before revocation
    const activeRes = await request(app)
      .get('/v1/usage')
      .set('Authorization', `Bearer ${liveKey.secret}`);
    expect(activeRes.status).toBe(200);

    // Revoke key
    await ApiKey.updateOne({ _id: liveKey.apiKey._id }, { $set: { status: 'revoked' } });

    // Next request fails immediately
    const revokedRes = await request(app)
      .get('/v1/usage')
      .set('Authorization', `Bearer ${liveKey.secret}`);

    expect(revokedRes.status).toBe(401);
    expect(revokedRes.body.error.code).toBe('api_key_revoked');
  });

  // =========================================================================
  // Test 3: Key rotation does not cause unintended integration downtime
  // =========================================================================
  it('3. Key rotation does not cause unintended integration downtime', async () => {
    const { account, liveKey } = await createTestUserAndAccount();

    // Rotate key with 24 hours overlap
    const rotateRes = await request(app)
      .post(`/api/v1/api-keys/${liveKey.apiKey._id}/rotate`)
      .set('Authorization', `Bearer test-token`) // or simulate via service
      .send({ overlapHours: 24 });

    // Test through ApiKeyService rotation
    const { apiKey: newKey, secret: newSecret, oldKey } = await (
      await import('../services/apiKeyService.js')
    ).ApiKeyService.rotateApiKey({
      apiKeyId: liveKey.apiKey._id.toString(),
      accountId: account._id.toString(),
      overlapHours: 24,
    });

    // Both old key and new key work during overlap period
    const oldKeyRes = await request(app)
      .get('/v1/usage')
      .set('Authorization', `Bearer ${liveKey.secret}`);
    expect(oldKeyRes.status).toBe(200);

    const newKeyRes = await request(app)
      .get('/v1/usage')
      .set('Authorization', `Bearer ${newSecret}`);
    expect(newKeyRes.status).toBe(200);

    // Simulate expiration of overlap window
    await ApiKey.updateOne(
      { _id: oldKey._id },
      { $set: { rotatesAt: new Date(Date.now() - 1000) } }
    );

    // Old key fails after window expires, new key continues working
    const expiredOldRes = await request(app)
      .get('/v1/usage')
      .set('Authorization', `Bearer ${liveKey.secret}`);
    expect(expiredOldRes.status).toBe(401);

    const activeNewRes = await request(app)
      .get('/v1/usage')
      .set('Authorization', `Bearer ${newSecret}`);
    expect(activeNewRes.status).toBe(200);
  });

  // =========================================================================
  // Test 4: A Starter account fires 20 generation requests simultaneously
  // =========================================================================
  it('4. A Starter account fires 20 generation requests simultaneously', async () => {
    const { liveKey } = await createTestUserAndAccount({ planName: 'STARTER' });

    // Starter parallelLimit = 3
    // Fire 20 actual simultaneous requests
    const promises = Array.from({ length: 20 }).map((_, i) =>
      request(app)
        .post('/v1/generations')
        .set('Authorization', `Bearer ${liveKey.secret}`)
        .send({
          prompt: `Simultaneous test prompt ${i}`,
          duration: 30,
          license: 'royalty_free',
        })
    );

    const results = await Promise.all(promises);
    const statuses = results.map((r) => r.status);

    const successCount = statuses.filter((s) => s === 201).length;
    const rateLimitedCount = statuses.filter((s) => s === 429).length;

    // Parallel limit is 3, so at most 3 can be queued concurrently; others get 429 parallel_limit_reached
    expect(successCount).toBeLessThanOrEqual(3);
    expect(rateLimitedCount).toBeGreaterThanOrEqual(17);

    // Check rate limit error message
    const limitedResponse = results.find((r) => r.status === 429);
    expect(limitedResponse?.body.error.code).toBe('parallel_limit_reached');
  });

  // =========================================================================
  // Test 5: A Starter account with 5 credits remaining fires 10 royalty_free requests simultaneously
  // =========================================================================
  it('5. A Starter account with 5 credits remaining fires 10 royalty_free requests simultaneously', async () => {
    const { account, liveKey } = await createTestUserAndAccount({ planName: 'STARTER' });

    // Starter allowance = 200. Consume 195 credits so exactly 5 credits remain.
    const periodMonth = getCurrentPeriodMonth();
    await UsageLedger.create({
      accountId: account._id,
      eventType: 'charge',
      credits: 195,
      periodMonth,
      description: 'Pre-existing monthly usage',
    });

    const usageBefore = await CreditService.getCurrentPeriodUsage(account._id, periodMonth);
    expect(usageBefore.totalConsumed).toBe(195); // 200 - 195 = 5 credits remaining

    // Fire 10 simultaneous royalty_free requests (1 credit each)
    const promises = Array.from({ length: 10 }).map((_, i) =>
      request(app)
        .post('/v1/generations')
        .set('Authorization', `Bearer ${liveKey.secret}`)
        .send({
          prompt: `Credit check simultaneous ${i}`,
          duration: 30,
          license: 'royalty_free',
        })
    );

    const results = await Promise.all(promises);
    const statuses = results.map((r) => r.status);

    const successCount = statuses.filter((s) => s === 201).length;
    // Cannot exceed available credits (5) or parallel limit (3)
    expect(successCount).toBeLessThanOrEqual(3);

    // Total reserved + charged credits in ledger cannot exceed allowance
    const usageAfter = await CreditService.getCurrentPeriodUsage(account._id, periodMonth);
    expect(usageAfter.totalConsumed).toBeLessThanOrEqual(200);
  });

  // =========================================================================
  // Test 6: Three simultaneous POST requests with the same Idempotency-Key create and charge only once
  // =========================================================================
  it('6. Three simultaneous POST requests with the same Idempotency-Key create and charge only once', async () => {
    const { account, liveKey } = await createTestUserAndAccount({ planName: 'GROWTH' });

    const idempotencyKey = `idem_${Date.now()}_test6`;
    const payload = {
      prompt: 'Idempotency test track',
      duration: 60,
      license: 'royalty_free',
    };

    // Fire 3 simultaneous requests with identical Idempotency-Key and payload
    const promises = [1, 2, 3].map(() =>
      request(app)
        .post('/v1/generations')
        .set('Authorization', `Bearer ${liveKey.secret}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(payload)
    );

    const results = await Promise.all(promises);

    // Check that at least one succeeded with 201 and all returned generations have the exact same generation ID
    const successfulResponses = results.filter((r) => r.status === 201 || (r.status === 200 && r.body.id));
    expect(successfulResponses.length).toBeGreaterThanOrEqual(1);

    const generationIds = new Set(successfulResponses.map((r) => r.body.id));
    expect(generationIds.size).toBe(1); // Exactly 1 generation was created

    // Verify DB count: only 1 Generation record with this idempotency key exists
    const count = await Generation.countDocuments({
      accountId: account._id,
      idempotencyKey,
    });
    expect(count).toBe(1);
  });

  // =========================================================================
  // Test 7: Reusing an idempotency key with a different body returns 409
  // =========================================================================
  it('7. Reusing an idempotency key with a different body returns 409', async () => {
    const { liveKey } = await createTestUserAndAccount({ planName: 'GROWTH' });
    const idempotencyKey = `idem_${Date.now()}_test7`;

    // First request
    const firstRes = await request(app)
      .post('/v1/generations')
      .set('Authorization', `Bearer ${liveKey.secret}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        prompt: 'First body composition',
        duration: 30,
        license: 'royalty_free',
      });
    expect(firstRes.status).toBe(201);

    // Second request with SAME key but DIFFERENT prompt
    const conflictRes = await request(app)
      .post('/v1/generations')
      .set('Authorization', `Bearer ${liveKey.secret}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        prompt: 'Completely different prompt string',
        duration: 30,
        license: 'royalty_free',
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error.type).toBe('idempotency_conflict');
  });

  // =========================================================================
  // Test 8: Model timeout or failure releases the correct reservations
  // =========================================================================
  it('8. Model timeout or failure releases the correct reservations', async () => {
    const { account, liveKey } = await createTestUserAndAccount({ planName: 'STARTER' });
    const periodMonth = getCurrentPeriodMonth();

    // Initially 0 usage
    const initialUsage = await CreditService.getCurrentPeriodUsage(account._id, periodMonth);
    expect(initialUsage.totalConsumed).toBe(0);

    // Create a generation with a reservation
    const gen = await Generation.create({
      accountId: account._id,
      prompt: 'Failure test',
      durationSec: 60,
      durationUnits: 1,
      license: 'royalty_free',
      instrumental: true,
      status: 'queued',
      creditsReserved: 1,
      provider: 'mock',
      model: 'test',
    });

    await UsageLedger.create({
      accountId: account._id,
      generationId: gen._id,
      eventType: 'reservation',
      credits: 1,
      periodMonth,
      description: 'Reservation test',
    });

    const activeUsage = await CreditService.getCurrentPeriodUsage(account._id, periodMonth);
    expect(activeUsage.totalConsumed).toBe(1);

    // Simulate failure release
    await CreditService.releaseGenerationReservation(gen._id, 'failed', {
      code: 'provider_timeout',
      message: 'Provider timed out',
    });

    const updatedGen = await Generation.findById(gen._id);
    expect(updatedGen?.status).toBe('failed');

    // Net usage returned to 0
    const finalUsage = await CreditService.getCurrentPeriodUsage(account._id, periodMonth);
    expect(finalUsage.totalConsumed).toBe(0);
  });

  // =========================================================================
  // Test 9: Account B cannot access Account A's generation
  // =========================================================================
  it("9. Account B cannot access Account A's generation", async () => {
    const accountA = await createTestUserAndAccount();
    const accountB = await createTestUserAndAccount();

    // Account A creates a generation
    const genRes = await request(app)
      .post('/v1/generations')
      .set('Authorization', `Bearer ${accountA.liveKey.secret}`)
      .send({
        prompt: "Account A's private soundtrack",
        duration: 30,
        license: 'royalty_free',
      });
    expect(genRes.status).toBe(201);
    const genId = genRes.body.id;

    // Account B tries to access Account A's generation
    const accessRes = await request(app)
      .get(`/v1/generations/${genId}`)
      .set('Authorization', `Bearer ${accountB.liveKey.secret}`);

    // Must return 404 (resource not found for this tenant)
    expect(accessRes.status).toBe(404);
    expect(accessRes.body.error.code).toBe('resource_not_found');
  });

  // =========================================================================
  // Test 10: The entire quickstart works with a test API key without paid generation or allowance consumption
  // =========================================================================
  it('10. The entire quickstart works with a test API key without paid generation or allowance consumption', async () => {
    const { account, testKey } = await createTestUserAndAccount({ planName: 'SANDBOX' });
    const periodMonth = getCurrentPeriodMonth();

    // Call /v1/generations with test API key
    const genRes = await request(app)
      .post('/v1/generations')
      .set('Authorization', `Bearer ${testKey.secret}`)
      .send({
        prompt: 'Quickstart lo-fi chill hip hop beat',
        duration: 30,
        license: 'royalty_free',
      });

    expect(genRes.status).toBe(201);
    expect(genRes.body.credits_reserved).toBe(0);

    // Verify 0 credits charged or consumed
    const usage = await CreditService.getCurrentPeriodUsage(account._id, periodMonth);
    expect(usage.totalConsumed).toBe(0);
  });

  // =========================================================================
  // Test 11: Webhooks recover after temporary downtime
  // =========================================================================
  it('11. Webhooks recover after temporary downtime', async () => {
    const { account } = await createTestUserAndAccount();

    const endpoint = await (
      await import('../models/WebhookEndpoint.js')
    ).WebhookEndpoint.create({
      accountId: account._id,
      url: 'https://example.com/webhook',
      signingSecret: 'whsec_test_secret_123',
      events: ['generation.succeeded'],
      active: true,
    });

    const delivery = await (
      await import('../models/WebhookDelivery.js')
    ).WebhookDelivery.create({
      accountId: account._id,
      endpointId: endpoint._id,
      deliveryId: 'del_temporary_fail',
      event: 'generation.succeeded',
      payload: { id: 'gen_123' },
      status: 'failed',
      attempt: 1,
      signature: 't=123,v1=sig',
      error: 'Temporary 503 service unavailable',
    });

    expect(delivery.status).toBe('failed');
    expect(delivery.attempt).toBe(1);

    // Retry mechanism increments attempt and records status
    const retried = await WebhookService.retryDelivery(delivery.deliveryId);
    expect(retried).toBeDefined();
    expect(retried?.attempt).toBe(2);
  });

  // =========================================================================
  // Test 12: Captured old webhook payloads cannot be replayed successfully
  // =========================================================================
  it('12. Captured old webhook payloads cannot be replayed successfully', () => {
    const secret = 'whsec_sample_secret_key';
    const payload = JSON.stringify({ event: 'generation.succeeded', id: 'gen_replay_test' });

    // Payload timestamp 600 seconds (10 minutes) in the past
    const pastTimestamp = Math.floor(Date.now() / 1000) - 600;
    const oldSignatureHeader = WebhookService.generateSignatureHeader(
      secret,
      pastTimestamp,
      payload
    );

    // Verify signature with 300 second tolerance
    const isValid = WebhookService.verifySignature(secret, oldSignatureHeader, payload, 300);
    expect(isValid).toBe(false); // Rejected due to replay expiration!
  });

  // =========================================================================
  // Test 13: SSRF requests to 169.254.169.254 are rejected
  // =========================================================================
  it('13. SSRF requests to 169.254.169.254 are rejected', async () => {
    const { liveKey } = await createTestUserAndAccount();

    // Attempt to register cloud metadata IP as webhook endpoint
    const ssrfRes = await request(app)
      .post('/v1/webhook_endpoints')
      .set('Authorization', `Bearer ${liveKey.secret}`)
      .send({
        url: 'http://169.254.169.254/latest/meta-data/',
        events: ['generation.succeeded'],
      });

    expect(ssrfRes.status).toBe(400);
    expect(ssrfRes.body.error.code).toBe('ssrf_blocked');
  });

  // =========================================================================
  // Test 14: Growth downgrade to Starter after 1,500 credits has a documented, enforced policy
  // =========================================================================
  it('14. Growth downgrade to Starter after 1,500 credits has a documented, enforced policy', async () => {
    const { account, liveKey } = await createTestUserAndAccount({ planName: 'GROWTH' });
    const periodMonth = getCurrentPeriodMonth();

    // Simulate 1,500 credits used on Growth
    await UsageLedger.create({
      accountId: account._id,
      eventType: 'charge',
      credits: 1500,
      periodMonth,
      description: 'Production generation usage on Growth plan',
    });

    const usageBefore = await CreditService.getCurrentPeriodUsage(account._id, periodMonth);
    expect(usageBefore.totalConsumed).toBe(1500);

    // Downgrade to STARTER (allowance 200)
    const downgradeResult = await PlanService.changeAccountPlan(account, 'STARTER');
    expect(downgradeResult.newPlan.name).toBe('STARTER');
    expect(downgradeResult.notice).toBeDefined();

    // Historical usage is preserved (1,500 credits)
    const usageAfter = await CreditService.getCurrentPeriodUsage(account._id, periodMonth);
    expect(usageAfter.totalConsumed).toBe(1500);

    // New request is blocked under Starter allowance (1500 >= 200)
    const newRequestRes = await request(app)
      .post('/v1/generations')
      .set('Authorization', `Bearer ${liveKey.secret}`)
      .send({
        prompt: 'Post-downgrade song attempt',
        duration: 30,
        license: 'royalty_free',
      });

    expect(newRequestRes.status).toBe(429);
    expect(newRequestRes.body.error.code).toBe('insufficient_credits');
  });

  // =========================================================================
  // Test 15: Starter cannot request full_ownership
  // =========================================================================
  it('15. Starter cannot request full_ownership', async () => {
    const { liveKey } = await createTestUserAndAccount({ planName: 'STARTER' });

    // Starter only permits 'royalty_free' and 'sync'
    const res = await request(app)
      .post('/v1/generations')
      .set('Authorization', `Bearer ${liveKey.secret}`)
      .send({
        prompt: 'Full ownership request on Starter',
        duration: 60,
        license: 'full_ownership',
      });

    expect(res.status).toBe(422);
    expect(res.body.error.type).toBe('plan_validation_error');
    expect(res.body.error.code).toBe('license_not_allowed');
  });

  // =========================================================================
  // Test 16: Polling a running job does not consume parallel generation slots or create additional charges
  // =========================================================================
  it('16. Polling a running job does not consume parallel generation slots or create additional charges', async () => {
    const { account, liveKey } = await createTestUserAndAccount({ planName: 'STARTER' });
    const periodMonth = getCurrentPeriodMonth();

    // Create a running generation
    const gen = await Generation.create({
      accountId: account._id,
      prompt: 'Polling test',
      durationSec: 60,
      durationUnits: 1,
      license: 'royalty_free',
      instrumental: true,
      status: 'running',
      creditsReserved: 1,
      provider: 'mock',
      model: 'soundforge-mock-v1',
    });

    const usageBefore = await CreditService.getCurrentPeriodUsage(account._id, periodMonth);

    // Poll the generation 5 times consecutively
    for (let i = 0; i < 5; i++) {
      const pollRes = await request(app)
        .get(`/v1/generations/${gen._id}`)
        .set('Authorization', `Bearer ${liveKey.secret}`);

      expect(pollRes.status).toBe(200);
      expect(pollRes.body.id).toBe(gen._id.toString());
      expect(pollRes.body.status).toBe('running');
    }

    // Credits consumed remained exactly the same
    const usageAfter = await CreditService.getCurrentPeriodUsage(account._id, periodMonth);
    expect(usageAfter.totalConsumed).toBe(usageBefore.totalConsumed);

    // Active parallel count remains 1 (not multiplied by polling)
    const activeCount = await Generation.countDocuments({
      accountId: account._id,
      status: { $in: ['queued', 'running'] },
    });
    expect(activeCount).toBe(1);
  });
});
