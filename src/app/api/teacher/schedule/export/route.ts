import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 导出课表
 * GET /api/teacher/schedule/export
 * 
 * 查询参数：
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - format: 导出格式（excel/ical）
 */
export async function GET(request: NextRequest) {
  try {
    // 验证身份
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
    const teacherId = payload.teacherId;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "excel";

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "请选择日期范围" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // 获取课程数据
    const lessons = await prisma.lesson.findMany({
      where: {
        class: { merchantId, teacherId },
        date: { gte: start, lte: end },
      },
      include: {
        class: {
          select: {
            name: true,
            teacher: { select: { name: true } },
            campus: { select: { name: true } },
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    if (format === "ical") {
      // 生成 iCal 格式
      const icalContent = generateICal(lessons);
      return new NextResponse(icalContent, {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="schedule.ics"`,
        },
      });
    } else {
      // 生成 CSV 格式（Excel 兼容）
      const csvContent = generateCSV(lessons);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="schedule.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("导出课表错误:", error);
    return NextResponse.json(
      { error: "导出失败" },
      { status: 500 }
    );
  }
}

function generateCSV(lessons: any[]): string {
  const headers = ["日期", "开始时间", "结束时间", "班级名称", "授课老师", "教室", "课程主题", "状态"];
  const rows = lessons.map((lesson) => [
    lesson.date.toISOString().split("T")[0],
    lesson.startTime,
    lesson.endTime,
    lesson.class.name,
    lesson.class.teacher?.name || "",
    lesson.classroom || "",
    lesson.topic || "",
    getStatusText(lesson.status),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

function generateICal(lessons: any[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const events = lessons.map((lesson) => {
    const dateStr = lesson.date.toISOString().split("T")[0].replace(/-/g, "");
    const startTime = lesson.startTime.replace(/:/g, "");
    const endTime = lesson.endTime.replace(/:/g, "");

    return [
      "BEGIN:VEVENT",
      `DTSTART:${dateStr}T${startTime}00`,
      `DTEND:${dateStr}T${endTime}00`,
      `SUMMARY:${lesson.class.name}`,
      `LOCATION:${lesson.classroom || lesson.class.campus?.name || ""}`,
      `DESCRIPTION:${lesson.topic || ""}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Education System//Schedule//CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    scheduled: "已排课",
    ongoing: "进行中",
    completed: "已完成",
    cancelled: "已取消",
  };
  return statusMap[status] || status;
}
