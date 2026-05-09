/**
 * expiry.scheduler.ts
 *
 * Registers a repeatable BullMQ job that fires nightly at 02:00 IST (20:30 UTC).
 * Also exposes scheduleExpiryJobNow() for manual/demo triggers.
 *
 * The scheduler uses BullMQ's built-in cron support — no external cron daemon
 * or node-cron dependency required. The repeatable job survives server restarts
 * because BullMQ persists its schedule in Redis.
 */

import { getExpiryQueue } from './expiry.queue.ts';

export const EXPIRY_JOB_NAME    = 'ExpiryNotificationJob';
// 02:00 IST = 20:30 UTC previous day
export const EXPIRY_JOB_CRON    = '30 20 * * *';

/**
 * Register the repeatable nightly schedule.
 * Safe to call multiple times — BullMQ deduplicates by name+cron pattern.
 */
export async function scheduleNightlyExpiryJob(): Promise<void> {
  const queue = getExpiryQueue();
  if (!queue) return; // Redis unavailable — silently skip

  await queue.add(
    EXPIRY_JOB_NAME,
    { triggeredBy: 'scheduler' },
    {
      repeat: { pattern: EXPIRY_JOB_CRON },
      jobId:  `${EXPIRY_JOB_NAME}-nightly`, // stable ID prevents duplicate schedules
    },
  );

  console.log(`📅 Nightly expiry job scheduled — cron: ${EXPIRY_JOB_CRON} (UTC)`);
}

/**
 * Enqueue a one-off immediate run.
 * Used by the admin trigger endpoint for demo / manual purposes.
 */
export async function scheduleExpiryJobNow(triggeredBy = 'manual'): Promise<string | undefined> {
  const queue = getExpiryQueue();
  if (!queue) return undefined;

  const job = await queue.add(
    EXPIRY_JOB_NAME,
    { triggeredBy },
    { jobId: `${EXPIRY_JOB_NAME}-manual-${Date.now()}` },
  );

  console.log(`⚡ Immediate expiry job enqueued — jobId: ${job.id}`);
  return job.id;
}

/**
 * Returns the next scheduled run time for the nightly job (UTC ISO string).
 * Returns null if queue is unavailable or no schedule found.
 */
export async function getNextScheduledRun(): Promise<string | null> {
  const queue = getExpiryQueue();
  if (!queue) return null;

  try {
    const repeatableJobs = await queue.getRepeatableJobs();
    const nightly = repeatableJobs.find(j => j.name === EXPIRY_JOB_NAME);
    if (!nightly?.next) return null;
    return new Date(nightly.next).toISOString();
  } catch {
    return null;
  }
}
