import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 校长端Dashboard数据
 * GET /api/principal/dashboard?campusId=xxx
 * 
 * 校长角色为 merchant（商家）
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

    if (!payload || payload.role !== "merchant") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const merchantId = payload.merchantId;
    if (!merchantId) {
      return NextResponse.json({ error: "商家信息缺失" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get("campusId");

    // 获取商家所有校区
    const campuses = await prisma.campus.findMany({
      where: { merchantId },
      select: { id: true, name: true, status: true },
      orderBy: { sortOrder: "asc" },
    });

    // 构建校区过滤条件
    const campusFilter = campusId ? { campusId } : { merchantId };
    const studentCampusFilter = campusId 
      ? { campusId } 
      : { merchantId };
    const classCampusFilter = campusId 
      ? { campusId } 
      : { merchantId };

    // ========== 全局数据概览 ==========
    
    // 总学员数
    const totalStudents = await prisma.student.count({
      where: studentCampusFilter,
    });

    // 今日课程数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayLessons = await prisma.lesson.count({
      where: {
        class: classCampusFilter,
        date: { gte: today, lt: todayEnd },
        status: { not: "cancelled" },
      },
    });

    // 本月起止时间
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // 本月业绩（充值金额）
    const monthRecharges = await prisma.recharge.aggregate({
      where: {
        student: studentCampusFilter,
        createdAt: { gte: monthStart, lte: monthEnd },
        status: "paid",
      },
      _sum: { amount: true },
    });
    const monthRevenue = monthRecharges._sum.amount || 0;

    // 本月新增学员
    const monthNewStudents = await prisma.student.count({
      where: {
        ...studentCampusFilter,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    });

    // ========== 业绩趋势（本月每日） ==========
    const dailyRevenue = [];
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    for (let day = 1; day <= Math.min(daysInMonth, today.getDate()); day++) {
      const dayStart = new Date(today.getFullYear(), today.getMonth(), day, 0, 0, 0);
      const dayEnd = new Date(today.getFullYear(), today.getMonth(), day, 23, 59, 59, 999);

      const dayRevenue = await prisma.recharge.aggregate({
        where: {
          student: studentCampusFilter,
          createdAt: { gte: dayStart, lte: dayEnd },
          status: "paid",
        },
        _sum: { amount: true },
      });

      const dayNewStudents = await prisma.student.count({
        where: {
          ...studentCampusFilter,
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      dailyRevenue.push({
        date: `${day}日`,
        revenue: dayRevenue._sum.amount || 0,
        newStudents: dayNewStudents,
      });
    }

    // ========== 转化漏斗 ==========
    // 潜在客户 -> 已联系 -> 已邀约 -> 已试听 -> 已签约
    const customerFunnel = await prisma.customer.groupBy({
      by: ["status"],
      where: campusId ? { campusId } : { merchantId },
      _count: { id: true },
    });

    const funnelData = [
      { name: "潜在客户", value: 0, key: "new" },
      { name: "已联系", value: 0, key: "contacted" },
      { name: "已邀约", value: 0, key: "invited" },
      { name: "已试听", value: 0, key: "trial" },
      { name: "已签约", value: 0, key: "signed" },
    ];

    customerFunnel.forEach((item) => {
      const funnelItem = funnelData.find((f) => f.key === item.status);
      if (funnelItem) {
        funnelItem.value = item._count.id;
      }
    });

    // ========== 校区对比（不指定校区时显示） ==========
    let campusComparison: Array<{ name: string; students: number; revenue: number; teachers: number }> = [];
    
    if (!campusId && campuses.length > 0) {
      for (const campus of campuses) {
        const [students, revenue, teachers] = await Promise.all([
          prisma.student.count({ where: { campusId: campus.id } }),
          prisma.recharge.aggregate({
            where: {
              student: { campusId: campus.id },
              createdAt: { gte: monthStart, lte: monthEnd },
              status: "paid",
            },
            _sum: { amount: true },
          }),
          prisma.teacher.count({ where: { campusId: campus.id, status: "active" } }),
        ]);

        campusComparison.push({
          name: campus.name,
          students,
          revenue: revenue._sum.amount || 0,
          teachers,
        });
      }
    }

    // ========== 待办事项 ==========
    
    // 续费预警学员（剩余课时 < 3）
    const renewalAlertStudents = await prisma.enrollment.findMany({
      where: {
        student: studentCampusFilter,
        status: "active",
        remainingHours: { lt: 3 },
      },
      include: {
        student: {
          select: { id: true, name: true, parentPhone: true },
        },
        class: {
          select: { id: true, name: true },
        },
      },
      take: 10,
      orderBy: { remainingHours: "asc" },
    });

    // 待跟进客户
    const pendingFollowUps = await prisma.customer.findMany({
      where: {
        ...campusFilter,
        nextFollowUp: { lte: new Date() },
        status: { notIn: ["signed", "lost"] },
      },
      include: {
        campus: { select: { name: true } },
      },
      take: 10,
      orderBy: { nextFollowUp: "asc" },
    });

    // ========== 其他统计 ==========
    const totalTeachers = await prisma.teacher.count({
      where: {
        merchantId,
        status: "active",
        ...(campusId ? { campusId } : {}),
      },
    });

    const totalClasses = await prisma.class.count({
      where: {
        ...classCampusFilter,
        status: "active",
      },
    });

    // 构建响应
    const response = {
      overview: {
        totalStudents,
        todayLessons,
        monthRevenue,
        monthNewStudents,
        totalTeachers,
        totalClasses,
      },
      campuses: campuses.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
      })),
      selectedCampus: campusId,
      dailyRevenue,
      funnelData: funnelData.map((f) => ({ name: f.name, value: f.value })),
      campusComparison,
      todos: {
        renewalAlert: {
          count: renewalAlertStudents.length,
          items: renewalAlertStudents.map((e) => ({
            studentId: e.student.id,
            studentName: e.student.name,
            parentPhone: e.student.parentPhone,
            className: e.class.name,
            remainingHours: e.remainingHours,
          })),
        },
        pendingFollowUp: {
          count: pendingFollowUps.length,
          items: pendingFollowUps.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            childName: c.childName,
            status: c.status,
            campusName: c.campus?.name,
            nextFollowUp: c.nextFollowUp?.toISOString(),
          })),
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("获取校长Dashboard数据错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
