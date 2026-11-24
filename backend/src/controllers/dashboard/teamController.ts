import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { TeamMember } from '../../models/TeamMember.js';
import { User } from '../../models/User.js';
import { Errors } from '../../utils/errors.js';

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
});

export class DashboardTeamController {
  static async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const members = await TeamMember.find({ accountId: account._id })
        .populate('userId', 'name email role')
        .sort({ createdAt: 1 });

      res.status(200).json({ members });
    } catch (error) {
      next(error);
    }
  }

  static async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const currentUser = req.user!;
      const { email, role } = inviteMemberSchema.parse(req.body);

      let targetUser = await User.findOne({ email: email.toLowerCase() });
      if (!targetUser) {
        // Create user placeholder
        targetUser = await User.create({
          name: email.split('@')[0],
          email: email.toLowerCase(),
          passwordHash: 'pending_invitation',
          role: 'user',
          isEmailVerified: false,
          currentAccountId: account._id,
        });
      }

      // Check if already in team
      const existing = await TeamMember.findOne({
        accountId: account._id,
        userId: targetUser._id,
      });

      if (existing) {
        throw Errors.badRequest('This user is already a member of this team.');
      }

      const membership = await TeamMember.create({
        accountId: account._id,
        userId: targetUser._id,
        role,
        invitedBy: currentUser._id,
      });

      res.status(201).json({
        message: 'Team member added.',
        member: membership,
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const { id } = req.params;

      const member = await TeamMember.findOne({ _id: id, accountId: account._id });
      if (!member) {
        throw Errors.notFound('Team member');
      }

      if (member.role === 'owner') {
        throw Errors.forbidden('Cannot remove the account owner.');
      }

      await TeamMember.deleteOne({ _id: id });
      res.status(200).json({ message: 'Team member removed.' });
    } catch (error) {
      next(error);
    }
  }
}
