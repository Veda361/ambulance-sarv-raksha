import { describe, it, expect } from 'vitest';
import { validateStateTransition } from '../../src/modules/mission/stateMachine.js';
import { InvalidStateTransitionError, AuthorizationError } from '../../src/shared/errors.js';

describe('Mission Finite State Machine', () => {
  it('allows valid sequential forward progression by authorized roles', () => {
    // REQUESTED -> DISPATCHING
    expect(() => validateStateTransition('REQUESTED', 'DISPATCHING', 'DISPATCHER')).not.toThrow();

    // DISPATCHING -> ASSIGNED
    expect(() => validateStateTransition('DISPATCHING', 'ASSIGNED', 'DISPATCHER')).not.toThrow();

    // ASSIGNED -> ACCEPTED by Driver
    expect(() => validateStateTransition('ASSIGNED', 'ACCEPTED', 'DRIVER')).not.toThrow();

    // ACCEPTED -> EN_ROUTE_TO_PICKUP by Driver
    expect(() => validateStateTransition('ACCEPTED', 'EN_ROUTE_TO_PICKUP', 'DRIVER')).not.toThrow();

    // EN_ROUTE_TO_PICKUP -> ARRIVED_PICKUP by Driver
    expect(() => validateStateTransition('EN_ROUTE_TO_PICKUP', 'ARRIVED_PICKUP', 'DRIVER')).not.toThrow();

    // ARRIVED_PICKUP -> PATIENT_ONBOARD by EMT
    expect(() => validateStateTransition('ARRIVED_PICKUP', 'PATIENT_ONBOARD', 'EMT')).not.toThrow();

    // PATIENT_ONBOARD -> EN_ROUTE_TO_HOSPITAL by Driver
    expect(() => validateStateTransition('PATIENT_ONBOARD', 'EN_ROUTE_TO_HOSPITAL', 'DRIVER')).not.toThrow();

    // EN_ROUTE_TO_HOSPITAL -> ARRIVED_HOSPITAL by Driver
    expect(() => validateStateTransition('EN_ROUTE_TO_HOSPITAL', 'ARRIVED_HOSPITAL', 'DRIVER')).not.toThrow();

    // ARRIVED_HOSPITAL -> HANDOVER
    expect(() => validateStateTransition('ARRIVED_HOSPITAL', 'HANDOVER', 'RECEIVING_HOSPITAL_USER')).not.toThrow();

    // HANDOVER -> COMPLETED by Hospital User
    expect(() => validateStateTransition('HANDOVER', 'COMPLETED', 'RECEIVING_HOSPITAL_USER')).not.toThrow();
  });

  it('rejects skipping state milestones (e.g. REQUESTED straight to ARRIVED_HOSPITAL)', () => {
    expect(() => validateStateTransition('REQUESTED', 'ARRIVED_HOSPITAL', 'DRIVER')).toThrow(
      InvalidStateTransitionError
    );
  });

  it('rejects backwards transitions (e.g. PATIENT_ONBOARD back to EN_ROUTE_TO_PICKUP)', () => {
    expect(() => validateStateTransition('PATIENT_ONBOARD', 'EN_ROUTE_TO_PICKUP', 'DRIVER')).toThrow(
      InvalidStateTransitionError
    );
  });

  it('rejects transitions out of terminal state COMPLETED', () => {
    expect(() => validateStateTransition('COMPLETED', 'REQUESTED', 'DISPATCHER')).toThrow(
      InvalidStateTransitionError
    );
  });

  it('rejects unauthorized actors (e.g. Driver attempting to mark mission COMPLETED)', () => {
    expect(() => validateStateTransition('HANDOVER', 'COMPLETED', 'DRIVER')).toThrow(
      AuthorizationError
    );
  });

  it('allows cancellation by Dispatcher from intermediate non-terminal states', () => {
    expect(() => validateStateTransition('EN_ROUTE_TO_PICKUP', 'CANCELLED', 'DISPATCHER')).not.toThrow();
  });
});
