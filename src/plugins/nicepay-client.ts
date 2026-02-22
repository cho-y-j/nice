import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { NicePayClient } from '../lib/nicepay/client.js';

declare module 'fastify' {
  interface FastifyInstance {
    nicepay: NicePayClient;
  }
}

async function nicepayClient(app: FastifyInstance) {
  const client = new NicePayClient();
  app.decorate('nicepay', client);
  app.log.info(`NicePay client initialized (${process.env.NICEPAY_MODE || 'sandbox'} mode)`);
}

export const nicepayClientPlugin = fp(nicepayClient, { name: 'nicepay-client' });
