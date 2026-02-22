import { FastifyInstance } from 'fastify';
import { PaymentService } from '../../../services/payment.service.js';
import type { AuthCallbackParams } from '../../../lib/nicepay/types.js';

export async function approveRoute(app: FastifyInstance) {
  // This endpoint receives POST from NicePay after user authentication
  // Content-Type: application/x-www-form-urlencoded
  app.post<{ Body: AuthCallbackParams }>('/approve', {
    schema: {
      tags: ['Payments'],
      summary: 'NicePay 인증 결과 수신 (returnUrl)',
      description: 'NicePay 결제창에서 인증 완료 후 호출되는 엔드포인트. 직접 호출하지 마세요.',
      hide: true,
    },
  }, async (request, reply) => {
    const service = new PaymentService(app.db, app.nicepay, request.log);

    try {
      const redirectUrl = await service.approve(request.body as AuthCallbackParams);
      return reply.redirect(redirectUrl);
    } catch (error: any) {
      request.log.error({ error }, 'Approve handler error');
      const failureUrl = process.env.DEFAULT_FAILURE_URL || 'http://localhost:3000/payment/failure';
      return reply.redirect(`${failureUrl}?status=error&msg=${encodeURIComponent(error.message)}`);
    }
  });
}
