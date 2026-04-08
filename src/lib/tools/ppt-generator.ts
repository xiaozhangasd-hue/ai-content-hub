/**
 * PPT生成工具 - 统一版本
 * 
 * 特性：
 * 1. 统一使用豆包模型（无需额外API配置）
 * 2. 双重生成模式：AI深度分析 → 生成PPT
 * 3. 支持行业专属模板
 * 4. 丰富的布局类型（14种）
 * 5. 可选AI自动配图
 */

import { LLMClient, Config } from "coze-coding-dev-sdk";
import PptxGenJS from "pptxgenjs";
import mammoth from "mammoth";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

// ==================== 类型定义 ====================

/** 简单模式参数（兼容原版接口） */
interface PPTGenerationParams {
  title: string;
  content: string;
  theme?: "education-blue" | "business" | "creative" | "minimal";
}

/** 简单模式结果（兼容原版接口） */
interface PPTGenerationResult {
  success: boolean;
  downloadUrl?: string;
  slideCount?: number;
  error?: string;
}

/** 高级模式参数 */
interface PPTAdvancedOptions {
  theme?: string;
  industry?: string;
  merchantName?: string;
  autoGenerateImages?: boolean;
}

/** PPT分析结果 */
interface PPTAnalysisResult {
  title: string;
  subtitle?: string;
  category: "education" | "business" | "creative" | "technical" | "general";
  targetAudience: string;
  keyPoints: string[];
  slides: PPTSlide[];
  suggestedTheme: string;
}

/** 单页幻灯片 */
interface PPTSlide {
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  content: SlideContent;
  notes?: string;
}

/** 幻灯片内容 */
interface SlideContent {
  paragraphs?: string[];
  items?: string[];
  features?: Array<{ title: string; description: string }>;
  leftColumn?: string[];
  rightColumn?: string[];
  quote?: string;
  author?: string;
  comparison?: Array<{ label: string; left: string; right: string }>;
  sections?: Array<{ number: number; title: string }>;
}

/** 布局类型 */
type SlideLayout =
  | "cover"
  | "toc"
  | "section"
  | "text-only"
  | "list"
  | "two-column"
  | "features"
  | "quote"
  | "comparison"
  | "summary"
  | "ending";

// ==================== 主题配置 ====================

const PPT_THEMES: Record<string, ThemeConfig> = {
  "education-blue": {
    name: "教育蓝",
    colors: {
      background: "FFFFFF",
      primary: "2563EB",
      secondary: "3B82F6",
      accent: "F59E0B",
      title: "1E3A8A",
      text: "374151",
      subtitle: "6B7280",
    },
    fonts: { title: "Microsoft YaHei", body: "Microsoft YaHei" },
  },
  business: {
    name: "商务深蓝",
    colors: {
      background: "1E293B",
      primary: "3B82F6",
      secondary: "60A5FA",
      accent: "F59E0B",
      title: "FFFFFF",
      text: "E2E8F0",
      subtitle: "94A3B8",
    },
    fonts: { title: "Microsoft YaHei", body: "Microsoft YaHei" },
  },
  creative: {
    name: "创意渐变",
    colors: {
      background: "FAFAFA",
      primary: "8B5CF6",
      secondary: "A78BFA",
      accent: "EC4899",
      title: "1F2937",
      text: "374151",
      subtitle: "6B7280",
    },
    fonts: { title: "Microsoft YaHei", body: "Microsoft YaHei" },
  },
  minimal: {
    name: "极简白",
    colors: {
      background: "FFFFFF",
      primary: "18181B",
      secondary: "3F3F46",
      accent: "22C55E",
      title: "18181B",
      text: "3F3F46",
      subtitle: "71717A",
    },
    fonts: { title: "Microsoft YaHei", body: "Microsoft YaHei" },
  },
};

interface ThemeConfig {
  name: string;
  colors: {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
    title: string;
    text: string;
    subtitle: string;
  };
  fonts: { title: string; body: string };
}

// ==================== 文档解析 ====================

async function parseDocument(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split(".").pop();

  if (ext === "docx" || ext === "doc") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (ext === "pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  } else {
    return buffer.toString("utf-8");
  }
}

