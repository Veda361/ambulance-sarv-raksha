import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: [
      'password',
      'password_hash',
      'token',
      'refreshToken',
      'authorization',
      'headers.authorization',
      'patient_name',
      'contact_phone',
      'national_id',
      'address_details',
    ],
    censor: '[REDACTED_SENSITIVE]',
  },
  base: {
    env: config.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
