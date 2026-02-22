import { FastifyInstance } from 'fastify';
import { registerRoute } from './register.js';
import { chargeRoute } from './charge.js';
import { expireRoute } from './expire.js';

export async function billingRoutes(app: FastifyInstance) {
  await app.register(registerRoute);
  await app.register(chargeRoute);
  await app.register(expireRoute);
}
