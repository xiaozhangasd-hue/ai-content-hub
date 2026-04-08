import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 获取学生列表
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

    const students = await prisma.student.findMany({
      where: {
        merchantId,
        OR: search
          ? [
              { name: { contains: search } },
              { parentPhone: { contains: search } },
            ]
          : undefined,
      },
      include: {
        enrollments: {
          include: {
            class: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 确保返回完整的 enrollments 数据（包含 remainingHours 和 totalHours）
    const studentsWithHours = students.map((student) => ({
      ...student,
      enrollments: student.enrollments.map((enrollment) => ({
        id: enrollment.id,
        classId: enrollment.classId,
        remainingHours: enrollment.remainingHours,
        totalHours: enrollment.totalHours,
        class: enrollment.class,
      })),
    }));

    return NextResponse.json({ success: true, students: studentsWithHours });
  } catch (error) {
    console.error("获取学生列表错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建学生
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
    const { name, gender, birthDate, phone, parentName, parentPhone, note } = data;

    if (!name) {
      return NextResponse.json({ error: "学生姓名不能为空" }, { status: 400 });
    }

    const student = await prisma.student.create({
      data: {
        merchantId,
        name,
        gender: gender || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone: phone || null,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        note: note || null,
      },
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error("创建学生错误:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
