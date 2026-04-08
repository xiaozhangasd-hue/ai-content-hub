import { NextRequest, NextResponse } from "next/server";
import { CozePPTClient } from "@/lib/coze-ppt-client";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * 扣子PPT生成API
 * 
 * 支持三种模式：
 * 1. 工作流模式 - 使用扣子平台创建的PPT生成工作流（推荐）
 * 2. Bot模式 - 使用扣子平台创建的PPT生成Bot
 * 3. LLM模式 - 直接使用扣子LLM生成内容
 * 
 * 环境变量配置：
 * - COZE_API_KEY: 扣子API密钥（从扣子平台获取）
 * - COZE_PPT_WORKFLOW_ID: PPT生成工作流ID（可选）
 * - COZE_PPT_BOT_ID: PPT生成Bot ID（可选）
 */

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    // 检查配置
    const apiKey = process.env.COZE_API_KEY || process.env.COZE_PAT;
    const workflowId = process.env.COZE_PPT_WORKFLOW_ID || "";
    const botId = process.env.COZE_PPT_BOT_ID || "";

    if (!apiKey) {
      return NextResponse.json({
        error: "未配置扣子API Key",
        hint: "请在.env.local中设置 COZE_API_KEY=your_api_key",
        getApiKey: "https://www.coze.cn/open/oauth/pats",
      }, { status: 400 });
    }

    let content = "";
    let courseType = "课程";
    let targetAudience = "学员";
    let style = "现代简约";
    let mode: "workflow" | "bot" | "llm" = "llm";

    // 处理文件上传
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      courseType = (formData.get("courseType") as string) || "课程";
      targetAudience = (formData.get("targetAudience") as string) || "学员";
      style = (formData.get("style") as string) || "现代简约";
      mode = (formData.get("mode") as "workflow" | "bot" | "llm") || "llm";

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
      style = body.style || "现代简约";
      mode = body.mode || "llm";
    }

    if (!content || content.length < 20) {
      return NextResponse.json({ error: "文档内容过少" }, { status: 400 });
    }

    // 使用扣子生成PPT
    const client = new CozePPTClient(apiKey, workflowId);
    
    let result;
    if (mode === "workflow" && workflowId) {
      console.log("[CozePPT] 使用工作流模式生成...");
      result = await client.generatePPT(content, { courseType, targetAudience, style });
    } else if (mode === "bot" && botId) {
      console.log("[CozePPT] 使用Bot模式生成...");
      result = await client.generatePPTWithBot(botId, content, { courseType, targetAudience, style });
    } else {
      console.log("[CozePPT] 使用LLM模式生成...");
      result = await client.generatePPTWithLLM(content, { courseType, targetAudience, style });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "生成失败" },
        { status: 500 }
      );
    }

    // 如果返回的是PPT URL，直接返回
    if (result.pptUrl) {
      return NextResponse.json({
        success: true,
        pptUrl: result.pptUrl,
        message: "PPT生成成功，点击链接下载",
      });
    }

    // 如果返回的是结构化数据，转换为前端格式
    if (result.slides) {
      const storyboard = {
        title: `${courseType}课程`,
        subtitle: `面向${targetAudience}`,
        targetAudience,
        duration: `${Math.ceil(result.slides.length * 2)}分钟`,
        slides: result.slides.map((slide, index) => ({
          id: index + 1,
          type: index === 0 ? "cover" as const : index === result.slides!.length - 1 ? "ending" as const : "content" as const,
          title: slide.title,
          content: slide.content.slice(0, 5),
          visual: {
            layout: "centered" as const,
            imageUrl: slide.imageUrl,
            imagePosition: "center" as const,
          },
          narrative: {
            hook: `本页介绍${slide.title}`,
            keyMessage: slide.title,
            transition: "",
          },
          teacherNote: `教学要点：${slide.title}`,
        })),
      };

      return NextResponse.json({
        success: true,
        storyboard,
      });
    }

    return NextResponse.json({
      error: "生成结果为空",
    }, { status: 500 });

  } catch (error) {
    console.error("扣子PPT生成错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成失败" },
      { status: 500 }
    );
  }
}

// GET: 获取API状态和配置指南
export async function GET() {
  const apiKey = process.env.COZE_API_KEY || process.env.COZE_PAT;
  const workflowId = process.env.COZE_PPT_WORKFLOW_ID;
  const botId = process.env.COZE_PPT_BOT_ID;

  return NextResponse.json({
    status: apiKey ? "configured" : "not_configured",
    message: apiKey ? "扣子PPT生成服务已配置" : "扣子PPT生成服务未配置",
    config: {
      hasApiKey: !!apiKey,
      hasWorkflow: !!workflowId,
      hasBot: !!botId,
    },
    setup: {
      step1: {
        title: "获取API Key",
        description: "访问扣子开放平台创建Personal Access Token",
        url: "https://www.coze.cn/open/oauth/pats",
      },
      step2: {
        title: "配置环境变量",
        description: "在.env.local中添加配置",
        env: [
          "COZE_API_KEY=your_api_key",
          "# 可选：PPT生成工作流ID",
          "COZE_PPT_WORKFLOW_ID=your_workflow_id",
          "# 可选：PPT生成Bot ID",
          "COZE_PPT_BOT_ID=your_bot_id",
        ],
      },
      step3: {
        title: "创建PPT生成工作流（推荐）",
        description: "在扣子平台创建工作流，添加文档生成节点",
        url: "https://www.coze.cn/workspace",
      },
    },
    modes: {
      workflow: {
        name: "工作流模式",
        description: "使用扣子工作流生成PPT，支持复杂流程和文档输出",
        recommended: true,
        requires: "COZE_PPT_WORKFLOW_ID",
      },
      bot: {
        name: "Bot模式",
        description: "使用扣子Bot生成PPT，支持对话交互",
        requires: "COZE_PPT_BOT_ID",
      },
      llm: {
        name: "LLM模式",
        description: "直接使用扣子LLM生成PPT内容",
        default: true,
        requires: "COZE_API_KEY",
      },
    },
    provider: "扣子(Coze)",
    website: "https://www.coze.cn",
  });
}
