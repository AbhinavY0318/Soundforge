import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { User, IUser } from '../models/User.js';
import { Account, IAccount } from '../models/Account.js';
import { Plan } from '../models/Plan.js';
import { TeamMember } from '../models/TeamMember.js';
import { EmailVerificationToken, PasswordResetToken } from '../models/AuthTokens.js';
import { hashSha256, generateRandomToken } from '../utils/crypto.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class AuthService {
  static generateTokens(payload: {
    userId: string;
    email: string;
    role: 'admin' | 'user';
    accountId: string;
  }): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRY,
    };
  }

  static async register(params: {
    name: string;
    email: string;
    password: string;
    accountName?: string;
  }): Promise<{ user: IUser; account: IAccount; tokens: AuthTokens; verificationToken: string }> {
    const normalizedEmail = params.email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw Errors.badRequest('An account with this email address already exists.', 'email_already_registered', 'email');
    }

    // Hash password securely with bcrypt
    const passwordHash = await bcrypt.hash(params.password, 12);

    // Default plan is SANDBOX or STARTER
    let defaultPlan = await Plan.findOne({ name: 'STARTER' });
    if (!defaultPlan) {
      defaultPlan = await Plan.findOne({ name: 'SANDBOX' });
      if (!defaultPlan) {
        throw Errors.internal('Default plan not configured.');
      }
    }

    // Create user
    const user = new User({
      name: params.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      isEmailVerified: false,
    });

    // Create primary account
    const account = new Account({
      name: params.accountName?.trim() || `${params.name.trim()}'s Team`,
      ownerId: user._id,
      planId: defaultPlan._id,
      overageEnabled: false,
      status: 'active',
    });

    await account.save();

    user.currentAccountId = account._id;
    await user.save();

    // Create team member entry as owner
    await TeamMember.create({
      accountId: account._id,
      userId: user._id,
      role: 'owner',
    });

    // Generate email verification token (unhashed returned to caller, hashed stored in DB)
    const rawVerificationToken = generateRandomToken(32);
    const tokenHash = hashSha256(rawVerificationToken);
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours

    await EmailVerificationToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    const tokens = this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      accountId: account._id.toString(),
    });

    logger.info('User registered successfully', { userId: user._id, accountId: account._id, email: user.email });

    return { user, account, tokens, verificationToken: rawVerificationToken };
  }

  static async verifyEmail(token: string): Promise<{ user: IUser }> {
    const tokenHash = hashSha256(token);
    const tokenDoc = await EmailVerificationToken.findOne({ tokenHash });

    if (!tokenDoc || new Date() > tokenDoc.expiresAt) {
      throw Errors.badRequest('Email verification token is invalid or has expired.', 'invalid_verification_token');
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      throw Errors.notFound('User');
    }

    user.isEmailVerified = true;
    await user.save();

    await EmailVerificationToken.deleteOne({ _id: tokenDoc._id });
    logger.info('Email verified', { userId: user._id, email: user.email });

    return { user };
  }

  static async login(params: {
    email: string;
    password: string;
  }): Promise<{ user: IUser; account: IAccount; tokens: AuthTokens }> {
    const normalizedEmail = params.email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw Errors.unauthorized('Invalid email or password.');
    }

    const passwordValid = await bcrypt.compare(params.password, user.passwordHash);
    if (!passwordValid) {
      throw Errors.unauthorized('Invalid email or password.');
    }

    const account = await Account.findById(user.currentAccountId);
    if (!account) {
      throw Errors.unauthorized('User does not have an active associated account.');
    }

    const tokens = this.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      accountId: account._id.toString(),
    });

    logger.info('User logged in successfully', { userId: user._id, accountId: account._id });

    return { user, account, tokens };
  }

  static async refresh(refreshToken: string): Promise<{ tokens: AuthTokens }> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
        email: string;
        role: 'admin' | 'user';
        accountId: string;
      };

      const user = await User.findById(decoded.userId);
      if (!user) {
        throw Errors.unauthorized('User no longer exists.');
      }

      const tokens = this.generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        accountId: decoded.accountId,
      });

      return { tokens };
    } catch {
      throw Errors.unauthorized('Invalid or expired refresh token.');
    }
  }

  static async requestPasswordReset(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Return dummy token without revealing if email exists for security
      return generateRandomToken(32);
    }

    const rawToken = generateRandomToken(32);
    const tokenHash = hashSha256(rawToken);
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    return rawToken;
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashSha256(token);
    const tokenDoc = await PasswordResetToken.findOne({ tokenHash });

    if (!tokenDoc || new Date() > tokenDoc.expiresAt) {
      throw Errors.badRequest('Password reset token is invalid or has expired.');
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      throw Errors.notFound('User');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
    logger.info('Password reset successfully', { userId: user._id });
  }
}
