import { FastifyInstance } from 'fastify';
import { PaymentService } from '../../../services/payment.service.js';
import { findSchema } from './schemas.js';

export async function findRoute(app: FastifyInstance) {
  app.get<{ Params: { orderId: string } }>('/find/:orderId', {
    schema: findSchema,
  }, async (request, reply) => {
    const service = new PaymentService(app.db, app.nicepay, request.log);
    const result = await service.getByOrderId(request.params.orderId);

    return { success: true, data: result };
  });
}
