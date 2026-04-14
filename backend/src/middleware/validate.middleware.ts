import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { errorResponse } from "../utils/response.ts";

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return errorResponse(
        res,
        "Validation failed",
        400,
        result.error.flatten().fieldErrors,
      );
    }

    req.body = result.data;
    next();
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name:     z.string().min(2).max(120),
  email:    z.string().email(),
  mobile:   z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  role:     z.enum(['consumer', 'pharmacy_owner']),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ── Orders ───────────────────────────────────────────────────────────────────

export const placeOrderSchema = z.object({
  store_id:         z.string().uuid(),
  delivery_type:    z.enum(["delivery", "pickup"]),
  payment_method:   z.enum(["upi", "card", "cod"]),
  items: z.array(z.object({
    inventory_id: z.string().uuid(),
    quantity:     z.number().int().positive(),
  })).min(1),
  delivery_address: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  action:           z.enum(["accept", "pack", "dispatch", "deliver", "reject"]),
  rejection_reason: z.string().min(1).optional(),
}).refine(
  (data) => data.action !== "reject" || !!data.rejection_reason,
  { message: "rejection_reason is required when action is 'reject'", path: ["rejection_reason"] },
);

// ── Inventory ────────────────────────────────────────────────────────────────

export const addInventorySchema = z.object({
  medicine_id:         z.string().uuid(),
  batch_number:        z.string().min(1).max(80),
  mfg_date:            z.string().min(1),
  exp_date:            z.string().min(1),
  quantity:            z.number().int().positive(),
  selling_price:       z.number().positive(),
  low_stock_threshold: z.number().int().positive().optional(),
});


export const updateInventorySchema = z.object({
  quantity:            z.number().int().min(0).optional(),
  selling_price:       z.number().positive().optional(),
  low_stock_threshold: z.number().int().positive().optional(),
  exp_date:            z.string().optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: "At least one field must be provided" },
);

// ── Medicines (Admin) ─────────────────────────────────────────────────────────

const medicineFormValues = ["tablet","capsule","syrup","gel","powder","injection","drops","inhaler"] as const;
const medicineScheduleValues = ["otc","schedule_h","schedule_h1","schedule_x"] as const;

export const createMedicineSchema = z.object({
  name:             z.string().min(1).max(200),
  generic_name:     z.string().min(1).max(200),
  salt_composition: z.string().min(1),
  manufacturer:     z.string().min(1).max(200),
  category:         z.string().min(1).max(100),
  form:             z.enum(medicineFormValues),
  pack_size:        z.string().min(1).max(80),
  mrp:              z.number().positive("MRP must be a positive number"),
  schedule:         z.enum(medicineScheduleValues).default("otc"),
});

export const updateMedicineSchema = z.object({
  name:             z.string().min(1).max(200).optional(),
  generic_name:     z.string().min(1).max(200).optional(),
  salt_composition: z.string().min(1).optional(),
  manufacturer:     z.string().min(1).max(200).optional(),
  category:         z.string().min(1).max(100).optional(),
  form:             z.enum(medicineFormValues).optional(),
  pack_size:        z.string().min(1).max(80).optional(),
  mrp:              z.number().positive().optional(),
  schedule:         z.enum(medicineScheduleValues).optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: "At least one field must be provided" },
);

// ── Addresses ────────────────────────────────────────────────────────────────

export const addAddressSchema = z.object({
  label:        z.string().min(1).max(50),
  address_line: z.string().min(1),
  city:         z.string().min(1).max(100),
  pincode:      z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  is_default:   z.boolean().optional(),
});

export const updateAddressSchema = z.object({
  label:        z.string().min(1).max(50).optional(),
  address_line: z.string().min(1).optional(),
  city:         z.string().min(1).max(100).optional(),
  pincode:      z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: "At least one field must be provided" },
);

// ── Complaints ───────────────────────────────────────────────────────────────

export const fileComplaintSchema = z.object({
  type:     z.string().min(1).max(80),
  subject:  z.string().min(1).max(200),
  body:     z.string().min(10),
  order_id: z.string().uuid().optional(),
});

// ── Pharmacy store update ────────────────────────────────────────────────────

export const updateStoreSchema = z.object({
  phone:        z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number').optional(),
  email:        z.string().email().optional(),
  address_line: z.string().min(1).optional(),
  city:         z.string().min(1).max(100).optional(),
  pincode:      z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: "At least one field must be provided" },
);
