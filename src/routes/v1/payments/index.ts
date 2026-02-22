import { FastifyInstance } from 'fastify';
import { prepareRoute } from './prepare.js';
import { approveRoute } from './approve.js';
import { statusRoute } from './status.js';
import { findRoute } from './find.js';
import { cancelRoute } from './cancel.js';

export async function paymentRoutes(app: FastifyInstance) {
  await app.register(prepareRoute);
  await app.register(approveRoute);
  await app.register(statusRoute);
  await app.register(findRoute);
  await app.register(cancelRoute);
}
