import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 获取班级列表
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
    const status = searchParams.get("status") || "";

    const classes = await prisma.class.findMany({
      where: {
        merchantId: decoded.merchantId,
        AND: [
          search ? { name: { contains: search } } : {},
          status ? { status } : {},
        ],
      },
      include: {
        courseTemplate: {
          select: { id: true, name: true, category: true },
        },
        teacher: {
          select: { id: true, name: true },
        },
        schedules: true,
        _count: {
          select: { enrollments: true, lessons: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, classes });
  } catch (error) {
    console.error("获取班级列表错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建班级
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
    const { name, courseTemplateId, teacherId, capacity, startDate, endDate, note, schedules } = data;

    if (!name) {
      return NextResponse.json({ error: "班级名称不能为空" }, { status: 400 });
    }

    if (!decoded.merchantId) {
      return NextResponse.json({ error: "缺少商户信息" }, { status: 400 });
    }

    // 创建班级和排课时间表
    const classItem = await prisma.class.create({
      data: {
        merchantId: decoded.merchantId,
        name,
        courseTemplateId: courseTemplateId || null,
        teacherId: teacherId || null,
        capacity: capacity || 10,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        note: note || null,
        schedules: schedules
          ? {
              create: schedules.map((s: { weekday: number; startTime: string; endTime: string; classroom?: string }) => ({
                weekday: s.weekday,
                startTime: s.startTime,
                endTime: s.endTime,
                classroom: s.classroom || null,
              })),
            }
          : undefined,
      },
      include: {
        schedules: true,
      },
    });

    return NextResponse.json({ success: true, class: classItem });
  } catch (error) {
    console.error("创建班级错误:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
