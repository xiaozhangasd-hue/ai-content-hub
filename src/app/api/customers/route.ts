import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// 验证商家权限
async function verifyMerchant(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "ai-content-hub-jwt-secret-20240321-secure-key") as {
      merchantId: string;
    };
    return decoded.merchantId;
  } catch {
    return null;
  }
}

// 获取客户列表
export async function GET(request: NextRequest) {
  const merchantId = await verifyMerchant(request);
  if (!merchantId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const level = searchParams.get("level");
    const search = searchParams.get("search");
    const campusId = searchParams.get("campusId");

    const where: any = { merchantId };
    if (status) where.status = status;
    if (level) where.level = level;
    if (campusId && campusId !== "all") where.campusId = campusId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { childName: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        campus: {
          select: { id: true, name: true }
        },
        followUps: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { followUps: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, customers });
  } catch (error) {
    console.error("获取客户列表错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建客户
export async function POST(request: NextRequest) {
  const merchantId = await verifyMerchant(request);
  if (!merchantId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    // 检查手机号是否已存在
    const existing = await prisma.customer.findFirst({
      where: { merchantId, phone: data.phone },
    });
    
    if (existing) {
      return NextResponse.json({ error: "该手机号已存在" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        merchantId,
        campusId: data.campusId || null,
        name: data.name,
        phone: data.phone,
        childName: data.childName,
        childAge: data.childAge ? parseInt(data.childAge) : null,
        intentCourse: data.intentCourse,
        source: data.source,
        status: data.status || "new",
        level: data.level || "warm",
        tags: data.tags,
        note: data.note,
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("创建客户错误:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

// 更新客户
export async function PUT(request: NextRequest) {
  const merchantId = await verifyMerchant(request);
  if (!merchantId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    const customer = await prisma.customer.update({
      where: { id, merchantId },
      data: {
        ...updateData,
        childAge: updateData.childAge ? parseInt(updateData.childAge) : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("更新客户错误:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// 删除客户
export async function DELETE(request: NextRequest) {
  const merchantId = await verifyMerchant(request);
  if (!merchantId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少客户ID" }, { status: 400 });
    }

    await prisma.customer.delete({
      where: { id, merchantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除客户错误:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
