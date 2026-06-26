/**
 * MedMarket — Gemini AI Client (Legacy Shim)
 *
 * @deprecated
 * This file is kept for backwards compatibility only.
 * All AI calls now go through `src/lib/ai.ts` which provides:
 *   - Gemini 2.5 Flash as the primary provider
 *   - Groq llama-3.3-70b-versatile as the automatic fallback
 *   - Graceful error handling and provider-agnostic interface
 *
 * New code should import from `../lib/ai.ts`:
 *   import { generateWithFallback } from '../lib/ai.ts';
 */
export { getFlashModel } from './ai.ts';
