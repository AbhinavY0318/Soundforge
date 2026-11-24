import mongoose, { Document, Schema, Types } from 'mongoose';
import { LicenseType } from './Plan.js';

export type GenerationStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';

export interface IGeneration extends Omit<Document, 'model'> {
  _id: Types.ObjectId;
  accountId: Types.ObjectId;
  apiKeyId?: Types.ObjectId;
  idempotencyKey?: string;
  prompt: string;
  durationSec: number;
  durationUnits: number;
  license: LicenseType;
  instrumental: boolean;
  status: GenerationStatus;
  creditsReserved: number;
  creditsCharged: number;
  audioUrl?: string;
  storageKey?: string;
  provider: string;
  model: string;
  error?: {
    code?: string;
    message?: string;
  };
  progress: number;
  metadata?: Record<string, unknown>;
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GenerationSchema = new Schema<IGeneration>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    apiKeyId: {
      type: Schema.Types.ObjectId,
      ref: 'ApiKey',
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    durationSec: {
      type: Number,
      required: true,
      min: 5,
      max: 600,
    },
    durationUnits: {
      type: Number,
      required: true,
      min: 1,
    },
    license: {
      type: String,
      enum: ['royalty_free', 'sync', 'full_ownership'],
      required: true,
    },
    instrumental: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'succeeded', 'failed', 'canceled'],
      default: 'queued',
      index: true,
    },
    creditsReserved: {
      type: Number,
      required: true,
      min: 0,
    },
    creditsCharged: {
      type: Number,
      default: 0,
      min: 0,
    },
    audioUrl: {
      type: String,
    },
    storageKey: {
      type: String,
    },
    provider: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    error: {
      code: String,
      message: String,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    queuedAt: {
      type: Date,
      default: Date.now,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for account + status queries (e.g. counting parallel active generations)
GenerationSchema.index({ accountId: 1, status: 1 });
// Compound index for listing generations chronologically by account
GenerationSchema.index({ accountId: 1, createdAt: -1 });

export const Generation = mongoose.model<IGeneration>('Generation', GenerationSchema);
