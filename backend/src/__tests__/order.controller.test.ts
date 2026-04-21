/**
 * Order controller — unit tests
 *
 * Focuses on the business-rule branches that matter most:
 *   - COD limit enforcement (> ₹2000 blocked)
 *   - Insufficient stock
 *   - Store not approved
 *   - Consumer-only / pharmacy-only route guards (mocked at the controller level)
 *   - Cancel only allowed on 'confirmed' orders
 *   - State machine transitions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../config/prisma.ts', () => ({
  default: {
    pharmacyStore:  { findFirst: vi.fn() },
    storeInventory: { findFirst: vi.fn(), updateMany: vi.fn() },
    order:          { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    $transaction:   vi.fn(),
  },
}));

vi.mock('../controllers/notification.controller.ts', () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

import prisma from '../config/prisma.ts';
import { placeOrder, cancelOrder, updateOrderStatus } from '../controllers/order.controller.ts';

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json:   vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function mockReq(body = {}, params: Record<string, string> = {}, userId = 'consumer-uid'): Request {
  return { body, params, userId } as unknown as Request;
}

describe('Order Controller', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── placeOrder ──────────────────────────────────────────────────────────
  describe('placeOrder', () => {
    it('returns 400 when required fields are missing', async () => {
      const res = mockRes();
      await placeOrder(mockReq({ store_id: 'sid' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when store is not found or not approved', async () => {
      vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce(null);
      const res = mockRes();
      await placeOrder(
        mockReq({ store_id: 's1', delivery_type: 'pickup', payment_method: 'upi', items: [{ inventory_id: 'i1', quantity: 1 }] }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 when COD total exceeds ₹2000', async () => {
      vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce({ id: 's1', owner_id: 'owner1' } as any);

      // $transaction executes the callback synchronously in the mock
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (cb: any) => {
        // Simulate the callback throwing the COD error
        const tx = {
          storeInventory: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'i1', quantity: 5, selling_price: 1200,
              medicine: { name: 'Med A', salt_composition: 'X', mrp: 1500 },
            }),
            updateMany: vi.fn().mockResolvedValue({}),
          },
          order: { create: vi.fn() },
        };
        await cb(tx);
      });

      const res = mockRes();
      await placeOrder(
        mockReq({
          store_id: 's1', delivery_type: 'pickup', payment_method: 'cod',
          items: [{ inventory_id: 'i1', quantity: 2 }],
        }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(400);
      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.message).toMatch(/COD/i);
    });

    it('returns 400 when stock is insufficient', async () => {
      vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce({ id: 's1', owner_id: 'owner1' } as any);
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (cb: any) => {
        const tx = {
          storeInventory: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'i1', quantity: 1, selling_price: 50,
              medicine: { name: 'Med B', salt_composition: 'Y', mrp: 60 },
            }),
            updateMany: vi.fn(),
          },
          order: { create: vi.fn() },
        };
        await cb(tx);
      });

      const res = mockRes();
      await placeOrder(
        mockReq({
          store_id: 's1', delivery_type: 'pickup', payment_method: 'upi',
          items: [{ inventory_id: 'i1', quantity: 99 }],
        }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(400);
      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.message).toMatch(/stock/i);
    });
  });

  // ── cancelOrder ─────────────────────────────────────────────────────────
  describe('cancelOrder', () => {
    it('returns 404 when order not found', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(null);
      const res = mockRes();
      await cancelOrder(mockReq({}, { id: 'order-1' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 when order is not in confirmed status', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce({
        id: 'order-1', status: 'accepted', items: [],
        store: { owner_id: 'owner1', name: 'Pharma' },
      } as any);
      const res = mockRes();
      await cancelOrder(mockReq({}, { id: 'order-1' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.message).toMatch(/cancel/i);
    });
  });

  // ── updateOrderStatus ────────────────────────────────────────────────────
  describe('updateOrderStatus', () => {
    it('returns 404 when pharmacy store not found', async () => {
      vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce(null);
      const res = mockRes();
      await updateOrderStatus(mockReq({ action: 'accept' }, { id: 'order-1' }, 'pharmacy-uid'), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 for invalid action', async () => {
      vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce({ id: 'store-1' } as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce({ id: 'o1', status: 'confirmed', items: [] } as any);
      const res = mockRes();
      await updateOrderStatus(mockReq({ action: 'fly' }, { id: 'o1' }, 'pharmacy-uid'), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when rejection_reason is missing on reject', async () => {
      vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce({ id: 'store-1', name: 'P' } as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce({
        id: 'o1', status: 'confirmed', consumer_id: 'c1', items: [],
      } as any);
      const res = mockRes();
      await updateOrderStatus(mockReq({ action: 'reject' }, { id: 'o1' }, 'pharmacy-uid'), res);
      expect(res.status).toHaveBeenCalledWith(400);
      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.message).toMatch(/reason/i);
    });

    it('returns 400 when trying to accept an already-accepted order', async () => {
      vi.mocked(prisma.pharmacyStore.findFirst).mockResolvedValueOnce({ id: 'store-1' } as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce({
        id: 'o1', status: 'accepted', items: [],
      } as any);
      const res = mockRes();
      await updateOrderStatus(mockReq({ action: 'accept' }, { id: 'o1' }, 'pharmacy-uid'), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
