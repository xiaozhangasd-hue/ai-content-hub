import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取智能洞察
 * GET /api/principal/performance/insights
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

    const insights: Array<{
      type: "success" | "warning" | "danger" | "info";
      title: string;
      description: string;
      suggestion?: string;
    }> = [];

    // 本月时间范围
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 1. 检查转化率变化
    const trialStudentsThisMonth = await prisma.customer.count({
      where: { merchantId, status: "trial", createdAt: { gte: monthStart, lte: monthEnd } },
    });
    const signedStudentsThisMonth = await prisma.customer.count({
      where: { merchantId, status: "signed", createdAt: { gte: monthStart, lte: monthEnd } },
    });
    const trialStudentsLastMonth = await prisma.customer.count({
      where: { merchantId, status: "trial", createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    });
    const signedStudentsLastMonth = await prisma.customer.count({
      where: { merchantId, status: "signed", createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    });

    const conversionRateThisMonth = trialStudentsThisMonth + signedStudentsThisMonth > 0
      ? signedStudentsThisMonth / (trialStudentsThisMonth + signedStudentsThisMonth)
      : 0;
    const conversionRateLastMonth = trialStudentsLastMonth + signedStudentsLastMonth > 0
      ? signedStudentsLastMonth / (trialStudentsLastMonth + signedStudentsLastMonth)
      : 0;

    if (conversionRateThisMonth < conversionRateLastMonth * 0.8) {
      insights.push({
        type: "danger",
        title: "转化率下降预警",
        description: `本月转化率 ${(conversionRateThisMonth * 100).toFixed(1)}%，较上月下降 ${((conversionRateLastMonth - conversionRateThisMonth) * 100).toFixed(1)} 个百分点`,
        suggestion: "建议加强试听课程的体验感，及时跟进意向客户，提供优惠活动促进转化",
      });
    }

    // 2. 检查学员增长
    const newStudentsThisMonth = await prisma.student.count({
      where: { merchantId, createdAt: { gte: monthStart, lte: monthEnd } },
    });
    const newStudentsLastMonth = await prisma.student.count({
      where: { merchantId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    });

    if (newStudentsThisMonth > newStudentsLastMonth * 1.2) {
      insights.push({
        type: "success",
        title: "学员增长显著",
        description: `本月新增学员 ${newStudentsThisMonth} 人，较上月增长 ${Math.round(((newStudentsThisMonth - newStudentsLastMonth) / newStudentsLastMonth) * 100)}%`,
        suggestion: "继续保持当前的招生策略，可考虑扩大招生团队或增加宣传投入",
      });
    } else if (newStudentsThisMonth < newStudentsLastMonth * 0.8) {
      insights.push({
        type: "warning",
        title: "学员增长放缓",
        description: `本月新增学员 ${newStudentsThisMonth} 人，较上月下降 ${Math.round(((newStudentsLastMonth - newStudentsThisMonth) / newStudentsLastMonth) * 100)}%`,
        suggestion: "建议加大市场推广力度，优化招生话术，增加转介绍激励",
      });
    }

    // 3. 检查课时即将耗尽的学员
    const lowHoursStudents = await prisma.enrollment.count({
      where: {
        student: { merchantId },
        status: "active",
        remainingHours: { lt: 5 },
      },
    });

    if (lowHoursStudents > 0) {
      insights.push({
        type: "warning",
        title: "续费提醒",
        description: `当前有 ${lowHoursStudents} 名学员课时不足5节，需要及时跟进续费`,
        suggestion: "建议主动联系家长，告知课时情况，提供续费优惠方案",
      });
    }

    // 4. 检查待跟进客户
    const pendingCustomers = await prisma.customer.count({
      where: {
        merchantId,
        status: { in: ["new", "contacted"] },
        nextFollowUp: { lte: now },
      },
    });

    if (pendingCustomers > 0) {
      insights.push({
        type: "info",
        title: "跟进提醒",
        description: `有 ${pendingCustomers} 位客户需要跟进，请及时联系`,
        suggestion: "建议今日完成跟进任务，避免客户流失",
      });
    }

    // 5. 检查老师出勤率
    const teachers = await prisma.teacher.findMany({
      where: { merchantId, status: "active" },
      select: { id: true, name: true },
    });

    if (teachers.length > 0) {
      // 计算本月课程数
      const teacherStats = await Promise.all(
        teachers.map(async (teacher) => {
          const lessons = await prisma.lesson.findMany({
            where: {
              class: { teacherId: teacher.id },
              date: { gte: monthStart, lte: monthEnd },
            },
          });
          return { name: teacher.name, lessonCount: lessons.length };
        })
      );

      const avgLessons = teacherStats.reduce((sum, t) => sum + t.lessonCount, 0) / teacherStats.length;
      const lowActivityTeachers = teacherStats.filter((t) => t.lessonCount < avgLessons * 0.5);

      if (lowActivityTeachers.length > 0) {
        insights.push({
          type: "info",
          title: "老师工作量提醒",
          description: `${lowActivityTeachers.map((t) => t.name).join("、")} 本月授课量较低`,
          suggestion: "建议合理分配课程，或考虑增加该老师的学员数量",
        });
      }
    }

    // 6. 生成综合分析报告
    const totalStudents = await prisma.student.count({ where: { merchantId } });
    const rechargesThisMonth = await prisma.recharge.findMany({
      where: { student: { merchantId }, createdAt: { gte: monthStart, lte: monthEnd }, status: "paid" },
      select: { amount: true },
    });
    const revenueThisMonth = rechargesThisMonth.reduce((sum, r) => sum + (r.amount || 0), 0);

    insights.push({
      type: "info",
      title: "月度分析报告",
      description: `本月业绩 ¥${revenueThisMonth.toLocaleString()}，新增学员 ${newStudentsThisMonth} 人，总学员数 ${totalStudents} 人`,
      suggestion: conversionRateThisMonth > 0.3
        ? "转化率表现良好，建议保持当前运营策略"
        : "建议优化招生流程，提升试听体验和跟进效率",
    });

    return NextResponse.json({
      success: true,
      data: {
        insights,
        summary: {
          totalInsights: insights.length,
          dangerCount: insights.filter((i) => i.type === "danger").length,
          warningCount: insights.filter((i) => i.type === "warning").length,
          successCount: insights.filter((i) => i.type === "success").length,
        },
      },
    });
  } catch (error) {
    console.error("获取智能洞察错误:", error);
    return NextResponse.json({ error: "获取智能洞察失败" }, { status: 500 });
  }
}
