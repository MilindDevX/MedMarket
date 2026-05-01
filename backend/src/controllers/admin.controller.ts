import type { Request, Response } from "express";
import prisma from "../config/prisma.ts";
import { successResponse, errorResponse } from "../utils/response.ts";
import { createNotification } from "./notification.controller.ts";
import { cloudinary } from "../lib/cloudinary.ts";

export async function listUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'consumer' },
      select: { id:true, name:true, email:true, mobile:true, is_active:true, created_at:true, _count: { select: { orders:true } } },
      orderBy: { created_at: 'desc' },
    });
    return successResponse(res, users, 'Users fetched');
  } catch (err) {
    console.error('listUsers error:', err);
    return errorResponse(res, 'Something went wrong', 500);
  }
}

export async function toggleUserActive(req: Request, res: Response) {
  try {
    const id   = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return errorResponse(res, 'User not found', 404);
    const updated = await prisma.user.update({ where: { id }, data: { is_active: !user.is_active } });
    return successResponse(res, updated, 'User status updated');
  } catch (err) {
    console.error('toggleUserActive error:', err);
    return errorResponse(res, 'Something went wrong', 500);
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
  } catch { return errorResponse(res, "Something went wrong", 500); }
}

export async function getApplication(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const store = await prisma.pharmacyStore.findUnique({
      where: { id },
      include: { owner: { select: { id:true, name:true, email:true, mobile:true } }, documents: true },
    });
    if (!store) return errorResponse(res, "Application not found", 404);

    const docsWithUrls = (store.documents || []).map(doc => {
      const resourceType = doc.mime_type === 'application/pdf' ? 'raw' : 'image';
      const url = doc.s3_key
        ? cloudinary.url(doc.s3_key, { resource_type: resourceType, secure: true })
        : null;
      return { ...doc, url };
    });

    return successResponse(res, { ...store, documents: docsWithUrls }, "Application fetched successfully");
  } catch { return errorResponse(res, "Something went wrong", 500); }
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
  } catch { return errorResponse(res, "Something went wrong", 500); }
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
  } catch { return errorResponse(res, "Something went wrong", 500); }
}

export async function rejectApplicaton(req: Request, res: Response) {
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
  } catch { return errorResponse(res, "Something went wrong", 500); }
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
  } catch { return errorResponse(res, "Something went wrong", 500); }
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
  } catch { return errorResponse(res, "Something went wrong", 500); }
}

export async function getAllOrders(req: Request, res: Response) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        consumer: { select: { id:true, name:true, mobile:true } },
        store:    { select: { id:true, name:true, city:true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return successResponse(res, orders, 'Orders fetched');
  } catch (err) {
    console.error('getAllOrders error:', err);
    return errorResponse(res, 'Something went wrong', 500);
  }
}

export async function getPharmacyAnalytics(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const store = await prisma.pharmacyStore.findUnique({
      where: { id },
      select: { id: true, name: true, city: true, status: true },
    });
    if (!store) return errorResponse(res, 'Store not found', 404);

    const orders = await prisma.order.findMany({
      where: { store_id: id },
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });

    const delivered  = orders.filter(o => o.status === 'delivered');
    const rejected   = orders.filter(o => o.status === 'rejected');
    const cancelled  = orders.filter(o => o.status === 'cancelled');
    const totalGmv   = delivered.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const avgOrder   = delivered.length > 0 ? totalGmv / delivered.length : 0;
    const terminal   = delivered.length + rejected.length + cancelled.length;
    const fulfillmentRate = terminal > 0 ? Math.round(delivered.length / terminal * 100) : 0;
    const rejectionRate   = terminal > 0 ? Math.round(rejected.length  / terminal * 100) : 0;

    // 14-day GMV trend
    const gmvByDay = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label   = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const dateStr = d.toISOString().slice(0, 10);
      const rev     = delivered
        .filter(o => o.created_at.toISOString().slice(0, 10) === dateStr)
        .reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const ordCnt  = orders.filter(o => o.created_at.toISOString().slice(0, 10) === dateStr).length;
      gmvByDay.push({ day: label, gmv: Math.round(rev), orders: ordCnt });
    }

    // Top medicines by units sold
    const medMap: Record<string, { name: string; units: number; revenue: number }> = {};
    delivered.forEach(o => {
      o.items.forEach((item: any) => {
        const key = item.medicine_name;
        if (!medMap[key]) medMap[key] = { name: key, units: 0, revenue: 0 };
        medMap[key].units   += item.quantity;
        medMap[key].revenue += Number(item.line_total || 0);
      });
    });
    const topMedicines = Object.values(medMap)
      .sort((a, b) => b.units - a.units)
      .slice(0, 6);

    // Order status distribution
    const statusDist: Record<string, number> = {};
    orders.forEach(o => { statusDist[o.status] = (statusDist[o.status] || 0) + 1; });
    const orderStatusDist = Object.entries(statusDist).map(([name, value]) => ({ name, value }));

    return successResponse(res, {
      store,
      totalOrders: orders.length,
      totalGmv: Math.round(totalGmv),
      avgOrder: Math.round(avgOrder),
      fulfillmentRate,
      rejectionRate,
      gmvByDay,
      topMedicines,
      orderStatusDist,
    }, 'Pharmacy analytics fetched');
  } catch (err) {
    console.error('getPharmacyAnalytics error:', err);
    return errorResponse(res, 'Something went wrong', 500);
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
    return errorResponse(res, 'Something went wrong', 500);
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
    return errorResponse(res, 'Something went wrong', 500);
  }
}
