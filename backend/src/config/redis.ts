/**
 * redis.ts
 *
 * Centralised Redis connection for BullMQ.
 * Supports Upstash (TLS) and local Redis automatically.
 *
 * Set REDIS_URL in .env:
 *   Local:    REDIS_URL=redis://localhost:6379
 *   Upstash:  REDIS_URL=rediss://:<token>@<host>.upstash.io:6380
 *
 * If REDIS_URL is absent, isRedisAvailable() returns false and the
 * queue system is skipped — the HTTP server boots normally.
 */

import { type ConnectionOptions } from 'bullmq';

let _connection: ConnectionOptions | null = null;

export function isRedisAvailable(): boolean {
  const url = process.env.REDIS_URL;
  if (!url) return false;
  // Must be a valid redis:// or rediss:// URL — not a CLI command string
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'redis:' || parsed.protocol === 'rediss:';
  } catch {
    console.warn(`⚠️  REDIS_URL is set but is not a valid URL ("${url.slice(0, 40)}…"). Queue disabled.`);
    return false;
  }
}

export function getRedisConnection(): ConnectionOptions {
  if (_connection) return _connection;

  const url = process.env.REDIS_URL!;

  if (url.startsWith('rediss://')) {
    // Upstash / TLS Redis — parse host, port, password from URL
    const parsed   = new URL(url);
    _connection = {
      host:     parsed.hostname,
      port:     Number(parsed.port) || 6380,
      password: parsed.password || undefined,
      tls:      {},             // enables TLS without cert verification
      maxRetriesPerRequest: null, // required by BullMQ
    };
  } else {
    // Local Redis
    const parsed = new URL(url);
    _connection = {
      host:     parsed.hostname || '127.0.0.1',
      port:     Number(parsed.port) || 6379,
      password: parsed.password || undefined,
      maxRetriesPerRequest: null,
    };
  }

  return _connection;
}
