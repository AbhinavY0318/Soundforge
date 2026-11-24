import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PlanService } from '../services/planService.js';
import { User, IUser } from '../models/User.js';
import { Account, IAccount } from '../models/Account.js';
import { Plan, IPlan, PlanName } from '../models/Plan.js';
import { ApiKeyService, CreateApiKeyResult } from '../services/apiKeyService.js';
import { createApp } from '../app.js';
import express from 'express';

let mongod: MongoMemoryServer | null = null;
let appInstance: express.Application | null = null;

export async function setupTestEnvironment(): Promise<{ app: express.Application }> {
  if (!mongod) {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    await PlanService.seedPlans();
    appInstance = createApp();
  }
  return { app: appInstance! };
}

export async function teardownTestEnvironment(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (key !== 'plans') {
      // Keep seeded plans intact
      await collections[key].deleteMany({});
    }
  }
}

export async function createTestUserAndAccount(params?: {
  planName?: PlanName;
  overageEnabled?: boolean;
}): Promise<{
  user: IUser;
  account: IAccount;
  plan: IPlan;
  testKey: CreateApiKeyResult;
  liveKey: CreateApiKeyResult;
}> {
  const planName = params?.planName || 'STARTER';
  const plan = await PlanService.getPlanByName(planName);

  const rand = Math.random().toString(36).substring(2, 8);
  const user = await User.create({
    name: `Test User ${rand}`,
    email: `test_${rand}@soundforge.ai`,
    passwordHash: 'dummy_hash_for_test',
    isEmailVerified: true,
    role: 'user',
  });

  const account = await Account.create({
    name: `Test Team ${rand}`,
    ownerId: user._id,
    planId: plan._id,
    overageEnabled: params?.overageEnabled ?? false,
    status: 'active',
  });

  user.currentAccountId = account._id;
  await user.save();

  const testKey = await ApiKeyService.createApiKey({
    accountId: account._id,
    name: 'Test Mode Key',
    mode: 'test',
  });

  const liveKey = await ApiKeyService.createApiKey({
    accountId: account._id,
    name: 'Live Mode Key',
    mode: 'live',
  });

  return { user, account, plan, testKey, liveKey };
}
