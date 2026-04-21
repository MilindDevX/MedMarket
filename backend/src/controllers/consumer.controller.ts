import type { Request, Response } from "express";
import prisma from "../config/prisma.ts";
import { successResponse, errorResponse } from "../utils/response.ts";

export async function fileComplaint(req: Request, res: Response) {
  try {
    const { type, subject, body, order_id } = req.body;
    if (!type || !subject || !body) {
      return errorResponse(res, 'type, subject, and body are required', 400);
    }
    const complaint = await prisma.complaint.create({
      data: {
        consumer_id: req.userId,
        order_id:    order_id || null,
        type,
        subject,
        body,
        status: 'open',
      },
    });
    return successResponse(res, complaint, 'Complaint filed');
  } catch (err) {
    console.error('fileComplaint error:', err);
    return errorResponse(res, 'Something went wrong', 500);
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const { name, mobile } = req.body;
    if (!name?.trim()) return errorResponse(res, 'Name is required', 400);
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { ...(name && { name }), ...(mobile && { mobile }) },
      select: { id: true, name: true, email: true, mobile: true, role: true },
    });
    return successResponse(res, updated, 'Profile updated');
  } catch (err) {
    console.error('updateProfile error:', err);
    return errorResponse(res, 'Something went wrong', 500);
  }
}
