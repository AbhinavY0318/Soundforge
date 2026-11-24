import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { WebhookEndpoint } from '../models/WebhookEndpoint.js';
import { WebhookDelivery } from '../models/WebhookDelivery.js';
import { WebhookService } from '../services/webhookService.js';
import { validateWebhookUrl } from '../utils/ssrf.js';
import { generateWebhookSecret } from '../utils/crypto.js';
import { Errors } from '../utils/errors.js';

export const createWebhookEndpointSchema = z.object({
  url: z.string().url('A valid URL is required'),
  description: z.string().optional(),
  events: z.array(z.enum(['generation.succeeded', 'generation.failed'])).default([
    'generation.succeeded',
    'generation.failed',
  ]),
});

export class DeveloperWebhookController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const body = createWebhookEndpointSchema.parse(req.body);

      // Validate URL against SSRF policy
      await validateWebhookUrl(body.url);

      const signingSecret = generateWebhookSecret();

      const endpoint = await WebhookEndpoint.create({
        accountId: account._id,
        url: body.url,
        signingSecret,
        description: body.description,
        events: body.events,
        active: true,
      });

      res.status(201).json({
        id: endpoint._id.toString(),
        object: 'webhook_endpoint',
        url: endpoint.url,
        signing_secret: signingSecret, // Revealed ONLY once upon creation!
        description: endpoint.description || null,
        events: endpoint.events,
        active: endpoint.active,
        created_at: endpoint.createdAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const endpoints = await WebhookEndpoint.find({ accountId: account._id })
        .select('-signingSecret') // Do not expose secret on listing
        .sort({ createdAt: -1 });

      res.status(200).json({
        object: 'list',
        data: endpoints.map((ep) => ({
          id: ep._id.toString(),
          object: 'webhook_endpoint',
          url: ep.url,
          description: ep.description || null,
          events: ep.events,
          active: ep.active,
          created_at: ep.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        throw Errors.notFound('Webhook Endpoint');
      }

      const endpoint = await WebhookEndpoint.findOneAndDelete({
        _id: id,
        accountId: account._id,
      });

      if (!endpoint) {
        throw Errors.notFound('Webhook Endpoint');
      }

      res.status(200).json({
        id,
        object: 'webhook_endpoint',
        deleted: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listDeliveries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const { endpointId } = req.query;

      const filter: Record<string, unknown> = { accountId: account._id };
      if (endpointId && Types.ObjectId.isValid(endpointId as string)) {
        filter.endpointId = endpointId;
      }

      const deliveries = await WebhookDelivery.find(filter)
        .sort({ createdAt: -1 })
        .limit(50);

      res.status(200).json({
        object: 'list',
        data: deliveries.map((d) => ({
          id: d._id.toString(),
          delivery_id: d.deliveryId,
          endpoint_id: d.endpointId.toString(),
          event: d.event,
          status: d.status,
          status_code: d.statusCode || null,
          attempt: d.attempt,
          duration_ms: d.durationMs || null,
          error: d.error || null,
          created_at: d.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  static async retry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const { deliveryId } = req.params;

      const delivery = await WebhookDelivery.findOne({
        deliveryId,
        accountId: account._id,
      });

      if (!delivery) {
        throw Errors.notFound('Webhook Delivery');
      }

      const result = await WebhookService.retryDelivery(deliveryId);
      if (!result) {
        throw Errors.internal('Failed to retry webhook delivery.');
      }

      res.status(200).json({
        id: result._id.toString(),
        delivery_id: result.deliveryId,
        status: result.status,
        status_code: result.statusCode || null,
        attempt: result.attempt,
        error: result.error || null,
      });
    } catch (error) {
      next(error);
    }
  }
}
