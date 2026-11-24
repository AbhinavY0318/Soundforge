import mongoose, { Document, Schema, Types } from 'mongoose';

export type IdempotencyStatus = 'processing' | 'completed';

export interface IIdempotencyRecord extends Document {
  _id: Types.ObjectId;
  accountId: Types.ObjectId;
  idempotencyKey: string;
  requestPath: string;
  requestHash: string; // SHA-256 hash of canonical body
  status: IdempotencyStatus;
  responseStatus?: number;
  responseBody?: any;
  generationId?: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IdempotencyRecordSchema = new Schema<IIdempotencyRecord>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
    },
    requestPath: {
      type: String,
      required: true,
    },
    requestHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['processing', 'completed'],
      default: 'processing',
      index: true,
    },
    responseStatus: {
      type: Number,
    },
    responseBody: {
      type: Schema.Types.Mixed,
    },
    generationId: {
      type: Schema.Types.ObjectId,
      ref: 'Generation',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to auto-delete expired records
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index guarantees strictly one record per account + idempotency key
IdempotencyRecordSchema.index({ accountId: 1, idempotencyKey: 1 }, { unique: true });

export const IdempotencyRecord = mongoose.model<IIdempotencyRecord>(
  'IdempotencyRecord',
  IdempotencyRecordSchema
);
