import { Router } from 'express';
import { apiKeyAuth } from '../../middleware/apiKeyAuth.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';
import { idempotencyMiddleware } from '../../middleware/idempotency.js';
import { DeveloperGenerationController } from '../../controllers/developerGenerationController.js';
import { DeveloperWebhookController } from '../../controllers/developerWebhookController.js';

const router = Router();

// ==========================================
// Generations API (/v1/generations)
// ==========================================
router.post(
  '/generations',
  apiKeyAuth('generations:write'),
  rateLimiter(),
  idempotencyMiddleware(),
  DeveloperGenerationController.create
);

router.get(
  '/generations/:id',
  apiKeyAuth('generations:read'),
  rateLimiter(),
  DeveloperGenerationController.getById
);

router.get(
  '/generations',
  apiKeyAuth('generations:read'),
  rateLimiter(),
  DeveloperGenerationController.list
);

router.post(
  '/generations/:id/cancel',
  apiKeyAuth('generations:write'),
  rateLimiter(),
  DeveloperGenerationController.cancel
);

// ==========================================
// Usage & Metering API (/v1/usage)
// ==========================================
router.get(
  '/usage',
  apiKeyAuth('generations:read'),
  rateLimiter(),
  DeveloperGenerationController.getUsage
);

// ==========================================
// Webhooks API (/v1/webhook_endpoints)
// ==========================================
router.post(
  '/webhook_endpoints',
  apiKeyAuth(),
  rateLimiter(),
  DeveloperWebhookController.create
);

router.get(
  '/webhook_endpoints',
  apiKeyAuth(),
  rateLimiter(),
  DeveloperWebhookController.list
);

router.delete(
  '/webhook_endpoints/:id',
  apiKeyAuth(),
  rateLimiter(),
  DeveloperWebhookController.delete
);

router.get(
  '/webhook_deliveries',
  apiKeyAuth(),
  rateLimiter(),
  DeveloperWebhookController.listDeliveries
);

router.post(
  '/webhook_deliveries/:deliveryId/retry',
  apiKeyAuth(),
  rateLimiter(),
  DeveloperWebhookController.retry
);

export default router;
