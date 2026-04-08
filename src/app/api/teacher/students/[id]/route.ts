import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取学员详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || !payload.merchantId) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id: studentId } = await params;

    // 获取学员基本信息
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: "active" },
          include: {
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "学员不存在" }, { status: 404 });
    }

    // 获取考勤记录
    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        lesson: {
          include: {
            class: { select: { name: true } },
          },
        },
      },
    });

    // 计算考勤统计
    const allAttendances = await prisma.attendance.findMany({
      where: { studentId },
    });

    const totalAttendance = allAttendances.length;
    const presentCount = allAttendances.filter((a) => a.status === "present").length;
    const absentCount = allAttendances.filter((a) => a.status === "absent").length;
    const leaveCount = allAttendances.filter((a) => a.status === "leave").length;

    // 构建学员画像
    const profile = {
      basic: {
        id: student.id,
        name: student.name,
        avatar: student.avatar,
        gender: student.gender,
        birthDate: student.birthDate,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        note: student.note,
        createdAt: student.createdAt,
      },
      classes: student.enrollments.map((e) => ({
        id: e.class.id,
        name: e.class.name,
        remainingHours: e.remainingHours,
        totalHours: e.totalHours,
      })),
      hours: {
        total: student.enrollments.reduce((sum, e) => sum + e.totalHours, 0),
        remaining: student.enrollments.reduce((sum, e) => sum + e.remainingHours, 0),
        used: student.enrollments.reduce(
          (sum, e) => sum + (e.totalHours - e.remainingHours),
          0
        ),
      },
      attendance: {
        total: totalAttendance,
        present: presentCount,
        absent: absentCount,
        leave: leaveCount,
        rate: totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0,
        recent: attendances.slice(0, 10).map((a) => ({
          id: a.id,
          date: a.createdAt,
          className: a.lesson?.class?.name || "未知班级",
          status: a.status,
          notes: a.remark,
        })),
      },
      performance: {
        averageRating: 4,
        trend: [],
      },
      works: [],
    };

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("获取学员详情错误:", error);
    return NextResponse.json({ error: "获取学员详情失败" }, { status: 500 });
  }
}
