import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const refunds = sqliteTable('refunds', {
  id: text('id').primaryKey(),
  paymentId: text('payment_id').notNull(),
  tid: text('tid').notNull(),
  cancelledTid: text('cancelled_tid'),
  orderId: text('order_id').notNull(),

  status: text('status', { enum: ['requested', 'completed', 'failed'] }).notNull().default('requested'),
  cancelAmt: integer('cancel_amt'),
  balanceAmt: integer('balance_amt'),
  taxFreeAmt: integer('tax_free_amt').default(0),

  reason: text('reason').notNull(),

  // Vbank refund info
  refundAccount: text('refund_account'),
  refundBankCode: text('refund_bank_code'),
  refundHolder: text('refund_holder'),

  // NicePay response
  resultCode: text('result_code'),
  resultMsg: text('result_msg'),

  // Timestamps
  cancelledAt: text('cancelled_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type Refund = typeof refunds.$inferSelect;
export type NewRefund = typeof refunds.$inferInsert;
