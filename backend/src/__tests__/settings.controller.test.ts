/**
 * Settings controller — unit tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../config/prisma.ts', () => ({
  default: {
    platformSettings: { upsert: vi.fn() },
  },
}));

import prisma from '../config/prisma.ts';
import { getSettings, updateSettings } from '../controllers/settings.controller.ts';

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json:   vi.fn().mockReturnThis(),
  } as unknown as Response;
}

const MOCK_SETTINGS = {
  id: 'singleton', gst_rate: 12, delivery_fee: 30, cod_limit: 2000,
  expiry_warn_60: true, expiry_warn_30: true,
};

describe('Settings Controller', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getSettings', () => {
    it('returns 200 with settings on success', async () => {
      vi.mocked(prisma.platformSettings.upsert).mockResolvedValueOnce(MOCK_SETTINGS as any);
      const res = mockRes();
      await getSettings({ userId: 'admin-1' } as any, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.gst_rate).toBe(12);
    });

    it('returns 500 when prisma throws', async () => {
      vi.mocked(prisma.platformSettings.upsert).mockRejectedValueOnce(new Error('DB error'));
      const res = mockRes();
      await getSettings({ userId: 'admin-1' } as any, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateSettings', () => {
    it('updates only the provided fields', async () => {
      vi.mocked(prisma.platformSettings.upsert).mockResolvedValueOnce({ ...MOCK_SETTINGS, gst_rate: 18 } as any);
      const res = mockRes();
      const req = { body: { gst_rate: 18 }, userId: 'admin-1' } as unknown as Request;
      await updateSettings(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const upsertCall = vi.mocked(prisma.platformSettings.upsert).mock.calls[0][0];
      expect(upsertCall.update).toHaveProperty('gst_rate', 18);
    });

    it('returns 500 when prisma throws', async () => {
      vi.mocked(prisma.platformSettings.upsert).mockRejectedValueOnce(new Error('DB error'));
      const res = mockRes();
      await updateSettings({ body: { gst_rate: 12 }, userId: 'admin-1' } as unknown as Request, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
