import type { Request, Response } from "express";
import prisma from "../config/prisma.ts";
import { successResponse, errorResponse } from "../utils/response.ts";
import { ErrorCode } from "../types/errors.ts";

async function getOwnerStore(userId: string) {
  return prisma.pharmacyStore.findFirst({
    where: { owner_id: userId, status: "approved" },
  });
}

export async function addInventory(req: Request, res: Response) {
  try {
    const store = await getOwnerStore(req.userId);

    if (!store) {
      return errorResponse(res, "Approved store not found", 404, ErrorCode.STORE_NOT_FOUND);
    }

    const {
      medicine_id,
      batch_number,
      mfg_date,
      exp_date,
      quantity,
      selling_price,
      low_stock_threshold,
    } = req.body;

    if (!medicine_id || !batch_number || !mfg_date || !exp_date || !quantity || !selling_price) {
      const missing = ['medicine_id','batch_number','mfg_date','exp_date','quantity','selling_price']
        .filter(f => !req.body[f])
        .map(f => f.replace(/_/g,' '));
      return errorResponse(res, `Missing required fields: ${missing.join(', ')}`, 400, ErrorCode.MISSING_FIELDS);
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty < 1)       return errorResponse(res, 'Quantity must be at least 1', 400, ErrorCode.INVALID_QUANTITY);
    if (qty > 100000)                 return errorResponse(res, 'Quantity cannot exceed 1,00,000 units per batch entry', 400, ErrorCode.INVALID_QUANTITY);

    const mfgDate = new Date(mfg_date);
    const expDate = new Date(exp_date);
    const today   = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(mfgDate.getTime())) return errorResponse(res, 'Invalid manufacturing date format', 400, ErrorCode.VALIDATION_ERROR);
    if (isNaN(expDate.getTime())) return errorResponse(res, 'Invalid expiry date format', 400, ErrorCode.VALIDATION_ERROR);
    if (expDate <= mfgDate)       return errorResponse(res, 'Expiry date must be after manufacturing date', 400, ErrorCode.EXPIRY_BEFORE_MFG);
    if (expDate <= today)         return errorResponse(res, 'Cannot add an already-expired batch', 400, ErrorCode.BATCH_ALREADY_EXPIRED);

    const maxExpiry = new Date(mfgDate);
    maxExpiry.setFullYear(maxExpiry.getFullYear() + 30);
    if (expDate > maxExpiry)      return errorResponse(res, 'Expiry date cannot be more than 30 years after the manufacturing date', 400, ErrorCode.VALIDATION_ERROR);

    const medicine = await prisma.medicineMaster.findFirst({
      where: { id: medicine_id, is_active: true },
    });

    if (!medicine) {
      return errorResponse(res, "Medicine not found", 404, ErrorCode.MEDICINE_NOT_FOUND);
    }

    if (medicine.schedule !== "otc") {
      return errorResponse(
        res,
        `Only OTC medicines can be listed in Phase 1. '${medicine.name}' is a ${medicine.schedule.replace(/_/g, " ").toUpperCase()} drug and requires a prescription.`,
        422,
        ErrorCode.SCHEDULE_BLOCKED,
      );
    }

    if (Number(selling_price) > Number(medicine.mrp)) {
      return errorResponse(
        res,
        `Selling price cannot exceed MRP of ₹${medicine.mrp} (DPCO compliance)`,
        400,
        ErrorCode.PRICE_EXCEEDS_MRP,
      );
    }

    const inventory = await prisma.storeInventory.create({
      data: {
        store_id: store.id,
        medicine_id,
        batch_number,
        mfg_date: mfgDate,
        exp_date: expDate,
        quantity: qty,
        selling_price: Number(selling_price),
        low_stock_threshold: low_stock_threshold ? Number(low_stock_threshold) : 10,
      },
    });

    return successResponse(res, inventory, "Inventory added successfully", 201);
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500, ErrorCode.INTERNAL_ERROR);
  }
}

