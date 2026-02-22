import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const billingKeys = sqliteTable('billing_keys', {
  id: text('id').primaryKey(),
  bid: text('bid').notNull().unique(),
  orderId: text('order_id').notNull(),
  status: text('status', { enum: ['active', 'expired'] }).notNull().default('active'),

  // Card info (masked)
  cardCode: text('card_code'),
  cardName: text('card_name'),
  cardNumMasked: text('card_num_masked'),

  // Buyer info
  buyerName: text('buyer_name'),
  buyerEmail: text('buyer_email'),
  buyerTel: text('buyer_tel'),

  // Timestamps
  authDate: text('auth_date'),
  expiredAt: text('expired_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type BillingKey = typeof billingKeys.$inferSelect;
export type NewBillingKey = typeof billingKeys.$inferInsert;
