import { NextRequest, NextResponse } from "next/server";
import { BailianPPTClient } from "@/lib/bailian-ppt-client";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5分钟超时

/**
 * 阿里云百炼PPT生成API
 * 
 * 流程：
 * 1. 上传文档 → 解析内容
 * 2. 通义千问生成PPT内容
 * 3. 通义万相生成每页配图
 * 4. 返回完整数据用于网页演示和PPTX导出
 */

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const apiKey = process.env.BAILIAN_API_KEY || "sk-ae4c2b48a76c4072a3bdbf9e69f16138";

    // 处理文件上传
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const courseType = (formData.get("courseType") as string) || "其他";
      const targetAudience = (formData.get("targetAudience") as string) || "学员";

      if (!file) {
        return NextResponse.json({ error: "请上传文件" }, { status: 400 });
      }

      // 解析文件内容
      const buffer = Buffer.from(await file.arrayBuffer());
      let content = "";

      if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        const result = await mammoth.extractRawText({ buffer });
        content = result.value || "";
      } else if (file.name.endsWith(".pdf")) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");
        const data = await pdfParse(buffer);
        content = data.text || "";
      } else {
        content = buffer.toString("utf-8");
      }

      if (!content || content.length < 20) {
        return NextResponse.json({ error: "文档内容过少" }, { status: 400 });
      }

      // 使用阿里云百炼生成PPT（含配图）
      const client = new BailianPPTClient(apiKey);
      const result = await client.generatePPT(content, {
        courseType,
        targetAudience,
        generateImages: true, // 启用配图生成
      });

      if (!result.success || !result.storyboard) {
        return NextResponse.json(
          { error: result.error || "生成失败" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        storyboard: result.storyboard,
      });
    }

    // 处理JSON请求
    const body = await request.json();
    const { content, courseType, targetAudience } = body;

    if (!content) {
      return NextResponse.json({ error: "请提供内容" }, { status: 400 });
    }

    const client = new BailianPPTClient(apiKey);
    const result = await client.generatePPT(content, {
      courseType: courseType || "其他",
      targetAudience: targetAudience || "学员",
      generateImages: true,
    });

    if (!result.success || !result.storyboard) {
      return NextResponse.json(
        { error: result.error || "生成失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      storyboard: result.storyboard,
    });
  } catch (error) {
    console.error("阿里云百炼PPT生成错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成失败" },
      { status: 500 }
    );
  }
}

// GET: 获取API状态
export async function GET() {
  return NextResponse.json({
    status: "ready",
    message: "阿里云百炼PPT生成服务已就绪",
    features: [
      "通义千问生成内容",
      "通义万相生成配图",
      "支持DOCX/PDF/TXT格式",
      "每页AI配图",
      "网页交互演示",
      "PPTX文件导出",
    ],
    models: {
      text: "qwen-plus",
      image: "wanx-v1",
    },
    provider: "阿里云百炼",
  });
}
