import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const TMP_DIR = "/tmp/video-compose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    
    if (!taskId) {
      return NextResponse.json({ error: "缺少taskId" }, { status: 400 });
    }

    const filePath = path.join(TMP_DIR, taskId, "output.mp4");
    
    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "文件不存在或已过期" }, { status: 404 });
    }

    // 读取文件
    const fileBuffer = await fs.readFile(filePath);
    
    // 返回视频流
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="composed-video-${taskId}.mp4"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("[文件下载] 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "下载失败" },
      { status: 500 }
    );
  }
}
