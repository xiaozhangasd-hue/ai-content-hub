import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

function verifyAdmin(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "admin-secret") as {
      role?: string;
    };
    if (!decoded.role || (decoded.role !== "platform" && decoded.role !== "super_admin")) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });

  try {
    const now = new Date();
    const start30 = new Date(now);
    start30.setDate(now.getDate() - 29);

    const [merchantTotal, memberTotal, activeSubs, merchants30, subs30] = await Promise.all([
      prisma.merchant.count(),
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.merchant.findMany({
        where: { createdAt: { gte: start30 } },
        select: { createdAt: true },
      }),
      prisma.subscription.findMany({
        where: { createdAt: { gte: start30 } },
        select: { createdAt: true },
      }),
    ]);

    const byDay = new Map<string, { date: string; merchants: number; members: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, { date: key, merchants: 0, members: 0 });
    }

    merchants30.forEach((m) => {
      const key = new Date(m.createdAt).toISOString().slice(0, 10);
      const slot = byDay.get(key);
      if (slot) slot.merchants += 1;
    });
    subs30.forEach((s) => {
      const key = new Date(s.createdAt).toISOString().slice(0, 10);
      const slot = byDay.get(key);
      if (slot) slot.members += 1;
    });

    const trend = Array.from(byDay.values());

    const funnel = {
      merchantsRegistered: merchantTotal,
      membersOpened: memberTotal,
      membersActive: activeSubs,
      conversionRate: merchantTotal > 0 ? Number(((memberTotal / merchantTotal) * 100).toFixed(1)) : 0,
      activeRate: memberTotal > 0 ? Number(((activeSubs / memberTotal) * 100).toFixed(1)) : 0,
    };

    return NextResponse.json({
      success: true,
      trend,
      funnel,
    });
  } catch (error) {
    console.error("获取数据报表失败:", error);
    return NextResponse.json({ error: "获取数据报表失败" }, { status: 500 });
  }
}

