import type { Response, Request } from "express";
import prisma from "../config/prisma.ts";
import { successResponse, errorResponse } from "../utils/response.ts";

export async function listMedicines(req: Request, res: Response) {
  try {
    const { search, category } = req.query;

    const medicines = await prisma.medicineMaster.findMany({
      where: {
        is_active: true,
        schedule: "otc",
        ...(category && { category: category as string }),
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: "insensitive" } },
            {
              generic_name: { contains: search as string, mode: "insensitive" },
            },
            {
              salt_composition: {
                contains: search as string,
                mode: "insensitive",
              },
            },
          ],
        }),
      },
      orderBy: { name: "asc" },
    });

    return successResponse(res, medicines, "Medicines fetched successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function getMedicine(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const medicine = await prisma.medicineMaster.findFirst({
      where: { id, is_active: true },
    });

    if (!medicine) {
      return errorResponse(res, "Medicine not found", 404);
    }

    return successResponse(res, medicine, "Medicine fetched successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function createMedicine(req: Request, res: Response) {
  try {
    const {
      name,
      generic_name,
      salt_composition,
      manufacturer,
      category,
      form,
      pack_size,
      mrp,
      schedule,
    } = req.body;

    if (
      !name ||
      !generic_name ||
      !salt_composition ||
      !manufacturer ||
      !category ||
      !form ||
      !pack_size ||
      !mrp
    ) {
      return errorResponse(res, "All fields are required", 400);
    }

    const exisiting = await prisma.medicineMaster.findUnique({ where: {name} });

    if (exisiting) {
      return errorResponse(res, "Medicine with this name already exists", 409);
    }

    const medicine = await prisma.medicineMaster.create({
      data: {
        name,
        generic_name,
        salt_composition,
        manufacturer,
        category,
        form,
        pack_size,
        mrp,
        schedule: schedule || "otc",
        created_by: req.userId,
      },
    });

    return successResponse(res, medicine, "Medicine created successfully", 201);
  } catch (error) {
    console.log(error)
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function updateMedicine(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const medicine = await prisma.medicineMaster.findFirst({ where: { id, is_active: true } });

    if (!medicine) {
      return errorResponse(res, "Medicine not found", 404);
    }

    const {
      name,
      generic_name,
      salt_composition,
      manufacturer,
      category,
      form,
      pack_size,
      mrp,
      schedule,
    } = req.body;

    const updated = await prisma.medicineMaster.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(generic_name && { generic_name }),
        ...(salt_composition && { salt_composition }),
        ...(manufacturer && { manufacturer }),
        ...(category && { category }),
        ...(form && { form }),
        ...(pack_size && { pack_size }),
        ...(mrp && { mrp }),
        ...(schedule && { schedule }),
      },
    });

    return successResponse(res, updated, "Medicine updated successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function deactivateMedicine(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const medicine = await prisma.medicineMaster.findFirst({ where: { id, is_active: true } });

    if (!medicine) {
      return errorResponse(res, "Medicine not found", 404);
    }

    await prisma.medicineMaster.update({
      where: { id },
      data: { is_active: false },
    });

    return successResponse(res, null, "Medicine deactivated successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}
