import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAccount extends Document {
  _id: Types.ObjectId;
  name: string;
  ownerId: Types.ObjectId;
  planId: Types.ObjectId;
  overageEnabled: boolean;
  status: 'active' | 'suspended' | 'canceled';
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
      index: true,
    },
    overageEnabled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'canceled'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Account = mongoose.model<IAccount>('Account', AccountSchema);
