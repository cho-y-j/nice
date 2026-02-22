import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

async function rateLimitSetup(app: FastifyInstance) {
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      return (req.headers['x-api-key'] as string) || req.ip;
    },
  });
}

export const rateLimitPlugin = fp(rateLimitSetup, { name: 'rate-limit' });
