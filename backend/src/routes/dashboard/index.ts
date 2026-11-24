import { Router } from 'express';
import { dashboardAuth } from '../../middleware/auth.js';
import { DashboardAuthController } from '../../controllers/dashboard/authController.js';
import { DashboardApiKeyController } from '../../controllers/dashboard/apiKeyController.js';
import { DashboardGenerationController } from '../../controllers/dashboard/generationController.js';
import { DashboardUsageController } from '../../controllers/dashboard/usageController.js';
import { DashboardPlanController } from '../../controllers/dashboard/planController.js';
import { DashboardTeamController } from '../../controllers/dashboard/teamController.js';
import { DeveloperWebhookController } from '../../controllers/developerWebhookController.js';

const router = Router();

// ==========================================
// Dashboard Authentication Routes
// ==========================================
router.post('/auth/register', DashboardAuthController.register);
router.post('/auth/login', DashboardAuthController.login);
router.post('/auth/verify-email', DashboardAuthController.verifyEmail);
router.post('/auth/refresh', DashboardAuthController.refresh);
router.get('/auth/me', dashboardAuth, DashboardAuthController.me);
router.post('/auth/forgot-password', DashboardAuthController.forgotPassword);
router.post('/auth/reset-password', DashboardAuthController.resetPassword);

// ==========================================
// API Key Management Routes (Protected)
// ==========================================
router.post('/api-keys', dashboardAuth, DashboardApiKeyController.create);
router.get('/api-keys', dashboardAuth, DashboardApiKeyController.list);
router.delete('/api-keys/:id', dashboardAuth, DashboardApiKeyController.revoke);
router.post('/api-keys/:id/rotate', dashboardAuth, DashboardApiKeyController.rotate);

// ==========================================
// Generation Studio Routes (Protected)
// ==========================================
router.post('/generations', dashboardAuth, DashboardGenerationController.create);
router.get('/generations', dashboardAuth, DashboardGenerationController.list);
router.get('/generations/stats', dashboardAuth, DashboardGenerationController.getStats);
router.post('/generations/:id/cancel', dashboardAuth, DashboardGenerationController.cancel);

// ==========================================
// Usage & Metering Routes (Protected)
// ==========================================
router.get('/usage', dashboardAuth, DashboardUsageController.getOverview);

// ==========================================
// Subscription Plan Routes (Protected)
// ==========================================
router.get('/plans', dashboardAuth, DashboardPlanController.listPlans);
router.post('/plans/change', dashboardAuth, DashboardPlanController.changePlan);
router.post('/plans/overage', dashboardAuth, DashboardPlanController.toggleOverage);

// ==========================================
// Webhook Management Routes (Protected)
// ==========================================
router.post(
  '/webhooks',
  dashboardAuth,
  (req, res, next) => DeveloperWebhookController.create(req, res, next)
);
router.get(
  '/webhooks',
  dashboardAuth,
  (req, res, next) => DeveloperWebhookController.list(req, res, next)
);
router.delete(
  '/webhooks/:id',
  dashboardAuth,
  (req, res, next) => DeveloperWebhookController.delete(req, res, next)
);
router.get(
  '/webhooks/deliveries',
  dashboardAuth,
  (req, res, next) => DeveloperWebhookController.listDeliveries(req, res, next)
);
router.post(
  '/webhooks/deliveries/:deliveryId/retry',
  dashboardAuth,
  (req, res, next) => DeveloperWebhookController.retry(req, res, next)
);

// ==========================================
// Team Members Management Routes (Protected)
// ==========================================
router.get('/team', dashboardAuth, DashboardTeamController.listMembers);
router.post('/team/invite', dashboardAuth, DashboardTeamController.inviteMember);
router.delete('/team/:id', dashboardAuth, DashboardTeamController.removeMember);

export default router;
