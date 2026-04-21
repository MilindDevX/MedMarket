import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// ── Mock Prisma ──────────────────────────────────────────────────────────────
vi.mock('../config/prisma.ts', () => ({
  default: {
    user:         { findUnique: vi.fn(), create: vi.fn() },
    refreshToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  },
}));

// ── Mock bcrypt helpers ──────────────────────────────────────────────────────
vi.mock('../utils/hash.ts', () => ({
  hashPassword:    vi.fn().mockResolvedValue('$hashed$'),
  comparePassword: vi.fn(),
}));

// ── Mock JWT helpers ─────────────────────────────────────────────────────────
vi.mock('../utils/jwt.ts', () => ({
  signAccessToken:   vi.fn().mockReturnValue('access-token-mock'),
  signRefreshToken:  vi.fn().mockReturnValue('refresh-token-mock'),
  verifyRefreshToken: vi.fn(),
}));

import prisma              from '../config/prisma.ts';
import { comparePassword } from '../utils/hash.ts';
import { verifyRefreshToken } from '../utils/jwt.ts';
import { register, login, refresh, logout } from '../controllers/auth.controller.ts';

// ── Helper to build mock req/res ─────────────────────────────────────────────
function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json:   vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function mockReq(body: Record<string, unknown> = {}, params: Record<string, string> = {}): Request {
  return { body, params, headers: {} } as unknown as Request;
}

// ─────────────────────────────────────────────────────────────────────────────
describe('Auth Controller', () => {

  beforeEach(() => vi.clearAllMocks());

  // ── register ──────────────────────────────────────────────────────────────
  describe('register', () => {
    it('returns 400 when required fields are missing', async () => {
      const res = mockRes();
      await register(mockReq({ name: 'Alice' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('blocks admin role registration with 403', async () => {
      const res = mockRes();
      await register(mockReq({ name: 'A', email: 'a@b.com', mobile: '+911234567890', password: 'pass', role: 'admin' }), res);
      expect(res.status).toHaveBeenCalledWith(403);
      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.success).toBe(false);
    });

    it('returns 409 when email is already registered', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'existing' } as any);
      const res = mockRes();
      await register(mockReq({ name: 'B', email: 'taken@b.com', mobile: '+911234567890', password: 'pass', role: 'consumer' }), res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('creates user and returns 201 with tokens on success', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 'new-id', name: 'Alice', email: 'alice@test.com', role: 'consumer',
      } as any);
      vi.mocked(prisma.refreshToken.create).mockResolvedValueOnce({} as any);

      const res = mockRes();
      await register(
        mockReq({ name: 'Alice', email: 'alice@test.com', mobile: '+911234567890', password: 'pass123', role: 'consumer' }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBe('access-token-mock');
      expect(body.data.refreshToken).toBe('refresh-token-mock');
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('returns 400 when email or password is missing', async () => {
      const res = mockRes();
      await login(mockReq({ email: 'x@y.com' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 for unknown email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      const res = mockRes();
      await login(mockReq({ email: 'ghost@test.com', password: 'wrong' }), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 for deactivated account', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ is_active: false } as any);
      const res = mockRes();
      await login(mockReq({ email: 'inactive@test.com', password: 'pass' }), res);
      expect(res.status).toHaveBeenCalledWith(403);
      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.message).toMatch(/deactivated/i);
    });

    it('returns 401 for wrong password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: '1', is_active: true, password_hash: '$hash$' } as any);
      vi.mocked(comparePassword).mockResolvedValueOnce(false);
      const res = mockRes();
      await login(mockReq({ email: 'user@test.com', password: 'wrong' }), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 200 with tokens on valid credentials', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'uid', name: 'Bob', email: 'bob@test.com', role: 'consumer', is_active: true, password_hash: '$hash$',
      } as any);
      vi.mocked(comparePassword).mockResolvedValueOnce(true);
      vi.mocked(prisma.refreshToken.create).mockResolvedValueOnce({} as any);

      const res = mockRes();
      await login(mockReq({ email: 'bob@test.com', password: 'correct' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeTruthy();
    });
  });

  // ── refresh ───────────────────────────────────────────────────────────────
  describe('refresh', () => {
    it('returns 400 when refreshToken is missing', async () => {
      const res = mockRes();
      await refresh(mockReq({}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 when token is invalid', async () => {
      vi.mocked(verifyRefreshToken).mockImplementationOnce(() => { throw new Error('bad'); });
      const res = mockRes();
      await refresh(mockReq({ refreshToken: 'bad-token' }), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when stored token is revoked', async () => {
      vi.mocked(verifyRefreshToken).mockReturnValueOnce({ userId: 'uid' });
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValueOnce({
        id: 'tok', revoked_at: new Date(), expires_at: new Date(Date.now() + 1000),
      } as any);
      const res = mockRes();
      await refresh(mockReq({ refreshToken: 'old-token' }), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rotates token and returns new pair on success', async () => {
      vi.mocked(verifyRefreshToken).mockReturnValueOnce({ userId: 'uid' });
      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValueOnce({
        id: 'tok', revoked_at: null, expires_at: new Date(Date.now() + 100_000),
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'uid', role: 'consumer', is_active: true,
      } as any);
      vi.mocked(prisma.refreshToken.update).mockResolvedValueOnce({} as any);
      vi.mocked(prisma.refreshToken.create).mockResolvedValueOnce({} as any);

      const res = mockRes();
      await refresh(mockReq({ refreshToken: 'valid-old-token' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.data.accessToken).toBe('access-token-mock');
      expect(body.data.refreshToken).toBe('refresh-token-mock');
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('returns 400 when refreshToken is missing', async () => {
      const res = mockRes();
      await logout(mockReq({}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('revokes token and returns 200', async () => {
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValueOnce({ count: 1 } as any);
      const res = mockRes();
      await logout(mockReq({ refreshToken: 'some-token' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    });
  });
});
