import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 获取跟进任务列表
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

    const merchantId = decoded.merchantId;
    
    // 从URL参数获取校区ID
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get("campusId");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // 构建查询条件
    const whereCondition: any = {
      merchantId,
      nextFollowUp: { not: null },
      status: { notIn: ["signed", "lost"] },
    };
    
    // 如果指定了校区，则过滤校区
    if (campusId && campusId !== "all") {
      whereCondition.campusId = campusId;
    }

    // 获取所有有待跟进日期的客户
    const customers = await prisma.customer.findMany({
      where: whereCondition,
      include: {
        campus: {
          select: { id: true, name: true }
        },
        followUps: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // 构建任务列表
    const tasks = customers.map((customer) => {
      const nextFollowUp = customer.nextFollowUp!;
      const nextDate = new Date(nextFollowUp);
      nextDate.setHours(0, 0, 0, 0);

      const isToday = nextDate.getTime() === today.getTime();
      const isOverdue = nextDate < today;
      const daysOverdue = isOverdue 
        ? Math.floor((today.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: customer.id,
        customerId: customer.id,
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          childName: customer.childName,
          level: customer.level,
          status: customer.status,
          intentCourse: customer.intentCourse,
          campus: customer.campus,
        },
        nextFollowUp,
        nextAction: customer.followUps[0]?.nextAction || null,
        lastContact: customer.lastContact?.toISOString() || null,
        daysOverdue,
        isToday,
        isOverdue,
      };
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error("获取跟进任务错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
