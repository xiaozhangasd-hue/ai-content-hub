import { NextRequest, NextResponse } from "next/server";

/**
 * 扣子Bot测试API
 * 用于验证Token和获取Bot信息
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const pat = process.env.COZE_API_KEY || process.env.COZE_PAT;
  
  if (!pat) {
    return NextResponse.json({ 
      error: "未配置扣子Token",
      hint: "请在环境变量中设置 COZE_API_KEY 或 COZE_PAT"
    }, { status: 400 });
  }

  try {
    // 尝试获取用户的Bot列表
    const response = await fetch("https://api.coze.cn/v1/bot/list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${pat}`,
      },
      body: JSON.stringify({
        page_size: 20,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        error: "扣子API调用失败",
        details: data,
        tokenPrefix: pat.substring(0, 10) + "...",
      }, { status: 500 });
    }

    // 返回Bot列表
    const bots = data.data?.bot_list || [];
    
    return NextResponse.json({
      success: true,
      botCount: bots.length,
      bots: bots.map((bot: any) => ({
        id: bot.bot_id,
        name: bot.bot_name,
        description: bot.description,
        version: bot.version,
      })),
      hint: bots.length > 0 
        ? "请选择一个Bot ID，设置到环境变量 COZE_BOT_ID"
        : "您还没有创建Bot，请先在扣子平台创建一个智能体",
    });

  } catch (error) {
    return NextResponse.json({
      error: "请求失败",
      message: error instanceof Error ? error.message : "未知错误",
    }, { status: 500 });
  }
}
