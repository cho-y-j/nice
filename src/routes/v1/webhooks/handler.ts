import { FastifyInstance } from 'fastify';
import { WebhookService } from '../../../services/webhook.service.js';
import type { WebhookPayload } from '../../../lib/nicepay/types.js';

export async function webhookHandler(app: FastifyInstance) {
  // NicePay webhook receiver
  // Must respond with HTTP 200 and body "OK"
  app.post<{ Body: WebhookPayload }>('/nicepay', {
    schema: {
      tags: ['Webhooks'],
      summary: 'NicePay 웹훅 수신',
      description: 'NicePay에서 결제 이벤트 발생 시 호출하는 엔드포인트. 직접 호출하지 마세요.',
    },
  }, async (request, reply) => {
    const service = new WebhookService(app.db, request.log);

    // Process webhook asynchronously but respond immediately
    // NicePay requires quick "OK" response
    service.processWebhook(request.body).catch(err => {
      request.log.error({ err }, 'Async webhook processing failed');
    });

    // NicePay requires Content-Type: text/html and body "OK"
    return reply
      .status(200)
      .header('Content-Type', 'text/html; charset=utf-8')
      .send('OK');
  });
}
