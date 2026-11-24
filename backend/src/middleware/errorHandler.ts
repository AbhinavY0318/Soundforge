import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ApiErrorResponse } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const requestId = req.id || 'req_unknown';

  if (err instanceof AppError) {
    logger.warn('Handled application error', {
      requestId,
      statusCode: err.statusCode,
      type: err.errorType,
      code: err.code,
      message: err.message,
      path: req.originalUrl,
      method: req.method,
    });

    res.status(err.statusCode).json(err.toResponse(requestId));
    return;
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const message = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Validation error';

    logger.warn('Validation error', {
      requestId,
      issues: err.issues,
      path: req.originalUrl,
    });

    const errorResponse: ApiErrorResponse = {
      error: {
        type: 'invalid_request_error',
        code: 'validation_error',
        message,
        request_id: requestId,
        param: firstIssue ? firstIssue.path.join('.') : undefined,
      },
    };

    res.status(400).json(errorResponse);
    return;
  }

  const error = err as Error;
  logger.error('Unhandled server exception', {
    requestId,
    error: error.message,
    stack: error.stack,
    path: req.originalUrl,
    method: req.method,
  });

  const internalResponse: ApiErrorResponse = {
    error: {
      type: 'api_error',
      code: 'internal_server_error',
      message: 'An unexpected internal server error occurred. Please contact support.',
      request_id: requestId,
    },
  };

  res.status(500).json(internalResponse);
}
