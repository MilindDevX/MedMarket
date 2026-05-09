/**
 * expiry.queue.ts
 *
 * Defines the BullMQ Queue and Worker for the nightly expiry notification job.
 *
 * Queue:  "expiry-notifications"
 * Job:    ExpiryNotificationJob  (fired by the scheduler, processes all stores)
 *
 * Redis connection is resolved from REDIS_URL env var (Upstash or local).
 * Falls back gracefully when Redis is unavailable so the HTTP server always starts.
 */

import { Queue, Worker, type Job } from 'bullmq';
import { getRedisConnection, isRedisAvailable } from '../config/redis.ts';
import { runExpiryNotificationJob } from './expiry.processor.ts';

export const EXPIRY_QUEUE_NAME = 'expiry-notifications';

let expiryQueue: Queue | null = null;
let expiryWorker: Worker | null = null;

// ── Queue (producer side) ──────────────────────────────────────────────────

export function getExpiryQueue(): Queue | null {
  return expiryQueue;
}

// ── Bootstrap — called once from index.ts ─────────────────────────────────

export async function initExpiryQueue(): Promise<void> {
  if (!isRedisAvailable()) {
    console.warn('⚠️  Redis not configured — expiry notification queue disabled. Set REDIS_URL to enable.');
    return;
  }

  const connection = getRedisConnection();

  // Producer
  expiryQueue = new Queue(EXPIRY_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts:    3,
      backoff:     { type: 'exponential', delay: 5_000 },
      removeOnComplete: { count: 50 },
      removeOnFail:     { count: 20 },
    },
  });

  // Consumer
  expiryWorker = new Worker(
    EXPIRY_QUEUE_NAME,
    async (job: Job) => {
      console.log(`[BullMQ] Processing job ${job.id} — ${job.name}`);
      const result = await runExpiryNotificationJob();
      console.log(`[BullMQ] Job ${job.id} complete —`, result);
      return result;
    },
    { connection, concurrency: 1 },
  );

  expiryWorker.on('failed', (job, err) => {
    console.error(`[BullMQ] Job ${job?.id} failed:`, err.message);
  });

  expiryWorker.on('completed', (job) => {
    console.log(`[BullMQ] Job ${job.id} succeeded`);
  });

  // Swallow connection errors (ECONNRESET etc.) so they don't flood stdout.
  // The real fix is to ensure REDIS_URL uses rediss:// for Upstash TLS.
  expiryWorker.on('error', (err) => {
    console.warn('[BullMQ] Worker connection error:', err.message);
  });
  expiryQueue.on('error', (err) => {
    console.warn('[BullMQ] Queue connection error:', err.message);
  });

  console.log('✅ BullMQ expiry-notifications queue initialised');
}

// ── Graceful shutdown ──────────────────────────────────────────────────────

export async function shutdownExpiryQueue(): Promise<void> {
  await expiryWorker?.close();
  await expiryQueue?.close();
}
