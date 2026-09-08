import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiV1Routes } from './api/v1/index.js';
import { pool } from './database/index.js';
import { realtimeGateway } from './realtime/wsGateway.js';
import { logger } from './shared/logger.js';

export function createApp(): express.Express {
  const app = express();

  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  app.use(requestIdMiddleware);

  // Request logger middleware
  app.use((req: Request, _res: Response, next) => {
    logger.debug({ method: req.method, path: req.path, requestId: req.id }, 'Incoming HTTP request');
    next();
  });

  // ============================================================
  // HEALTH & OBSERVABILITY ENDPOINTS
  // ============================================================
  // Liveness probe
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
    });
  });

  // Readiness probe
  app.get('/ready', async (_req: Request, res: Response) => {
    try {
      await pool.query('SELECT 1');
      res.json({
        status: 'READY',
        database: 'CONNECTED',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(503).json({
        status: 'NOT_READY',
        database: 'DISCONNECTED',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Basic metrics snapshot
  app.get('/metrics', (_req: Request, res: Response) => {
    const memory = process.memoryUsage();
    res.json({
      process: {
        uptime: process.uptime(),
        memory: {
          heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
          rssMb: Math.round(memory.rss / 1024 / 1024),
        },
      },
      realtime: {
        activeWebSocketClients: realtimeGateway.getConnectedClientsCount(),
      },
      pool: {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingRequests: pool.waitingCount,
      },
    });
  });

  // ============================================================
  // API VERSION 1
  // ============================================================
  app.use('/api/v1', apiV1Routes);

  // 404 Route Not Found
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Endpoint '${req.method} ${req.path}' does not exist on this server`,
      },
      meta: {
        requestId: req.id,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
