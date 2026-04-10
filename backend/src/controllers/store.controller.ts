import type { Request, Response } from "express";
import prisma from "../config/prisma.ts";
import { errorResponse, successResponse } from "../utils/response.ts";

export async function getStores(req: Request, res: Response) {
  try {
    const { city, pincode } = req.query;
    const hasStock = req.query.has_stock === "true";

    const stores = await prisma.pharmacyStore.findMany({
      where: {
        status: "approved",
        ...(hasStock && {
          inventory: { some: { quantity: { gt: 0 }, status: "active" } },
        }),
        ...(city && {
          city: { contains: city as string, mode: "insensitive" },
        }),
        ...(pincode && { pincode: pincode as string }),
      },
      select: {
        id: true,
        name: true,
        address_line: true,
        city: true,
        state: true,
        pincode: true,
        phone: true,
        avg_rating: true,
        total_reviews: true,
        operating_hours: true,
        status: true,
        owner_id: true,
      },
      orderBy: { avg_rating: "desc" },
    });

    return successResponse(res, stores, "Stores fetched successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function getStoreById(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const store = await prisma.pharmacyStore.findFirst({
      where: { id, status: "approved" },
      include: {
        inventory: {
          where: { status: "active", quantity: { gt: 0 } },
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                generic_name: true,
                category: true,
                form: true,
                pack_size: true,
                mrp: true,
              },
            },
          },
        },
      },
    });

    if (!store) {
      return errorResponse(res, "Store not found", 404);
    }

    return successResponse(res, store, "Store fetched successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}
