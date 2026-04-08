import { NextRequest, NextResponse } from "next/server";
import { VideoClient } from "@/lib/video-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      duration = 5, 
      ratio = "16:9", 
      resolution = "720p",
      model = "v2-5",  // 默认使用v2-5-turbo模型
      mode = "std"
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "请输入视频描述" },
        { status: 400 }
      );
    }

    const client = new VideoClient();

    const result = await client.generate({
      prompt,
      duration,
      aspectRatio: ratio as "16:9" | "9:16" | "1:1",
      resolution: resolution as "720p" | "1080p",
      model: model as "v1" | "v1-5" | "v2-5",
      mode: mode as "std" | "pro",
    });

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: result.error || "视频生成失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      taskId: result.taskId,
      status: result.status,
      message: "视频生成任务已提交，请使用taskId查询进度",
    });
  } catch (error) {
    console.error("视频生成错误:", error);
    let errorMessage = error instanceof Error ? error.message : "视频生成失败";
    
    // 友好化错误提示
    if (errorMessage.includes("unauthorized consumer") || errorMessage.includes("Forbidden") || errorMessage.includes("403")) {
      errorMessage = "⚠️ 可灵AI API需要购买资源包才能使用。\n\n请按以下步骤操作：\n1. 访问 https://klingai.com/cn/dev/model/video\n2. 购买视频生成资源包（有试用额度可领取）\n3. 购买后即可正常调用API";
    } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      errorMessage = "API认证失败，请检查Access Key和Secret Key配置是否正确";
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// 查询视频生成状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: "请提供taskId" },
        { status: 400 }
      );
    }

    const client = new VideoClient();
    const result = await client.getTaskStatus(taskId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("查询视频状态错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询失败" },
      { status: 500 }
    );
  }
}
