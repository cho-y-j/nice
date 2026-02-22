import { nanoid } from 'nanoid';

export function generatePaymentId(): string {
  return `pay_${nanoid(16)}`;
}

export function generateBillingId(): string {
  return `bill_${nanoid(16)}`;
}

export function generateRefundId(): string {
  return `ref_${nanoid(16)}`;
}

export function generateWebhookLogId(): string {
  return `wh_${nanoid(16)}`;
}

export function generateOrderId(prefix = 'ORD'): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${prefix}-${date}-${nanoid(8)}`;
}
