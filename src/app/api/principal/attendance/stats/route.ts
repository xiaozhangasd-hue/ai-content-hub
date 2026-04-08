import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 考勤统计
 * GET /api/principal/attendance/stats
 */
export async function GET(request: NextRequest) {
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

    const merchantId = payload.merchantId;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const campusId = searchParams.get("campusId");

    // 构建日期范围
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const queryStartDate = startDate ? new Date(startDate) : firstDayOfMonth;
    const queryEndDate = endDate ? new Date(endDate) : lastDayOfMonth;

    // 查询考勤记录
    const whereClause: Record<string, unknown> = {
      student: {
        merchantId,
        ...(campusId && campusId !== "all" ? { campusId } : {}),
      },
      createdAt: {
        gte: queryStartDate,
        lte: queryEndDate,
      },
    };

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: true,
        enrollment: {
          include: {
            class: true,
          },
        },
        lesson: true,
      },
    });

    // 统计各状态数量
    const stats = {
      total: attendances.length,
      present: attendances.filter(a => a.status === "present").length,
      absent: attendances.filter(a => a.status === "absent").length,
      leave: attendances.filter(a => a.status === "leave").length,
      late: attendances.filter(a => a.status === "late").length,
      earlyLeave: attendances.filter(a => a.status === "early_leave").length,
    };

    // 计算出勤率
    const attendanceRate = stats.total > 0 
      ? Math.round((stats.present / stats.total) * 100) 
      : 0;

    // 按班级统计
    const byClass: Record<string, { 
      classId: string; 
      className: string; 
      total: number; 
      present: number; 
      rate: number;
    }> = {};

    attendances.forEach(a => {
      const classId = a.enrollment?.classId || "unknown";
      const className = a.enrollment?.class?.name || "未分配";
      
      if (!byClass[classId]) {
        byClass[classId] = { classId, className, total: 0, present: 0, rate: 0 };
      }
      
      byClass[classId].total += 1;
      if (a.status === "present") {
        byClass[classId].present += 1;
      }
    });

    // 计算每个班级的出勤率
    Object.values(byClass).forEach(c => {
      c.rate = c.total > 0 ? Math.round((c.present / c.total) * 100) : 0;
    });

    // 按日期统计（最近30天）
    const dailyStats: Record<string, { date: string; total: number; present: number; rate: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyStats[dateStr] = { date: dateStr, total: 0, present: 0, rate: 0 };
    }

    attendances.forEach(a => {
      const dateStr = a.createdAt.toISOString().split("T")[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].total += 1;
        if (a.status === "present") {
          dailyStats[dateStr].present += 1;
        }
      }
    });

    // 计算每日出勤率
    Object.values(dailyStats).forEach(d => {
      d.rate = d.total > 0 ? Math.round((d.present / d.total) * 100) : 0;
    });

    // 异常考勤（缺勤超过3次的学生）
    const studentAbsentCount: Record<string, { studentId: string; studentName: string; absentCount: number }> = {};
    attendances.filter(a => a.status === "absent").forEach(a => {
      const studentId = a.studentId;
      const studentName = a.student?.name || "未知";
      
      if (!studentAbsentCount[studentId]) {
        studentAbsentCount[studentId] = { studentId, studentName, absentCount: 0 };
      }
      studentAbsentCount[studentId].absentCount += 1;
    });

    const abnormalAttendances = Object.values(studentAbsentCount)
      .filter(s => s.absentCount >= 3)
      .sort((a, b) => b.absentCount - a.absentCount);

    // 待处理的请假申请
    const pendingLeaveRequests = await prisma.leaveRequest.count({
      where: {
        student: { merchantId },
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          ...stats,
          attendanceRate,
          pendingLeaveRequests,
        },
        byClass: Object.values(byClass).sort((a, b) => b.rate - a.rate),
        daily: Object.values(dailyStats),
        abnormalAttendances: abnormalAttendances.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("获取考勤统计错误:", error);
    return NextResponse.json({ error: "获取考勤统计失败" }, { status: 500 });
  }
}
