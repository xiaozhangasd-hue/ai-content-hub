import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 获取学员报名记录
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
    const classId = searchParams.get("classId") || "";
    const studentId = searchParams.get("studentId") || "";

    const enrollments = await prisma.enrollment.findMany({
      where: {
        student: { merchantId: decoded.merchantId },
        AND: [
          classId ? { classId } : {},
          studentId ? { studentId } : {},
        ],
      },
      include: {
        student: {
          select: { id: true, name: true, phone: true, parentPhone: true },
        },
        class: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, enrollments });
  } catch (error) {
    console.error("获取报名记录错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 学员报名班级
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
    const { studentId, classId, totalHours, note } = data;

    if (!studentId || !classId) {
      return NextResponse.json({ error: "学生和班级不能为空" }, { status: 400 });
    }

    // 检查是否已报名
    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_classId: { studentId, classId },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "该学生已在此班级" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        classId,
        totalHours: totalHours || 0,
        remainingHours: totalHours || 0,
        note: note || null,
      },
      include: {
        student: true,
        class: true,
      },
    });

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error("报名错误:", error);
    return NextResponse.json({ error: "报名失败" }, { status: 500 });
  }
}

// 更新课时
export async function PUT(request: NextRequest) {
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
    const { id, remainingHours, totalHours, status, note } = data;

    const enrollment = await prisma.enrollment.update({
      where: { id },
      data: {
        remainingHours: remainingHours !== undefined ? remainingHours : undefined,
        totalHours: totalHours !== undefined ? totalHours : undefined,
        status: status || undefined,
        note: note !== undefined ? note : undefined,
      },
    });

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error("更新报名记录错误:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
