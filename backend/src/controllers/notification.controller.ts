import type { Request, Response } from 'express';
import prisma from '../config/prisma.ts';
import { successResponse, errorResponse } from '../utils/response.ts';

/** List all in_app notifications for the logged-in user, newest first. */
export async function getNotifications(req: Request, res: Response) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipient_id: req.userId, channel: 'in_app' },
      orderBy: { created_at: 'desc' },
    });
    return successResponse(res, notifications, 'Notifications fetched');
  } catch {
    return errorResponse(res, 'Something went wrong', 500);
  }
}

/** Mark a single notification as read. */
export async function markRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const notif = await prisma.notification.findFirst({
      where: { id, recipient_id: req.userId },
    });
    if (!notif) return errorResponse(res, 'Notification not found', 404);

    const updated = await prisma.notification.update({
      where: { id },
      data: { read_at: new Date() },
    });
    return successResponse(res, updated, 'Marked as read');
  } catch {
    return errorResponse(res, 'Something went wrong', 500);
  }
}

/** Mark ALL unread notifications as read for this user. */
export async function markAllRead(req: Request, res: Response) {
  try {
    await prisma.notification.updateMany({
      where: { recipient_id: req.userId, channel: 'in_app', read_at: null },
      data: { read_at: new Date() },
    });
    return successResponse(res, null, 'All notifications marked as read');
  } catch {
    return errorResponse(res, 'Something went wrong', 500);
  }
}

/** Delete a single notification. */
export async function deleteNotification(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const notif = await prisma.notification.findFirst({
      where: { id, recipient_id: req.userId },
    });
    if (!notif) return errorResponse(res, 'Notification not found', 404);

    await prisma.notification.delete({ where: { id } });
    return successResponse(res, null, 'Notification deleted');
  } catch {
    return errorResponse(res, 'Something went wrong', 500);
  }
}

/** Delete ALL notifications for this user. */
export async function deleteAllNotifications(req: Request, res: Response) {
  try {
    await prisma.notification.deleteMany({
      where: { recipient_id: req.userId, channel: 'in_app' },
    });
    return successResponse(res, null, 'All notifications cleared');
  } catch {
    return errorResponse(res, 'Something went wrong', 500);
  }
}

/**
 * Internal helper — creates an in_app notification row.
 * Called from order and admin controllers after state changes.
 */
export async function createNotification(
  recipientId: string,
  type: string,
  title: string,
  body: string,
) {
  try {
    await prisma.notification.create({
      data: {
        recipient_id: recipientId,
        type,
        title,
        body,
        channel: 'in_app',
        sent_at: new Date(),
      },
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
