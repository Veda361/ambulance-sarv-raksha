export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  readonly details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_ERROR';
}

export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = 'AUTHENTICATION_REQUIRED';
}

export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  readonly errorCode = 'FORBIDDEN_RESOURCE_ACCESS';
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = 'RESOURCE_NOT_FOUND';
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = 'RESOURCE_CONFLICT';
}

export class InvalidStateTransitionError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = 'INVALID_STATE_TRANSITION';
}

export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly errorCode = 'RATE_LIMIT_EXCEEDED';
}

export class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly errorCode = 'INTERNAL_SERVER_ERROR';
}
