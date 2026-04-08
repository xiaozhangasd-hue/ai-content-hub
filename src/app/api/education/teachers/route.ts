import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 获取教师列表
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const teachers = await prisma.teacher.findMany({
      where: {
        merchantId: decoded.merchantId,
        OR: search
          ? [
              { name: { contains: search } },
              { phone: { contains: search } },
            ]
          : undefined,
      },
      include: {
        _count: {
          select: { classes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, teachers });
  } catch (error) {
    console.error("获取教师列表错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建教师
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const data = await request.json();
    const { name, phone, subjects, note } = data;

    if (!name) {
      return NextResponse.json({ error: "教师姓名不能为空" }, { status: 400 });
    }

    if (!decoded.merchantId) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const teacher = await prisma.teacher.create({
      data: {
        merchantId: decoded.merchantId,
        name,
        phone: phone || null,
        subjects: subjects || null,
        note: note || null,
      },
    });

    return NextResponse.json({ success: true, teacher });
  } catch (error) {
    console.error("创建教师错误:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
