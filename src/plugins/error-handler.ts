import { FastifyInstance, FastifyError } from 'fastify';
import fp from 'fastify-plugin';

async function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode || 500;

    request.log.error({
      err: error,
      statusCode,
      url: request.url,
      method: request.method,
    });

    reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: statusCode >= 500 ? 'Internal server error' : error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
    });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });
}

export const errorHandlerPlugin = fp(errorHandler, { name: 'error-handler' });
