import mongoose, { Document, Schema, Types } from 'mongoose';

export type TeamRole = 'owner' | 'admin' | 'member';

export interface ITeamMember extends Document {
  _id: Types.ObjectId;
  accountId: Types.ObjectId;
  userId: Types.ObjectId;
  role: TeamRole;
  invitedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

TeamMemberSchema.index({ accountId: 1, userId: 1 }, { unique: true });

export const TeamMember = mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);
