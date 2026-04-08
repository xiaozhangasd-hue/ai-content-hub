import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取课时明细
 * GET /api/mini/hours/records?childId=xxx&classId=xxx&page=1&pageSize=20
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 Token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== "parent") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const parentId = payload.parentId;
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");
    const classId = searchParams.get("classId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    if (!childId) {
      return NextResponse.json({ error: "缺少孩子ID" }, { status: 400 });
    }

    // 验证家长是否有权限访问该孩子
    const parentChild = await prisma.parentChild.findFirst({
      where: {
        parentId,
        studentId: childId,
        status: "active",
      },
    });

    if (!parentChild) {
      return NextResponse.json({ error: "无权限访问该孩子信息" }, { status: 403 });
    }

    // 获取学生的班级关联
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: childId,
        status: "active",
        ...(classId ? { classId } : {}),
      },
    });

    const enrollmentIds = enrollments.map((e) => e.id);

    // 获取课时消耗记录
    const [deductions, total] = await Promise.all([
      prisma.deduction.findMany({
        where: {
          enrollmentId: { in: enrollmentIds },
        },
        include: {
          enrollment: {
            include: { class: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.deduction.count({
        where: {
          enrollmentId: { in: enrollmentIds },
        },
      }),
    ]);

    // 获取关联的课程
    const lessonIds = deductions.filter(d => d.lessonId).map(d => d.lessonId as string);
    const lessons = lessonIds.length > 0 ? await prisma.lesson.findMany({
      where: { id: { in: lessonIds } },
    }) : [];
    const lessonMap = new Map(lessons.map(l => [l.id, l]));

    // 获取充值记录
    const [recharges, rechargeTotal] = await Promise.all([
      prisma.recharge.findMany({
        where: {
          studentId: childId,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.recharge.count({
        where: {
          studentId: childId,
        },
      }),
    ]);

    // 合并并排序记录
    const allRecords = [
      ...deductions.map((d) => {
        const lesson = d.lessonId ? lessonMap.get(d.lessonId) : null;
        return {
          id: d.id,
          type: "deduction",
          hours: -d.hours,
          description: lesson
            ? `${d.enrollment.class.name} - ${lesson.topic || "课程"}`
            : d.remark || "课时扣减",
          date: d.createdAt.toISOString().split("T")[0],
          classId: d.enrollment.classId,
          className: d.enrollment.class.name,
        };
      }),
      ...recharges.map((r) => ({
        id: r.id,
        type: "recharge",
        hours: r.hours,
        amount: r.amount,
        paymentType: r.paymentType,
        description: r.remark || "课时充值",
        date: r.createdAt.toISOString().split("T")[0],
        classId: null,
        className: null,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      records: allRecords.slice(0, pageSize),
      pagination: {
        page,
        pageSize,
        total: total + rechargeTotal,
        totalPages: Math.ceil((total + rechargeTotal) / pageSize),
      },
    });
  } catch (error) {
    console.error("获取课时明细错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
