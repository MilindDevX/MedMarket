import type { Request, Response } from 'express';
import prisma from '../config/prisma.ts';
import { successResponse, errorResponse } from '../utils/response.ts';

/**
 * GET /api/v1/admin/settings
 * Returns the singleton platform settings row.
 * Upserts the singleton on first read so the row always exists.
 */
export async function getSettings(req: Request, res: Response) {
  try {
    const settings = await prisma.platformSettings.upsert({
      where:  { id: 'singleton' },
      update: {},
      create: { id: 'singleton', updated_at: new Date() },
    });
    return successResponse(res, settings, 'Settings fetched');
  } catch (err) {
    console.error('getSettings error:', err);
    return errorResponse(res, 'Something went wrong', 500);
  }
}

/**
 * PATCH /api/v1/admin/settings
 * Partial update — only provided fields are changed.
 */
export async function updateSettings(req: Request, res: Response) {
  try {
    const {
      gst_rate,
      delivery_fee,
      free_delivery_threshold,
      cod_limit,
      order_timeout_minutes,
      expiry_warn_60,
      expiry_warn_30,
      dead_stock_alert,
      email_invoice,
      sms_on_order,
    } = req.body;

    // Build update payload — only include keys that were actually sent
    const data: Record<string, unknown> = { updated_by: req.userId, updated_at: new Date() };

    if (gst_rate              !== undefined) data.gst_rate              = Number(gst_rate);
    if (delivery_fee          !== undefined) data.delivery_fee          = Number(delivery_fee);
    if (free_delivery_threshold !== undefined) data.free_delivery_threshold = Number(free_delivery_threshold);
    if (cod_limit             !== undefined) data.cod_limit             = Number(cod_limit);
    if (order_timeout_minutes !== undefined) data.order_timeout_minutes = Number(order_timeout_minutes);
    if (expiry_warn_60        !== undefined) data.expiry_warn_60        = Boolean(expiry_warn_60);
    if (expiry_warn_30        !== undefined) data.expiry_warn_30        = Boolean(expiry_warn_30);
    if (dead_stock_alert      !== undefined) data.dead_stock_alert      = Boolean(dead_stock_alert);
    if (email_invoice         !== undefined) data.email_invoice         = Boolean(email_invoice);
    if (sms_on_order          !== undefined) data.sms_on_order          = Boolean(sms_on_order);

    const updated = await prisma.platformSettings.upsert({
      where:  { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data, updated_at: new Date() },
    });

    return successResponse(res, updated, 'Settings updated');
  } catch (err) {
    console.error('updateSettings error:', err);
    return errorResponse(res, 'Something went wrong', 500);
  }
}
