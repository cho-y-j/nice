import { FastifyInstance } from 'fastify';
import { webhookHandler } from './handler.js';
import { webhookLogsRoute } from './logs.js';

export async function webhookRoutes(app: FastifyInstance) {
  await app.register(webhookHandler);
  await app.register(webhookLogsRoute);
}
