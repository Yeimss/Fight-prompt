import { buildServer } from './infrastructure/server/server.js';
import { config } from './shared/config/index.js';
import { logger } from './shared/logger/logger.js';

/**
 * Punto de entrada del proceso API HTTP.
 * Los workers de jobs viven en un proceso separado (src/jobs/worker.ts)
 * para poder escalarlos de forma independiente.
 */
async function bootstrap(): Promise<void> {
  const app = await buildServer();

  await app.listen({ port: config.port, host: '0.0.0.0' });
  logger.info(`API escuchando en puerto ${config.port} [${config.nodeEnv}]`);
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fallo al iniciar la aplicación');
  process.exit(1);
});
