import type { Response } from 'express';

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
  errors?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
