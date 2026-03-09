/**
 * Inventory controller — unit tests
 *
 * Tests the critical compliance rules:
 *   - OTC-only enforcement (Schedule H/H1/X blocked)
 *   - MRP price cap (selling_price must be <= MRP)
 *   - Store must be approved
 *   - Required fields validation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../config/prisma.ts', () => ({
  default: {
    pharmacyStore:  { findFirst: vi.fn() },
    medicineMaster: { findFirst: vi.fn() },
    storeInventory: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  },
}));

import prisma from '../config/prisma.ts';
import { addInventory } from '../controllers/inventory.controller.ts';

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json:   vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeReq(body = {}, userId = 'pharmacy-uid'): Request {
  return { body, userId } as unknown as Request;
}

const BASE_BODY = {
  medicine_id: 'med-1',
  batch_number: 'BATCH001',
  mfg_date: '2025-01-01',
  exp_date: '2027-01-01',
  quantity: 100,
  selling_price: 50,
};

describe('Inventory Controller — addInventory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when the pharmacy store is not found or not approved', async () => {
    vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce(null);
    const res = mockRes();
    await addInventory(makeReq(BASE_BODY), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when required fields are missing', async () => {
    vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce({ id: 'store-1' } as any);
    const res = mockRes();
    await addInventory(makeReq({ medicine_id: 'med-1' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when medicine does not exist', async () => {
    vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce({ id: 'store-1' } as any);
    vi.mocked(prisma.medicineMaster.findFirst).mockResolvedValueOnce(null);
    const res = mockRes();
    await addInventory(makeReq(BASE_BODY), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('blocks Schedule H medicines with 422 (OTC-only rule)', async () => {
    vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce({ id: 'store-1' } as any);
    vi.mocked(prisma.medicineMaster.findFirst).mockResolvedValueOnce({
      id: 'med-1', name: 'Restricted Med', schedule: 'schedule_h', mrp: 100,
    } as any);
    const res = mockRes();
    await addInventory(makeReq(BASE_BODY), res);
    expect(res.status).toHaveBeenCalledWith(422);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.message).toMatch(/OTC/i);
  });

  it('blocks Schedule H1 medicines with 422', async () => {
    vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce({ id: 'store-1' } as any);
    vi.mocked(prisma.medicineMaster.findFirst).mockResolvedValueOnce({
      id: 'med-1', name: 'Restricted Med H1', schedule: 'schedule_h1', mrp: 100,
    } as any);
    const res = mockRes();
    await addInventory(makeReq(BASE_BODY), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('blocks Schedule X medicines with 422', async () => {
    vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce({ id: 'store-1' } as any);
    vi.mocked(prisma.medicineMaster.findFirst).mockResolvedValueOnce({
      id: 'med-1', name: 'Controlled Med', schedule: 'schedule_x', mrp: 100,
    } as any);
    const res = mockRes();
    await addInventory(makeReq(BASE_BODY), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('blocks selling_price above MRP (DPCO compliance)', async () => {
    vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce({ id: 'store-1' } as any);
    vi.mocked(prisma.medicineMaster.findFirst).mockResolvedValueOnce({
      id: 'med-1', name: 'Paracetamol', schedule: 'otc', mrp: 40,
    } as any);
    const res = mockRes();
    // selling_price 50 > mrp 40 — must be blocked
    await addInventory(makeReq({ ...BASE_BODY, selling_price: 50 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.message).toMatch(/MRP|price/i);
  });

  it('creates inventory successfully for a valid OTC medicine at or below MRP', async () => {
    vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce({ id: 'store-1' } as any);
    vi.mocked(prisma.medicineMaster.findFirst).mockResolvedValueOnce({
      id: 'med-1', name: 'Paracetamol', schedule: 'otc', mrp: 60,
    } as any);
    vi.mocked(prisma.storeInventory.create).mockResolvedValueOnce({
      id: 'inv-1', store_id: 'store-1', medicine_id: 'med-1',
      batch_number: 'BATCH001', quantity: 100, selling_price: 50,
    } as any);

    const res = mockRes();
    await addInventory(makeReq(BASE_BODY), res);
    expect(res.status).toHaveBeenCalledWith(201);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.success).toBe(true);
  });

  it('allows selling_price exactly equal to MRP', async () => {
    vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce({ id: 'store-1' } as any);
    vi.mocked(prisma.medicineMaster.findFirst).mockResolvedValueOnce({
      id: 'med-1', name: 'Ibuprofen', schedule: 'otc', mrp: 50,
    } as any);
    vi.mocked(prisma.storeInventory.create).mockResolvedValueOnce({ id: 'inv-2' } as any);

    const res = mockRes();
    await addInventory(makeReq({ ...BASE_BODY, selling_price: 50 }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
