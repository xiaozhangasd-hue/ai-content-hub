import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 获取课程列表
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
    const date = searchParams.get("date") || "";
    const status = searchParams.get("status") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const lessons = await prisma.lesson.findMany({
      where: {
        class: { merchantId: decoded.merchantId },
        AND: [
          classId ? { classId } : {},
          date ? { date: new Date(date) } : {},
          status ? { status } : {},
          startDate && endDate
            ? { date: { gte: new Date(startDate), lte: new Date(endDate) } }
            : {},
        ],
      },
      include: {
        class: {
          select: { id: true, name: true, teacher: { select: { id: true, name: true } } },
        },
        attendances: {
          include: {
            student: { select: { id: true, name: true } },
          },
        },
        feedbacks: {
          select: { id: true, studentId: true },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ success: true, lessons });
  } catch (error) {
    console.error("获取课程列表错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建课程（排课）
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
    const { classId, date, startTime, endTime, classroom, topic, note } = data;

    if (!classId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "班级、日期和时间为必填项" }, { status: 400 });
    }

    // 获取班级的所有学员，自动创建考勤记录
    const enrollments = await prisma.enrollment.findMany({
      where: { classId, status: "active" },
    });

    const lesson = await prisma.lesson.create({
      data: {
        classId,
        date: new Date(date),
        startTime,
        endTime,
        classroom: classroom || null,
        topic: topic || null,
        note: note || null,
        attendances: {
          create: enrollments.map((e) => ({
            enrollmentId: e.id,
            studentId: e.studentId,
            status: "pending",
          })),
        },
      },
      include: {
        class: true,
        attendances: true,
      },
    });

    return NextResponse.json({ success: true, lesson });
  } catch (error) {
    console.error("创建课程错误:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

// 批量排课
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
    const { classId, startDate, endDate, excludeDates } = data;

    // 获取班级的排课时间表
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: { schedules: true, enrollments: { where: { status: "active" } } },
    });

    if (!classData) {
      return NextResponse.json({ error: "班级不存在" }, { status: 400 });
    }

    const lessons: any[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const exclude = new Set(excludeDates || []);

    // 遍历日期范围
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      if (exclude.has(dateStr)) continue;

      const weekday = d.getDay() || 7; // 1-7
      const daySchedules = classData.schedules.filter((s) => s.weekday === weekday);

      for (const schedule of daySchedules) {
        // 检查是否已存在
        const existing = await prisma.lesson.findFirst({
          where: {
            classId,
            date: new Date(dateStr),
            startTime: schedule.startTime,
          },
        });

        if (!existing) {
          const lesson = await prisma.lesson.create({
            data: {
              classId,
              date: new Date(dateStr),
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              classroom: schedule.classroom,
              attendances: {
                create: classData.enrollments.map((e) => ({
                  enrollmentId: e.id,
                  studentId: e.studentId,
                  status: "pending",
                })),
              },
            },
          });
          lessons.push(lesson);
        }
      }
    }

    return NextResponse.json({ success: true, count: lessons.length, lessons });
  } catch (error) {
    console.error("批量排课错误:", error);
    return NextResponse.json({ error: "排课失败" }, { status: 500 });
  }
}
