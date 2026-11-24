import crypto from 'crypto';
import axios from 'axios';
import { Types } from 'mongoose';
import { WebhookEndpoint, IWebhookEndpoint } from '../models/WebhookEndpoint.js';
import { WebhookDelivery, IWebhookDelivery } from '../models/WebhookDelivery.js';
import { validateWebhookUrl } from '../utils/ssrf.js';
import { computeHmacSha256, secureCompare } from '../utils/crypto.js';
import { logger } from '../config/logger.js';

export interface WebhookEventPayload {
  id: string;
  event: 'generation.succeeded' | 'generation.failed';
  created_at: string;
  data: Record<string, unknown>;
}

export class WebhookService {
  /**
   * Generates signature header: `t=TIMESTAMP,v1=SIGNATURE`
   */
  static generateSignatureHeader(secret: string, timestamp: number, payloadString: string): string {
    const signaturePayload = `${timestamp}.${payloadString}`;
    const signature = computeHmacSha256(secret, signaturePayload);
    return `t=${timestamp},v1=${signature}`;
  }

  /**
   * Verifies signature and guards against replay attacks.
   */
  static verifySignature(
    secret: string,
    signatureHeader: string,
    payloadString: string,
    toleranceSeconds = 300
  ): boolean {
    try {
      const parts = signatureHeader.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const signaturePart = parts.find((p) => p.startsWith('v1='));

      if (!timestampPart || !signaturePart) return false;

      const timestamp = parseInt(timestampPart.substring(2), 10);
      const signature = signaturePart.substring(3);

      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - timestamp) > toleranceSeconds) {
        // Replay attack prevention: expired timestamp
        return false;
      }

      const expectedSignature = computeHmacSha256(secret, `${timestamp}.${payloadString}`);
      return secureCompare(signature, expectedSignature);
    } catch {
      return false;
    }
  }

  /**
   * Delivers an event payload to a single webhook endpoint with SSRF verification.
   */
  static async deliverToEndpoint(
    endpoint: IWebhookEndpoint,
    event: string,
    payload: WebhookEventPayload
  ): Promise<IWebhookDelivery> {
    const deliveryId = `del_${crypto.randomBytes(12).toString('hex')}`;
    const payloadString = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.generateSignatureHeader(endpoint.signingSecret, timestamp, payloadString);

    const delivery = new WebhookDelivery({
      accountId: endpoint.accountId,
      endpointId: endpoint._id,
      deliveryId,
      event,
      payload,
      status: 'pending',
      attempt: 1,
      maxRetries: 5,
      signature,
    });

    const startTime = Date.now();

    try {
      // 1. SSRF URL validation
      await validateWebhookUrl(endpoint.url);

      // 2. Dispatch HTTP request with headers
      const response = await axios.post(endpoint.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SoundForge-Webhooks/1.0',
          'SoundForge-Signature': signature,
          'SoundForge-Delivery-Id': deliveryId,
          'SoundForge-Event': event,
        },
        timeout: 10000,
        validateStatus: () => true, // Don't throw on non-2xx status
      });

      delivery.durationMs = Date.now() - startTime;
      delivery.statusCode = response.status;
      delivery.responseBody = typeof response.data === 'string' ? response.data.substring(0, 1000) : JSON.stringify(response.data).substring(0, 1000);

      if (response.status >= 200 && response.status < 300) {
        delivery.status = 'success';
      } else {
        delivery.status = 'failed';
        delivery.error = `HTTP response status ${response.status}`;
      }
    } catch (err: any) {
      delivery.durationMs = Date.now() - startTime;
      delivery.status = 'failed';
      delivery.error = err.message || 'Network error during delivery';
    }

    await delivery.save();
    return delivery;
  }

  /**
   * Dispatches an event to all active endpoints registered for the account.
   */
  static async triggerAccountWebhooks(
    accountId: Types.ObjectId | string,
    event: 'generation.succeeded' | 'generation.failed',
    eventData: Record<string, unknown>
  ): Promise<void> {
    try {
      const endpoints = await WebhookEndpoint.find({
        accountId,
        active: true,
        events: event,
      });

      if (!endpoints || endpoints.length === 0) return;

      const payload: WebhookEventPayload = {
        id: `evt_${crypto.randomBytes(12).toString('hex')}`,
        event,
        created_at: new Date().toISOString(),
        data: eventData,
      };

      for (const endpoint of endpoints) {
        // Fire and record deliveries
        this.deliverToEndpoint(endpoint, event, payload).catch((err) => {
          logger.error('Error delivering webhook', { endpointId: endpoint._id, error: err.message });
        });
      }
    } catch (err: any) {
      logger.error('Failed to trigger account webhooks', { accountId, error: err.message });
    }
  }

  /**
   * Manually retries a failed delivery.
   */
  static async retryDelivery(deliveryId: string): Promise<IWebhookDelivery | null> {
    const delivery = await WebhookDelivery.findOne({ deliveryId });
    if (!delivery) return null;

    const endpoint = await WebhookEndpoint.findById(delivery.endpointId);
    if (!endpoint) return null;

    delivery.attempt += 1;
    const startTime = Date.now();

    try {
      await validateWebhookUrl(endpoint.url);

      const timestamp = Math.floor(Date.now() / 1000);
      const payloadString = JSON.stringify(delivery.payload);
      const signature = this.generateSignatureHeader(endpoint.signingSecret, timestamp, payloadString);

      const response = await axios.post(endpoint.url, delivery.payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SoundForge-Webhooks/1.0',
          'SoundForge-Signature': signature,
          'SoundForge-Delivery-Id': delivery.deliveryId,
          'SoundForge-Event': delivery.event,
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      delivery.durationMs = Date.now() - startTime;
      delivery.statusCode = response.status;
      delivery.signature = signature;

      if (response.status >= 200 && response.status < 300) {
        delivery.status = 'success';
        delivery.error = undefined;
      } else {
        delivery.status = 'failed';
        delivery.error = `HTTP response status ${response.status}`;
      }
    } catch (err: any) {
      delivery.durationMs = Date.now() - startTime;
      delivery.status = 'failed';
      delivery.error = err.message || 'Retry delivery failed';
    }

    await delivery.save();
    return delivery;
  }
}
