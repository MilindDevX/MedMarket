import rateLimit, { Options } from 'express-rate-limit';
import type { Request } from 'express';

// Skip CORS preflight requests — OPTIONS must never consume a rate-limit slot.
// This prevents browsers from burning through auth quotas before the real request.
const skipOptions = (req: Request) => req.method === 'OPTIONS';

// Inject Retry-After header on 429 so clients can back off gracefully.
const onLimitReached: Partial<Options> = {
  handler: (req, res, next, options) => {
    const windowSec = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', windowSec);
    res.status(429).json(options.message);
  },
};

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipOptions,
  ...onLimitReached,
});

// Auth limiter: kept at 20/10min — appropriate for login/register flows.
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  // CORS preflight must never consume login quota
  skip: skipOptions,
  ...onLimitReached,
});

// Order limiter: applied to POST /orders to prevent order spam.
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { success: false, message: 'Too many orders placed. Please wait before placing another.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipOptions,
  ...onLimitReached,
});
