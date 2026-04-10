import { Request, Response } from "express";
import prisma from "../config/prisma.ts";
import { errorResponse, successResponse } from "../utils/response.ts";
import { Decimal } from "@prisma/client/runtime/client";

export async function placeOrder(req: Request, res: Response) {
  try {
    const { store_id, delivery_type, delivery_address, payment_method, items } =
      req.body;

    if (!store_id || !delivery_type || !payment_method || !items || !items.length) {
      return errorResponse(res, "All fields are required", 400);
    }

    const store = await prisma.pharmacyStore.findFirst({
      where: { id: store_id, status: "approved" },
    });

    if (!store) {
      return errorResponse(res, "Store not found or not approved", 404);
    }

    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItems: {
        inventory_id: string;
        medicine_name: string;
        salt_composition: string;
        batch_number: string;
        quantity: number;
        unit_price: Decimal;
        line_total: number;
        mrp_at_order: Decimal;
      }[] = [];

      for (const item of items) {
        const inventory = await tx.storeInventory.findFirst({
          where: { id: item.inventory_id, store_id, status: "active" },
          include: { medicine: true },
        });

        if (!inventory) {
          throw new Error(`Inventory item ${item.inventory_id} not found`);
        }

        if (inventory.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${inventory.medicine.name}`);
        }

        const lineTotal = Number(inventory.selling_price) * item.quantity;
        subtotal += lineTotal;

        orderItems.push({
          inventory_id: inventory.id,
          medicine_name: inventory.medicine.name,
          salt_composition: inventory.medicine.salt_composition,
          batch_number: inventory.batch_number,
          quantity: item.quantity,
          unit_price: inventory.selling_price,
          line_total: lineTotal,
          mrp_at_order: inventory.medicine.mrp,
        });
      }

      if (payment_method === "cod" && subtotal > 2000) {
        throw new Error("COD not available for orders above ₹2000");
      }

      const gst_amount = subtotal * 0.12;
      const delivery_fee = delivery_type === "delivery" ? 30 : 0;
      const total_amount = subtotal + gst_amount + delivery_fee;

      const newOrder = await tx.order.create({
        data: {
          consumer_id: req.userId,
          store_id,
          delivery_type,
          delivery_address: delivery_address || null,
          payment_method,
          subtotal,
          gst_amount,
          delivery_fee,
          total_amount,
          status: "confirmed",
          items: { create: orderItems },
        },
        include: { items: true },
      });

      for (const item of items) {
        await tx.storeInventory.updateMany({
          where: { id: item.inventory_id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    return successResponse(res, order, "Order placed successfully", 201);
  } catch (error: any) {
    const knownErrors = [
      "Inventory item",
      "Insufficient stock",
      "COD not available",
      "not found",
    ];
    if (knownErrors.some((e) => error?.message?.includes(e))) {
      return errorResponse(res, error.message, 400);
    }
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function getMyOrders(req: Request, res: Response) {
  try {
    const orders = await prisma.order.findMany({
      where: { consumer_id: req.userId },
      include: {
        items: true,
        store: { select: { name: true, phone: true, city: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return successResponse(res, orders, "Orders fetched successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function getOrder(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const order = await prisma.order.findFirst({
      where: { id, consumer_id: req.userId },
      include: {
        items: true,
        store: {
          select: { name: true, phone: true, city: true, address_line: true },
        },
      },
    });

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    return successResponse(res, order, "Order fetched successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function cancelOrder(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const order = await prisma.order.findFirst({
      where: { id, consumer_id: req.userId },
      include: { items: true },
    });

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    if (order.status !== "confirmed") {
      return errorResponse(
        res,
        `Cannot cancel an order that is already '${order.status}'. Only confirmed orders can be cancelled.`,
        400,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: "cancelled", cancelled_at: new Date() },
      });

      for (const item of order.items) {
        await tx.storeInventory.updateMany({
          where: { id: item.inventory_id },
          data: { quantity: { increment: item.quantity } },
        });
      }
    });

    return successResponse(res, null, "Order cancelled successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function getPharmacyOrders(req: Request, res: Response) {
  try {
    const store = await prisma.pharmacyStore.findFirst({
      where: { owner_id: req.userId, status: "approved" },
    });

    if (!store) {
      return errorResponse(res, "Approved store not found", 404);
    }

    const { status } = req.query;
    const statusParam = typeof status === "string" ? status : undefined;

    const orders = await prisma.order.findMany({
      where: {
        store_id: store.id,
        ...(statusParam && { status: statusParam as any }),
      },
      include: {
        items: true,
        consumer: { select: { name: true, mobile: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return successResponse(res, orders, "Orders fetched successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { action, rejection_reason } = req.body;

    const store = await prisma.pharmacyStore.findFirst({
      where: { owner_id: req.userId, status: "approved" },
    });

    if (!store) {
      return errorResponse(res, "Approved store not found", 404);
    }

    const order = await prisma.order.findFirst({
      where: { id, store_id: store.id },
      include: { items: true },
    });

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }
    
    const allowedFrom: Record<string, string> = {
      accept:   "confirmed",
      pack:     "accepted",
      dispatch: "packing",
      deliver:  "dispatched",
      reject:   "confirmed",
    };

    const validTransitions: Record<string, string> = {
      accept:   "accepted",
      pack:     "packing",
      dispatch: "dispatched",
      deliver:  "delivered",
      reject:   "rejected",
    };

    const newStatus = validTransitions[action];
    if (!newStatus) {
      return errorResponse(res, "Invalid action", 400);
    }

    if (order.status !== allowedFrom[action]) {
      return errorResponse(
        res,
        `Cannot '${action}' an order that is currently '${order.status}'. Expected status: '${allowedFrom[action]}'.`,
        400,
      );
    }

    if (action === "reject" && !rejection_reason) {
      return errorResponse(res, "Rejection reason is required", 400);
    }

    const updateData: any = {
      status: newStatus,
      ...(action === "accept"   && { accepted_at: new Date() }),
      ...(action === "dispatch" && { dispatched_at: new Date() }),
      ...(action === "deliver"  && { delivered_at: new Date() }),
      ...(action === "reject"   && { rejection_reason }),
    };

    if (action === "reject") {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id }, data: updateData });

        for (const item of order.items) {
          await tx.storeInventory.updateMany({
            where: { id: item.inventory_id },
            data: { quantity: { increment: item.quantity } },
          });
        }
      });
    } else {
      await prisma.order.update({ where: { id }, data: updateData });
    }

    return successResponse(res, null, `Order ${newStatus} successfully`);
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}
