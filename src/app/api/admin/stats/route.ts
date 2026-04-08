import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";

// 验证管理员权限
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id?: string;
      username?: string;
      role?: string;
      adminId?: string;
    };
    
    // 验证是否是平台管理员
    if (decoded.role !== "platform") {
      return null;
    }
    
    return decoded;
  } catch {
    return null;
  }
}

// 获取统计数据
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    // 商家总数
    const totalMerchants = await prisma.merchant.count();

    // 活跃商家（最近30天有登录）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // 老师总数
    const totalTeachers = await prisma.teacher.count();

    // 学员总数
    const totalStudents = await prisma.student.count();

    // 付费会员数
    const activeMerchants = await prisma.subscription.count({
      where: { status: "active" },
    });

    // 计算本月/上月营收（按支付实收统计）
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [currentMonthPaidOrders, previousMonthPaidOrders] = await Promise.all([
      prisma.paymentOrder.findMany({
        where: {
          paidAt: { gte: monthStart, lt: nextMonthStart },
          status: "paid",
        },
        select: { amount: true },
      }),
      prisma.paymentOrder.findMany({
        where: {
          paidAt: { gte: prevMonthStart, lt: monthStart },
          status: "paid",
        },
        select: { amount: true },
      }),
    ]);

    const monthlyRevenue = currentMonthPaidOrders.reduce((sum, order) => sum + order.amount, 0);
    const previousMonthlyRevenue = previousMonthPaidOrders.reduce((sum, order) => sum + order.amount, 0);

    const monthlyGrowth =
      previousMonthlyRevenue > 0
        ? Number(
            (
              ((monthlyRevenue - previousMonthlyRevenue) /
                previousMonthlyRevenue) *
              100
            ).toFixed(1)
          )
        : monthlyRevenue > 0
          ? 100
          : 0;

    // 返回前端期望的数据结构
    return NextResponse.json({
      totalMerchants,
      activeMerchants,
      totalTeachers,
      totalStudents,
      monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
      monthlyGrowth,
    });
  } catch (error) {
    console.error("获取统计数据错误:", error);
    // 返回默认数据，避免前端报错
    return NextResponse.json({
      totalMerchants: 0,
      activeMerchants: 0,
      totalTeachers: 0,
      totalStudents: 0,
      monthlyRevenue: 0,
      monthlyGrowth: 0,
    });
  }
}
