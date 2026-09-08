import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors.js';
import { logger } from '../shared/logger.js';
import { config } from '../config/index.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id || 'unknown';

  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    logger.warn({ err: err.issues, requestId }, 'Request validation failed');
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input data',
        details: err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle Domain/App Errors
  if (err instanceof AppError) {
    logger.warn(
      { code: err.errorCode, message: err.message, details: err.details, requestId },
      'Handled application error'
    );
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle Uncaught / Internal Errors
  logger.error({ err, requestId }, 'Unhandled internal server error');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.NODE_ENV === 'production' 
        ? 'An unexpected error occurred. Please contact support.' 
        : err.message || 'Internal server error',
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}
