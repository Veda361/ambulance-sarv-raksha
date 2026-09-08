import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    hookTimeout: 15000,
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://sarvraksha:sarvraksha_password@localhost:5432/sarvraksha_test',
      JWT_SECRET: 'test_jwt_secret_key_must_be_at_least_32_characters_long_for_security',
      LOG_LEVEL: 'fatal',
    },
  },
});
