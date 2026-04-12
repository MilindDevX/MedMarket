import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter: kept at 20/10min — appropriate for login/register flows.
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Order limiter: applied to POST /orders to prevent order spam.
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { success: false, message: 'Too many orders placed. Please wait before placing another.' },
  standardHeaders: true,
  legacyHeaders: false,
});
