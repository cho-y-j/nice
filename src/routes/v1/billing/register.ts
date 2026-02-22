import { FastifyInstance } from 'fastify';
import { BillingService } from '../../../services/billing.service.js';
import { registerSchema } from './schemas.js';

interface RegisterBody {
  orderId: string;
  cardNo: string;
  expYear: string;
  expMonth: string;
  idNo?: string;
  cardPw?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerTel?: string;
}

export async function registerRoute(app: FastifyInstance) {
  app.post<{ Body: RegisterBody }>('/register', {
    schema: registerSchema,
  }, async (request, reply) => {
    const service = new BillingService(app.db, app.nicepay, request.log);
    const result = await service.register(request.body);

    return reply.status(201).send({ success: true, data: result });
  });
}
