import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 提交请假申请
 * POST /api/mini/leave
 */
export async function POST(request: NextRequest) {
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
    const { childId, classId, startDate, endDate, reason } = await request.json();

    // 验证必填字段
    if (!childId || !classId || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "请填写完整的请假信息" },
        { status: 400 }
      );
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

    // 验证孩子是否在该班级
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: childId,
        classId,
        status: "active",
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "孩子不在该班级" }, { status: 400 });
    }

    // 创建请假申请
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        studentId: childId,
        classId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: "pending",
      },
    });

    // 发送通知给机构管理员（可选）

    return NextResponse.json({
      success: true,
      leaveId: leaveRequest.id,
      status: "pending",
      message: "请假申请已提交，等待审批",
    });
  } catch (error) {
    console.error("提交请假申请错误:", error);
    return NextResponse.json(
      { error: "提交失败" },
      { status: 500 }
    );
  }
}

/**
 * 获取请假记录
 * GET /api/mini/leave?childId=xxx&status=all
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
    const status = searchParams.get("status") || "all";

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

    // 构建查询条件
    const where: Record<string, unknown> = { studentId: childId };
    if (status !== "all") {
      where.status = status;
    }

    // 获取请假记录
    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: { class: true },
      orderBy: { createdAt: "desc" },
    });

    const leaveList = leaves.map((l) => ({
      id: l.id,
      className: l.class.name,
      startDate: l.startDate.toISOString().split("T")[0],
      endDate: l.endDate.toISOString().split("T")[0],
      reason: l.reason,
      status: l.status,
      remark: l.remark,
      approvedAt: l.approvedAt?.toISOString(),
      createdAt: l.createdAt.toISOString(),
    }));

    return NextResponse.json({ leaves: leaveList });
  } catch (error) {
    console.error("获取请假记录错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
