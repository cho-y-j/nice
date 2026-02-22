import { FastifyInstance } from 'fastify';
import { BillingService } from '../../../services/billing.service.js';
import { expireSchema } from './schemas.js';

export async function expireRoute(app: FastifyInstance) {
  app.post<{ Params: { bid: string }; Body: { orderId: string } }>('/:bid/expire', {
    schema: expireSchema,
  }, async (request, reply) => {
    const service = new BillingService(app.db, app.nicepay, request.log);
    const result = await service.expire(request.params.bid, request.body);

    return { success: true, data: result };
  });
}
