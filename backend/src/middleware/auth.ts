import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, IUser } from '../models/User.js';
import { Account, IAccount } from '../models/Account.js';
import { Plan, IPlan } from '../models/Plan.js';
import { Errors } from '../utils/errors.js';

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  accountId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      account?: IAccount;
      plan?: IPlan;
      authPayload?: AuthenticatedUserPayload;
    }
  }
}

export async function dashboardAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw Errors.unauthorized('Authentication token is missing. Please log in.');
    }

    const token = authHeader.substring(7).trim();
    let decoded: AuthenticatedUserPayload;

    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthenticatedUserPayload;
    } catch {
      throw Errors.unauthorized('Invalid or expired authentication token. Please log in again.');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw Errors.unauthorized('User associated with this token does not exist.');
    }

    const accountId = decoded.accountId || user.currentAccountId;
    if (!accountId) {
      throw Errors.unauthorized('User does not have an active account associated.');
    }

    const account = await Account.findById(accountId);
    if (!account) {
      throw Errors.unauthorized('Account not found.');
    }

    if (account.status !== 'active') {
      throw Errors.forbidden(`Account is ${account.status}. Access denied.`);
    }

    const plan = await Plan.findById(account.planId);
    if (!plan) {
      throw Errors.internal('Account plan configuration is missing.');
    }

    req.user = user;
    req.account = account;
    req.plan = plan;
    req.authPayload = decoded;

    next();
  } catch (error) {
    next(error);
  }
}
