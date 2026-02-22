import Fastify from 'fastify';
import formbody from '@fastify/formbody';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config/index.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { swaggerPlugin } from './plugins/swagger.js';
import { dbPlugin } from './plugins/db.js';
import { nicepayClientPlugin } from './plugins/nicepay-client.js';
import { rateLimitPlugin } from './plugins/rate-limit.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport: config.nodeEnv === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
      redact: ['req.headers.authorization', 'req.headers["x-api-key"]'],
    },
  });

  // Core plugins
  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://pay.nicepay.co.kr"],
        scriptSrcAttr: ["'unsafe-inline'"],
        frameSrc: ["'self'", "https://*.nicepay.co.kr"],
        connectSrc: ["'self'", "https://*.nicepay.co.kr"],
        imgSrc: ["'self'", "data:", "https://*.nicepay.co.kr"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        formAction: ["'self'", "https://*.nicepay.co.kr"],
      },
    },
  });
  await app.register(cors, { origin: true });
  await app.register(formbody);

  // Application plugins
  await app.register(errorHandlerPlugin);
  await app.register(swaggerPlugin);
  await app.register(dbPlugin);
  await app.register(nicepayClientPlugin);
  await app.register(rateLimitPlugin);

  // Routes
  await app.register(registerRoutes);

  return app;
}
