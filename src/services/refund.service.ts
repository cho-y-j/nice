import { eq } from 'drizzle-orm';
import { payments, refunds } from '../db/schema/index.js';
import { generateRefundId } from '../utils/generate-id.js';
import { PaymentNotFoundError, NicePayError } from '../lib/nicepay/errors.js';
import { PAYMENT_STATUS } from '../lib/nicepay/constants.js';
import type { AppDb } from '../db/index.js';
import type { NicePayClient } from '../lib/nicepay/client.js';

interface CancelParams {
  reason: string;
  orderId: string;
  cancelAmt?: number;
  taxFreeAmt?: number;
  refundAccount?: string;
  refundBankCode?: string;
  refundHolder?: string;
}

export class RefundService {
  constructor(
    private db: AppDb,
    private nicepay: NicePayClient,
    private logger: { warn: (...args: any[]) => void; error: (...args: any[]) => void; info: (...args: any[]) => void },
  ) {}

  async cancel(tid: string, params: CancelParams) {
    // Find payment
    const paymentRows = await this.db.select().from(payments).where(eq(payments.tid, tid)).limit(1);
    const payment = paymentRows[0];

    if (!payment) {
      throw new PaymentNotFoundError(tid);
    }

    // Create refund record
    const refundId = generateRefundId();
    await this.db.insert(refunds).values({
      id: refundId,
      paymentId: payment.id,
      tid,
      orderId: params.orderId,
      cancelAmt: params.cancelAmt,
      reason: params.reason,
      refundAccount: params.refundAccount,
      refundBankCode: params.refundBankCode,
      refundHolder: params.refundHolder,
    });

    try {
      // Call NicePay cancel API
      const result = await this.nicepay.cancel(tid, params);

      // Update refund record
      await this.db.update(refunds).set({
        status: 'completed',
        cancelledTid: result.cancelledTid,
        balanceAmt: result.balanceAmt,
        cancelledAt: result.cancelledAt,
        resultCode: result.resultCode,
        resultMsg: result.resultMsg,
      }).where(eq(refunds.id, refundId));

      // Update payment status
      const newStatus = result.balanceAmt === 0
        ? PAYMENT_STATUS.CANCELLED
        : PAYMENT_STATUS.PARTIAL_CANCELLED;

      await this.db.update(payments).set({
        status: newStatus,
        balanceAmt: result.balanceAmt,
        cancelledAt: result.cancelledAt,
        updatedAt: new Date().toISOString(),
      }).where(eq(payments.tid, tid));

      return {
        refundId,
        tid,
        cancelledTid: result.cancelledTid,
        orderId: params.orderId,
        status: newStatus,
        cancelAmt: result.cancelAmt,
        balanceAmt: result.balanceAmt,
        cancelledAt: result.cancelledAt,
        reason: params.reason,
      };
    } catch (error) {
      // Update refund record as failed
      const errorMsg = error instanceof NicePayError ? error.message : 'Unknown error';
      const resultCode = error instanceof NicePayError ? error.resultCode : undefined;

      await this.db.update(refunds).set({
        status: 'failed',
        resultCode,
        resultMsg: errorMsg,
      }).where(eq(refunds.id, refundId));

      throw error;
    }
  }
}
