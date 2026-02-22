import { eq } from 'drizzle-orm';
import { payments } from '../db/schema/index.js';
import { nicepayConfig } from '../config/nicepay.js';
import { config } from '../config/index.js';
import { generatePaymentId } from '../utils/generate-id.js';
import { verifyAmount } from '../lib/amount-guard.js';
import { verifyAuthSignature } from '../lib/nicepay/crypto.js';
import { approveWithNetCancel } from '../lib/net-cancel.js';
import { RESULT_CODE, PAYMENT_STATUS } from '../lib/nicepay/constants.js';
import {
  PaymentNotFoundError,
  SignatureVerificationError,
  AuthenticationFailedError,
  NicePayError,
} from '../lib/nicepay/errors.js';
import type { AppDb } from '../db/index.js';
import type { NicePayClient } from '../lib/nicepay/client.js';
import type { AuthCallbackParams } from '../lib/nicepay/types.js';

interface PrepareParams {
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

export class PaymentService {
  constructor(
    private db: AppDb,
    private nicepay: NicePayClient,
    private logger: { warn: (...args: any[]) => void; error: (...args: any[]) => void; info: (...args: any[]) => void },
  ) {}

  /**
   * Step 1: Prepare payment - store amount in DB, return SDK params
   */
  async prepare(params: PrepareParams) {
    const paymentId = generatePaymentId();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min TTL

    // The returnUrl in sdkParams points to our gateway's approve endpoint
    const gatewayReturnUrl = params.returnUrl;

    await this.db.insert(payments).values({
      id: paymentId,
      orderId: params.orderId,
      amount: params.amount,
      goodsName: params.goodsName,
      payMethod: params.method,
      returnUrl: gatewayReturnUrl,
      successUrl: params.successUrl || config.redirectUrls.defaultSuccess,
      failureUrl: params.failureUrl || config.redirectUrls.defaultFailure,
      buyerName: params.buyerName,
      buyerEmail: params.buyerEmail,
      buyerTel: params.buyerTel,
      mallReserved: params.mallReserved,
      expiresAt,
      status: PAYMENT_STATUS.READY,
    });

    return {
      paymentId,
      orderId: params.orderId,
      amount: params.amount,
      status: PAYMENT_STATUS.READY,
      sdkParams: {
        clientId: nicepayConfig.clientId,
        method: params.method,
        orderId: params.orderId,
        amount: params.amount,
        goodsName: params.goodsName,
        returnUrl: gatewayReturnUrl,
        ...(params.buyerName && { buyerName: params.buyerName }),
        ...(params.buyerEmail && { buyerEmail: params.buyerEmail }),
        ...(params.buyerTel && { buyerTel: params.buyerTel }),
        ...(params.mallReserved && { mallReserved: params.mallReserved }),
      },
      sdkUrl: nicepayConfig.sdk,
      createdAt: new Date().toISOString(),
      expiresAt,
    };
  }

  /**
   * Step 2: Process NicePay authentication callback and call approval API
   * Returns redirect URL (success or failure)
   */
  async approve(params: AuthCallbackParams): Promise<string> {
    const { authResultCode, authResultMsg, tid, clientId, orderId, amount, authToken, signature } = params;

    // Look up payment
    const paymentRows = await this.db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);
    const payment = paymentRows[0];

    if (!payment) {
      throw new PaymentNotFoundError(orderId);
    }

    const failureUrl = payment.failureUrl || config.redirectUrls.defaultFailure;
    const successUrl = payment.successUrl || config.redirectUrls.defaultSuccess;

