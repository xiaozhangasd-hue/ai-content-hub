import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取AI助手历史记录
 * GET /api/ai-assistant/history
 * 
 * 查询参数：
 * - page: 页码
 * - pageSize: 每页数量
 * - sceneId: 场景ID筛选
 * - favorite: 是否只看收藏
 */
export async function GET(request: NextRequest) {
  try {
    // 验证身份
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
    const teacherId = payload.teacherId;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const sceneId = searchParams.get("sceneId") || undefined;
    const favorite = searchParams.get("favorite") === "true";

    // 构建查询条件
    const where: Record<string, unknown> = {
      merchantId,
      teacherId,
      isDeleted: false,
    };

    if (sceneId) {
      where.sceneId = sceneId;
    }

    if (favorite) {
      where.isFavorite = true;
    }

    // 查询历史记录
    const [records, total] = await Promise.all([
      prisma.aiAssistantHistory.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.aiAssistantHistory.count({ where }),
    ]);

    // 场景名称映射
    const sceneNames: Record<string, string> = {
      recruitment: "招生宣传",
      renewal: "续费提醒",
      festival: "节日祝福",
      activity: "活动通知",
      summary: "课堂总结",
    };

    // 模板名称映射
    const templateNames: Record<string, string> = {
      poster: "海报",
      copywriting: "文案",
      video_script: "视频脚本",
      reminder: "提醒",
      promotion: "优惠活动",
      card: "贺卡",
      greeting: "祝福",
      notice: "通知",
      invitation: "邀请函",
      feedback: "课后反馈",
      report: "学习报告",
      moment: "朋友圈素材",
    };

    return NextResponse.json({
      success: true,
      data: records.map((record) => ({
        id: record.id,
        sceneId: record.sceneId,
        sceneName: sceneNames[record.sceneId] || record.sceneId,
        templateId: record.templateId,
        templateName: templateNames[record.templateId] || record.templateId,
        prompt: record.prompt,
        content: record.content,
        isFavorite: record.isFavorite,
        createdAt: record.createdAt,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取历史记录错误:", error);
    return NextResponse.json(
      { error: "获取历史记录失败" },
      { status: 500 }
    );
  }
}
