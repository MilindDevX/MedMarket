import type { Response, Request } from "express";
import { createHash } from "crypto";
import prisma from "../config/prisma.ts";
import { hashPassword, comparePassword } from "../utils/hash.ts";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.ts";
import { successResponse, errorResponse } from "../utils/response.ts";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
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
