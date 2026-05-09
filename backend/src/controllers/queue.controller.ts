/**
 * queue.controller.ts
 *
 * Admin-only endpoints for the BullMQ expiry notification job.
 *
 * POST /api/v1/admin/jobs/expiry/trigger  — enqueue an immediate run
 * GET  /api/v1/admin/jobs/expiry/status   — queue depth + next scheduled run
 */

import type { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response.ts';
import { ErrorCode } from '../types/errors.ts';
import { getExpiryQueue } from '../queues/expiry.queue.ts';
import {
  scheduleExpiryJobNow,
  getNextScheduledRun,
} from '../queues/expiry.scheduler.ts';
import { isRedisAvailable } from '../config/redis.ts';

/** POST /admin/jobs/expiry/trigger */
export async function triggerExpiryJob(req: Request, res: Response) {
  try {
    if (!isRedisAvailable()) {
      return errorResponse(
        res,
        'Redis is not configured. Set REDIS_URL to enable the job queue.',
        503,
        ErrorCode.INTERNAL_ERROR,
      );
    }

    const jobId = await scheduleExpiryJobNow('admin-manual');

    return successResponse(
      res,
      { jobId, message: 'Expiry notification job enqueued. Check server logs for progress.' },
      'Job enqueued',
      202,
    );
  } catch (err) {
    console.error('[queue.controller] triggerExpiryJob error:', err);
    return errorResponse(res, 'Failed to enqueue job', 500, ErrorCode.INTERNAL_ERROR);
  }
}

/** GET /admin/jobs/expiry/status */
export async function getExpiryJobStatus(req: Request, res: Response) {
  try {
    if (!isRedisAvailable()) {
      return successResponse(res, {
        redisAvailable: false,
        message: 'Redis not configured — queue disabled',
      }, 'Queue status');
    }

    const queue = getExpiryQueue();
    if (!queue) {
      return successResponse(res, { redisAvailable: true, queueReady: false }, 'Queue status');
    }

    const [waiting, active, completed, failed, nextRun] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      getNextScheduledRun(),
    ]);

    return successResponse(res, {
      redisAvailable: true,
      queueReady:     true,
      counts: { waiting, active, completed, failed },
      nextScheduledRun: nextRun,
    }, 'Queue status');
  } catch (err) {
    console.error('[queue.controller] getExpiryJobStatus error:', err);
    return errorResponse(res, 'Failed to fetch queue status', 500, ErrorCode.INTERNAL_ERROR);
  }
}
