import mongoose, { Document, Schema, Types } from 'mongoose';

export type PlanName = 'SANDBOX' | 'STARTER' | 'GROWTH';
export type LicenseType = 'royalty_free' | 'sync' | 'full_ownership';

export interface IPlan extends Document {
  _id: Types.ObjectId;
  name: PlanName;
  displayName: string;
  monthlyAllowance: number;
  parallelLimit: number;
  requestsPerHour: number;
  requestsPerDay: number;
  allowedLicenses: LicenseType[];
  allowTestKeysOnly: boolean;
  overageAllowed: boolean;
  priceMonthlyUsd: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      enum: ['SANDBOX', 'STARTER', 'GROWTH'],
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    monthlyAllowance: {
      type: Number,
      required: true,
      min: 0,
    },
    parallelLimit: {
      type: Number,
      required: true,
      min: 1,
    },
    requestsPerHour: {
      type: Number,
      required: true,
      min: 1,
    },
    requestsPerDay: {
      type: Number,
      required: true,
      min: 1,
    },
    allowedLicenses: {
      type: [String],
      enum: ['royalty_free', 'sync', 'full_ownership'],
      required: true,
    },
    allowTestKeysOnly: {
      type: Boolean,
      default: false,
    },
    overageAllowed: {
      type: Boolean,
      default: false,
    },
    priceMonthlyUsd: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);
