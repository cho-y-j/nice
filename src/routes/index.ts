import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health/index.js';
import { paymentRoutes } from './v1/payments/index.js';
import { billingRoutes } from './v1/billing/index.js';
import { webhookRoutes } from './v1/webhooks/index.js';
import { testPageRoutes } from './test-page.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(paymentRoutes, { prefix: '/v1/payments' });
  await app.register(billingRoutes, { prefix: '/v1/billing' });
  await app.register(webhookRoutes, { prefix: '/v1/webhooks' });
  await app.register(testPageRoutes);
}
