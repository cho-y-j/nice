import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { config } from '../config/index.js';

async function authPlugin(app: FastifyInstance) {
  app.decorate('verifyApiKey', async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTH_MISSING', message: 'X-API-Key header is required' },
      });
    }

    if (!config.security.apiKeys.includes(apiKey)) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_INVALID', message: 'Invalid API key' },
      });
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    verifyApiKey: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin_ = fp(authPlugin, { name: 'auth' });
