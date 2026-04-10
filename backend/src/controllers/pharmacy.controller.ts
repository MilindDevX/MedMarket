import type { Request, Response } from 'express';
import prisma from '../config/prisma.ts';
import { successResponse, errorResponse } from '../utils/response.ts';

export async function registerStore(req: Request, res: Response) {
  try {
    const { name, address_line, city, state, pincode, phone, drug_license_no, gst_number } = req.body;

    if (!name || !address_line || !city || !state || !pincode || !phone || !drug_license_no || !gst_number) {
      return errorResponse(res, "All fields are required", 400);
    }

    const existing = await prisma.pharmacyStore.findUnique({ where: { drug_license_no } });

    if (existing) {
      if (existing.status === 'rejected' && existing.owner_id === req.userId) {
        const reapplied = await prisma.pharmacyStore.update({
          where: { id: existing.id },
          data: {
            name,
            address_line,
            city,
            state,
            pincode,
            phone,
            gst_number,
            status: 'pending',
            rejection_reason: null,
          },
        });
        return successResponse(res, reapplied, "Re-application submitted successfully", 200);
      }

      return errorResponse(res, 'A store with this drug license already exists', 409);
    }

    const store = await prisma.pharmacyStore.create({
      data: {
        owner_id: req.userId,
        name,
        address_line,
        city,
        state,
        pincode,
        phone,
        drug_license_no,
        gst_number,
        status: 'pending',
      },
    });

    return successResponse(res, store, "Store registered successfully", 201);
  } catch (error) {
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