export async function getInventory(req: Request, res: Response) {
  try {
    const store = await getOwnerStore(req.userId);

    if (!store) {
      return errorResponse(res, "Approved store not found", 404, ErrorCode.STORE_NOT_FOUND);
    }

    const { status } = req.query;
    const statusParam = typeof status === "string" ? status : undefined;

    const inventory = await prisma.storeInventory.findMany({
      where: {
        store_id: store.id,
        ...(statusParam && { status: statusParam as any }),
      },
      include: {
        medicine: {
          select: { name: true, category: true, generic_name: true, mrp: true, salt_composition: true },
        },
      },
      orderBy: { exp_date: "asc" },
    });

    // Compute total active stock per medicine across ALL batches in this store.
    const medicineTotals: Record<string, number> = {};
    for (const item of inventory) {
      if (item.status === "active") {
        medicineTotals[item.medicine_id] = (medicineTotals[item.medicine_id] || 0) + item.quantity;
      }
    }

    const today = new Date();
    const enriched = inventory.map((item: any) => {
      const daysToExpiry = item.exp_date
        ? Math.floor((new Date(item.exp_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // risk_score = urgency × quantity
      // Items expiring within 30 days accumulate score; 0 days left = max urgency
      const riskScore = (daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry >= 0)
        ? (30 - daysToExpiry) * item.quantity
        : 0;

      return {
        ...item,
        medicine_total_quantity: medicineTotals[item.medicine_id] ?? item.quantity,
        days_to_expiry: daysToExpiry,
        risk_score: riskScore,
      };
    });

    return successResponse(res, enriched, "Inventory fetched successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500, ErrorCode.INTERNAL_ERROR);
  }
}

export async function updateInventory(req: Request, res: Response) {
  try {
    const store = await getOwnerStore(req.userId);

    if (!store) {
      return errorResponse(res, "Approved store not found", 404, ErrorCode.STORE_NOT_FOUND);
    }

    const id = req.params.id as string;

    const item = await prisma.storeInventory.findUnique({ where: { id } });

    if (!item) {
      return errorResponse(res, "Inventory item not found", 404, ErrorCode.INVENTORY_NOT_FOUND);
    }

    if (item.store_id !== store.id) {
      return errorResponse(res, "Access denied", 403, ErrorCode.ACCESS_DENIED);
    }

    const { quantity, selling_price, low_stock_threshold, exp_date } = req.body;

    if (selling_price !== undefined) {
      const medicine = await prisma.medicineMaster.findUnique({
        where: { id: item.medicine_id },
      });

      if (medicine && Number(selling_price) > Number(medicine.mrp)) {
        return errorResponse(
          res,
          `Selling price cannot exceed MRP of ₹${medicine.mrp} (DPCO compliance)`,
          400,
          ErrorCode.PRICE_EXCEEDS_MRP,
        );
      }
    }

    const updated = await prisma.storeInventory.update({
      where: { id },
      data: {
        ...(quantity !== undefined            && { quantity: Number(quantity) }),
        ...(selling_price !== undefined       && { selling_price: Number(selling_price) }),
        ...(low_stock_threshold !== undefined && { low_stock_threshold: Number(low_stock_threshold) }),
        ...(exp_date                          && { exp_date: new Date(exp_date) }),
      },
    });

    return successResponse(res, updated, "Inventory updated successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500, ErrorCode.INTERNAL_ERROR);
  }
}

export async function deleteInventory(req: Request, res: Response) {
  try {
    const store = await getOwnerStore(req.userId);

    if (!store) {
      return errorResponse(res, "Approved store not found", 404, ErrorCode.STORE_NOT_FOUND);
    }

    const id = req.params.id as string;

    const item = await prisma.storeInventory.findUnique({ where: { id } });

    if (!item) {
      return errorResponse(res, "Inventory item not found", 404, ErrorCode.INVENTORY_NOT_FOUND);
    }

    if (item.store_id !== store.id) {
      return errorResponse(res, "Access denied", 403, ErrorCode.ACCESS_DENIED);
    }

    await prisma.storeInventory.delete({ where: { id } });

    return successResponse(res, null, "Inventory item removed successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500, ErrorCode.INTERNAL_ERROR);
  }
}

export async function getExpiryAlerts(req: Request, res: Response) {
  try {
    const store = await getOwnerStore(req.userId);

    if (!store) {
      return errorResponse(res, "Approved store not found", 404, ErrorCode.STORE_NOT_FOUND);
    }

    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const items = await prisma.storeInventory.findMany({
      where: {
        store_id: store.id,
        exp_date: { lte: sixtyDaysFromNow },
        status: "active",
      },
      include: {
        medicine: {
          select: { name: true, category: true, generic_name: true },
        },
      },
      orderBy: { exp_date: "asc" },
    });

    return successResponse(res, items, "Expiry alerts fetched successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500, ErrorCode.INTERNAL_ERROR);
  }
}
