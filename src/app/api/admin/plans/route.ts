import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

function safeParseJSON<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// 验证管理员权限
async function verifyAdmin(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "admin-secret") as {
      adminId: string;
      role: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

// 获取会员套餐列表
export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    const result = plans.map((p) => ({
      ...p,
      features: safeParseJSON<string[]>(p.features, []),
      limits: safeParseJSON<Record<string, unknown>>(p.limits, {}),
      subscriberCount: p._count.subscriptions,
    }));

    return NextResponse.json({ success: true, plans: result });
  } catch (error) {
    console.error("获取套餐列表错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建或更新套餐
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { id, name, price, yearlyPrice, features, limits, sortOrder } = data;

    const planData = {
      name,
      price: parseFloat(price) || 0,
      yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : null,
      features: JSON.stringify(features || []),
      limits: JSON.stringify(limits || {}),
      sortOrder: parseInt(sortOrder) || 0,
    };

    let plan;
    if (id) {
      plan = await prisma.membershipPlan.update({
        where: { id },
        data: planData,
      });
    } else {
      plan = await prisma.membershipPlan.create({
        data: planData,
      });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("保存套餐错误:", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

// 删除套餐
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    await prisma.membershipPlan.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除套餐错误:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
