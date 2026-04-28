import type { Request, Response } from 'express';
import prisma from '../config/prisma.ts';
import { successResponse, errorResponse } from '../utils/response.ts';
import { createNotification } from './notification.controller.ts';

export async function fileComplaint(req: Request, res: Response) {
  try {
    const { type, subject, body, order_id, store_id, category } = req.body;

    if (!type || !subject || !body) {
      const missing = ['type','subject','body'].filter(f => !req.body[f]);
      return errorResponse(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    const complaintCategory = category === 'pharmacy' ? 'pharmacy' : 'order';

    const complaint = await prisma.complaint.create({
      data: {
        consumer_id: req.userId,
        order_id:    order_id  || null,
        store_id:    store_id  || null,
        category:    complaintCategory,
        type,
        subject,
        body,
        status: 'open',
      },
    });

    const consumer = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true },
    });
    const consumerName = consumer?.name || 'A consumer';

    if (complaintCategory === 'order' && order_id) {
      // Order complaint → notify the pharmacy owner of that order
      const order = await prisma.order.findUnique({
        where: { id: order_id },
        include: { store: { select: { owner_id: true, name: true } } },
      });
      if (order?.store?.owner_id) {
        await createNotification(
          order.store.owner_id,
          'complaint.order',
          `New complaint on order #${order_id.slice(0,8).toUpperCase()}`,
          `${consumerName} filed a complaint: "${subject}". Please review and resolve.`,
        );
      }
    } else if (complaintCategory === 'pharmacy') {
      // Pharmacy complaint → notify all admins
      const admins = await prisma.user.findMany({
        where: { role: 'admin', is_active: true },
        select: { id: true },
      });

      let storeName = 'a pharmacy';
      if (store_id) {
        const store = await prisma.pharmacyStore.findUnique({
          where: { id: store_id },
          select: { name: true },
        });
        storeName = store?.name || storeName;
      }

      await Promise.all(admins.map(admin =>
        createNotification(
          admin.id,
          'complaint.pharmacy',
          `Pharmacy complaint: ${storeName}`,
          `${consumerName} filed a complaint about ${storeName}: "${subject}". Review under Complaints.`,
        )
      ));
    }

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
