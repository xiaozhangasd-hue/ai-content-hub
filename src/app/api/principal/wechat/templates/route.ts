import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取微信订阅消息模板列表
 * GET /api/principal/wechat/templates
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

    // 返回预设的模板列表
    // 实际使用时需要调用微信API获取模板列表
    const templates = [
      {
        id: "trial_reminder",
        name: "试听提醒",
        templateId: "TEMPLATE_ID_TRIAL",
        description: "提醒学员即将进行的试听课程",
        content: "课程名称：{{course}}\n试听时间：{{time}}\n上课地点：{{address}}\n教师姓名：{{teacher}}",
        status: "active",
      },
      {
        id: "class_reminder",
        name: "上课提醒",
        templateId: "TEMPLATE_ID_CLASS",
        description: "提醒学员即将开始的课程",
        content: "课程名称：{{course}}\n上课时间：{{time}}\n上课地点：{{address}}\n教师姓名：{{teacher}}",
        status: "active",
      },
      {
        id: "payment_reminder",
        name: "缴费提醒",
        templateId: "TEMPLATE_ID_PAYMENT",
        description: "提醒学员缴纳学费",
        content: "学员姓名：{{student}}\n课程名称：{{course}}\n缴费金额：{{amount}}\n截止日期：{{deadline}}",
        status: "active",
      },
      {
        id: "refund_notice",
        name: "退费通知",
        templateId: "TEMPLATE_ID_REFUND",
        description: "通知学员退费进度",
        content: "学员姓名：{{student}}\n退费金额：{{amount}}\n退费原因：{{reason}}\n处理时间：{{time}}",
        status: "active",
      },
      {
        id: "reward_notice",
        name: "奖励到账通知",
        templateId: "TEMPLATE_ID_REWARD",
        description: "通知推荐人奖励已发放",
        content: "推荐学员：{{student}}\n奖励金额：{{amount}}\n到账时间：{{time}}\n累计奖励：{{total}}",
        status: "active",
      },
    ];

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("获取模板列表错误:", error);
    return NextResponse.json({ error: "获取模板列表失败" }, { status: 500 });
  }
}
