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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const paidWhere =
      status === "all"
        ? { status: { in: ["pending", "paid", "failed", "cancelled", "refunded", "closed"] as const } }
        : { status: status as "pending" | "paid" | "failed" | "cancelled" | "refunded" | "closed" };

    const [allOrders, monthOrders] = await Promise.all([
      prisma.paymentOrder.findMany({
        where: paidWhere,
        include: {
          merchant: { select: { phone: true, name: true, institution: true } },
          plan: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.paymentOrder.findMany({
        where: {
          ...paidWhere,
          createdAt: { gte: monthStart, lt: nextMonthStart },
        },
        select: { amount: true },
      }),
    ]);

    const totalRevenue = allOrders.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.amount, 0);
    const monthlyRevenue = monthOrders.reduce((sum, o) => sum + o.amount, 0);
    const successCount = allOrders.filter((o) => o.status === "paid").length;
    const successRate = allOrders.length > 0 ? Number(((successCount / allOrders.length) * 100).toFixed(1)) : 0;
    const avgOrderValue = successCount > 0 ? Number((totalRevenue / successCount).toFixed(2)) : 0;

    const orders = allOrders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      merchantName: o.merchant.institution || o.merchant.name || o.merchant.phone,
      merchantPhone: o.merchant.phone,
      planName: o.plan?.name || o.subject,
      amount: o.amount,
      status: o.status,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      channel: o.provider,
    }));

    return NextResponse.json({
      success: true,
      overview: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
        successRate,
        avgOrderValue,
        orderCount: allOrders.length,
      },
      orders,
    });
  } catch (error) {
    console.error("获取财务数据失败:", error);
    return NextResponse.json({ error: "获取财务数据失败" }, { status: 500 });
  }
}

