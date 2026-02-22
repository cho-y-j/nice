import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { getDb, AppDb } from '../db/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: AppDb;
  }
}

async function db(app: FastifyInstance) {
  const database = getDb();

  // Run initial schema creation
  const sqlite = (database as any).session?.client;
  if (sqlite) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL UNIQUE,
        tid TEXT,
        status TEXT NOT NULL DEFAULT 'ready',
        amount INTEGER NOT NULL,
        balance_amt INTEGER,
        tax_free_amt INTEGER DEFAULT 0,
        currency TEXT DEFAULT 'KRW',
        pay_method TEXT NOT NULL,
        goods_name TEXT NOT NULL,
        approve_no TEXT,
        channel TEXT,
        card_info TEXT,
        vbank_info TEXT,
        buyer_name TEXT,
        buyer_email TEXT,
        buyer_tel TEXT,
        return_url TEXT NOT NULL,
        success_url TEXT,
        failure_url TEXT,
        mall_reserved TEXT,
        auth_token TEXT,
        paid_at TEXT,
        failed_at TEXT,
        cancelled_at TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS billing_keys (
        id TEXT PRIMARY KEY,
        bid TEXT NOT NULL UNIQUE,
        order_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        card_code TEXT,
        card_name TEXT,
        card_num_masked TEXT,
        buyer_name TEXT,
        buyer_email TEXT,
        buyer_tel TEXT,
        auth_date TEXT,
        expired_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS refunds (
        id TEXT PRIMARY KEY,
        payment_id TEXT NOT NULL,
        tid TEXT NOT NULL,
        cancelled_tid TEXT,
        order_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'requested',
        cancel_amt INTEGER,
        balance_amt INTEGER,
        tax_free_amt INTEGER DEFAULT 0,
        reason TEXT NOT NULL,
        refund_account TEXT,
        refund_bank_code TEXT,
        refund_holder TEXT,
        result_code TEXT,
        result_msg TEXT,
        cancelled_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS webhook_logs (
        id TEXT PRIMARY KEY,
        tid TEXT,
        order_id TEXT,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'received',
        payload TEXT NOT NULL,
        signature_valid INTEGER,
        result_code TEXT,
        error_message TEXT,
        processing_ms INTEGER,
        received_at TEXT NOT NULL,
        processed_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
      CREATE INDEX IF NOT EXISTS idx_payments_tid ON payments(tid);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_billing_keys_bid ON billing_keys(bid);
      CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
      CREATE INDEX IF NOT EXISTS idx_refunds_tid ON refunds(tid);
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_tid ON webhook_logs(tid);
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_order_id ON webhook_logs(order_id);
    `);
  }

  app.decorate('db', database);
  app.log.info('Database connected');
}

export const dbPlugin = fp(db, { name: 'db' });
