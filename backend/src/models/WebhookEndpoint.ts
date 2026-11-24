import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWebhookEndpoint extends Document {
  _id: Types.ObjectId;
  accountId: Types.ObjectId;
  url: string;
  signingSecret: string; // e.g. "whsec_..."
  description?: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEndpointSchema = new Schema<IWebhookEndpoint>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    signingSecret: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    events: {
      type: [String],
      enum: ['generation.succeeded', 'generation.failed'],
      default: ['generation.succeeded', 'generation.failed'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

WebhookEndpointSchema.index({ accountId: 1, active: 1 });

export const WebhookEndpoint = mongoose.model<IWebhookEndpoint>(
  'WebhookEndpoint',
  WebhookEndpointSchema
);
