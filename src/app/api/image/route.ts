import { NextRequest, NextResponse } from "next/server";
import { ImageClient } from "@/lib/image-client";

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = "1024x1024" } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "请输入图片描述" },
        { status: 400 }
      );
    }

    const client = new ImageClient();

    const imageUrls = await client.generate({
      prompt,
      size: size as "512x512" | "768x768" | "1024x1024" | "1280x720" | "1920x1080",
    });

    if (imageUrls.length > 0) {
      return NextResponse.json({
        success: true,
        imageUrls,
      });
    } else {
      return NextResponse.json(
        { error: "图片生成失败" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("图片生成错误:", error);
    const errorMessage = error instanceof Error ? error.message : "图片生成失败";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
