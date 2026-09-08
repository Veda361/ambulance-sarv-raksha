import { UserRole } from '../authorization/permissions.js';
import { InvalidStateTransitionError, AuthorizationError } from '../../shared/errors.js';

export type MissionState =
  | 'REQUESTED'
  | 'DISPATCHING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'EN_ROUTE_TO_PICKUP'
  | 'ARRIVED_PICKUP'
  | 'PATIENT_ONBOARD'
  | 'EN_ROUTE_TO_HOSPITAL'
  | 'ARRIVED_HOSPITAL'
  | 'HANDOVER'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

interface StateTransitionRule {
  allowedTargetStates: MissionState[];
  authorizedRoles: UserRole[];
}

export const STATE_TRANSITIONS: Record<MissionState, StateTransitionRule> = {
  REQUESTED: {
    allowedTargetStates: ['DISPATCHING', 'CANCELLED'],
    authorizedRoles: ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER'],
  },
  DISPATCHING: {
    allowedTargetStates: ['ASSIGNED', 'CANCELLED'],
    authorizedRoles: ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER'],
  },
  ASSIGNED: {
    allowedTargetStates: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
    authorizedRoles: ['DRIVER', 'DISPATCHER', 'HOSPITAL_ADMIN'],
  },
  REJECTED: {
    allowedTargetStates: ['ASSIGNED', 'CANCELLED'],
    authorizedRoles: ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'HOSPITAL_ADMIN', 'DISPATCHER'],
  },
  ACCEPTED: {
    allowedTargetStates: ['EN_ROUTE_TO_PICKUP', 'CANCELLED'],
    authorizedRoles: ['DRIVER', 'DISPATCHER'],
  },
  EN_ROUTE_TO_PICKUP: {
    allowedTargetStates: ['ARRIVED_PICKUP', 'CANCELLED'],
    authorizedRoles: ['DRIVER', 'DISPATCHER'],
  },
  ARRIVED_PICKUP: {
    allowedTargetStates: ['PATIENT_ONBOARD', 'CANCELLED'],
    authorizedRoles: ['DRIVER', 'EMT', 'DISPATCHER'],
  },
  PATIENT_ONBOARD: {
    allowedTargetStates: ['EN_ROUTE_TO_HOSPITAL', 'CANCELLED'],
    authorizedRoles: ['DRIVER', 'EMT', 'DISPATCHER'],
  },
  EN_ROUTE_TO_HOSPITAL: {
    allowedTargetStates: ['ARRIVED_HOSPITAL', 'CANCELLED'],
    authorizedRoles: ['DRIVER', 'DISPATCHER'],
  },
  ARRIVED_HOSPITAL: {
    allowedTargetStates: ['HANDOVER', 'CANCELLED'],
    authorizedRoles: ['DRIVER', 'EMT', 'RECEIVING_HOSPITAL_USER', 'DISPATCHER'],
  },
  HANDOVER: {
    allowedTargetStates: ['COMPLETED', 'CANCELLED'],
    authorizedRoles: ['RECEIVING_HOSPITAL_USER', 'HOSPITAL_ADMIN'],
  },
  COMPLETED: {
    allowedTargetStates: [], // Terminal
    authorizedRoles: [],
  },
  CANCELLED: {
    allowedTargetStates: [], // Terminal
    authorizedRoles: [],
  },
};

export function validateStateTransition(
  currentState: MissionState,
  targetState: MissionState,
  actorRole: UserRole
): void {
  const rule = STATE_TRANSITIONS[currentState];
  if (!rule) {
    throw new InvalidStateTransitionError(`Unknown current mission state: ${currentState}`);
  }

  if (currentState === 'COMPLETED' || currentState === 'CANCELLED') {
    throw new InvalidStateTransitionError(
      `Cannot transition out of terminal state: ${currentState}`
    );
  }

  if (!rule.allowedTargetStates.includes(targetState)) {
    throw new InvalidStateTransitionError(
      `Invalid state transition: Cannot transition from ${currentState} to ${targetState}`
    );
  }

  if (!rule.authorizedRoles.includes(actorRole)) {
    throw new AuthorizationError(
      `Role ${actorRole} is not authorized to transition mission from ${currentState} to ${targetState}`
    );
  }
}
