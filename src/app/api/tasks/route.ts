import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

// 获取任务列表
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "无效的token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const campusId = searchParams.get("campusId");

    const where: Record<string, unknown> = { merchantId: decoded.merchantId };
    
    if (status && status !== "all") {
      where.status = status;
    }
    if (type && type !== "all") {
      where.type = type;
    }
    if (priority && priority !== "all") {
      where.priority = priority;
    }
    if (campusId && campusId !== "all") {
      where.campusId = campusId;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" }
      ],
      take: 100,
    });

    // 统计
    const stats = await prisma.task.groupBy({
      by: ["status"],
      where: { merchantId: decoded.merchantId },
      _count: true,
    });

    const statusStats = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    stats.forEach((s: { status: string; _count: number }) => {
      if (s.status in statusStats) {
        statusStats[s.status as keyof typeof statusStats] = s._count;
      }
    });

    return NextResponse.json({
      success: true,
      tasks,
      stats: statusStats,
    });
  } catch (error) {
    console.error("获取任务失败:", error);
    return NextResponse.json({ error: "获取任务失败" }, { status: 500 });
  }
}

// 创建任务
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "无效的token" }, { status: 401 });
    }

    const body = await request.json();
    const {
      type = "manual",
      title,
      description,
      priority = "medium",
      dueDate,
      studentId,
      customerId,
      classId,
      campusId,
      metadata,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "任务标题不能为空" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        // @ts-expect-error Task model
        merchantId: decoded.merchantId,
        campusId,
        type,
        title,
        description,
        priority,
        status: "pending",
        dueDate: dueDate ? new Date(dueDate) : null,
        studentId,
        customerId,
        classId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        creatorId: decoded.id,
      },
    });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("创建任务失败:", error);
    return NextResponse.json({ error: "创建任务失败" }, { status: 500 });
  }
}

// 更新任务
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "无效的token" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, priority, dueDate, title, description } = body;

    if (!id) {
      return NextResponse.json({ error: "任务ID不能为空" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (status) {
      updateData.status = status;
      if (status === "completed") {
        updateData.completedAt = new Date();
      }
    }
    if (priority) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("更新任务失败:", error);
    return NextResponse.json({ error: "更新任务失败" }, { status: 500 });
  }
}

// 删除任务
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "无效的token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "任务ID不能为空" }, { status: 400 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("删除任务失败:", error);
    return NextResponse.json({ error: "删除任务失败" }, { status: 500 });
  }
}
