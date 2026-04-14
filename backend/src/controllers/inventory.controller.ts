import type { Request, Response } from "express";
import prisma from "../config/prisma.ts";
import { successResponse, errorResponse } from "../utils/response.ts";

async function getOwnerStore(userId: string) {
  return prisma.pharmacyStore.findFirst({
    where: { owner_id: userId, status: "approved" },
  });
}

export async function addInventory(req: Request, res: Response) {
  try {
    const store = await getOwnerStore(req.userId);

    if (!store) {
      return errorResponse(res, "Approved store not found", 404);
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
      return errorResponse(res, "All fields are required", 400);
    }

    const medicine = await prisma.medicineMaster.findFirst({
      where: { id: medicine_id, is_active: true },
    });

    if (!medicine) {
      return errorResponse(res, "Medicine not found", 404);
    }

    if (medicine.schedule !== "otc") {
      return errorResponse(
        res,
        `Only OTC medicines can be listed in Phase 1. '${medicine.name}' is a ${medicine.schedule.replace(/_/g, " ").toUpperCase()} drug and requires a prescription.`,
        422,
      );
    }

    if (Number(selling_price) > Number(medicine.mrp)) {
      return errorResponse(
        res,
        `Selling price cannot exceed MRP of ₹${medicine.mrp} (DPCO compliance)`,
        400,
      );
    }

    const inventory = await prisma.storeInventory.create({
      data: {
        store_id: store.id,
        medicine_id,
        batch_number,
        mfg_date: new Date(mfg_date),
        exp_date: new Date(exp_date),
        quantity: Number(quantity),
        selling_price: Number(selling_price),
        low_stock_threshold: low_stock_threshold ? Number(low_stock_threshold) : 10,
      },
    });

    return successResponse(res, inventory, "Inventory added successfully", 201);
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function getInventory(req: Request, res: Response) {
  try {
    const store = await getOwnerStore(req.userId);

    if (!store) {
      return errorResponse(res, "Approved store not found", 404);
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
          select: { name: true, category: true, generic_name: true, mrp: true },
        },
      },
      orderBy: { exp_date: "asc" },
    });

    return successResponse(res, inventory, "Inventory fetched successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function updateInventory(req: Request, res: Response) {
  try {
    const store = await getOwnerStore(req.userId);

    if (!store) {
      return errorResponse(res, "Approved store not found", 404);
    }

    const id = req.params.id as string;

    const item = await prisma.storeInventory.findUnique({ where: { id } });

    if (!item) {
      return errorResponse(res, "Inventory item not found", 404);
    }

    if (item.store_id !== store.id) {
      return errorResponse(res, "Access denied", 403);
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
        );
      }
    }

    const updated = await prisma.storeInventory.update({
      where: { id },
      data: {
        ...(quantity !== undefined        && { quantity: Number(quantity) }),
        ...(selling_price !== undefined   && { selling_price: Number(selling_price) }),
        ...(low_stock_threshold !== undefined && { low_stock_threshold: Number(low_stock_threshold) }),
        ...(exp_date                      && { exp_date: new Date(exp_date) }),
      },
    });

    return successResponse(res, updated, "Inventory updated successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function deleteInventory(req: Request, res: Response) {
  try {
    const store = await getOwnerStore(req.userId);

    if (!store) {
      return errorResponse(res, "Approved store not found", 404);
    }

    const id = req.params.id as string;

    const item = await prisma.storeInventory.findUnique({ where: { id } });

    if (!item) {
      return errorResponse(res, "Inventory item not found", 404);
    }

    if (item.store_id !== store.id) {
      return errorResponse(res, "Access denied", 403);
    }

    await prisma.storeInventory.delete({ where: { id } });

    return successResponse(res, null, "Inventory item removed successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function getExpiryAlerts(req: Request, res: Response) {
  try {
    const store = await getOwnerStore(req.userId);

    if (!store) {
      return errorResponse(res, "Approved store not found", 404);
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
    return errorResponse(res, "Something went wrong", 500);
  }
}
