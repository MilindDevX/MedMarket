import type { Response, Request } from 'express';
import { createHash } from 'crypto';
import prisma from '../config/prisma.ts';
import { hashPassword, comparePassword } from '../utils/hash.ts';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.ts';
import { successResponse, errorResponse } from '../utils/response.ts';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function issueTokenPair(userId: string, role: string) {
  const accessToken  = signAccessToken({ userId, role });
  const refreshToken = signRefreshToken({ userId });
  await prisma.refreshToken.create({
    data: {
      user_id:    userId,
      token_hash: hashToken(refreshToken),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return { accessToken, refreshToken };
}

export async function googleAuth(req: Request, res: Response) {
  try {
    const { idToken, role } = req.body;

    if (!idToken) return errorResponse(res, 'Google token is required', 400);

    const allowedRoles = ['consumer', 'pharmacy_owner'];
    if (role && !allowedRoles.includes(role)) {
      return errorResponse(res, 'Google sign-in is only available for consumer and pharmacy accounts', 400);
    }

    // Verify the token — works for both access tokens (via userinfo) and id tokens (via tokeninfo)
    let google_id: string, email: string, name: string;

    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (userinfoRes.ok) {
      const info = await userinfoRes.json() as { sub: string; email: string; name: string; email_verified: boolean };
      if (!info.email_verified) return errorResponse(res, 'Google account email is not verified', 401);
      google_id = info.sub;
      email     = info.email;
      name      = info.name;
    } else {
      // Fallback: treat as id_token and verify via tokeninfo
      const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!tokenRes.ok) return errorResponse(res, 'Invalid Google token', 401);
      const payload = await tokenRes.json() as { sub: string; email: string; name: string; email_verified: string; error_description?: string };
      if (payload.error_description) return errorResponse(res, 'Google token verification failed', 401);
      if (payload.email_verified !== 'true') return errorResponse(res, 'Google account email is not verified', 401);
      google_id = payload.sub;
      email     = payload.email;
      name      = payload.name;
    }

    let user = await prisma.user.findFirst({
      where: { OR: [{ google_id }, { email }] },
    });

    if (user) {
      if (!user.is_active) {
        return errorResponse(res, 'Your account has been deactivated. Please contact support.', 403);
      }
      if (!user.google_id) {
        user = await prisma.user.update({ where: { id: user.id }, data: { google_id } });
      }
    } else {
      const assignedRole = (role as 'consumer' | 'pharmacy_owner') || 'consumer';
      user = await prisma.user.create({
        data: { name, email, google_id, role: assignedRole, is_active: true },
      });
    }

    const { accessToken, refreshToken } = await issueTokenPair(user.id, user.role);

    return successResponse(res, {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, 'Authenticated with Google');
  } catch (err) {
    console.error('googleAuth error:', err);
    return errorResponse(res, 'Something went wrong', 500);
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, mobile, password, role } = req.body;

    if (!name || !email || !mobile || !password || !role) {
      return errorResponse(res, "All fields are required", 400);
    }

    if (role === "admin") {
      return errorResponse(res, "Admin accounts cannot be created through public registration.", 403);
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return errorResponse(res, "Email already registered", 409);
    }

    const password_hash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, mobile, password_hash, role },
    });

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: hashToken(refreshToken),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return successResponse(
      res,
      {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      "Account created successfully",
      201,
    );
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, "Email and password are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return errorResponse(res, "Invalid credentials", 401);
    }
    if (!user.is_active) {
      return errorResponse(res, "Your account has been deactivated. Please contact support.", 403);
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return errorResponse(res, "Invalid credentials", 401);
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: hashToken(refreshToken),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return successResponse(
      res,
      {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      "Login successful",
    );
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, "Refresh token required", 400);
    }

    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return errorResponse(res, "Invalid or expired refresh token", 401);
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token_hash: hashToken(refreshToken) },
    });

    if (!stored || stored.revoked_at || stored.expires_at < new Date()) {
      return errorResponse(res, "Invalid or expired refresh token", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || !user.is_active) {
      return errorResponse(res, "User not found or deactivated", 401);
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked_at: new Date() },
    });

    const newAccessToken = signAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: hashToken(newRefreshToken),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return successResponse(
      res,
      { accessToken: newAccessToken, refreshToken: newRefreshToken },
      "Token refreshed",
    );
  } catch (error) {
    console.error("Refresh error:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, "Refresh token required", 400);
    }

    await prisma.refreshToken.updateMany({
      where: { token_hash: hashToken(refreshToken), revoked_at: null },
      data: { revoked_at: new Date() },
    });

    return successResponse(res, null, "Logged out successfully");
  } catch (error) {
    return errorResponse(res, "Something went wrong", 500);
  }
}
