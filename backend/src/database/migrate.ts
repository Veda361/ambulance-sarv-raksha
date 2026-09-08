import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { pool, withTransaction } from './index.js';
import { logger } from '../shared/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureMigrationTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      checksum VARCHAR(64) NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function runMigrations(): Promise<void> {
  logger.info('Starting database migration process...');
  await ensureMigrationTable();

  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    logger.warn(`Migrations directory not found at: ${migrationsDir}`);
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const version = file.split('_')[0];
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    const checksum = crypto.createHash('sha256').update(sql).digest('hex');

    const res = await pool.query(
      'SELECT version, checksum FROM schema_migrations WHERE version = $1',
      [version]
    );

    if (res.rows.length > 0) {
      if (res.rows[0].checksum !== checksum) {
        throw new Error(
          `Checksum mismatch for migration ${file}! Database: ${res.rows[0].checksum}, File: ${checksum}`
        );
      }
      logger.debug({ version, file }, 'Migration already executed, skipping');
      continue;
    }

    logger.info({ version, file }, 'Executing pending migration...');
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
        [version, file, checksum]
      );
    });
    logger.info({ version, file }, 'Migration executed successfully');
  }

  logger.info('All database migrations completed successfully.');
}

// Run directly when called from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      pool.end();
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Migration failed');
      pool.end();
      process.exit(1);
    });
}
