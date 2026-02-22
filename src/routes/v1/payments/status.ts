import { FastifyInstance } from 'fastify';
import { PaymentService } from '../../../services/payment.service.js';
import { statusSchema } from './schemas.js';

export async function statusRoute(app: FastifyInstance) {
  app.get<{ Params: { tid: string } }>('/:tid', {
    schema: statusSchema,
  }, async (request, reply) => {
    const service = new PaymentService(app.db, app.nicepay, request.log);
    const result = await service.getByTid(request.params.tid);

    return { success: true, data: result };
  });
}
