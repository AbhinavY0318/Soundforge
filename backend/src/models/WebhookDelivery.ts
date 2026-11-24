import mongoose, { Document, Schema, Types } from 'mongoose';

export type DeliveryStatus = 'pending' | 'success' | 'failed';

export interface IWebhookDelivery extends Document {
  _id: Types.ObjectId;
  accountId: Types.ObjectId;
  endpointId: Types.ObjectId;
  deliveryId: string;
  event: string;
  payload: Record<string, unknown>;
  status: DeliveryStatus;
  statusCode?: number;
  responseBody?: string;
  attempt: number;
  maxRetries: number;
  nextRetryAt?: Date;
  signature: string;
  error?: string;
  durationMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookDeliverySchema = new Schema<IWebhookDelivery>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    endpointId: {
      type: Schema.Types.ObjectId,
      ref: 'WebhookEndpoint',
      required: true,
      index: true,
    },
    deliveryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
      index: true,
    },
    statusCode: {
      type: Number,
    },
    responseBody: {
      type: String,
    },
    attempt: {
      type: Number,
      default: 1,
    },
    maxRetries: {
      type: Number,
      default: 5,
    },
    nextRetryAt: {
      type: Date,
      index: true,
    },
    signature: {
      type: String,
      required: true,
    },
    error: {
      type: String,
    },
    durationMs: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

WebhookDeliverySchema.index({ endpointId: 1, createdAt: -1 });

export const WebhookDelivery = mongoose.model<IWebhookDelivery>(
  'WebhookDelivery',
  WebhookDeliverySchema
);
