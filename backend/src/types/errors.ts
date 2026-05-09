/**
 * MedMarket API — Structured Error Codes
 *
 * Every errorResponse() call should include one of these codes so clients
 * can branch on machine-readable identifiers instead of fragile message strings.
 *
 * Usage:
 *   import { ErrorCode } from '../types/errors.ts';
 *   return errorResponse(res, 'Selling price exceeds MRP', 400, ErrorCode.PRICE_EXCEEDS_MRP);
 */

export enum ErrorCode {
  // ── Generic ────────────────────────────────────────────────────────────────
  INTERNAL_ERROR          = 'INTERNAL_ERROR',
  VALIDATION_ERROR        = 'VALIDATION_ERROR',
  NOT_FOUND               = 'NOT_FOUND',
  ACCESS_DENIED           = 'ACCESS_DENIED',
  MISSING_FIELDS          = 'MISSING_FIELDS',

  // ── Auth ───────────────────────────────────────────────────────────────────
  INVALID_CREDENTIALS     = 'INVALID_CREDENTIALS',
  TOKEN_INVALID           = 'TOKEN_INVALID',
  TOKEN_EXPIRED           = 'TOKEN_EXPIRED',
  EMAIL_TAKEN             = 'EMAIL_TAKEN',
  ACCOUNT_NOT_FOUND       = 'ACCOUNT_NOT_FOUND',

  // ── Inventory ──────────────────────────────────────────────────────────────
  PRICE_EXCEEDS_MRP       = 'PRICE_EXCEEDS_MRP',
  BATCH_ALREADY_EXPIRED   = 'BATCH_ALREADY_EXPIRED',
  EXPIRY_BEFORE_MFG       = 'EXPIRY_BEFORE_MFG',
  SCHEDULE_BLOCKED        = 'SCHEDULE_BLOCKED',
  MEDICINE_NOT_FOUND      = 'MEDICINE_NOT_FOUND',
  STORE_NOT_FOUND         = 'STORE_NOT_FOUND',
  INVENTORY_NOT_FOUND     = 'INVENTORY_NOT_FOUND',
  INVALID_QUANTITY        = 'INVALID_QUANTITY',

  // ── Orders ─────────────────────────────────────────────────────────────────
  STOCK_DEPLETED          = 'STOCK_DEPLETED',
  COD_LIMIT_EXCEEDED      = 'COD_LIMIT_EXCEEDED',
  ORDER_NOT_FOUND         = 'ORDER_NOT_FOUND',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  CANCEL_NOT_ALLOWED      = 'CANCEL_NOT_ALLOWED',
  CROSS_STORE_CART        = 'CROSS_STORE_CART',

  // ── Pharmacy ───────────────────────────────────────────────────────────────
  STORE_ALREADY_EXISTS    = 'STORE_ALREADY_EXISTS',
  STORE_NOT_APPROVED      = 'STORE_NOT_APPROVED',
  APPLICATION_NOT_FOUND   = 'APPLICATION_NOT_FOUND',

  // ── Complaints ─────────────────────────────────────────────────────────────
  COMPLAINT_NOT_FOUND     = 'COMPLAINT_NOT_FOUND',
  INVALID_COMPLAINT_TYPE  = 'INVALID_COMPLAINT_TYPE',

  // ── Admin ──────────────────────────────────────────────────────────────────
  BATCH_ALREADY_BLACKLISTED = 'BATCH_ALREADY_BLACKLISTED',
  SETTINGS_NOT_FOUND      = 'SETTINGS_NOT_FOUND',
}
