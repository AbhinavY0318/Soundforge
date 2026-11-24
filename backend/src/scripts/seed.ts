import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { PlanService } from '../services/planService.js';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { Plan } from '../models/Plan.js';
import { TeamMember } from '../models/TeamMember.js';
import { ApiKeyService } from '../services/apiKeyService.js';
import { logger } from '../config/logger.js';

export async function seedDatabase() {
  logger.info('Starting SoundForge database seed...');
  await connectDatabase();

  // 1. Seed standard plans
  await PlanService.seedPlans();

  const starterPlan = await Plan.findOne({ name: 'STARTER' });
  const growthPlan = await Plan.findOne({ name: 'GROWTH' });
  const sandboxPlan = await Plan.findOne({ name: 'SANDBOX' });

  // 2. Seed default demo developer
  const demoEmail = 'developer@soundforge.ai';
  let demoUser = await User.findOne({ email: demoEmail });

  if (!demoUser) {
    const passwordHash = await bcrypt.hash('SoundForge2026!', 12);
    demoUser = await User.create({
      name: 'SoundForge Demo Developer',
      email: demoEmail,
      passwordHash,
      role: 'admin',
      isEmailVerified: true,
    });

    const demoAccount = await Account.create({
      name: 'SoundForge Demo Team',
      ownerId: demoUser._id,
      planId: starterPlan!._id,
      overageEnabled: false,
      status: 'active',
    });

    demoUser.currentAccountId = demoAccount._id;
    await demoUser.save();

    await TeamMember.create({
      accountId: demoAccount._id,
      userId: demoUser._id,
      role: 'owner',
    });

    // Seed a test API key
    const testKeyResult = await ApiKeyService.createApiKey({
      accountId: demoAccount._id,
      name: 'Default Test Key',
      mode: 'test',
    });

    // Seed a live API key
    const liveKeyResult = await ApiKeyService.createApiKey({
      accountId: demoAccount._id,
      name: 'Default Live Key',
      mode: 'live',
    });

    logger.info('Seeded demo account and API keys', {
      email: demoEmail,
      testKey: testKeyResult.secret,
      liveKey: liveKeyResult.secret,
    });
  } else {
    logger.info('Demo user already exists, skipping creation');
  }

  logger.info('Database seeding completed successfully.');
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(() => disconnectDatabase())
    .catch((err) => {
      logger.error('Seeding error', { error: err.message });
      process.exit(1);
    });
}
