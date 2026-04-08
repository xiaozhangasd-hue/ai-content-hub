import { NextRequest, NextResponse } from "next/server";
import { generatePPTPro, generatePPTFromFile, getCourseDesignConfig, type CourseType } from "@/lib/tools/ppt-generator-pro";
import { LLMClient, Config } from "coze-coding-dev-sdk";

/**
 * 课程PPT生成API - 专业级
 * 
 * 核心能力：
 * 1. 豆包模型深度分析 - 语义理解、知识点提取、教学逻辑规划
 * 2. 专业模板系统 - 10+行业专属模板
 * 3. 智能布局引擎 - 13种布局自动选择
 * 4. 课程专属设计 - 美术/音乐/编程等不同风格
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 课程类型映射
const COURSE_TYPE_MAP: Record<string, CourseType> = {
  "美术课程": "美术课程",
  "音乐课程": "音乐课程",
  "舞蹈课程": "舞蹈课程",
  "编程课程": "编程课程",
  "早教课程": "早教课程",
  "学科辅导": "学科辅导",
  "体育课程": "体育课程",
  "语言培训": "语言培训",
  "职业培训": "职业培训",
  "其他": "其他",
};

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    // 处理文件上传
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const courseType = (formData.get("courseType") as string) || "其他";
      const targetAudience = (formData.get("targetAudience") as string) || "学员";
      const merchantName = formData.get("merchantName") as string;

      if (!file) {
        return NextResponse.json({ error: "请上传文件" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const courseTypeEnum = COURSE_TYPE_MAP[courseType] || "其他";

      const { buffer: pptBuffer, analysis } = await generatePPTFromFile(buffer, file.name, {
        courseType: courseTypeEnum,
        targetAudience,
        merchantName,
      });

      return new NextResponse(new Uint8Array(pptBuffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(analysis.title)}.pptx"`,
        },
      });
    }

    // 处理JSON请求
    const body = await request.json();
    const { action, content, courseType, targetAudience, merchantName, topic, duration } = body;

    // 获取设计配置
    const courseTypeEnum = COURSE_TYPE_MAP[courseType] || "其他";

    // 预览模式：仅返回分析结果
    if (action === "preview") {
      if (!content) {
        return NextResponse.json({ error: "请提供内容" }, { status: 400 });
      }

      const config = new Config();
      const client = new LLMClient(config);

      // 快速分析生成大纲
      const previewPrompt = `快速分析以下内容，生成PPT大纲预览：

${content.slice(0, 3000)}

请以JSON格式输出：
{
  "title": "课程标题",
  "subtitle": "副标题",
  "outline": ["第一章 xxx", "第二章 xxx", ...],
  "keyPoints": ["要点1", "要点2", "要点3"],
  "slideCount": 预估页数
}`;

      const response = await client.invoke(
        [{ role: "user", content: previewPrompt }],
        { model: "doubao-seed-2-0-pro-260215", temperature: 0.7 }
      );

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      const preview = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: topic || "课程", outline: [], keyPoints: [] };

      return NextResponse.json({
        preview,
        designConfig: getCourseDesignConfig(courseTypeEnum),
      });
    }

    // 获取模板配置
    if (action === "getDesignConfig") {
      return NextResponse.json({
        designConfig: getCourseDesignConfig(courseTypeEnum),
        availableLayouts: [
          { id: "cover", name: "封面页", desc: "课程标题和机构信息" },
          { id: "toc", name: "目录页", desc: "课程章节目录" },
          { id: "section-title", name: "章节标题", desc: "章节分隔页" },
          { id: "key-points", name: "要点列表", desc: "展示核心要点" },
          { id: "feature-cards", name: "特点卡片", desc: "展示3-4个特点" },
          { id: "process-flow", name: "流程图", desc: "展示步骤流程" },
          { id: "comparison", name: "对比表格", desc: "方案对比" },
          { id: "two-column", name: "双栏布局", desc: "左右对比" },
          { id: "case-study", name: "案例展示", desc: "背景-方案-结果" },
          { id: "quote", name: "引用页", desc: "名言引用" },
          { id: "practice", name: "练习互动", desc: "课堂练习题" },
          { id: "summary", name: "总结页", desc: "课程总结" },
          { id: "ending", name: "结束页", desc: "谢谢观看" },
        ],
      });
    }

    // 默认：生成完整PPT
    const inputContent = content || topic || "";
    if (!inputContent) {
      return NextResponse.json({ error: "请提供课程内容或主题" }, { status: 400 });
    }

    const { buffer: pptBuffer, analysis } = await generatePPTPro(inputContent, {
      courseType: courseTypeEnum,
      targetAudience: targetAudience || "学员",
      merchantName,
    });

    return new NextResponse(new Uint8Array(pptBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(analysis.title)}.pptx"`,
      },
    });
  } catch (error) {
    console.error("PPT生成错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PPT生成失败，请重试" },
      { status: 500 }
    );
  }
}

// GET: 获取支持的课程类型和设计风格
export async function GET() {
  return NextResponse.json({
    courseTypes: Object.keys(COURSE_TYPE_MAP),
    features: [
      "豆包AI深度分析内容",
      "13种智能布局自动选择",
      "10+行业专属设计模板",
      "教学逻辑自动规划",
      "知识点智能提取",
    ],
  });
}
