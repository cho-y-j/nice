import { FastifyInstance } from 'fastify';
import { BillingService } from '../../../services/billing.service.js';
import { chargeSchema } from './schemas.js';

interface ChargeBody {
  orderId: string;
  amount: number;
  goodsName: string;
  cardQuota?: number;
  buyerName?: string;
  buyerEmail?: string;
  buyerTel?: string;
}

export async function chargeRoute(app: FastifyInstance) {
  app.post<{ Params: { bid: string }; Body: ChargeBody }>('/:bid/charge', {
    schema: chargeSchema,
  }, async (request, reply) => {
    const service = new BillingService(app.db, app.nicepay, request.log);
    const result = await service.charge(request.params.bid, request.body);

    return { success: true, data: result };
  });
}
