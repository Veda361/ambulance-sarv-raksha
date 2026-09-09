import { describe, it, expect } from 'vitest';
import { HospitalOpsService } from '../../src/modules/organization/hospitalOpsService.js';
import { ValidationError } from '../../src/shared/errors.js';

describe('Hospital Diversion Status Engine', () => {
  it('validates allowed diversion statuses', async () => {
    const validStatuses = ['NORMAL', 'ADVISORY', 'DIVERT_ALL', 'TRAUMA_BYPASS'];

    for (const st of validStatuses) {
      // Calling with fake tenant/hospital to test validation logic before query
      try {
        await HospitalOpsService.updateDiversionStatus('mock-hosp-id', 'mock-tenant-id', st);
      } catch (err: any) {
        // We expect either database error (because mock IDs don't exist) or success, but NOT ValidationError
        expect(err).not.toBeInstanceOf(ValidationError);
      }
    }
  });

  it('rejects invalid diversion status with ValidationError', async () => {
    await expect(
      HospitalOpsService.updateDiversionStatus('mock-hosp-id', 'mock-tenant-id', 'INVALID_STATUS')
    ).rejects.toThrow(ValidationError);
  });
});
