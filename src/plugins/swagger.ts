import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

async function swaggerSetup(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'NicePay Gateway API',
        description: 'NicePay 결제 게이트웨이 마이크로서비스 API',
        version: '1.0.0',
      },
      servers: [
        { url: 'http://localhost:3100', description: 'Development' },
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
          },
        },
      },
      tags: [
        { name: 'Health', description: '헬스 체크' },
        { name: 'Payments', description: '결제 관리' },
        { name: 'Billing', description: '빌링(정기결제) 관리' },
        { name: 'Webhooks', description: '웹훅 관리' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });
}

export const swaggerPlugin = fp(swaggerSetup, { name: 'swagger' });