// ==================== AI 分析（使用豆包）====================

async function analyzeContentWithAI(
  content: string,
  options: PPTAdvancedOptions = {}
): Promise<PPTAnalysisResult> {
  const config = new Config();
  const client = new LLMClient(config);

  const systemPrompt = `你是一位资深的PPT设计师和内容策划专家。

## 任务
根据用户提供的内容，设计一份专业、美观、有吸引力的PPT。

## 分析流程
1. 理解内容核心信息和目标受众
2. 提取关键信息，确定信息架构
3. 规划页面结构和布局
4. 推荐合适的视觉主题

## 输出要求
请以JSON格式输出，包含以下字段：
- title: PPT主标题
- subtitle: 副标题（可选）
- category: 内容类别（education/business/creative/technical/general）
- targetAudience: 目标受众
- keyPoints: 核心要点数组（3-5个）
- slides: 幻灯片数组
- suggestedTheme: 推荐主题（education-blue/business/creative/minimal）

## 可用布局类型
- cover: 封面页
- toc: 目录页
- section: 章节分隔页
- text-only: 纯文字页
- list: 要点列表页
- two-column: 双栏对比页
- features: 特点展示页
- quote: 引用页
- comparison: 对比页
- summary: 总结页
- ending: 结束页

## 设计原则
1. 封面要有冲击力
2. 每页内容简洁，不超过5个要点
3. 重要内容用features布局突出
4. 适当使用配图增强视觉
5. 结尾要有总结

${options.industry ? `## 行业信息：${options.industry}` : ""}
${options.merchantName ? `## 机构名称：${options.merchantName}` : ""}`;

  const userPrompt = `请根据以下内容设计PPT：

---
${content.slice(0, 6000)}
---

请分析内容并输出PPT设计方案（JSON格式）。`;

  try {
    const response = await client.invoke(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        model: "doubao-seed-2-0-pro-260215",
        temperature: 0.7,
      }
    );

    // 解析JSON
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("AI分析失败:", error);
  }

  // 返回默认结构
  return createDefaultPPTStructure(content);
}

function createDefaultPPTStructure(content: string): PPTAnalysisResult {
  const lines = content.split("\n").filter((l) => l.trim());
  const title = lines[0]?.slice(0, 50) || "未命名演示";

  return {
    title,
    category: "general",
    targetAudience: "一般受众",
    keyPoints: lines.slice(1, 4).map((l) => l.slice(0, 30)),
    slides: [
      { layout: "cover", title, content: {} },
      {
        layout: "list",
        title: "主要内容",
        content: { items: lines.slice(1, 6).map((l) => l.slice(0, 50)) },
      },
      { layout: "ending", title: "谢谢观看", content: {} },
    ],
    suggestedTheme: "education-blue",
  };
}

// ==================== PPT生成 ====================

async function createPPT(
  analysis: PPTAnalysisResult,
  options: PPTAdvancedOptions = {}
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  const theme =
    PPT_THEMES[options.theme || analysis.suggestedTheme] || PPT_THEMES["education-blue"];

  pptx.layout = "LAYOUT_16x9";
  pptx.title = analysis.title;
  pptx.author = options.merchantName || "南都AI";

  for (const slide of analysis.slides) {
    createSlide(pptx, slide, theme);
  }

  const output = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(output as unknown as Uint8Array);
}

function createSlide(pptx: PptxGenJS, slideData: PPTSlide, theme: ThemeConfig): void {
  const { layout, title, subtitle, content } = slideData;

  switch (layout) {
    case "cover":
      createCoverSlide(pptx, theme, title, subtitle);
      break;
    case "toc":
      createTOCSlide(pptx, theme, content.sections || []);
      break;
    case "section":
      createSectionSlide(pptx, theme, title);
      break;
    case "text-only":
      createTextOnlySlide(pptx, theme, title, content.paragraphs || []);
      break;
    case "list":
      createListSlide(pptx, theme, title, content.items || []);
      break;
    case "two-column":
      createTwoColumnSlide(pptx, theme, title, content.leftColumn || [], content.rightColumn || []);
      break;
    case "features":
      createFeaturesSlide(pptx, theme, title, content.features || []);
      break;
    case "quote":
      createQuoteSlide(pptx, theme, content.quote || title, content.author);
      break;
    case "comparison":
      createComparisonSlide(pptx, theme, title, content.comparison || []);
      break;
    case "summary":
      createSummarySlide(pptx, theme, title, content.items || []);
      break;
    case "ending":
      createEndingSlide(pptx, theme, title);
      break;
    default:
      createListSlide(pptx, theme, title, content.items || []);
  }
}

// ==================== 幻灯片创建函数 ====================

function createCoverSlide(pptx: PptxGenJS, theme: ThemeConfig, title: string, subtitle?: string) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };

  slide.addText(title, {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 1.2,
    fontSize: 44,
    bold: true,
    color: theme.colors.title,
    align: "center",
    fontFace: theme.fonts.title,
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5,
      y: 3.5,
      w: 9,
      h: 0.6,
      fontSize: 20,
      color: theme.colors.subtitle,
      align: "center",
      fontFace: theme.fonts.body,
    });
  }

  slide.addShape(pptx.ShapeType.rect, {
    x: 4,
    y: 4.3,
    w: 2,
    h: 0.08,
    fill: { color: theme.colors.accent },
  });

  slide.addText("由南都AI智能生成", {
    x: 0.5,
    y: 5,
    w: 9,
    h: 0.3,
    fontSize: 10,
    color: theme.colors.subtitle,
    align: "center",
  });
}

function createTOCSlide(pptx: PptxGenJS, theme: ThemeConfig, sections: Array<{ number: number; title: string }>) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };

  slide.addText("目录", {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: theme.colors.title,
    fontFace: theme.fonts.title,
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.2,
    w: 1.5,
    h: 0.06,
    fill: { color: theme.colors.accent },
  });

  sections.slice(0, 6).forEach((section, index) => {
    const yPos = 1.6 + index * 0.7;

    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.8,
      y: yPos,
      w: 0.35,
      h: 0.35,
      fill: { color: theme.colors.primary },
    });

    slide.addText(String(index + 1), {
      x: 0.8,
      y: yPos,
      w: 0.35,
      h: 0.35,
      fontSize: 14,
      bold: true,
      color: "FFFFFF",
      align: "center",
      valign: "middle",
    });

    slide.addText(section.title, {
      x: 1.4,
      y: yPos,
      w: 7,
      h: 0.35,
      fontSize: 18,
      color: theme.colors.text,
      fontFace: theme.fonts.body,
    });
  });
}

function createSectionSlide(pptx: PptxGenJS, theme: ThemeConfig, title: string) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };

  slide.addText(title, {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1,
    fontSize: 40,
    bold: true,
    color: theme.colors.primary,
    align: "center",
    fontFace: theme.fonts.title,
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 4,
    y: 3.8,
    w: 2,
    h: 0.06,
    fill: { color: theme.colors.accent },
  });
}

function createListSlide(pptx: PptxGenJS, theme: ThemeConfig, title: string, items: string[]) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };

  slide.addText(title, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: theme.colors.title,
    fontFace: theme.fonts.title,
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.1,
    w: 1.5,
    h: 0.05,
    fill: { color: theme.colors.accent },
  });

  items.slice(0, 6).forEach((item, index) => {
    const yPos = 1.5 + index * 0.65;

    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: yPos + 0.12,
      w: 0.15,
      h: 0.15,
      fill: { color: theme.colors.primary },
    });

    slide.addText(item, {
      x: 0.8,
      y: yPos,
      w: 8.7,
      h: 0.5,
      fontSize: 18,
      color: theme.colors.text,
      fontFace: theme.fonts.body,
    });
  });
}

function createTextOnlySlide(pptx: PptxGenJS, theme: ThemeConfig, title: string, paragraphs: string[]) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };

  slide.addText(title, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: theme.colors.title,
    fontFace: theme.fonts.title,
  });

  const content = paragraphs.join("\n\n");
  slide.addText(content, {
    x: 0.5,
    y: 1.3,
    w: 9,
    h: 3.5,
    fontSize: 16,
    color: theme.colors.text,
    fontFace: theme.fonts.body,
    valign: "top",
    lineSpacing: 28,
  });
}

function createFeaturesSlide(
  pptx: PptxGenJS,
  theme: ThemeConfig,
  title: string,
  features: Array<{ title: string; description: string }>
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };

  slide.addText(title, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: theme.colors.title,
    fontFace: theme.fonts.title,
  });

  const cardWidth = 2.8;
  const cardGap = 0.3;
  const cards = features.slice(0, 4);
  const startX = (10 - (cards.length * cardWidth + (cards.length - 1) * cardGap)) / 2;

  cards.forEach((feature, index) => {
    const xPos = startX + index * (cardWidth + cardGap);
    const yPos = 1.4;

    slide.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: yPos,
      w: cardWidth,
      h: 3.4,
      fill: { color: "F5F5F5" },
      line: { color: theme.colors.primary, width: 1 },
    });

    slide.addText(String(index + 1).padStart(2, "0"), {
      x: xPos,
      y: yPos + 0.2,
      w: cardWidth,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: theme.colors.primary,
      align: "center",
    });

    slide.addText(feature.title, {
      x: xPos + 0.15,
      y: yPos + 0.9,
      w: cardWidth - 0.3,
      h: 0.5,
      fontSize: 16,
      bold: true,
      color: theme.colors.title,
      align: "center",
    });

    slide.addText(feature.description, {
      x: xPos + 0.15,
      y: yPos + 1.5,
      w: cardWidth - 0.3,
      h: 1.5,
      fontSize: 12,
      color: theme.colors.text,
      align: "center",
      valign: "top",
    });
  });
}

function createTwoColumnSlide(
  pptx: PptxGenJS,
  theme: ThemeConfig,
  title: string,
  leftColumn: string[],
  rightColumn: string[]
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };

  slide.addText(title, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: theme.colors.title,
    fontFace: theme.fonts.title,
  });

  const leftContent = leftColumn.map((item) => `• ${item}`).join("\n");
  slide.addText(leftContent, {
    x: 0.5,
    y: 1.3,
    w: 4.2,
    h: 3.5,
    fontSize: 14,
    color: theme.colors.text,
    fontFace: theme.fonts.body,
    valign: "top",
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 4.9,
    y: 1.3,
    w: 0.02,
    h: 3,
    fill: { color: "E0E0E0" },
  });

  const rightContent = rightColumn.map((item) => `• ${item}`).join("\n");
  slide.addText(rightContent, {
    x: 5.2,
    y: 1.3,
    w: 4.2,
    h: 3.5,
    fontSize: 14,
    color: theme.colors.text,
    fontFace: theme.fonts.body,
    valign: "top",
  });
}

function createQuoteSlide(pptx: PptxGenJS, theme: ThemeConfig, quote: string, author?: string) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };

  slide.addText('"', {
    x: 1,
    y: 1.5,
    w: 1,
    h: 1,
    fontSize: 72,
    color: theme.colors.primary,
    transparency: 30,
  });

  slide.addText(quote, {
    x: 1.5,
    y: 2,
    w: 7,
    h: 1.5,
    fontSize: 24,
    italic: true,
    color: theme.colors.text,
    align: "center",
    fontFace: theme.fonts.body,
  });

  if (author) {
    slide.addText(`—— ${author}`, {
      x: 1.5,
      y: 3.6,
      w: 7,
      h: 0.5,
      fontSize: 16,
      color: theme.colors.subtitle,
      align: "right",
    });
  }
}

function createComparisonSlide(
  pptx: PptxGenJS,
  theme: ThemeConfig,
  title: string,
  comparisons: Array<{ label: string; left: string; right: string }>
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };

  slide.addText(title, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: theme.colors.title,
    fontFace: theme.fonts.title,
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.2,
    w: 4.3,
    h: 0.5,
    fill: { color: theme.colors.primary },
  });
  slide.addText("传统方式", {
    x: 0.5,
    y: 1.2,
    w: 4.3,
    h: 0.5,
    fontSize: 14,
    bold: true,
    color: "FFFFFF",
    align: "center",
    valign: "middle",
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 5.2,
    y: 1.2,
    w: 4.3,
    h: 0.5,
    fill: { color: theme.colors.accent },
  });
  slide.addText("优化方式", {
    x: 5.2,
    y: 1.2,
    w: 4.3,
    h: 0.5,
    fontSize: 14,
    bold: true,
    color: "FFFFFF",
    align: "center",
    valign: "middle",
  });

  comparisons.slice(0, 5).forEach((item, index) => {
    const yPos = 1.9 + index * 0.6;

    slide.addText(item.left, {
      x: 0.5,
      y: yPos,
      w: 4.3,
      h: 0.5,
      fontSize: 14,
      color: theme.colors.text,
      align: "center",
    });

    slide.addText(item.right, {
      x: 5.2,
      y: yPos,
      w: 4.3,
      h: 0.5,
      fontSize: 14,
      color: theme.colors.text,
      align: "center",
    });
  });
}

function createSummarySlide(pptx: PptxGenJS, theme: ThemeConfig, title: string, items: string[]) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };

  slide.addText(title || "课程总结", {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: theme.colors.title,
    fontFace: theme.fonts.title,
  });

  items.slice(0, 5).forEach((item, index) => {
    const yPos = 1.3 + index * 0.7;

    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.5,
      y: yPos,
      w: 0.4,
      h: 0.4,
      fill: { color: theme.colors.primary },
    });

    slide.addText(String(index + 1), {
      x: 0.5,
      y: yPos,
      w: 0.4,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: "FFFFFF",
      align: "center",
      valign: "middle",
    });

    slide.addText(item, {
      x: 1.1,
      y: yPos,
      w: 8.4,
      h: 0.5,
      fontSize: 18,
      color: theme.colors.text,
      fontFace: theme.fonts.body,
    });
  });
}

function createEndingSlide(pptx: PptxGenJS, theme: ThemeConfig, title: string) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };

  slide.addText(title || "谢谢观看", {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 1,
    fontSize: 48,
    bold: true,
    color: theme.colors.title,
    align: "center",
    fontFace: theme.fonts.title,
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 4,
    y: 3.4,
    w: 2,
    h: 0.08,
    fill: { color: theme.colors.accent },
  });

  slide.addText("由南都AI智能生成", {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.3,
    fontSize: 12,
    color: theme.colors.subtitle,
    align: "center",
  });
}

// ==================== 主入口函数 ====================

/**
 * 生成PPT（简单模式 - 兼容原版接口）
 * 用于 chat/route.ts 调用
 */
export async function generatePPT(params: PPTGenerationParams): Promise<PPTGenerationResult> {
  const { title, content, theme = "education-blue" } = params;

  try {
    // 使用豆包AI分析内容
    const analysis = await analyzeContentWithAI(content, { theme });

    // 覆盖标题（用户指定的优先）
    analysis.title = title;

    // 生成PPT
    const buffer = await createPPT(analysis, { theme });
    const base64 = buffer.toString("base64");

    return {
      success: true,
      downloadUrl: `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${base64}`,
      slideCount: analysis.slides.length,
    };
  } catch (error) {
    console.error("PPT generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "PPT生成失败",
    };
  }
}

/**
 * 生成PPT（高级模式 - 带AI分析）
 * 用于需要深度分析的场景
 */
export async function generatePPTAdvanced(
  content: string,
  options: PPTAdvancedOptions = {}
): Promise<{ buffer: Buffer; analysis: PPTAnalysisResult }> {
  const analysis = await analyzeContentWithAI(content, options);
  const buffer = await createPPT(analysis, options);
  return { buffer, analysis };
}

/**
 * 从文件生成PPT
 */
export async function generatePPTFromFile(
  fileBuffer: Buffer,
  fileName: string,
  options: PPTAdvancedOptions = {}
): Promise<{ buffer: Buffer; analysis: PPTAnalysisResult }> {
  const content = await parseDocument(fileBuffer, fileName);
  return generatePPTAdvanced(content, options);
}

// 导出类型
export type {
  PPTGenerationParams,
  PPTGenerationResult,
  PPTAdvancedOptions,
  PPTAnalysisResult,
  PPTSlide,
  SlideContent,
  SlideLayout,
};
