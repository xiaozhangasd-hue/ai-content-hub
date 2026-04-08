import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取校区列表
 * GET /api/principal/campuses
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

    // 获取校区列表
    const campuses = await prisma.campus.findMany({
      where: { merchantId },
      include: {
        _count: {
          select: {
            students: { where: {} },
            teachers: { where: { status: "active" } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 获取本月业绩
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const campusData = await Promise.all(
      campuses.map(async (campus) => {
        // 本月业绩
        const recharges = await prisma.recharge.findMany({
          where: {
            student: { campusId: campus.id },
            createdAt: { gte: monthStart, lte: monthEnd },
            status: "paid",
          },
          select: { amount: true },
        });

        const revenue = recharges.reduce((sum, r) => sum + (r.amount || 0), 0);

        // 班级数
        const classCount = await prisma.class.count({
          where: { campusId: campus.id, status: "active" },
        });

        return {
          id: campus.id,
          name: campus.name,
          address: campus.address,
          phone: campus.phone,
          status: campus.status,
          studentCount: campus._count.students,
          teacherCount: campus._count.teachers,
          classCount,
          revenue,
          createdAt: campus.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: campusData,
    });
  } catch (error) {
    console.error("获取校区列表错误:", error);
    return NextResponse.json({ error: "获取校区列表失败" }, { status: 500 });
  }
}

/**
 * 创建校区
 * POST /api/principal/campuses
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
    const { name, address, phone } = body;

    if (!name) {
      return NextResponse.json({ error: "校区名称不能为空" }, { status: 400 });
    }

    // 检查是否已存在同名校区
    const existing = await prisma.campus.findFirst({
      where: { merchantId, name },
    });

    if (existing) {
      return NextResponse.json({ error: "校区名称已存在" }, { status: 400 });
    }

    const campus = await prisma.campus.create({
      data: {
        merchantId,
        name,
        address,
        phone,
        status: "active",
      },
    });

    return NextResponse.json({
      success: true,
      data: campus,
    });
  } catch (error) {
    console.error("创建校区错误:", error);
    return NextResponse.json({ error: "创建校区失败" }, { status: 500 });
  }
}

/**
 * 更新校区
 * PUT /api/principal/campuses
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
    const { id, name, address, phone, status } = body;

    if (!id) {
      return NextResponse.json({ error: "校区ID不能为空" }, { status: 400 });
    }

    // 验证校区归属
    const campus = await prisma.campus.findFirst({
      where: { id, merchantId },
    });

    if (!campus) {
      return NextResponse.json({ error: "校区不存在" }, { status: 404 });
    }

    const updated = await prisma.campus.update({
      where: { id },
      data: { name, address, phone, status },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("更新校区错误:", error);
    return NextResponse.json({ error: "更新校区失败" }, { status: 500 });
  }
}

/**
 * 删除校区
 * DELETE /api/principal/campuses?id=xxx
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
      return NextResponse.json({ error: "校区ID不能为空" }, { status: 400 });
    }

    // 验证校区归属
    const campus = await prisma.campus.findFirst({
      where: { id, merchantId },
    });

    if (!campus) {
      return NextResponse.json({ error: "校区不存在" }, { status: 404 });
    }

    // 检查是否有学员或老师
    const studentCount = await prisma.student.count({
      where: { campusId: id },
    });

    if (studentCount > 0) {
      return NextResponse.json({ error: "该校区还有学员，无法删除" }, { status: 400 });
    }

    await prisma.campus.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除校区错误:", error);
    return NextResponse.json({ error: "删除校区失败" }, { status: 500 });
  }
}
