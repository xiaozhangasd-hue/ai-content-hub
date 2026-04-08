import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

/**
 * 获取AI助手场景列表
 * GET /api/ai-assistant/scenes
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

    // 场景列表
    const scenes = [
      {
        id: "recruitment",
        name: "招生宣传",
        icon: "Users",
        description: "制作招生海报、宣传文案",
        templates: [
          { id: "poster", name: "招生海报", type: "image" },
          { id: "copywriting", name: "宣传文案", type: "text" },
          { id: "video_script", name: "宣传视频脚本", type: "text" },
        ],
      },
      {
        id: "renewal",
        name: "续费提醒",
        icon: "RefreshCw",
        description: "课时不足提醒、续费优惠",
        templates: [
          { id: "reminder", name: "续费提醒", type: "text" },
          { id: "promotion", name: "优惠活动", type: "text" },
          { id: "poster", name: "续费海报", type: "image" },
        ],
      },
      {
        id: "festival",
        name: "节日祝福",
        icon: "Gift",
        description: "节日贺卡、祝福文案",
        templates: [
          { id: "greeting", name: "节日祝福", type: "text" },
          { id: "card", name: "节日贺卡", type: "image" },
          { id: "poster", name: "节日海报", type: "image" },
        ],
      },
      {
        id: "activity",
        name: "活动通知",
        icon: "Calendar",
        description: "活动宣传、报名通知",
        templates: [
          { id: "notice", name: "活动通知", type: "text" },
          { id: "poster", name: "活动海报", type: "image" },
          { id: "invitation", name: "邀请函", type: "text" },
        ],
      },
      {
        id: "summary",
        name: "课堂总结",
        icon: "FileText",
        description: "课后反馈、学习报告",
        templates: [
          { id: "feedback", name: "课后反馈", type: "text" },
          { id: "report", name: "学习报告", type: "text" },
          { id: "moment", name: "朋友圈素材", type: "image" },
        ],
      },
    ];

    return NextResponse.json({
      success: true,
      data: scenes,
    });
  } catch (error) {
    console.error("获取场景列表错误:", error);
    return NextResponse.json(
      { error: "获取场景列表失败" },
      { status: 500 }
    );
  }
}
