import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().unique(),
  tid: text('tid'),
  status: text('status', {
    enum: ['ready', 'paid', 'failed', 'cancelled', 'partialCancelled', 'expired'],
  }).notNull().default('ready'),
  amount: integer('amount').notNull(),
  balanceAmt: integer('balance_amt'),
  taxFreeAmt: integer('tax_free_amt').default(0),
  currency: text('currency').default('KRW'),
  payMethod: text('pay_method').notNull(),
  goodsName: text('goods_name').notNull(),

  // NicePay approval details
  approveNo: text('approve_no'),
  channel: text('channel'),

  // Card details (JSON string)
  cardInfo: text('card_info'),

  // Virtual account details (JSON string)
  vbankInfo: text('vbank_info'),

  // Buyer info
  buyerName: text('buyer_name'),
  buyerEmail: text('buyer_email'),
  buyerTel: text('buyer_tel'),

  // URLs
  returnUrl: text('return_url').notNull(),
  successUrl: text('success_url'),
  failureUrl: text('failure_url'),

  // Metadata
  mallReserved: text('mall_reserved'),

  // Auth token (temporary, for approval flow)
  authToken: text('auth_token'),

  // Timestamps
  paidAt: text('paid_at'),
  failedAt: text('failed_at'),
  cancelledAt: text('cancelled_at'),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
