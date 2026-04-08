import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 获取课时预警列表
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
    const threshold = parseFloat(searchParams.get("threshold") || "5");

    // 查找课时不足的学员
    const lowHoursEnrollments = await prisma.enrollment.findMany({
      where: {
        remainingHours: { lte: threshold },
        class: { merchantId: decoded.merchantId },
        status: "active",
      },
      include: {
        student: {
          select: { id: true, name: true, phone: true, parentName: true, parentPhone: true },
        },
        class: {
          select: { id: true, name: true, teacher: { select: { id: true, name: true } } },
        },
      },
      orderBy: { remainingHours: "asc" },
    });

    // 按学员分组
    const studentMap = new Map<string, {
      student: { id: string; name: string; phone: string | null; parentName: string | null; parentPhone: string | null };
      enrollments: Array<{
        id: string;
        classId: string;
        className: string;
        teacherName: string | null;
        remainingHours: number;
        totalHours: number;
      }>;
      totalRemaining: number;
      reminded: boolean;
      remindedAt: Date | null;
    }>();

    for (const enrollment of lowHoursEnrollments) {
      const studentId = enrollment.studentId;
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student: {
            id: enrollment.student.id,
            name: enrollment.student.name,
            phone: enrollment.student.phone,
            parentName: enrollment.student.parentName,
            parentPhone: enrollment.student.parentPhone,
          },
          enrollments: [],
          totalRemaining: 0,
          reminded: false,
          remindedAt: null,
        });
      }
      
      const data = studentMap.get(studentId)!;
      data.enrollments.push({
        id: enrollment.id,
        classId: enrollment.classId,
        className: enrollment.class.name,
        teacherName: enrollment.class.teacher?.name || null,
        remainingHours: enrollment.remainingHours,
        totalHours: enrollment.totalHours,
      });
      data.totalRemaining += enrollment.remainingHours;
    }

    const alerts = Array.from(studentMap.values()).sort((a, b) => a.totalRemaining - b.totalRemaining);

    // 统计
    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.totalRemaining <= 2).length,
      warning: alerts.filter(a => a.totalRemaining > 2 && a.totalRemaining <= 5).length,
    };

    return NextResponse.json({ 
      success: true, 
      alerts,
      summary,
      threshold,
    });
  } catch (error) {
    console.error("获取课时预警错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
