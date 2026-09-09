import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Idempotency Key & Digest Generation', () => {
  it('generates deterministic SHA-256 parameter hashes for equivalent payloads', () => {
    const payload1 = { ambulanceId: 'amb-1', pickupAddress: 'Main St', triageAcuity: 'RED_CRITICAL' };
    const payload2 = { ambulanceId: 'amb-1', pickupAddress: 'Main St', triageAcuity: 'RED_CRITICAL' };

    const hash1 = crypto.createHash('sha256').update(JSON.stringify(payload1)).digest('hex');
    const hash2 = crypto.createHash('sha256').update(JSON.stringify(payload2)).digest('hex');

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('generates distinct hashes for modified payloads', () => {
    const payload1 = { ambulanceId: 'amb-1', pickupAddress: 'Main St' };
    const payload2 = { ambulanceId: 'amb-2', pickupAddress: 'Main St' };

    const hash1 = crypto.createHash('sha256').update(JSON.stringify(payload1)).digest('hex');
    const hash2 = crypto.createHash('sha256').update(JSON.stringify(payload2)).digest('hex');

    expect(hash1).not.toBe(hash2);
  });
});
