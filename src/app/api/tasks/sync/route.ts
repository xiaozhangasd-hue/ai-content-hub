import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

// 同步任务 - 扫描学员课时和高意向客户
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
    const { hoursThreshold = 15 } = body;

    const merchantId = decoded.merchantId;

    // 1. 扫描课时预警学员
    const lowHoursEnrollments = await prisma.enrollment.findMany({
      where: {
        class: { merchantId },
        remainingHours: { lte: hoursThreshold },
        status: "active",
      },
      include: {
        student: {
          select: { id: true, name: true, phone: true },
        },
        class: {
          select: { id: true, name: true, campusId: true },
        },
      },
    });

    // 按学员分组
    const studentHoursMap = new Map<string, {
      student: { id: string; name: string; phone: string | null };
      classes: Array<{ id: string; name: string; remainingHours: number; campusId: string | null }>;
      totalRemaining: number;
      campusIds: Set<string>;
    }>();

    for (const enrollment of lowHoursEnrollments) {
      const studentId = enrollment.student.id;
      if (!studentHoursMap.has(studentId)) {
        studentHoursMap.set(studentId, {
          student: enrollment.student,
          classes: [],
          totalRemaining: 0,
          campusIds: new Set(),
        });
      }
      const data = studentHoursMap.get(studentId)!;
      data.classes.push({
        id: enrollment.class.id,
        name: enrollment.class.name,
        remainingHours: enrollment.remainingHours,
        campusId: enrollment.class.campusId,
      });
      data.totalRemaining += enrollment.remainingHours;
      if (enrollment.class.campusId) {
        data.campusIds.add(enrollment.class.campusId);
      }
    }

    // 为每个课时预警学员创建/更新任务
    let hoursWarningCreated = 0;
    for (const [studentId, data] of studentHoursMap) {
      // 检查是否已存在未完成的课时预警任务
      const existingTask = await prisma.task.findFirst({
        where: {
          merchantId,
          studentId,
          type: "hours_warning",
          status: { in: ["pending", "in_progress"] },
        },
      });

      if (!existingTask) {
        // 取第一个校区作为任务的校区
        const campusId = data.campusIds.values().next().value || null;
        
        await prisma.task.create({
          data: {
            // @ts-expect-error Task model
            merchantId,
            campusId,
            type: "hours_warning",
            title: `学员「${data.student.name}」课时不足`,
            description: `剩余 ${data.totalRemaining} 课时，请及时跟进续费。涉及班级：${data.classes.map(c => c.name).join("、")}`,
            priority: data.totalRemaining <= 5 ? "high" : "medium",
            status: "pending",
            studentId,
            metadata: JSON.stringify({
              totalRemaining: data.totalRemaining,
              classes: data.classes,
            }),
          },
        });
        hoursWarningCreated++;
      } else {
        // 更新现有任务
        await prisma.task.update({
          where: { id: existingTask.id },
          data: {
            title: `学员「${data.student.name}」课时不足`,
            description: `剩余 ${data.totalRemaining} 课时，请及时跟进续费。涉及班级：${data.classes.map(c => c.name).join("、")}`,
            priority: data.totalRemaining <= 5 ? "high" : "medium",
            metadata: JSON.stringify({
              totalRemaining: data.totalRemaining,
              classes: data.classes,
            }),
          },
        });
      }
    }

    // 2. 扫描高意向客户（未跟进的）
    const highIntentCustomers = await prisma.customer.findMany({
      where: {
        merchantId,
        level: "hot",
        status: { in: ["new", "contacted"] },
      },
    });

    let customerFollowCreated = 0;
    for (const customer of highIntentCustomers) {
      // 检查是否已存在未完成的跟进任务
      const existingTask = await prisma.task.findFirst({
        where: {
          merchantId,
          customerId: customer.id,
          type: "customer_high_intent",
          status: { in: ["pending", "in_progress"] },
        },
      });

      if (!existingTask) {
        await prisma.task.create({
          data: {
            // @ts-expect-error Task model
            merchantId,
            campusId: customer.campusId,
            type: "customer_high_intent",
            title: `高意向客户「${customer.name}」待跟进`,
            description: `客户意向课程：${customer.intentCourse || "未指定"}，孩子：${customer.childName || "未知"}，请及时跟进转化。`,
            priority: "high",
            status: "pending",
            customerId: customer.id,
            metadata: JSON.stringify({
              phone: customer.phone,
              intentCourse: customer.intentCourse,
              childName: customer.childName,
              source: customer.source,
            }),
          },
        });
        customerFollowCreated++;
      }
    }

    // 3. 统计总数
    const totalPending = await prisma.task.count({
      where: {
        merchantId,
        status: { in: ["pending", "in_progress"] },
      },
    });

    return NextResponse.json({
      success: true,
      message: "任务同步完成",
      data: {
        hoursWarningCreated,
        customerFollowCreated,
        totalPending,
      },
    });
  } catch (error) {
    console.error("同步任务失败:", error);
    return NextResponse.json({ error: "同步任务失败" }, { status: 500 });
  }
}
