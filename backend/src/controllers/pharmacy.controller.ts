import type { Request, Response } from 'express';
import prisma from '../config/prisma.ts';
import { successResponse, errorResponse } from '../utils/response.ts';
import { createNotification } from './notification.controller.ts';

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export async function registerStore(req: Request, res: Response) {
  try {
    const { name, address_line, city, state, pincode, phone, drug_license_no, gst_number } = req.body;

    const missing = ['name','address_line','city','state','pincode','phone','drug_license_no','gst_number']
      .filter(f => !req.body[f]).map(f => f.replace(/_/g,' '));
    if (missing.length > 0) return errorResponse(res, `Missing required fields: ${missing.join(', ')}`, 400);

    if (!GST_REGEX.test(gst_number.toUpperCase())) {
      return errorResponse(res, 'Invalid GST Number format. Expected: 06AABCX1234D1Z5 (2-digit state code + 10-char PAN + Z + check digit)', 400);
    }

    const existing = await prisma.pharmacyStore.findUnique({ where: { drug_license_no } });

    if (existing) {
      if (existing.status === 'rejected' && existing.owner_id === req.userId) {
        const reapplied = await prisma.pharmacyStore.update({
          where: { id: existing.id },
          data: { name, address_line, city, state, pincode, phone, gst_number, status: 'pending', rejection_reason: null },
        });

        const admins = await prisma.user.findMany({ where: { role: 'admin', is_active: true }, select: { id: true } });
        await Promise.all(admins.map(admin =>
          createNotification(admin.id, 'store.new_application',
            `Re-application: ${name}`,
            `${name} (${city}, ${state}) has resubmitted after rejection. Drug License: ${drug_license_no}. Please review updated documents.`)
        ));

        return successResponse(res, reapplied, 'Re-application submitted successfully', 200);
      }
      return errorResponse(res, `A pharmacy with Drug License '${drug_license_no}' is already registered on MedMarket.`, 409);
    }

    const store = await prisma.pharmacyStore.create({
      data: { owner_id: req.userId, name, address_line, city, state, pincode, phone, drug_license_no, gst_number, status: 'pending' },
    });

    const admins = await prisma.user.findMany({ where: { role: 'admin', is_active: true }, select: { id: true } });
    await Promise.all(admins.map(admin =>
      createNotification(admin.id, 'store.new_application',
        `New pharmacy application: ${name}`,
        `${name} (${city}, ${state}) has applied for verification. Drug License: ${drug_license_no}. Review and approve or reject.`)
    ));

    return successResponse(res, store, 'Store registered successfully', 201);
  } catch (error) {
    console.error('registerStore error:', error);
    return errorResponse(res, 'Something went wrong', 500);
  }
}

export async function getMyStore(req: Request, res: Response) {
  try {
    const store = await prisma.pharmacyStore.findFirst({
      where: { owner_id: req.userId },
      include: { documents: true },
    });

    if (!store) {
      return errorResponse(res, 'No store found', 404);
    }

    return successResponse(res, store, 'Store fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Something went wrong', 500);
  }
}

export async function updateMyStore(req: Request, res: Response) {
  const store = await prisma.pharmacyStore.findFirst({ where: { owner_id: req.userId } });
  if (!store) return errorResponse(res, 'Store not found', 404);

  const { phone, email, address_line, city, pincode } = req.body;
  const updated = await prisma.pharmacyStore.update({
    where: { id: store.id },
    data: {
      ...(phone        && { phone }),
      ...(email        && { email }),
      ...(address_line && { address_line }),
      ...(city         && { city }),
      ...(pincode      && { pincode }),
    },
  });
  return successResponse(res, updated, 'Store updated');
}

/**
 * GET /api/v1/pharmacy/complaints
 * Returns all order-category complaints filed against orders from this pharmacy.
 */
export async function getMyComplaints(req: Request, res: Response) {
  try {
    const store = await prisma.pharmacyStore.findFirst({
      where: { owner_id: req.userId },
      select: { id: true },
    });
    if (!store) return errorResponse(res, 'Store not found', 404);

    const complaints = await prisma.complaint.findMany({
      where: {
        category: 'order',
        order: { store_id: store.id },
      },
      include: {
        consumer: { select: { id: true, name: true, mobile: true } },
        order:    { select: { id: true, status: true, total_amount: true, created_at: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return successResponse(res, complaints, 'Complaints fetched');
  } catch (err) {
    console.error('getMyComplaints error:', err);
    return errorResponse(res, 'Something went wrong', 500);
  }
}

/**
 * PATCH /api/v1/pharmacy/complaints/:id/resolve
 * Pharmacy marks a complaint as resolved with a resolution note.
 */
export async function resolveMyComplaint(req: Request, res: Response) {
  try {
    const id  = req.params.id as string;
    const { resolution } = req.body;

    if (!resolution?.trim()) {
      return errorResponse(res, 'Resolution note is required', 400);
    }

    const store = await prisma.pharmacyStore.findFirst({
      where: { owner_id: req.userId },
      select: { id: true },
    });
    if (!store) return errorResponse(res, 'Store not found', 404);

    // Verify the complaint belongs to an order from this store
    const complaint = await prisma.complaint.findFirst({
      where: {
        id,
        category: 'order',
        order: { store_id: store.id },
      },
    });
    if (!complaint) return errorResponse(res, 'Complaint not found', 404);

    const updated = await prisma.complaint.update({
      where: { id },
      data: { status: 'resolved', resolution: resolution.trim() },
    });

    return successResponse(res, updated, 'Complaint resolved');
  } catch (err) {
    console.error('resolveMyComplaint error:', err);
    return errorResponse(res, 'Something went wrong', 500);
  }
}
