export type UserRole =
  | 'SUPER_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'HOSPITAL_ADMIN'
  | 'DISPATCHER'
  | 'DRIVER'
  | 'EMT'
  | 'RECEIVING_HOSPITAL_USER'
  | 'GOVERNMENT_OPERATOR';

export type Resource =
  | 'organization'
  | 'hospital'
  | 'ambulance'
  | 'crew'
  | 'patient'
  | 'mission'
  | 'location'
  | 'vital'
  | 'alert'
  | 'audit'
  | 'device';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'assign' | 'transition';

// Permission Matrix matching Phase 0 specifications
export const PERMISSIONS: Record<UserRole, Partial<Record<Resource, Action[]>>> = {
  SUPER_ADMIN: {
    organization: ['create', 'read', 'update', 'delete'],
    hospital: ['read'],
    ambulance: ['read'],
    crew: ['read'],
    mission: ['read'],
    location: ['read'],
    alert: ['read'],
    audit: ['read'],
    device: ['create', 'read', 'update', 'delete'],
    // ZERO PHI: patient and vital are explicitly omitted
  },

  ORGANIZATION_ADMIN: {
    organization: ['read', 'update'],
    hospital: ['create', 'read', 'update', 'delete'],
    ambulance: ['create', 'read', 'update', 'delete'],
    crew: ['create', 'read', 'update', 'delete'],
    mission: ['create', 'read', 'update', 'delete'],
    patient: ['create', 'read', 'update'],
    location: ['read'],
    vital: ['read'],
    alert: ['read', 'update'],
    audit: ['read'],
    device: ['create', 'read', 'update', 'delete'],
  },

  HOSPITAL_ADMIN: {
    organization: ['read'],
    hospital: ['read', 'update'],
    ambulance: ['read'],
    crew: ['read'],
    mission: ['create', 'read', 'update'],
    patient: ['create', 'read', 'update'],
    location: ['read'],
    vital: ['read'],
    alert: ['read', 'update'],
    audit: ['read'],
    device: ['read'],
  },

  DISPATCHER: {
    organization: ['read'],
    hospital: ['read'],
    ambulance: ['read', 'update'],
    crew: ['create', 'read', 'update'],
    mission: ['create', 'read', 'update', 'assign', 'transition'],
    patient: ['create', 'read', 'update'],
    location: ['read'],
    vital: ['read'],
    alert: ['create', 'read', 'update'],
    device: ['read'],
  },

  DRIVER: {
    hospital: ['read'],
    ambulance: ['read'],
    crew: ['read'],
    mission: ['read', 'transition'],
    location: ['create', 'read'],
    alert: ['read'],
    // ZERO PHI access to patients or vitals
  },

  EMT: {
    hospital: ['read'],
    ambulance: ['read'],
    crew: ['read'],
    mission: ['read', 'transition'],
    patient: ['create', 'read', 'update'],
    vital: ['create', 'read', 'update'],
    location: ['read'],
    alert: ['create', 'read'],
  },

  RECEIVING_HOSPITAL_USER: {
    hospital: ['read'],
    ambulance: ['read'],
    mission: ['read', 'transition'],
    patient: ['read'],
    vital: ['read'],
    location: ['read'],
    alert: ['read', 'update'],
  },

  GOVERNMENT_OPERATOR: {
    organization: ['read'],
    hospital: ['read'],
    ambulance: ['read'],
    mission: ['read'],
    location: ['read'],
    alert: ['read'],
    audit: ['read'],
    // ZERO PHI: patient and vitals omitted
  },
};

export function hasPermission(role: UserRole, resource: Resource, action: Action): boolean {
  const roleRules = PERMISSIONS[role];
  if (!roleRules) return false;
  const allowedActions = roleRules[resource];
  if (!allowedActions) return false;
  return allowedActions.includes(action);
}