    // Check auth result
    if (authResultCode !== RESULT_CODE.SUCCESS) {
      await this.db.update(payments).set({
        status: PAYMENT_STATUS.FAILED,
        failedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).where(eq(payments.orderId, orderId));

      return `${failureUrl}?orderId=${orderId}&status=failed&code=${authResultCode}&msg=${encodeURIComponent(authResultMsg)}`;
    }

    // Verify signature
    const parsedAmount = parseInt(amount, 10);
    const signatureValid = verifyAuthSignature(authToken, clientId, parsedAmount, nicepayConfig.secretKey, signature);
    if (!signatureValid) {
      this.logger.error({ orderId, tid }, 'Auth signature verification failed');
      await this.db.update(payments).set({
        status: PAYMENT_STATUS.FAILED,
        failedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).where(eq(payments.orderId, orderId));

      return `${failureUrl}?orderId=${orderId}&status=failed&code=SIGNATURE_INVALID`;
    }

    // Verify amount (anti-tampering)
    try {
      await verifyAmount(this.db, orderId, parsedAmount);
    } catch (error) {
      this.logger.error({ orderId, tid, error }, 'Amount verification failed');
      await this.db.update(payments).set({
        status: PAYMENT_STATUS.FAILED,
        failedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).where(eq(payments.orderId, orderId));

      return `${failureUrl}?orderId=${orderId}&status=failed&code=AMOUNT_MISMATCH`;
    }

    // Store auth token and tid
    await this.db.update(payments).set({
      tid,
      authToken,
      updatedAt: new Date().toISOString(),
    }).where(eq(payments.orderId, orderId));

    // Call NicePay approval API (with net-cancel on timeout)
    try {
      const approvalResult = await approveWithNetCancel(
        this.nicepay, tid, parsedAmount, orderId, this.logger,
      );

      // Update payment with approval result
      await this.db.update(payments).set({
        status: PAYMENT_STATUS.PAID,
        tid: approvalResult.tid,
        approveNo: approvalResult.approveNo,
        balanceAmt: approvalResult.balanceAmt,
        channel: approvalResult.channel,
        cardInfo: approvalResult.card ? JSON.stringify(approvalResult.card) : null,
        vbankInfo: approvalResult.vbank ? JSON.stringify(approvalResult.vbank) : null,
        paidAt: approvalResult.paidAt,
        updatedAt: new Date().toISOString(),
      }).where(eq(payments.orderId, orderId));

      // Handle vbank (status will be 'ready' until deposit)
      if (approvalResult.status === 'ready' && approvalResult.vbank) {
        await this.db.update(payments).set({
          status: PAYMENT_STATUS.READY,
        }).where(eq(payments.orderId, orderId));
      }

      return `${successUrl}?orderId=${orderId}&status=paid&tid=${approvalResult.tid}`;
    } catch (error) {
      this.logger.error({ orderId, tid, error }, 'Approval failed');

      await this.db.update(payments).set({
        status: PAYMENT_STATUS.FAILED,
        failedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).where(eq(payments.orderId, orderId));

      const errorCode = error instanceof NicePayError ? error.code : 'UNKNOWN';
      return `${failureUrl}?orderId=${orderId}&status=failed&code=${errorCode}`;
    }
  }

  /**
   * Get payment status by TID
   */
  async getByTid(tid: string) {
    const rows = await this.db.select().from(payments).where(eq(payments.tid, tid)).limit(1);
    if (!rows[0]) throw new PaymentNotFoundError(tid);
    return this.formatPayment(rows[0]);
  }

  /**
   * Get payment status by orderId
   */
  async getByOrderId(orderId: string) {
    const rows = await this.db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);
    if (!rows[0]) throw new PaymentNotFoundError(orderId);
    return this.formatPayment(rows[0]);
  }

  private formatPayment(row: any) {
    return {
      paymentId: row.id,
      tid: row.tid,
      orderId: row.orderId,
      status: row.status,
      amount: row.amount,
      balanceAmt: row.balanceAmt,
      payMethod: row.payMethod,
      goodsName: row.goodsName,
      currency: row.currency,
      approveNo: row.approveNo,
      channel: row.channel,
      card: row.cardInfo ? JSON.parse(row.cardInfo) : null,
      vbank: row.vbankInfo ? JSON.parse(row.vbankInfo) : null,
      buyer: {
        name: row.buyerName,
        email: row.buyerEmail,
        tel: row.buyerTel,
      },
      paidAt: row.paidAt,
      failedAt: row.failedAt,
      cancelledAt: row.cancelledAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
