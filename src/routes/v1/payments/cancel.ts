import { FastifyInstance } from 'fastify';
import { RefundService } from '../../../services/refund.service.js';
import { cancelSchema } from './schemas.js';

interface CancelBody {
  reason: string;
  orderId: string;
  cancelAmt?: number;
  taxFreeAmt?: number;
  refundAccount?: string;
  refundBankCode?: string;
  refundHolder?: string;
}

export async function cancelRoute(app: FastifyInstance) {
  app.post<{ Params: { tid: string }; Body: CancelBody }>('/:tid/cancel', {
    schema: cancelSchema,
  }, async (request, reply) => {
    const service = new RefundService(app.db, app.nicepay, request.log);
    const result = await service.cancel(request.params.tid, request.body);

    return { success: true, data: result };
  });
}
