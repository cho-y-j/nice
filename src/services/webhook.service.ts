import { eq } from 'drizzle-orm';
import { payments, webhookLogs } from '../db/schema/index.js';
import { nicepayConfig } from '../config/nicepay.js';
import { verifyResponseSignature } from '../lib/nicepay/crypto.js';
import { generateWebhookLogId } from '../utils/generate-id.js';
import { PAYMENT_STATUS, RESULT_CODE } from '../lib/nicepay/constants.js';
import type { AppDb } from '../db/index.js';
import type { WebhookPayload } from '../lib/nicepay/types.js';

export class WebhookService {
  constructor(
    private db: AppDb,
    private logger: { warn: (...args: any[]) => void; error: (...args: any[]) => void; info: (...args: any[]) => void },
  ) {}

  async processWebhook(payload: WebhookPayload): Promise<void> {
    const startTime = Date.now();
    const logId = generateWebhookLogId();

    // Determine event type
    const eventType = this.determineEventType(payload);

    // Log received webhook
    await this.db.insert(webhookLogs).values({
      id: logId,
      tid: payload.tid,
      orderId: payload.orderId,
      eventType,
      status: 'received',
      payload: JSON.stringify(payload),
    });

    // Verify signature
    const signatureValid = verifyResponseSignature(
      payload.tid,
      payload.amount,
      payload.ediDate,
      nicepayConfig.secretKey,
      payload.signature,
    );

    if (!signatureValid) {
      this.logger.error({ tid: payload.tid, orderId: payload.orderId }, 'Webhook signature verification failed');
      await this.db.update(webhookLogs).set({
        status: 'signature_invalid',
        signatureValid: false,
        processingMs: Date.now() - startTime,
        processedAt: new Date().toISOString(),
      }).where(eq(webhookLogs.id, logId));
      return;
    }

    try {
      // Update payment record based on event type
      await this.handleEvent(eventType, payload);

      await this.db.update(webhookLogs).set({
        status: 'processed',
        signatureValid: true,
        resultCode: payload.resultCode,
        processingMs: Date.now() - startTime,
        processedAt: new Date().toISOString(),
      }).where(eq(webhookLogs.id, logId));
    } catch (error: any) {
      this.logger.error({ tid: payload.tid, error }, 'Webhook processing failed');
      await this.db.update(webhookLogs).set({
        status: 'failed',
        signatureValid: true,
        errorMessage: error.message,
        processingMs: Date.now() - startTime,
        processedAt: new Date().toISOString(),
      }).where(eq(webhookLogs.id, logId));
    }
  }

  async getWebhookLogs(filters: { orderId?: string; tid?: string; page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = this.db.select().from(webhookLogs);

    if (filters.orderId) {
      query = query.where(eq(webhookLogs.orderId, filters.orderId)) as any;
    } else if (filters.tid) {
      query = query.where(eq(webhookLogs.tid, filters.tid)) as any;
    }

    const rows = await (query as any).limit(limit).offset(offset);

    return {
      data: rows.map((row: any) => ({
        ...row,
        payload: JSON.parse(row.payload),
      })),
      pagination: { page, limit },
    };
  }

  private determineEventType(payload: WebhookPayload): string {
    if (payload.status === 'paid') return 'payment.approved';
    if (payload.status === 'ready' && payload.payMethod === 'vbank') return 'vbank.ready';
    if (payload.status === 'cancelled') return 'payment.cancelled';
    if (payload.status === 'partialCancelled') return 'payment.partialCancelled';
    return `payment.${payload.status}`;
  }

  private async handleEvent(eventType: string, payload: WebhookPayload) {
    switch (eventType) {
      case 'payment.approved':
        await this.db.update(payments).set({
          status: PAYMENT_STATUS.PAID,
          paidAt: payload.paidAt,
          updatedAt: new Date().toISOString(),
        }).where(eq(payments.orderId, payload.orderId));
        break;

      case 'vbank.ready':
        // Virtual account issued, waiting for deposit
        this.logger.info({ orderId: payload.orderId }, 'Virtual account issued, waiting for deposit');
        break;

      case 'payment.cancelled':
        await this.db.update(payments).set({
          status: PAYMENT_STATUS.CANCELLED,
          cancelledAt: payload.cancelledAt,
          updatedAt: new Date().toISOString(),
        }).where(eq(payments.orderId, payload.orderId));
        break;

      case 'payment.partialCancelled':
        await this.db.update(payments).set({
          status: PAYMENT_STATUS.PARTIAL_CANCELLED,
          updatedAt: new Date().toISOString(),
        }).where(eq(payments.orderId, payload.orderId));
        break;

      default:
        this.logger.warn({ eventType, orderId: payload.orderId }, 'Unknown webhook event type');
    }
  }
}
