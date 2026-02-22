import { FastifyInstance } from 'fastify';
import { WebhookService } from '../../../services/webhook.service.js';

export async function webhookLogsRoute(app: FastifyInstance) {
  app.get<{
    Querystring: { orderId?: string; tid?: string; page?: number; limit?: number };
  }>('/logs', {
    schema: {
      tags: ['Webhooks'],
      summary: '웹훅 로그 조회',
      security: [{ apiKey: [] }],
      querystring: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          tid: { type: 'string' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
  }, async (request) => {
    const service = new WebhookService(app.db, request.log);
    const result = await service.getWebhookLogs(request.query);

    return { success: true, ...result };
  });
}
