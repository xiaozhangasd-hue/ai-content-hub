import { NextRequest, NextResponse } from "next/server";
import { 
  LessonPlanSyncService, 
  PPTChange, 
  CourseContext, 
  LessonPlan 
} from "@/lib/lesson-plan-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * 教案同步API
 * 
 * 功能：
 * 1. 同步教案 - 当PPT结构变化时自动更新教案
 * 2. 生成教案 - 从PPT生成完整教案
 * 3. 导出教案 - 导出为Word/PDF格式
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = process.env.BAILIAN_API_KEY || "sk-ae4c2b48a76c4072a3bdbf9e69f16138";

    const { action, pptChanges, originalLessonPlan, courseContext, slides } = body;

    const service = new LessonPlanSyncService(apiKey);

    switch (action) {
      case "sync":
        // 同步教案
        if (!pptChanges) {
          return NextResponse.json({ error: "缺少pptChanges参数" }, { status: 400 });
        }

        const syncResult = await service.syncLessonPlan(
          pptChanges as PPTChange,
          originalLessonPlan as LessonPlan | string | null,
          courseContext as CourseContext
        );

        return NextResponse.json(syncResult);

      case "generate":
        // 从PPT生成完整教案
        if (!slides || !Array.isArray(slides)) {
          return NextResponse.json({ error: "缺少slides参数" }, { status: 400 });
        }

        const lessonPlan = await service.generateLessonPlanFromPPT(
          slides,
          courseContext as CourseContext
        );

        return NextResponse.json({
          success: true,
          lessonPlan,
        });

      case "export":
        // 导出教案为文本格式
        const plan = body.lessonPlan as LessonPlan;
        const exportFormat = body.format || "text";

        if (exportFormat === "markdown") {
          const markdown = generateMarkdown(plan);
          return new NextResponse(markdown, {
            headers: {
              "Content-Type": "text/markdown; charset=utf-8",
              "Content-Disposition": `attachment; filename="${plan.title}.md"`,
            },
          });
        }

        // 默认返回JSON
        return NextResponse.json(plan);

      default:
        return NextResponse.json({ error: "未知操作" }, { status: 400 });
    }
  } catch (error) {
    console.error("教案同步错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "处理失败" },
      { status: 500 }
    );
  }
}

// GET: 获取API状态
export async function GET() {
  return NextResponse.json({
    status: "ready",
    message: "教案同步服务已就绪",
    features: [
      "PPT变化检测 → 自动更新教案",
      "新增页面 → 生成配套教案章节",
      "修改页面 → 更新关联教案内容",
      "删除页面 → 标记教案章节",
      "时长冲突检测",
      "从PPT生成完整教案",
      "导出教案为Markdown",
    ],
    actions: {
      sync: "同步教案（检测PPT变化）",
      generate: "从PPT生成完整教案",
      export: "导出教案",
    },
    example: {
      action: "sync",
      pptChanges: {
        added: [{ id: "page_3", title: "小猫的秘密", type: "knowledge" }],
        modified: [{ id: "page_1", oldTitle: "第一关", newTitle: "第一关：嘴巴粘粘怪" }],
        deleted: [{ id: "page_5", title: "过渡页" }],
      },
      courseContext: {
        courseType: "口才课程",
        targetAudience: "3-5岁幼儿",
        totalDuration: "30分钟",
      },
    },
  });
}

/**
 * 生成Markdown格式的教案
 */
function generateMarkdown(plan: LessonPlan): string {
  let md = `# ${plan.title}\n\n`;
  md += `**课程类型：** ${plan.courseType}  \n`;
  md += `**目标学员：** ${plan.targetAudience}  \n`;
  md += `**总时长：** ${plan.totalDuration}\n\n`;
  md += `---\n\n`;

  for (const section of plan.sections) {
    if (section.status === "deleted") continue;

    md += `## ${section.title}\n\n`;
    md += `**时长：** ${section.duration}  \n`;
    md += `**状态：** ${section.status || "保持"}\n\n`;
    
    md += `### 教学目标\n${section.objectives}\n\n`;
    md += `### 教师话术\n\`\`\`\n${section.script}\n\`\`\`\n\n`;
    md += `### 互动设计\n${section.interaction}\n\n`;
    
    if (section.teachingTips) {
      md += `### 教学提示\n${section.teachingTips}\n\n`;
    }
    
    if (section.materials && section.materials.length > 0) {
      md += `### 所需材料\n${section.materials.map(m => `- ${m}`).join("\n")}\n\n`;
    }
    
    md += `---\n\n`;
  }

  if (plan.summary) {
    md += `## 变更摘要\n\n`;
    md += `- 新增章节：${plan.summary.addedSections}\n`;
    md += `- 修改章节：${plan.summary.modifiedSections}\n`;
    md += `- 删除章节：${plan.summary.deletedSections}\n`;
  }

  return md;
}
