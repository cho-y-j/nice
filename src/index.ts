import { config } from './config/index.js';
import { buildApp } from './app.js';

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`NicePay Gateway running on http://${config.host}:${config.port}`);
    app.log.info(`Mode: ${config.nicepay.mode}`);
    app.log.info(`Swagger UI: http://${config.host}:${config.port}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
