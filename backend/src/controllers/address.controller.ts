import type { Request, Response } from "express";
import prisma from "../config/prisma.ts";
import { errorResponse, successResponse } from "../utils/response.ts";

export async function getAddresses(req: Request, res: Response) {
  try {
    const addresses = await prisma.consumerAddress.findMany({
      where: { consumer_id: req.userId },
      orderBy: { is_default: "desc" },
    });

    return successResponse(res, addresses, "Addresses fetched successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function addAddress(req: Request, res: Response) {
  try {
    const { label, address_line, city, pincode, is_default } = req.body;

    if (!label || !address_line || !city || !pincode) {
      return errorResponse(res, "All field are required", 400);
    }

    if (is_default) {
      await prisma.consumerAddress.updateMany({
        where: { consumer_id: req.userId },
        data: { is_default: false },
      });
    }

    const address = await prisma.consumerAddress.create({
      data: {
        consumer_id: req.userId,
        label,
        address_line,
        city,
        pincode,
        is_default: is_default || false,
      },
    });

    return successResponse(res, address, "Address added successfully", 201);
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function updateAddress(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const address = await prisma.consumerAddress.findFirst({
      where: { id, consumer_id: req.userId },
    });

    if (!address) {
      return errorResponse(res, "Address not found", 404);
    }

    const { label, address_line, city, pincode } = req.body;

    const updated = await prisma.consumerAddress.update({
      where: { id },
      data: {
        ...(label && { label }),
        ...(address_line && { address_line }),
        ...(city && { city }),
        ...(pincode && { pincode }),
      },
    });

    return successResponse(res, updated, "Address updated successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function deleteAddress(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const address = await prisma.consumerAddress.findFirst({
      where: { id, consumer_id: req.userId },
    });

    if (!address) {
      return errorResponse(res, "Address not found", 404);
    }

    await prisma.consumerAddress.delete({ where: { id } });

    return successResponse(res, null, "Address deleted successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function setDefaultAddress(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const address = await prisma.consumerAddress.findFirst({
      where: { id, consumer_id: req.userId },
    });

    if (!address) {
      return errorResponse(res, "Address not found", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.consumerAddress.updateMany({
        where: { consumer_id: req.userId },
        data: { is_default: false },
      });

      await tx.consumerAddress.update({
        where: { id },
        data: { is_default: true },
      });
    });

    return successResponse(res, null, "Default address updated");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}
