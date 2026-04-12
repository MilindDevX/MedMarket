import type { Request, Response } from "express";
import prisma from "../config/prisma.ts";
import { successResponse, errorResponse } from "../utils/response.ts";
import { createNotification } from "./notification.controller.ts";

export async function listUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({ where: { role: 'consumer' }, select: { id:true, name:true, email:true, mobile:true, is_active:true, created_at:true, _count: { select: { orders:true } } }, orderBy: { created_at: 'desc' } });
  return successResponse(res, users, 'Users fetched');
}

export async function toggleUserActive(req: Request, res: Response) {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return errorResponse(res, 'User not found', 404);
  const updated = await prisma.user.update({ where: { id }, data: { is_active: !user.is_active } });
  return successResponse(res, updated, 'User status updated');
}

export async function listApplications(req: Request, res: Response) {
  try {
    const { status } = req.query;
    const statusParam = typeof status === "string" ? status : undefined;
    const stores = await prisma.pharmacyStore.findMany({ where: statusParam ? { status: statusParam as any } : undefined, include: { owner: { select: { id:true, name:true, email:true, mobile:true } } }, orderBy: { created_at: "desc" } });
    return successResponse(res, stores, "Applications fetched successfully");
  } catch { return errorResponse(res, "Something went wrong", 500); }
}

export async function getApplication(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const store = await prisma.pharmacyStore.findUnique({ where: { id }, include: { owner: { select: { id:true, name:true, email:true, mobile:true } }, documents:true } });
    if (!store) return errorResponse(res, "Application not found", 404);
    return successResponse(res, store, "Application fetched successfully");
  } catch { return errorResponse(res, "Something went wrong", 500); }
}

export async function approveApplication(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const store = await prisma.pharmacyStore.findUnique({ where: { id } });
    if (!store) return errorResponse(res, "Application not found", 404);
    if (store.status !== "pending") return errorResponse(res, "Only pending applications can be approved", 400);

    const updated = await prisma.pharmacyStore.update({ where: { id }, data: { status: "approved", verified_at: new Date(), verified_by: req.userId } });

    await createNotification(store.owner_id, "store.approved", "Your pharmacy has been approved! 🎉", `Congratulations! ${store.name} has been verified and is now live on MedMarket. You can start listing medicines.`);
    return successResponse(res, updated, "Application approved successfully");
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

    await createNotification(store.owner_id, "store.rejected", "Application not approved", `Your application for ${store.name} was not approved. Reason: ${rejection_reason}. You may resubmit with corrected documents.`);
    return successResponse(res, updated, "Application rejected");
  } catch { return errorResponse(res, "Something went wrong", 500); }
}

export async function suspendApplication(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const store = await prisma.pharmacyStore.findUnique({ where: { id } });
    if (!store) return errorResponse(res, "Store not found", 404);

    const updated = await prisma.pharmacyStore.update({ where: { id }, data: { status: 'suspended' } });

    await createNotification(store.owner_id, "store.suspended", "Your store has been suspended", `${store.name} has been suspended by MedMarket. All listings are hidden. Contact pharmacy-support@medmarket.in to resolve this.`);
    return successResponse(res, updated, 'Pharmacy suspended');
  } catch { return errorResponse(res, "Something went wrong", 500); }
}

export async function getAllOrders(req: Request, res: Response) {
  const orders = await prisma.order.findMany({ include: { items:true, consumer: { select: { id:true, name:true, mobile:true } }, store: { select: { id:true, name:true, city:true } } }, orderBy: { created_at: 'desc' } });
  return successResponse(res, orders, 'Orders fetched');
}

export async function listComplaints(req: Request, res: Response) {
  const complaints = await prisma.complaint.findMany({ include: { consumer: { select: { id:true, name:true, email:true, mobile:true } } }, orderBy: { created_at: 'desc' } });
  return res.json({ success: true, data: complaints });
}

export async function updateComplaint(req: Request, res: Response) {
  const id = req.params.id as string;
  const { status, resolution } = req.body;
  const updated = await prisma.complaint.update({ where: { id }, data: { ...(status && { status }), ...(resolution && { resolution }) } });
  return res.json({ success: true, data: updated, message: 'Complaint updated' });
}
