import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";

export interface JWTPayload {
  merchantId?: string;
  phone?: string;
  id?: string;
  username?: string;
  role?: string;
  teacherId?: string;
  parentId?: string;
  campusId?: string;
  adminId?: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Error("未授权访问");
  }
  return user;
}
