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

// 获取话术模板
export async function GET(request: NextRequest) {
  const merchantId = await verifyMerchant(request);
  if (!merchantId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = { OR: [{ merchantId }, { isPublic: true }] };
    if (category) where.category = category;
    if (search) {
      where.title = { contains: search };
    }

    const templates = await prisma.scriptTemplate.findMany({
      where,
      orderBy: [
        { usageCount: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error("获取话术模板错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建话术模板
export async function POST(request: NextRequest) {
  const merchantId = await verifyMerchant(request);
  if (!merchantId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const data = await request.json();

    const template = await prisma.scriptTemplate.create({
      data: {
        merchantId,
        category: data.category,
        title: data.title,
        question: data.question,
        answer: data.answer,
        tags: data.tags,
        isPublic: false,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("创建话术模板错误:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

// 更新使用次数
export async function PUT(request: NextRequest) {
  const merchantId = await verifyMerchant(request);
  if (!merchantId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    await prisma.scriptTemplate.update({
      where: { id: data.id },
      data: {
        usageCount: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("更新话术模板错误:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// 删除话术模板
export async function DELETE(request: NextRequest) {
  const merchantId = await verifyMerchant(request);
  if (!merchantId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少话术ID" }, { status: 400 });
    }

    await prisma.scriptTemplate.delete({
      where: { id, merchantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除话术模板错误:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
