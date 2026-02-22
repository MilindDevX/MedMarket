import type { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log full error server-side
  console.error('[GlobalErrorHandler]', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // Never leak stack traces or internal error details to the client
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again.',
  });
}
