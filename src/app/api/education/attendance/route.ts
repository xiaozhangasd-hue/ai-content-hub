import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 获取考勤记录
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
    const lessonId = searchParams.get("lessonId") || "";
    const studentId = searchParams.get("studentId") || "";
    const status = searchParams.get("status") || "";
    const date = searchParams.get("date") || "";

    const attendances = await prisma.attendance.findMany({
      where: {
        student: { merchantId: decoded.merchantId },
        AND: [
          lessonId ? { lessonId } : {},
          studentId ? { studentId } : {},
          status ? { status } : {},
          date
            ? {
                lesson: { date: new Date(date) },
              }
            : {},
        ],
      },
      include: {
        lesson: {
          include: {
            class: { select: { id: true, name: true } },
          },
        },
        student: { select: { id: true, name: true } },
        enrollment: { select: { id: true, remainingHours: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, attendances });
  } catch (error) {
    console.error("获取考勤记录错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 更新考勤状态
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

    // 支持批量更新
    if (Array.isArray(data)) {
      const results = await Promise.all(
        data.map(async (item) => {
          const { id, status, checkInTime, checkOutTime, remark } = item;

          const attendance = await prisma.attendance.update({
            where: { id },
            data: {
              status: status || undefined,
              checkInTime: checkInTime ? new Date(checkInTime) : undefined,
              checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
              remark: remark !== undefined ? remark : undefined,
            },
          });

          // 如果是出勤，自动扣课时
          if (status === "present") {
            const lesson = await prisma.lesson.findUnique({
              where: { id: attendance.lessonId },
            });
            if (lesson) {
              const hours = 1; // 默认扣1课时，可根据实际情况调整
              await prisma.enrollment.update({
                where: { id: attendance.enrollmentId },
                data: { remainingHours: { decrement: hours } },
              });
              await prisma.deduction.create({
                data: {
                  enrollmentId: attendance.enrollmentId,
                  lessonId: lesson.id,
                  hours,
                  type: "lesson",
                  remark: "上课扣课时",
                },
              });
            }
          }

          return attendance;
        })
      );

      return NextResponse.json({ success: true, count: results.length });
    } else {
      const { id, status, checkInTime, checkOutTime, remark } = data;

      const attendance = await prisma.attendance.update({
        where: { id },
        data: {
          status: status || undefined,
          checkInTime: checkInTime ? new Date(checkInTime) : undefined,
          checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
          remark: remark !== undefined ? remark : undefined,
        },
      });

      // 如果是出勤，自动扣课时
      if (status === "present") {
        const lesson = await prisma.lesson.findUnique({
          where: { id: attendance.lessonId },
        });
        if (lesson) {
          const hours = 1;
          await prisma.enrollment.update({
            where: { id: attendance.enrollmentId },
            data: { remainingHours: { decrement: hours } },
          });
          await prisma.deduction.create({
            data: {
              enrollmentId: attendance.enrollmentId,
              lessonId: lesson.id,
              hours,
              type: "lesson",
              remark: "上课扣课时",
            },
          });
        }
      }

      return NextResponse.json({ success: true, attendance });
    }
  } catch (error) {
    console.error("更新考勤错误:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
