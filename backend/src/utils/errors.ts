export type ErrorType =
  | 'invalid_request_error'
  | 'authentication_error'
  | 'permission_error'
  | 'not_found_error'
  | 'idempotency_conflict'
  | 'plan_validation_error'
  | 'rate_limit_error'
  | 'provider_error'
  | 'api_error';

export interface ApiErrorResponse {
  error: {
    type: ErrorType;
    code: string;
    message: string;
    request_id?: string;
    param?: string;
  };
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorType: ErrorType;
  public readonly code: string;
  public readonly param?: string;

  constructor(
    statusCode: number,
    errorType: ErrorType,
    code: string,
    message: string,
    param?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.code = code;
    this.param = param;
    Error.captureStackTrace(this, this.constructor);
  }

  toResponse(requestId?: string): ApiErrorResponse {
    return {
      error: {
        type: this.errorType,
        code: this.code,
        message: this.message,
        request_id: requestId,
        param: this.param,
      },
    };
  }
}

// Convenient factory helpers matching exact prompt requirements
export const Errors = {
  badRequest: (message: string, code = 'invalid_request', param?: string) =>
    new AppError(400, 'invalid_request_error', code, message, param),

  unauthorized: (message = 'Authentication credentials invalid or missing.', code = 'unauthorized') =>
    new AppError(401, 'authentication_error', code, message),

  forbidden: (message = 'You do not have permission to perform this action.', code = 'forbidden') =>
    new AppError(403, 'permission_error', code, message),

  notFound: (resource = 'Resource', code = 'resource_not_found') =>
    new AppError(404, 'not_found_error', code, `${resource} not found.`),

  idempotencyConflict: (
    message = 'An idempotency key was reused with different request parameters.',
    code = 'idempotency_conflict'
  ) => new AppError(409, 'idempotency_conflict', code, message),

  planValidationError: (
    message: string,
    code = 'plan_limit_exceeded',
    param?: string
  ) => new AppError(422, 'plan_validation_error', code, message, param),

  rateLimitError: (
    message = 'Rate limit exceeded.',
    code = 'rate_limit_reached'
  ) => new AppError(429, 'rate_limit_error', code, message),

  parallelLimitError: (
    message = 'Your account has reached its parallel generation limit.',
    code = 'parallel_limit_reached'
  ) => new AppError(429, 'rate_limit_error', code, message),

  creditsExhaustedError: (
    message = 'Your monthly credit allowance has been exhausted.',
    code = 'insufficient_credits'
  ) => new AppError(429, 'rate_limit_error', code, message),

  providerError: (message: string, code = 'provider_unavailable', statusCode = 502) =>
    new AppError(statusCode, 'provider_error', code, message),

  internal: (message = 'An unexpected internal error occurred.', code = 'internal_error') =>
    new AppError(500, 'api_error', code, message),
};
