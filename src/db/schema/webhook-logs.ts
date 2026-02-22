import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const webhookLogs = sqliteTable('webhook_logs', {
  id: text('id').primaryKey(),
  tid: text('tid'),
  orderId: text('order_id'),
  eventType: text('event_type').notNull(),
  status: text('status', {
    enum: ['received', 'processed', 'failed', 'signature_invalid'],
  }).notNull().default('received'),

  // Full payload
  payload: text('payload').notNull(),

  // Signature verification
  signatureValid: integer('signature_valid', { mode: 'boolean' }),

  // Processing
  resultCode: text('result_code'),
  errorMessage: text('error_message'),
  processingMs: integer('processing_ms'),

  // Timestamps
  receivedAt: text('received_at').notNull().$defaultFn(() => new Date().toISOString()),
  processedAt: text('processed_at'),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type NewWebhookLog = typeof webhookLogs.$inferInsert;
