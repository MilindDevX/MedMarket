import { ErrorCode } from "../types/errors.ts";
import type { Request, Response } from "express";
import prisma from "../config/prisma.ts";
import { successResponse, errorResponse } from "../utils/response.ts";
import { createNotification } from "./notification.controller.ts";
import { cloudinary } from "../lib/cloudinary.ts";

/** Build a signed Cloudinary URL consistent with document.controller.ts */
function buildDocUrl(s3_key: string, mime_type: string): string {
  if (!s3_key) return '';
  if (mime_type === 'application/pdf') {
    // PDFs are uploaded as resource_type 'raw' — must specify that here
    // or Cloudinary generates a broken image URL
    return cloudinary.url(s3_key, {
      resource_type: 'raw',
      secure: true,
    });
  }
  return cloudinary.url(s3_key, { resource_type: 'image', secure: true });
}

export async function listUsers(req: Request, res: Response) {
  try {
    const { role } = req.query;
    // Default to all non-admin users (consumers + pharmacy_owners).
    // Pass ?role=all to include admins, ?role=consumer to filter to consumers only.
    const roleFilter = typeof role === 'string' && role !== 'all'
      ? { role: role as any }
      : { role: { not: 'admin' as any } };

    const users = await prisma.user.findMany({
      where: roleFilter,
      select: {
        id: true, name: true, email: true, mobile: true,
        role: true, is_active: true, created_at: true,
        _count: { select: { orders: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return successResponse(res, users, 'Users fetched');
  } catch (err) {
    console.error('listUsers error:', err);
    return errorResponse(res, 'Something went wrong', 500, ErrorCode.INTERNAL_ERROR);
  }
}

export async function toggleUserActive(req: Request, res: Response) {
  try {
    const id   = req.params.id as string;

    // SEC-7: Prevent admin from deactivating their own account
    if (id === req.userId) {
      return errorResponse(res, 'You cannot deactivate your own admin account', 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return errorResponse(res, 'User not found', 404);
    const updated = await prisma.user.update({ where: { id }, data: { is_active: !user.is_active } });
    return successResponse(res, updated, 'User status updated');
  } catch (err) {
    console.error('toggleUserActive error:', err);
    return errorResponse(res, 'Something went wrong', 500, ErrorCode.INTERNAL_ERROR);
  }
}

export async function listApplications(req: Request, res: Response) {
  try {
    const { status } = req.query;
    const statusParam = typeof status === "string" ? status : undefined;
    const stores = await prisma.pharmacyStore.findMany({
      where: statusParam ? { status: statusParam as any } : undefined,
      include: { owner: { select: { id:true, name:true, email:true, mobile:true } } },
      orderBy: { created_at: "desc" },
    });
    return successResponse(res, stores, "Applications fetched successfully");
  } catch { return errorResponse(res, "Something went wrong", 500, ErrorCode.INTERNAL_ERROR); }
}

export async function getApplication(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const store = await prisma.pharmacyStore.findUnique({
      where: { id },
      include: { owner: { select: { id:true, name:true, email:true, mobile:true } }, documents: true },
    });
    if (!store) return errorResponse(res, "Application not found", 404);

    const docsWithUrls = (store.documents || []).map((doc: any) => ({
      ...doc,
      url: buildDocUrl(doc.s3_key, doc.mime_type),
    }));

    return successResponse(res, { ...store, documents: docsWithUrls }, "Application fetched successfully");
  } catch { return errorResponse(res, "Something went wrong", 500, ErrorCode.INTERNAL_ERROR); }
}

export async function approveApplication(req: Request, res: Response) {
  try {
    const id    = req.params.id as string;
    const store = await prisma.pharmacyStore.findUnique({ where: { id } });
    if (!store) return errorResponse(res, "Application not found", 404);
    if (store.status !== "pending") return errorResponse(res, "Only pending applications can be approved", 400);

    const updated = await prisma.pharmacyStore.update({
      where: { id },
      data: { status: "approved", verified_at: new Date(), verified_by: req.userId },
    });
    await createNotification(store.owner_id, "store.approved", "Your pharmacy has been approved! 🎉",
      `Congratulations! ${store.name} has been verified and is now live on MedMarket.`);
    return successResponse(res, updated, "Application approved successfully");
  } catch { return errorResponse(res, "Something went wrong", 500, ErrorCode.INTERNAL_ERROR); }
}

// Separate from approveApplication — allows suspended → approved without the pending check
export async function reactivateApplication(req: Request, res: Response) {
  try {
    const id    = req.params.id as string;
    const store = await prisma.pharmacyStore.findUnique({ where: { id } });
    if (!store) return errorResponse(res, "Application not found", 404);
    if (store.status !== "suspended") return errorResponse(res, "Only suspended pharmacies can be reactivated", 400);

    const updated = await prisma.pharmacyStore.update({
      where: { id },
      data: { status: "approved" },
    });
    await createNotification(store.owner_id, "store.approved", "Your pharmacy has been reactivated",
      `Great news! ${store.name} is back online and visible to consumers.`);
    return successResponse(res, updated, "Pharmacy reactivated successfully");
  } catch { return errorResponse(res, "Something went wrong", 500, ErrorCode.INTERNAL_ERROR); }
}

export async function rejectApplication(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { rejection_reason } = req.body;
    if (!rejection_reason) return errorResponse(res, "Rejection reason is required", 400);

    const store = await prisma.pharmacyStore.findUnique({ where: { id } });
    if (!store) return errorResponse(res, "Application not found", 404);
    if (store.status !== "pending") return errorResponse(res, "Only pending applications can be rejected", 400);

    const updated = await prisma.pharmacyStore.update({ where: { id }, data: { status: "rejected", rejection_reason } });
    await createNotification(store.owner_id, "store.rejected", "Application not approved",
      `Your application for ${store.name} was not approved. Reason: ${rejection_reason}. You may resubmit with corrected documents.`);
    return successResponse(res, updated, "Application rejected");
  } catch { return errorResponse(res, "Something went wrong", 500, ErrorCode.INTERNAL_ERROR); }
}

export async function suspendApplication(req: Request, res: Response) {
  try {
    const id    = req.params.id as string;
    const store = await prisma.pharmacyStore.findUnique({ where: { id } });
    if (!store) return errorResponse(res, "Store not found", 404);

    const updated = await prisma.pharmacyStore.update({ where: { id }, data: { status: 'suspended' } });
    await createNotification(store.owner_id, "store.suspended", "Your store has been suspended",
      `${store.name} has been suspended. Contact pharmacy-support@medmarket.in to resolve this.`);
    return successResponse(res, updated, 'Pharmacy suspended');
  } catch { return errorResponse(res, "Something went wrong", 500, ErrorCode.INTERNAL_ERROR); }
}

export async function updatePharmacyDetails(req: Request, res: Response) {
  try {
    const id    = req.params.id as string;
    const store = await prisma.pharmacyStore.findUnique({ where: { id } });
    if (!store) return errorResponse(res, "Store not found", 404);

    const { name, address_line, city, state, pincode, phone, email, drug_license_no, gst_number, fssai_no } = req.body;

    if (drug_license_no && drug_license_no !== store.drug_license_no) {
      const conflict = await prisma.pharmacyStore.findFirst({ where: { drug_license_no, id: { not: id } } });
      if (conflict) return errorResponse(res, "Drug license number already in use.", 409);
    }

    const updated = await prisma.pharmacyStore.update({
      where: { id },
      data: {
        ...(name             && { name }),
        ...(address_line     && { address_line }),
        ...(city             && { city }),
        ...(state            && { state }),
        ...(pincode          && { pincode }),
        ...(phone            && { phone }),
        ...(email            !== undefined && { email }),
        ...(drug_license_no  && { drug_license_no }),
        ...(gst_number       && { gst_number }),
        ...(fssai_no         !== undefined && { fssai_no }),
      },
    });
    return successResponse(res, updated, 'Pharmacy details updated');
  } catch { return errorResponse(res, "Something went wrong", 500, ErrorCode.INTERNAL_ERROR); }
}

export async function getAllOrders(req: Request, res: Response) {
  try {
    const page  = Math.max(1, parseInt(String(req.query.page  || '1'),  10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const skip  = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        include: {
          items:    true,
          consumer: { select: { id: true, name: true } },
          store:    { select: { id: true, name: true, city: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count(),
    ]);

    return successResponse(res, {
      data:    orders,
      total,
      page,
      limit,
      hasMore: skip + orders.length < total,
    }, 'Orders fetched');
  } catch (err) {
    console.error('getAllOrders error:', err);
    return errorResponse(res, 'Something went wrong', 500, ErrorCode.INTERNAL_ERROR);
  }
}

export async function getPharmacyAnalytics(req: Request, res: Response) {
  try {
    const storeId = String(req.params.id);
    const store = await prisma.pharmacyStore.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, city: true, status: true },
    });
    if (!store) return errorResponse(res, 'Store not found', 404);

    // ── All aggregation pushed to PostgreSQL — no JS-level iteration ──
    const [gmvAgg, statusGroups, itemAgg, dailyAgg] = await Promise.all([
      // Total GMV for delivered orders
      prisma.order.aggregate({
        where: { store_id: storeId, status: 'delivered' },
        _sum:   { total_amount: true },
        _count: { _all: true },
      }),

      // Order count per status
      prisma.order.groupBy({
        by:     ['status'],
        where:  { store_id: storeId },
        _count: true,
      }),

      // Top 6 medicines by units sold (delivered orders only)
      prisma.orderItem.groupBy({
        by:      ['medicine_name'],
        where:   { order: { store_id: storeId, status: 'delivered' } },
        _sum:    { quantity: true, line_total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take:    6,
      }),

      // 14-day daily GMV + order count
      prisma.order.groupBy({
        by:    ['created_at'],
        where: {
          store_id:   storeId,
          created_at: { gte: new Date(Date.now() - 14 * 86400000) },
        },
        _sum:   { total_amount: true },
        _count: true,
      }),
    ]);

    // Compute rates from status groups
    const statusMap: Record<string, number> = {};
    let totalOrders = 0;
    for (const row of statusGroups) {
      const cnt = typeof row._count === 'number' ? row._count : (row._count as any)?._all ?? 0;
      statusMap[row.status] = cnt;
      totalOrders += cnt;
    }
    const delivered       = statusMap['delivered']  || 0;
    const rejected        = statusMap['rejected']   || 0;
    const cancelled       = statusMap['cancelled']  || 0;
    const terminal        = delivered + rejected + cancelled;
    const totalGmv        = Number(gmvAgg._sum?.total_amount ?? 0);
    const avgOrder        = delivered > 0 ? totalGmv / delivered : 0;
    const fulfillmentRate = terminal > 0 ? Math.round(delivered / terminal * 100) : 0;
    const rejectionRate   = terminal > 0 ? Math.round(rejected  / terminal * 100) : 0;

    // Build 14-day trend buckets from raw groupBy rows
    const bucketMap: Record<string, { gmv: number; orders: number }> = {};
    for (const row of dailyAgg) {
      const dateStr = row.created_at.toISOString().slice(0, 10);
      if (!bucketMap[dateStr]) bucketMap[dateStr] = { gmv: 0, orders: 0 };
      bucketMap[dateStr].gmv    += Number(row._sum?.total_amount ?? 0);
      const cnt = typeof row._count === 'number' ? row._count : (row._count as any)?._all ?? 0;
      bucketMap[dateStr].orders += cnt;
    }
    const gmvByDay = [];
    for (let i = 13; i >= 0; i--) {
      const d       = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label   = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const bucket  = bucketMap[dateStr] || { gmv: 0, orders: 0 };
      gmvByDay.push({ day: label, gmv: Math.round(bucket.gmv), orders: bucket.orders });
    }

    // Format top medicines
    const topMedicines = itemAgg.map(row => ({
      name:    row.medicine_name,
      units:   row._sum?.quantity   ?? 0,
      revenue: Number(row._sum?.line_total ?? 0),
    }));

    // Status distribution for pie chart
    const orderStatusDist = statusGroups.map(row => ({
      name:  row.status,
      value: typeof row._count === 'number' ? row._count : (row._count as any)?._all ?? 0,
    }));

    return successResponse(res, {
      store,
      totalOrders,
      totalGmv:        Math.round(totalGmv),
      avgOrder:        Math.round(avgOrder),
      fulfillmentRate,
      rejectionRate,
      gmvByDay,
      topMedicines,
      orderStatusDist,
    }, 'Pharmacy analytics fetched');
  } catch (err) {
    console.error('getPharmacyAnalytics error:', err);
    return errorResponse(res, 'Something went wrong', 500, ErrorCode.INTERNAL_ERROR);
  }
}

export async function listComplaints(req: Request, res: Response) {
  try {
    const complaints = await prisma.complaint.findMany({
      include: { consumer: { select: { id:true, name:true, email:true, mobile:true } } },
      orderBy: { created_at: 'desc' },
    });
    return successResponse(res, complaints, 'Complaints fetched');
  } catch (err) {
    console.error('listComplaints error:', err);
    return errorResponse(res, 'Something went wrong', 500, ErrorCode.INTERNAL_ERROR);
  }
}
export async function updateComplaint(req: Request, res: Response) {
  try {
    const id  = req.params.id as string;
    const { status, resolution } = req.body;
    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, 'Complaint not found', 404);
    const updated = await prisma.complaint.update({
      where: { id },
      data: { ...(status && { status }), ...(resolution && { resolution }) },
    });
    return successResponse(res, updated, 'Complaint updated');
  } catch (err) {
    console.error('updateComplaint error:', err);
    return errorResponse(res, 'Something went wrong', 500, ErrorCode.INTERNAL_ERROR);
  }
}

/**
 * GET /api/v1/admin/analytics/platform
 * Returns all platform-level analytics in one DB round-trip.
 * Replaces the previous pattern of bulk-fetching all orders client-side.
 */
export async function getPlatformAnalytics(req: Request, res: Response) {
  try {
    // Build date ranges for trend buckets
    const now = new Date();
    const day14Ago = new Date(now); day14Ago.setDate(now.getDate() - 13); day14Ago.setHours(0,0,0,0);
    const day7Ago  = new Date(now); day7Ago.setDate(now.getDate() - 6);   day7Ago.setHours(0,0,0,0);

    // PERF-1: All queries in a single Promise.all — including totalOrders count
    //         and per-store delivered/terminal/lastOrder groupBys
    const [
      totalAgg,
      statusGroups,
      topMedRaw,
      storeGroups,
      approvedStores,
      totalConsumers,
      activeConsumers,
      storeStatusGroups,
      approvedTurnaroundRaw,
      recentOrdersByDay,
      recentUsersByDay,
      totalOrdersCount,
      deliveredByStore,
      terminalByStore,
      lastOrderByStore,
    ] = await Promise.all([
      // 1. GMV + order counts
      prisma.order.aggregate({
        _sum:   { total_amount: true },
        _count: { id: true },
        where:  { status: 'delivered' },
      }),

      // 2. Status distribution
      prisma.order.groupBy({ by: ['status'], _count: { id: true } }),

      // 3. Top medicines by units (last 180 days to match seed window)
      prisma.orderItem.groupBy({
        by: ['medicine_name'],
        _sum:   { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 8,
      }),

      // 4. Per-store order + GMV aggregation
      prisma.order.groupBy({
        by:      ['store_id'],
        _count:  { id: true },
        _sum:    { total_amount: true },
      }),

      // 5. Approved store list for breakdown table
      prisma.pharmacyStore.findMany({
        where:  { status: 'approved' },
        select: { id: true, name: true, city: true, created_at: true, verified_at: true },
      }),

      // 6. Total consumers
      prisma.user.count({ where: { role: 'consumer' } }),

      // 7. Consumers who placed ≥1 order (activation)
      prisma.user.count({ where: { role: 'consumer', orders: { some: {} } } }),

      // 8. Store status distribution + pending count
      prisma.pharmacyStore.groupBy({ by: ['status'], _count: { id: true } }),

      // 9. Approved stores with turnaround data
      prisma.pharmacyStore.findMany({
        where:  { status: 'approved', verified_at: { not: null } },
        select: { created_at: true, verified_at: true },
      }),

      // 10. Orders in last 14 days (for GMV trend)
      prisma.order.findMany({
        where:  { created_at: { gte: day14Ago } },
        select: { created_at: true, status: true, total_amount: true, store_id: true },
      }),

      // 11. New user registrations last 7 days
      prisma.user.findMany({
        where:  { role: 'consumer', created_at: { gte: day7Ago } },
        select: { created_at: true },
      }),

      // 12. PERF-1: Total order count (was orphaned outside Promise.all)
      prisma.order.count(),

      // 13–15. PERF-1: Per-store delivered/terminal/lastOrder (were in separate Promise.all)
      prisma.order.groupBy({ by: ['store_id'], _count: { id: true }, where: { status: 'delivered' } }),
      prisma.order.groupBy({ by: ['store_id'], _count: { id: true }, where: { status: { in: ['delivered','rejected','cancelled'] } } }),
      prisma.order.groupBy({ by: ['store_id'], _max: { created_at: true } }),
    ]);

    // ── Compute derived values ────────────────────────────────────────────────

    const totalOrders    = totalOrdersCount;
    const deliveredCount = totalAgg._count.id;
    const totalGmv       = Number(totalAgg._sum.total_amount ?? 0);

    // Status distribution object
    const statusMap: Record<string, number> = {};
    statusGroups.forEach(g => { statusMap[g.status] = g._count.id; });
    const terminal = (statusMap['delivered'] ?? 0) + (statusMap['rejected'] ?? 0) + (statusMap['cancelled'] ?? 0);
    const fulfillmentRate = terminal > 0 ? Math.round((statusMap['delivered'] ?? 0) / terminal * 100) : 0;
    const rejectionRate   = terminal > 0 ? Math.round((statusMap['rejected']  ?? 0) / terminal * 100) : 0;

    // Store status distribution
    const storeStatusMap: Record<string, number> = { pending:0, approved:0, rejected:0, suspended:0 };
    storeStatusGroups.forEach(g => { storeStatusMap[g.status] = g._count.id; });
    const storeStatusDist = Object.entries(storeStatusMap)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    // Avg approval turnaround
    const avgTurnaround = approvedTurnaroundRaw.length > 0
      ? Math.round(
          approvedTurnaroundRaw.reduce((sum, s) => {
            const days = Math.round((new Date(s.verified_at!).getTime() - new Date(s.created_at).getTime()) / 86400000);
            return sum + days;
          }, 0) / approvedTurnaroundRaw.length
        )
      : 0;

    // 14-day GMV trend
    const gmvByDay = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label   = d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
      const dayOrders = recentOrdersByDay.filter(o => o.created_at.toISOString().slice(0, 10) === dateStr);
      const gmv   = dayOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
      const count = dayOrders.length;
      gmvByDay.push({ day: label, gmv: Math.round(gmv), orders: count });
    }

    // 7-day registration trend
    const regByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label   = d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
      const count   = recentUsersByDay.filter(u => u.created_at.toISOString().slice(0, 10) === dateStr).length;
      regByDay.push({ day: label, registrations: count });
    }

    // BUG-1: Removed dead cityMap code — city breakdown is handled by pharmacyRows below

    // Top medicines
    const topMedicines = topMedRaw.map(m => ({
      name:    m.medicine_name,
      units:   m._sum.quantity ?? 0,
      revenue: 0, // revenue per medicine requires join — omitted for perf
    }));

    // Per-store aggregate lookup
    const storeAggMap: Record<string, { orders: number; gmv: number }> = {};
    storeGroups.forEach(g => {
      storeAggMap[g.store_id] = { orders: g._count.id, gmv: Number(g._sum.total_amount ?? 0) };
    });

    // Per-store delivered + terminal counts (PERF-1: now from the main Promise.all above)
    const storeDeliveredMap: Record<string, number>  = {};
    const storeTerminalMap:  Record<string, number>  = {};
    const storeLastOrderMap: Record<string, string>  = {};

    deliveredByStore.forEach(g => { storeDeliveredMap[g.store_id] = g._count.id; });
    terminalByStore.forEach(g  => { storeTerminalMap[g.store_id]  = g._count.id; });
    lastOrderByStore.forEach(g => { if (g._max.created_at) storeLastOrderMap[g.store_id] = g._max.created_at.toISOString(); });

    // Pharmacy breakdown table rows
    const pharmacyRows = approvedStores.map(store => {
      const agg        = storeAggMap[store.id]     ?? { orders: 0, gmv: 0 };
      const delivered  = storeDeliveredMap[store.id] ?? 0;
      const terminal   = storeTerminalMap[store.id]  ?? 0;
      const fulfillRate = terminal > 0 ? Math.round(delivered / terminal * 100) : 0;
      const avgOrderVal = delivered > 0 ? agg.gmv / delivered : 0;
      return {
        id:          store.id,
        name:        store.name,
        city:        store.city ?? '—',
        orders:      agg.orders,
        gmv:         Math.round(agg.gmv),
        fulfillRate,
        avgOrderVal: Math.round(avgOrderVal),
        lastActive:  storeLastOrderMap[store.id] ?? null,
      };
    });

    return successResponse(res, {
      // KPIs
      totalGmv:        Math.round(totalGmv),
      totalOrders,
      deliveredOrders: deliveredCount,
      avgOrder:        deliveredCount > 0 ? Math.round(totalGmv / deliveredCount) : 0,
      fulfillmentRate,
      rejectionRate,

      // Stores
      totalStores:    Object.values(storeStatusMap).reduce((a, b) => a + b, 0),
      approvedStores: storeStatusMap['approved'] ?? 0,
      pendingStores:  storeStatusMap['pending']  ?? 0,
      avgTurnaround,
      storeStatusDist,

      // Consumers
      totalConsumers,
      activationRate: totalConsumers > 0 ? Math.round(activeConsumers / totalConsumers * 100) : 0,

      // Charts
      gmvByDay,
      regByDay,
      topMedicines,

      // Breakdown table
      pharmacyRows,
    }, 'Platform analytics fetched');
  } catch (err) {
    console.error('getPlatformAnalytics error:', err);
    return errorResponse(res, 'Something went wrong', 500, ErrorCode.INTERNAL_ERROR);
  }
}

