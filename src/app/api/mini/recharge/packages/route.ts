import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取可充值课时包
 * GET /api/mini/recharge/packages?classId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 Token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== "parent") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    // 获取班级所属机构
    let merchantId: string | undefined;
    if (classId) {
      const classInfo = await prisma.class.findUnique({
        where: { id: classId },
        select: { merchantId: true },
      });
      merchantId = classInfo?.merchantId;
    }

    // 获取充值套餐
    const packages = await prisma.rechargePackage.findMany({
      where: {
        merchantId: merchantId || undefined,
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    const packageList = packages.map((p) => ({
      id: p.id,
      name: p.name,
      hours: p.hours,
      price: p.price,
      originalPrice: p.originalPrice,
      gift: p.gift,
      description: p.description,
      validityDays: p.validityDays,
    }));

    return NextResponse.json({ packages: packageList });
  } catch (error) {
    console.error("获取充值套餐错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
