import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "./db";

export type AppRole = "USER" | "ADMIN";

export type JwtUser = {
  userId: string;
  role: AppRole;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

export function signJwt(user: JwtUser) {
  return jwt.sign(user, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyJwt(token: string): JwtUser {
  return jwt.verify(token, getJwtSecret()) as JwtUser;
}

export async function hashPassword(value: string) {
  return bcrypt.hash(value, 12);
}

export async function comparePassword(
  value: string,
  hash: string,
) {
  return bcrypt.compare(value, hash);
}

function extractToken(req: any): string | null {
  // 1. Authorization header
  const authorization =
    req?.headers?.authorization ??
    req?.headers?.Authorization;

  if (
    typeof authorization === "string" &&
    authorization.startsWith("Bearer ")
  ) {
    const token = authorization
      .slice("Bearer ".length)
      .trim();

    if (token) {
      return token;
    }
  }

  // 2. Cookie
  const cookieHeader =
    req?.headers?.cookie ??
    req?.headers?.Cookie ??
    "";

  if (typeof cookieHeader === "string") {
    const match = cookieHeader.match(
      /(?:^|;\s*)token=([^;]+)/,
    );

    if (match?.[1]) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }

  return null;
}

export async function getAuthUserFromRequest(req: any) {
  const token = extractToken(req);

  if (!token) {
    return null;
  }

  try {
    const payload = verifyJwt(token);

    if (!payload?.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Auth token verification failed:", error);
    return null;
  }
}

export async function requireAuth(req: any) {
  const user = await getAuthUserFromRequest(req);

  if (!user) {
    const error = new Error("Unauthorized") as Error & {
      statusCode?: number;
    };

    error.statusCode = 401;

    throw error;
  }

  return user;
}

export async function requireAdmin(req: any) {
  const user = await requireAuth(req);

  if (user.role !== "ADMIN") {
    const error = new Error("Forbidden") as Error & {
      statusCode?: number;
    };

    error.statusCode = 403;

    throw error;
  }

  return user;
}