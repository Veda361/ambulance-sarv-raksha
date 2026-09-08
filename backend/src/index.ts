import http from 'http';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './shared/logger.js';
import { pool } from './database/index.js';
import { realtimeGateway } from './realtime/wsGateway.js';

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize Realtime WebSocket Gateway
  realtimeGateway.initialize(server);

  server.listen(config.PORT, config.HOST, () => {
    logger.info(
      { port: config.PORT, host: config.HOST, env: config.NODE_ENV },
      '🚀 Sarv Raksha Ambulance Platform Backend running'
    );
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received termination signal, shutting down gracefully...');
    server.close(async () => {
      logger.info('Closed HTTP and WebSocket server');
      try {
        await realtimeGateway.close();
        await pool.end();
        logger.info('Closed PostgreSQL connection pool');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during graceful shutdown');
        process.exit(1);
      }
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      logger.fatal('Forceful shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Fatal error during bootstrap');
  process.exit(1);
});
