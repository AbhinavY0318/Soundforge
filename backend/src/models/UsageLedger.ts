import mongoose, { Document, Schema, Types } from 'mongoose';

export type LedgerEventType = 'reservation' | 'charge' | 'refund' | 'adjustment';

export interface IUsageLedger extends Document {
  _id: Types.ObjectId;
  accountId: Types.ObjectId;
  apiKeyId?: Types.ObjectId;
  generationId?: Types.ObjectId;
  eventType: LedgerEventType;
  credits: number;
  license?: string;
  durationUnits?: number;
  periodMonth: string; // e.g. "2026-11"
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const UsageLedgerSchema = new Schema<IUsageLedger>(
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
    generationId: {
      type: Schema.Types.ObjectId,
      ref: 'Generation',
      index: true,
    },
    eventType: {
      type: String,
      enum: ['reservation', 'charge', 'refund', 'adjustment'],
      required: true,
      index: true,
    },
    credits: {
      type: Number,
      required: true,
    },
    license: {
      type: String,
    },
    durationUnits: {
      type: Number,
    },
    periodMonth: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for monthly usage aggregation queries
UsageLedgerSchema.index({ accountId: 1, periodMonth: 1, eventType: 1 });
UsageLedgerSchema.index({ accountId: 1, createdAt: -1 });

export const UsageLedger = mongoose.model<IUsageLedger>('UsageLedger', UsageLedgerSchema);
