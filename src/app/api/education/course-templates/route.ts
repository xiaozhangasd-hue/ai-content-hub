import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 获取课程模板列表
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.merchantId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const merchantId = decoded.merchantId;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const courses = await prisma.courseTemplate.findMany({
      where: {
        merchantId,
        status: "active",
        AND: [
          search ? { name: { contains: search } } : {},
          category ? { category } : {},
        ],
      },
      include: {
        _count: {
          select: { classes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, courses });
  } catch (error) {
    console.error("获取课程模板失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建课程模板
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.merchantId) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const merchantId = decoded.merchantId;

    const data = await request.json();
    const { name, category, totalHours, duration, price, description } = data;

    if (!name) {
      return NextResponse.json({ error: "课程名称不能为空" }, { status: 400 });
    }

    const course = await prisma.courseTemplate.create({
      data: {
        merchantId,
        name,
        category: category || null,
        totalHours: totalHours || 10,
        duration: duration || 45,
        price: price || 0,
        description: description || null,
        status: "active",
      },
    });

    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error("创建课程模板失败:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
