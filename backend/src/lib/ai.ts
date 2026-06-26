/**
 * MedMarket — Unified AI Client
 *
 * Primary:  Google Gemini 2.5 Flash  (via @google/generative-ai)
 * Fallback: Groq  llama-3.3-70b-versatile  (via groq-sdk) — free tier
 *
 * Usage:
 *   import { generateWithFallback } from '../lib/ai.ts';
 *   const text = await generateWithFallback(prompt);
 *   // OR with inline image:
 *   const text = await generateWithFallback(prompt, { base64: '...', mimeType: 'image/jpeg' });
 *
 * Error handling strategy:
 *   - Gemini quota / rate-limit / 429 / overloaded  → try Groq
 *   - Groq quota / rate-limit                        → throw AiUnavailableError
 *   - Any other error on Gemini                       → re-throw immediately (don't waste Groq quota)
 *   - Both providers unavailable                      → throw AiUnavailableError
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

// ─────────────────────────────────────────────────────────────────────────────
// Typed error class so callers can distinguish AI-specific failures
// ─────────────────────────────────────────────────────────────────────────────
export class AiUnavailableError extends Error {
  public readonly provider: 'gemini' | 'groq' | 'both';
  public readonly isQuota: boolean;

  constructor(message: string, opts: { provider: 'gemini' | 'groq' | 'both'; isQuota?: boolean }) {
    super(message);
    this.name = 'AiUnavailableError';
    this.provider = opts.provider;
    this.isQuota  = opts.isQuota ?? false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider singletons (lazy-initialised)
// ─────────────────────────────────────────────────────────────────────────────
let _geminiClient: GoogleGenerativeAI | null = null;
let _groqClient:   Groq | null               = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!_geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new AiUnavailableError(
      'GEMINI_API_KEY is not configured. Add it to backend/.env',
      { provider: 'gemini', isQuota: false },
    );
    _geminiClient = new GoogleGenerativeAI(key);
  }
  return _geminiClient;
}

function getGroqClient(): Groq {
  if (!_groqClient) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new AiUnavailableError(
      'GROQ_API_KEY is not configured. Add it to backend/.env — get a free key at https://console.groq.com',
      { provider: 'groq', isQuota: false },
    );
    _groqClient = new Groq({ apiKey: key });
  }
  return _groqClient;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error classifier: decide if a Gemini error should trigger fallback
// ─────────────────────────────────────────────────────────────────────────────
function shouldFallbackToGroq(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();

  // HTTP status codes that indicate quota / availability issues
  const quotaSignals = [
    '429',
    'quota',
    'rate limit',
    'rate_limit',
    'resource_exhausted',
    'too many requests',
    'overloaded',
    'service unavailable',
    '503',
    'capacity',
    'temporarily',
    'token limit',
  ];

  return quotaSignals.some(s => msg.includes(s));
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline image data (optional, only Gemini supports images natively)
// ─────────────────────────────────────────────────────────────────────────────
export interface ImageData {
  base64:   string;
  mimeType: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: generateWithFallback
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Generate text from a prompt.
 *
 * @param prompt      The text prompt to send to the AI.
 * @param imageData   Optional inline image (base64 + mimeType). Only used by
 *                    Gemini; if it falls back to Groq, a descriptive note is
 *                    appended to the prompt instead.
 * @returns           Plain text response string.
 */
export async function generateWithFallback(
  prompt: string,
  imageData?: ImageData | null,
): Promise<string> {
  // ── 1. Try Gemini ────────────────────────────────────────────────────────
  try {
    const model = getGeminiClient().getGenerativeModel({ model: 'gemini-2.5-flash' });

    let result;
    if (imageData) {
      result = await model.generateContent([
        prompt,
        { inlineData: { data: imageData.base64, mimeType: imageData.mimeType } },
      ]);
    } else {
      result = await model.generateContent(prompt);
    }

    const text = result.response.text().trim();
    if (text) return text;

    // Empty response from Gemini — treat as soft failure and try Groq
    throw new Error('Gemini returned an empty response');

  } catch (geminiErr: unknown) {
    const isQuotaError = shouldFallbackToGroq(geminiErr);
    const isConfigErr  = geminiErr instanceof AiUnavailableError;

    if (!isQuotaError && !isConfigErr) {
      // Non-quota Gemini error (bad prompt, blocked content, etc.) — re-throw
      throw geminiErr;
    }

    console.warn(
      `[AI] Gemini ${isConfigErr ? 'not configured' : 'quota/rate-limit hit'} — falling back to Groq.`,
      isConfigErr ? '' : `(${(geminiErr as Error).message})`,
    );

    // ── 2. Try Groq (fallback) ─────────────────────────────────────────────
    try {
      const groq = getGroqClient();

      // Groq doesn't support inline image data — inject a descriptive note
      const groqPrompt = imageData
        ? `${prompt}\n\n[Note: An image was provided but could not be sent to this text-only model. Respond based on the textual context alone and return UNREADABLE for any field requiring visual extraction.]`
        : prompt;

      const completion = await groq.chat.completions.create({
        model:       'llama-3.3-70b-versatile',
        messages:    [{ role: 'user', content: groqPrompt }],
        temperature: 0.2,
        max_tokens:  1024,
      });

      const text = completion.choices[0]?.message?.content?.trim() ?? '';
      if (!text) throw new Error('Groq returned an empty response');

      console.info('[AI] Response successfully generated via Groq fallback.');
      return text;

    } catch (groqErr: unknown) {
      const groqIsQuota = shouldFallbackToGroq(groqErr);
      const groqIsConfig = groqErr instanceof AiUnavailableError;

      if (groqIsQuota) {
        throw new AiUnavailableError(
          'Both Gemini and Groq are currently unavailable due to quota limits. Please try again later.',
          { provider: 'both', isQuota: true },
        );
      }

      if (groqIsConfig) {
        throw new AiUnavailableError(
          'Groq fallback is not configured (GROQ_API_KEY missing). ' +
          'Get a free key at https://console.groq.com and add it to backend/.env',
          { provider: 'groq', isQuota: false },
        );
      }

      // Unexpected Groq error
      throw new AiUnavailableError(
        `Groq fallback failed: ${(groqErr as Error).message}`,
        { provider: 'groq', isQuota: false },
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy shim: keeps existing code that directly imports getFlashModel() working
// ─────────────────────────────────────────────────────────────────────────────
/** @deprecated Use `generateWithFallback()` instead. */
export function getFlashModel() {
  return getGeminiClient().getGenerativeModel({ model: 'gemini-2.5-flash' });
}
