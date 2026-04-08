import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取课表数据
 * GET /api/teacher/schedule
 * 
 * 查询参数：
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - campusId: 校区ID（可选）
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
    const campusId = searchParams.get("campusId");

    // 构建日期范围
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date(start);
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);

    // 获取老师的课程
    const classes = await prisma.class.findMany({
      where: {
        merchantId,
        teacherId,
        ...(campusId ? { campusId } : {}),
        status: "active",
      },
      select: {
        id: true,
        name: true,
        teacher: { select: { id: true, name: true } },
        campus: { select: { id: true, name: true } },
        schedules: true,
      },
    });

    const classIds = classes.map((c) => c.id);

    // 获取具体课程（Lesson）
    const lessons = await prisma.lesson.findMany({
      where: {
        classId: { in: classIds },
        date: { gte: start, lte: end },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            teacher: { select: { id: true, name: true } },
          },
        },
        attendances: {
          select: {
            studentId: true,
            status: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    // 转换为日历事件格式
    const events = lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.class.name,
      start: `${lesson.date.toISOString().split("T")[0]}T${lesson.startTime}`,
      end: `${lesson.date.toISOString().split("T")[0]}T${lesson.endTime}`,
      extendedProps: {
        classId: lesson.classId,
        teacherId: lesson.class.teacher?.id || "",
        teacherName: lesson.class.teacher?.name || "未分配",
        topic: lesson.topic,
        classroom: lesson.classroom,
        status: lesson.status,
        studentCount: lesson.attendances.length,
        attendedCount: lesson.attendances.filter((a) => a.status === "present").length,
      },
    }));

    // 获取循环排课规则
    const scheduleRules = classes.flatMap((cls) =>
      cls.schedules.map((schedule) => ({
        classId: cls.id,
        className: cls.name,
        teacherName: cls.teacher?.name,
        weekday: schedule.weekday,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        classroom: schedule.classroom,
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        events,
        scheduleRules,
        classes: classes.map((c) => ({
          id: c.id,
          name: c.name,
          teacher: c.teacher,
          campus: c.campus,
        })),
      },
    });
  } catch (error) {
    console.error("获取课表错误:", error);
    return NextResponse.json(
      { error: "获取课表失败" },
      { status: 500 }
    );
  }
}

/**
 * 创建/更新课程
 * POST /api/teacher/schedule
 * 
 * 请求体：
 * - id: 课程ID（更新时传入）
 * - classId: 班级ID
 * - date: 日期
 * - startTime: 开始时间
 * - endTime: 结束时间
 * - topic: 课程主题
 * - classroom: 教室
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { id, classId, date, startTime, endTime, topic, classroom } = body;

    if (!classId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    // 验证班级归属
    const classItem = await prisma.class.findFirst({
      where: { id: classId, merchantId, teacherId },
    });

    if (!classItem) {
      return NextResponse.json({ error: "班级不存在或无权限" }, { status: 404 });
    }

    // 冲突检测
    const lessonDate = new Date(date);
    const conflictingLesson = await prisma.lesson.findFirst({
      where: {
        class: { teacherId },
        date: lessonDate,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
        ...(id ? { NOT: { id } } : {}),
      },
    });

    if (conflictingLesson) {
      return NextResponse.json({
        error: "时间冲突：该时间段已有其他课程",
        conflictWith: conflictingLesson,
      }, { status: 409 });
    }

    let lesson: {
      id: string;
      classId: string;
      date: Date;
      startTime: string;
      endTime: string;
      topic: string | null;
      classroom: string | null;
      status: string;
    };

    if (id) {
      // 更新
      lesson = await prisma.lesson.update({
        where: { id },
        data: {
          date: lessonDate,
          startTime,
          endTime,
          topic,
          classroom,
        },
      });
    } else {
      // 创建
      lesson = await prisma.lesson.create({
        data: {
          classId,
          date: lessonDate,
          startTime,
          endTime,
          topic,
          classroom,
          status: "scheduled",
        },
      });

      // 为班级所有学员创建考勤记录
      const enrollments = await prisma.enrollment.findMany({
        where: { classId, status: "active" },
        select: { id: true, studentId: true },
      });

      if (enrollments.length > 0) {
        await prisma.attendance.createMany({
          data: enrollments.map((e) => ({
            lessonId: lesson.id,
            enrollmentId: e.id,
            studentId: e.studentId,
            status: "pending",
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.error("创建/更新课程错误:", error);
    return NextResponse.json(
      { error: "操作失败" },
      { status: 500 }
    );
  }
}

/**
 * 删除课程
 * DELETE /api/teacher/schedule?id=xxx
 */
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "课程ID不能为空" }, { status: 400 });
    }

    // 验证课程归属
    const lesson = await prisma.lesson.findFirst({
      where: {
        id,
        class: { merchantId, teacherId },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "课程不存在或无权限" }, { status: 404 });
    }

    // 删除相关考勤记录
    await prisma.attendance.deleteMany({ where: { lessonId: id } });

    // 删除课程
    await prisma.lesson.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除课程错误:", error);
    return NextResponse.json(
      { error: "删除失败" },
      { status: 500 }
    );
  }
}
