import { NextRequest, NextResponse } from "next/server";
import { AdvancedPPTClient, DesignStyle } from "@/lib/advanced-ppt-client";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600; // 10分钟超时

/**
 * 高级PPT生成API
 * 
 * 多模型协作工作流：
 * 1. 深度分析文档内容
 * 2. 设计叙事结构和分镜
 * 3. 生成风格统一的配图
 * 4. 返回高级PPT剧本
 */

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const apiKey = process.env.BAILIAN_API_KEY || "sk-ae4c2b48a76c4072a3bdbf9e69f16138";

    let content = "";
    let courseType = "课程";
    let targetAudience = "学员";
    let style: DesignStyle | undefined;

    // 处理文件上传
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      courseType = (formData.get("courseType") as string) || "课程";
      targetAudience = (formData.get("targetAudience") as string) || "学员";
      style = formData.get("style") as DesignStyle | undefined;

      if (!file) {
        return NextResponse.json({ error: "请上传文件" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

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
    } else {
      // JSON请求
      const body = await request.json();
      content = body.content;
      courseType = body.courseType || "课程";
      targetAudience = body.targetAudience || "学员";
      style = body.style;
    }

    if (!content || content.length < 20) {
      return NextResponse.json({ error: "文档内容过少" }, { status: 400 });
    }

    // 使用高级PPT引擎
    const client = new AdvancedPPTClient(apiKey);
    const result = await client.generatePPT(content, {
      courseType,
      targetAudience,
      style,
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
    console.error("高级PPT生成错误:", error);
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
    message: "高级PPT生成服务已就绪",
    workflow: [
      "1. 深度分析文档内容",
      "2. 智能匹配设计风格",
      "3. 设计叙事结构",
      "4. 生成风格统一配图",
      "5. 输出高级PPT剧本",
    ],
    styles: [
      { id: "playful", name: "童趣活泼", suitable: "幼儿课程" },
      { id: "modern", name: "现代简约", suitable: "商务培训" },
      { id: "creative", name: "创意艺术", suitable: "美术音乐" },
      { id: "tech", name: "科技未来", suitable: "编程科技" },
      { id: "elegant", name: "优雅精致", suitable: "高端课程" },
    ],
    models: {
      analysis: "qwen-plus",
      design: "qwen-plus",
      image: "wanx-v1",
    },
    provider: "阿里云百炼",
  });
}
