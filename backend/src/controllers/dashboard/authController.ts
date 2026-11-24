import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../../services/authService.js';
import { User } from '../../models/User.js';
import { Account } from '../../models/Account.js';
import { Plan } from '../../models/Plan.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  accountName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export class DashboardAuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = registerSchema.parse(req.body);
      const result = await AuthService.register(body);

      res.status(201).json({
        user: {
          id: result.user._id.toString(),
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          isEmailVerified: result.user.isEmailVerified,
        },
        account: {
          id: result.account._id.toString(),
          name: result.account.name,
          status: result.account.status,
        },
        tokens: result.tokens,
        verificationToken: result.verificationToken, // Provided for instant dev/sandbox flow
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = verifyEmailSchema.parse(req.body);
      const { user } = await AuthService.verifyEmail(token);

      res.status(200).json({
        message: 'Email verified successfully.',
        user: {
          id: user._id.toString(),
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = loginSchema.parse(req.body);
      const result = await AuthService.login(body);

      res.status(200).json({
        user: {
          id: result.user._id.toString(),
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          isEmailVerified: result.user.isEmailVerified,
        },
        account: {
          id: result.account._id.toString(),
          name: result.account.name,
          status: result.account.status,
        },
        tokens: result.tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
      if (!refreshToken) {
        res.status(400).json({ error: { message: 'Refresh token is required.' } });
        return;
      }

      const result = await AuthService.refresh(refreshToken as string);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const account = req.account!;
      const plan = req.plan!;

      res.status(200).json({
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
        account: {
          id: account._id.toString(),
          name: account.name,
          status: account.status,
          overageEnabled: account.overageEnabled,
        },
        plan: {
          name: plan.name,
          displayName: plan.displayName,
          monthlyAllowance: plan.monthlyAllowance,
          parallelLimit: plan.parallelLimit,
          requestsPerHour: plan.requestsPerHour,
          requestsPerDay: plan.requestsPerDay,
          allowedLicenses: plan.allowedLicenses,
          overageAllowed: plan.overageAllowed,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const token = await AuthService.requestPasswordReset(email);

      res.status(200).json({
        message: 'Password reset link sent to your email address.',
        resetToken: token, // Provided for easy sandbox testing
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      await AuthService.resetPassword(token, password);

      res.status(200).json({
        message: 'Password has been reset successfully. Please log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }
}
