import mongoose, { Document, Schema, Types } from 'mongoose';

export type ApiKeyMode = 'test' | 'live';
export type ApiKeyStatus = 'active' | 'revoked' | 'rotating';
export type ApiKeyScope = 'generations:write' | 'generations:read';

export interface IApiKey extends Document {
  _id: Types.ObjectId;
  accountId: Types.ObjectId;
  name: string;
  keyPrefix: string;
  hashedSecret: string;
  mode: ApiKeyMode;
  scopes: ApiKeyScope[];
  status: ApiKeyStatus;
  rotatesAt?: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    keyPrefix: {
      type: String,
      required: true,
    },
    hashedSecret: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['test', 'live'],
      required: true,
    },
    scopes: {
      type: [String],
      enum: ['generations:write', 'generations:read'],
      default: ['generations:write', 'generations:read'],
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'rotating'],
      default: 'active',
      index: true,
    },
    rotatesAt: {
      type: Date,
    },
    lastUsedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for listing active keys by account
ApiKeySchema.index({ accountId: 1, status: 1 });

export const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
