import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取老师列表
 * GET /api/principal/teachers
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
    const search = searchParams.get("search") || "";
    const campusId = searchParams.get("campusId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // 构建查询条件
    const whereClause: Record<string, unknown> = {
      merchantId,
      status: "active",
      ...(campusId ? { campusId } : {}),
      OR: search
        ? [
            { name: { contains: search } },
            { phone: { contains: search } },
          ]
        : undefined,
    };

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where: whereClause,
        include: {
          campus: { select: { id: true, name: true } },
          _count: {
            select: {
              classes: { where: { status: "active" } },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.teacher.count({ where: whereClause }),
    ]);

    // 本月时间范围
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 获取统计数据
    const teacherData = await Promise.all(
      teachers.map(async (teacher) => {
        // 获取老师班级的学员数
        const classes = await prisma.class.findMany({
          where: { teacherId: teacher.id, status: "active" },
          select: { id: true },
        });
        const classIds = classes.map((c) => c.id);

        const studentCount = await prisma.enrollment.count({
          where: { classId: { in: classIds }, status: "active" },
        });

        // 本月授课数
        const lessonCount = await prisma.lesson.count({
          where: {
            class: { teacherId: teacher.id },
            date: { gte: monthStart, lte: monthEnd },
            status: "completed",
          },
        });

        // 本月课消
        const attendances = await prisma.attendance.findMany({
          where: {
            lesson: {
              class: { teacherId: teacher.id },
              date: { gte: monthStart, lte: monthEnd },
            },
            status: "present",
          },
        });
        const hoursConsumed = attendances.length * 1; // 假设每节课1课时

        return {
          id: teacher.id,
          name: teacher.name,
          avatar: teacher.avatar,
          phone: teacher.phone,
          campus: teacher.campus,
          subjects: teacher.subjects,
          studentCount,
          lessonCount,
          hoursConsumed,
          classCount: classes.length,
          createdAt: teacher.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: teacherData,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取老师列表错误:", error);
    return NextResponse.json({ error: "获取老师列表失败" }, { status: 500 });
  }
}

/**
 * 创建老师
 * POST /api/principal/teachers
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { name, phone, campusId, subjects, username, password, accountRole } = body;

    if (!name) {
      return NextResponse.json({ error: "老师姓名不能为空" }, { status: 400 });
    }

    const teacher = await prisma.teacher.create({
      data: {
        merchantId,
        name,
        phone,
        campusId,
        subjects,
        username,
        password,
        accountRole,
        status: "active",
      },
    });

    return NextResponse.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error("创建老师错误:", error);
    return NextResponse.json({ error: "创建老师失败" }, { status: 500 });
  }
}

/**
 * 更新老师
 * PUT /api/principal/teachers
 */
export async function PUT(request: NextRequest) {
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
    const body = await request.json();
    const { id, name, phone, campusId, subjects, status } = body;

    if (!id) {
      return NextResponse.json({ error: "老师ID不能为空" }, { status: 400 });
    }

    // 验证归属
    const teacher = await prisma.teacher.findFirst({
      where: { id, merchantId },
    });

    if (!teacher) {
      return NextResponse.json({ error: "老师不存在" }, { status: 404 });
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data: { name, phone, campusId, subjects, status },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("更新老师错误:", error);
    return NextResponse.json({ error: "更新老师失败" }, { status: 500 });
  }
}

/**
 * 删除老师
 * DELETE /api/principal/teachers?id=xxx
 */
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "老师ID不能为空" }, { status: 400 });
    }

    // 验证归属
    const teacher = await prisma.teacher.findFirst({
      where: { id, merchantId },
    });

    if (!teacher) {
      return NextResponse.json({ error: "老师不存在" }, { status: 404 });
    }

    // 软删除
    await prisma.teacher.update({
      where: { id },
      data: { status: "inactive" },
    });

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除老师错误:", error);
    return NextResponse.json({ error: "删除老师失败" }, { status: 500 });
  }
}
