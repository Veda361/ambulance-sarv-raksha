import { describe, it, expect } from 'vitest';
import { hasPermission } from '../../src/modules/authorization/permissions.js';

describe('RBAC Permission Matrix', () => {
  it('enforces Zero-PHI for Super Admin', () => {
    // Super Admin can manage organizations, hospitals, ambulances
    expect(hasPermission('SUPER_ADMIN', 'organization', 'create')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'ambulance', 'read')).toBe(true);

    // Super Admin CANNOT read or write patient clinical records or vitals
    expect(hasPermission('SUPER_ADMIN', 'patient', 'read')).toBe(false);
    expect(hasPermission('SUPER_ADMIN', 'vital', 'read')).toBe(false);
  });

  it('enforces least-privilege for Driver', () => {
    // Driver can read mission and transition it
    expect(hasPermission('DRIVER', 'mission', 'read')).toBe(true);
    expect(hasPermission('DRIVER', 'mission', 'transition')).toBe(true);

    // Driver can create location telemetry
    expect(hasPermission('DRIVER', 'location', 'create')).toBe(true);

    // Driver CANNOT read patient clinical history or create organizations
    expect(hasPermission('DRIVER', 'patient', 'read')).toBe(false);
    expect(hasPermission('DRIVER', 'vital', 'read')).toBe(false);
    expect(hasPermission('DRIVER', 'organization', 'create')).toBe(false);
  });

  it('allows EMT to record patient data and vital measurements', () => {
    expect(hasPermission('EMT', 'patient', 'create')).toBe(true);
    expect(hasPermission('EMT', 'patient', 'update')).toBe(true);
    expect(hasPermission('EMT', 'vital', 'create')).toBe(true);
    expect(hasPermission('EMT', 'alert', 'create')).toBe(true);
  });

  it('allows Dispatcher to manage missions and ambulances but not update organization settings', () => {
    expect(hasPermission('DISPATCHER', 'mission', 'create')).toBe(true);
    expect(hasPermission('DISPATCHER', 'mission', 'assign')).toBe(true);
    expect(hasPermission('DISPATCHER', 'ambulance', 'update')).toBe(true);
    expect(hasPermission('DISPATCHER', 'organization', 'update')).toBe(false);
  });
});
