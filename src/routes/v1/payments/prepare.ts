import { FastifyInstance } from 'fastify';
import { PaymentService } from '../../../services/payment.service.js';
import { prepareSchema } from './schemas.js';

interface PrepareBody {
  orderId: string;
  amount: number;
  goodsName: string;
  method: string;
  returnUrl: string;
  successUrl?: string;
  failureUrl?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerTel?: string;
  mallReserved?: string;
}

export async function prepareRoute(app: FastifyInstance) {
  app.post<{ Body: PrepareBody }>('/prepare', {
    schema: prepareSchema,
  }, async (request, reply) => {
    const service = new PaymentService(app.db, app.nicepay, request.log);
    const result = await service.prepare(request.body);

    return reply
      .status(201)
      .header('Content-Type', 'application/json')
      .serializer((payload: unknown) => JSON.stringify(payload))
      .send({ success: true, data: result });
  });
}
