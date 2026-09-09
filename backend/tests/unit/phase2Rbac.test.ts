import { describe, it, expect } from 'vitest';
import { hasPermission } from '../../src/modules/authorization/permissions.js';

describe('Phase 2 Hospital Operations RBAC Matrix', () => {
  it('confirms HOSPITAL_ADMIN can manage facility ambulance fleet and crew', () => {
    expect(hasPermission('HOSPITAL_ADMIN', 'ambulance', 'create')).toBe(true);
    expect(hasPermission('HOSPITAL_ADMIN', 'ambulance', 'read')).toBe(true);
    expect(hasPermission('HOSPITAL_ADMIN', 'ambulance', 'update')).toBe(true);

    expect(hasPermission('HOSPITAL_ADMIN', 'crew', 'create')).toBe(true);
    expect(hasPermission('HOSPITAL_ADMIN', 'crew', 'read')).toBe(true);
    expect(hasPermission('HOSPITAL_ADMIN', 'crew', 'update')).toBe(true);

    expect(hasPermission('HOSPITAL_ADMIN', 'user', 'create')).toBe(true);
    expect(hasPermission('HOSPITAL_ADMIN', 'user', 'read')).toBe(true);
  });

  it('confirms RECEIVING_HOSPITAL_USER can manage receiving coordination and acknowledge alerts', () => {
    expect(hasPermission('RECEIVING_HOSPITAL_USER', 'receiving', 'read')).toBe(true);
    expect(hasPermission('RECEIVING_HOSPITAL_USER', 'receiving', 'manage')).toBe(true);
    expect(hasPermission('RECEIVING_HOSPITAL_USER', 'alert', 'acknowledge')).toBe(true);
    expect(hasPermission('RECEIVING_HOSPITAL_USER', 'mission', 'transition')).toBe(true);

    // Read-only on patients (PHI)
    expect(hasPermission('RECEIVING_HOSPITAL_USER', 'patient', 'read')).toBe(true);
    expect(hasPermission('RECEIVING_HOSPITAL_USER', 'patient', 'create')).toBe(false);
    expect(hasPermission('RECEIVING_HOSPITAL_USER', 'patient', 'delete')).toBe(false);
  });

  it('confirms DISPATCHER permissions for missions and alerts', () => {
    expect(hasPermission('DISPATCHER', 'mission', 'create')).toBe(true);
    expect(hasPermission('DISPATCHER', 'mission', 'assign')).toBe(true);
    expect(hasPermission('DISPATCHER', 'mission', 'transition')).toBe(true);
    expect(hasPermission('DISPATCHER', 'alert', 'acknowledge')).toBe(true);
    expect(hasPermission('DISPATCHER', 'receiving', 'manage')).toBe(true);
  });

  it('preserves Zero-PHI invariant for DRIVERS and REGULATORS', () => {
    expect(hasPermission('DRIVER', 'patient', 'read')).toBe(false);
    expect(hasPermission('DRIVER', 'vital', 'read')).toBe(false);
    expect(hasPermission('GOVERNMENT_OPERATOR', 'patient', 'read')).toBe(false);
    expect(hasPermission('GOVERNMENT_OPERATOR', 'vital', 'read')).toBe(false);
  });
});
