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
  | 'device'
  | 'receiving'
  | 'user';

export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'assign'
  | 'transition'
  | 'acknowledge'
  | 'manage';

// Permission Matrix matching Phase 1 foundation + Phase 2 Hospital Operations specifications
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
    user: ['create', 'read', 'update', 'delete'],
    receiving: ['read'],
    // ZERO PHI: patient and vital are explicitly omitted
  },

  ORGANIZATION_ADMIN: {
    organization: ['read', 'update'],
    hospital: ['create', 'read', 'update', 'delete'],
    ambulance: ['create', 'read', 'update', 'delete'],
    crew: ['create', 'read', 'update', 'delete'],
    mission: ['create', 'read', 'update', 'delete', 'assign', 'transition'],
    patient: ['create', 'read', 'update'],
    location: ['read'],
    vital: ['read'],
    alert: ['create', 'read', 'update', 'acknowledge'],
    audit: ['read'],
    device: ['create', 'read', 'update', 'delete'],
    user: ['create', 'read', 'update', 'delete'],
    receiving: ['read', 'manage'],
  },

  HOSPITAL_ADMIN: {
    organization: ['read'],
    hospital: ['read', 'update'],
    ambulance: ['create', 'read', 'update'], // Phase 2: Hospital Admin manages facility ambulance fleet
    crew: ['create', 'read', 'update'],     // Phase 2: Hospital Admin manages crew shifts
    mission: ['create', 'read', 'update', 'assign', 'transition'],
    patient: ['create', 'read', 'update'],
    location: ['read'],
    vital: ['read'],
    alert: ['read', 'update', 'acknowledge'],
    audit: ['read'],
    device: ['read'],
    user: ['create', 'read', 'update'],     // Phase 2: Hospital Admin manages hospital staff
    receiving: ['read', 'manage'],
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
    alert: ['create', 'read', 'update', 'acknowledge'],
    device: ['read'],
    receiving: ['read', 'manage'],
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
    alert: ['create', 'read', 'acknowledge'],
    receiving: ['read'],
  },

  RECEIVING_HOSPITAL_USER: {
    hospital: ['read'],
    ambulance: ['read'],
    mission: ['read', 'transition'],
    patient: ['read'],
    vital: ['read'],
    location: ['read'],
    alert: ['read', 'update', 'acknowledge'],
    receiving: ['read', 'manage'],
  },

  GOVERNMENT_OPERATOR: {
    organization: ['read'],
    hospital: ['read'],
    ambulance: ['read'],
    mission: ['read'],
    location: ['read'],
    alert: ['read'],
    audit: ['read'],
    receiving: ['read'],
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
