import type { Response } from 'express';
import type { ErrorCode } from '../types/errors.ts';

export function successResponse(
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode = 400,
  errorCode?: ErrorCode | string,
  errors?: unknown
) {
  return res.status(statusCode).json({
    success:    false,
    message,
    error_code: errorCode ?? null,
    errors,
  });
}
