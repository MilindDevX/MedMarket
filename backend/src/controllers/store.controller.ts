import type { Request, Response } from "express";
import prisma from "../config/prisma.ts";
import { errorResponse, successResponse } from "../utils/response.ts";

export async function getStores(req: Request, res: Response) {
  try {
    const { city, pincode } = req.query;
    const hasStock   = req.query.has_stock === "true";
    const lat        = req.query.lat  ? parseFloat(req.query.lat  as string) : null;
    const lng        = req.query.lng  ? parseFloat(req.query.lng  as string) : null;
    const radiusKm   = req.query.radius ? parseFloat(req.query.radius as string) : 20;

    // ── Geo mode: lat + lng provided — Haversine via raw SQL ──────────────────
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      // Haversine formula in PostgreSQL: distance in km between two lat/lng pairs.
      // Only returns stores that have lat/lng set + have the right inventory filter.
      const stores = await prisma.$queryRaw<
        Array<{
          id: string; name: string; address_line: string;
          city: string; state: string; pincode: string;
          phone: string; avg_rating: string; total_reviews: number;
          operating_hours: unknown; status: string; owner_id: string;
          distance_km: number;
        }>
      >`
        SELECT
          ps.id, ps.name, ps.address_line, ps.city, ps.state, ps.pincode,
          ps.phone, ps.avg_rating, ps.total_reviews, ps.operating_hours,
          ps.status, ps.owner_id,
          ROUND(
            CAST(
              6371 * 2 * ASIN(SQRT(
                POWER(SIN(RADIANS(CAST(ps.latitude  AS FLOAT) - ${lat}) / 2), 2) +
                COS(RADIANS(${lat})) * COS(RADIANS(CAST(ps.latitude AS FLOAT))) *
                POWER(SIN(RADIANS(CAST(ps.longitude AS FLOAT) - ${lng}) / 2), 2)
              )) AS NUMERIC
            ), 1
          ) AS distance_km
        FROM "PharmacyStore" ps
        WHERE
          ps.status = 'approved'
          AND ps.latitude  IS NOT NULL
          AND ps.longitude IS NOT NULL
          ${hasStock
            ? prisma.$queryRaw`AND EXISTS (
                SELECT 1 FROM "StoreInventory" si
                WHERE si.store_id = ps.id AND si.quantity > 0 AND si.status = 'active'
              )`
            : prisma.$queryRaw``
          }
        HAVING
          6371 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(CAST(ps.latitude  AS FLOAT) - ${lat}) / 2), 2) +
            COS(RADIANS(${lat})) * COS(RADIANS(CAST(ps.latitude AS FLOAT))) *
            POWER(SIN(RADIANS(CAST(ps.longitude AS FLOAT) - ${lng}) / 2), 2)
          )) <= ${radiusKm}
        ORDER BY distance_km ASC
      `;

      return successResponse(res, stores, "Stores fetched successfully");
    }

    // ── City / fallback mode (original behaviour) ──────────────────────────────
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
