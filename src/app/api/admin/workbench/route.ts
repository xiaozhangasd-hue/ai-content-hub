import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

function verifyAdmin(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "admin-secret") as { role?: string };
    if (!decoded.role || (decoded.role !== "platform" && decoded.role !== "super_admin")) return null;
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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [pendingOrders, expiringSubs, todayMerchants, todayPaidOrders, recentMerchants] = await Promise.all([
      prisma.paymentOrder.count({ where: { status: "pending" } }),
      prisma.subscription.count({
        where: {
          status: "active",
          endDate: { gte: now, lte: sevenDaysLater },
        },
      }),
      prisma.merchant.count({
        where: { createdAt: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.paymentOrder.findMany({
        where: { status: "paid", paidAt: { gte: todayStart, lt: todayEnd } },
        select: { amount: true },
      }),
      prisma.merchant.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          institution: true,
          category: true,
          createdAt: true,
          subscriptions: {
            where: { status: "active" },
            select: { id: true },
            take: 1,
          },
        },
      }),
    ]);

    const todayRevenue = todayPaidOrders.reduce((sum, o) => sum + o.amount, 0);

    return NextResponse.json({
      success: true,
      todo: {
        pendingOrders,
        expiringSubs,
      },
      today: {
        newMerchants: todayMerchants,
        revenue: Number(todayRevenue.toFixed(2)),
      },
      recentMerchants: recentMerchants.map((m) => ({
        id: m.id,
        name: m.institution || m.name || "未命名机构",
        category: m.category || "未分类",
        createdAt: m.createdAt,
        status: m.subscriptions.length > 0 ? "已开通" : "待开通",
      })),
    });
  } catch (error) {
    console.error("获取运营工作台数据失败:", error);
    return NextResponse.json({ error: "获取运营工作台数据失败" }, { status: 500 });
  }
}

