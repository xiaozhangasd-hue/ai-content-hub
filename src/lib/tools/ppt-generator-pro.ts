/**
 * 专业级PPT生成引擎
 * 
 * 核心能力：
 * 1. 豆包模型深度分析 - 语义理解、知识点提取、教学逻辑规划
 * 2. 专业模板系统 - 10+行业专属模板
 * 3. 智能布局引擎 - 根据内容自动选择最佳布局
 * 4. 视觉设计优化 - 配色、字体、装饰元素
 * 
 * 目标：达到Gamma 85%效果水平
 */

import { LLMClient, Config } from "coze-coding-dev-sdk";
import PptxGenJS from "pptxgenjs";
import mammoth from "mammoth";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

// ==================== 类型定义 ====================

export interface PPTGenerationOptions {
  /** 课程类型 */
  courseType?: CourseType;
  /** 目标学员 */
  targetAudience?: string;
  /** 机构名称 */
  merchantName?: string;
  /** 机构Logo URL */
  logoUrl?: string;
  /** 是否生成配图 */
  generateImages?: boolean;
  /** 自定义主题 */
  customTheme?: string;
}

export type CourseType = 
  | "美术课程"
  | "音乐课程"
  | "舞蹈课程"
  | "编程课程"
  | "早教课程"
  | "学科辅导"
  | "体育课程"
  | "语言培训"
  | "职业培训"
  | "其他";

export interface PPTAnalysisResult {
  title: string;
  subtitle?: string;
  courseInfo: {
    type: CourseType;
    targetAudience: string;
    duration: number;
    difficulty: "入门" | "进阶" | "高级";
  };
  outline: {
    sections: Section[];
    totalSlides: number;
  };
  slides: ProSlide[];
  designSuggestion: DesignSuggestion;
}

export interface Section {
  id: number;
  title: string;
  description: string;
  slideCount: number;
  keyPoints: string[];
}

export interface ProSlide {
  id: number;
  layout: ProLayout;
  title: string;
  subtitle?: string;
  content: SlideContent;
  teachingNote?: string;
  imagePrompt?: string;
  animation?: AnimationConfig;
}

export type ProLayout =
  | "cover"           // 封面
  | "toc"             // 目录
  | "section-title"   // 章节标题
  | "key-points"      // 要点列表
  | "two-column"      // 双栏对比
  | "three-columns"   // 三栏展示
  | "feature-cards"   // 特点卡片
  | "process-flow"    // 流程图
  | "comparison"      // 对比表格
  | "case-study"      // 案例展示
  | "quote"           // 引用/名言
  | "practice"        // 练习互动
  | "summary"         // 总结
  | "ending";         // 结束

export interface SlideContent {
  text?: string;
  paragraphs?: string[];
  items?: string[];
  features?: FeatureItem[];
  columns?: ColumnItem[];
  process?: ProcessStep[];
  comparison?: ComparisonItem[];
  caseStudy?: CaseStudyData;
  quote?: QuoteData;
  practice?: PracticeData;
  summary?: SummaryItem[];
}

export interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
  highlight?: boolean;
}

export interface ColumnItem {
  title: string;
  content: string[];
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
  icon?: string;
}

export interface ComparisonItem {
  aspect: string;
  option1: string;
  option2: string;
}

export interface CaseStudyData {
  title: string;
  background: string;
  solution: string;
  result: string;
}

export interface QuoteData {
  text: string;
  author?: string;
  source?: string;
}

export interface PracticeData {
  question: string;
  options?: string[];
  answer?: string;
  hint?: string;
}

export interface SummaryItem {
  number: number;
  content: string;
}

export interface DesignSuggestion {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  titleFont: string;
  bodyFont: string;
  style: "modern" | "classic" | "playful" | "professional" | "creative";
}

export interface AnimationConfig {
  type: "fade" | "slide" | "zoom" | "none";
  duration: number;
}

// ==================== 课程类型专属设计配置 ====================

const COURSE_DESIGN_CONFIG: Record<CourseType, DesignSuggestion> = {
  "美术课程": {
    primaryColor: "E91E63",
    secondaryColor: "9C27B0",
    accentColor: "FFC107",
    backgroundColor: "FAFAFA",
    textColor: "333333",
    titleFont: "Microsoft YaHei",
    bodyFont: "Microsoft YaHei",
    style: "creative",
  },
  "音乐课程": {
    primaryColor: "673AB7",
    secondaryColor: "3F51B5",
    accentColor: "FF4081",
    backgroundColor: "F5F5F5",
    textColor: "333333",
    titleFont: "Microsoft YaHei",
    bodyFont: "Microsoft YaHei",
    style: "modern",
  },
  "舞蹈课程": {
    primaryColor: "FF5722",
    secondaryColor: "E91E63",
    accentColor: "FFC107",
    backgroundColor: "FFF8E1",
    textColor: "333333",
    titleFont: "Microsoft YaHei",
    bodyFont: "Microsoft YaHei",
    style: "playful",
  },
  "编程课程": {
    primaryColor: "2196F3",
    secondaryColor: "00BCD4",
    accentColor: "4CAF50",
    backgroundColor: "FFFFFF",
    textColor: "263238",
    titleFont: "Microsoft YaHei",
    bodyFont: "Consolas",
    style: "modern",
  },
  "早教课程": {
    primaryColor: "FF9800",
    secondaryColor: "FFC107",
    accentColor: "8BC34A",
    backgroundColor: "FFFDE7",
    textColor: "5D4037",
    titleFont: "Microsoft YaHei",
    bodyFont: "Microsoft YaHei",
    style: "playful",
  },
  "学科辅导": {
    primaryColor: "1565C0",
    secondaryColor: "0D47A1",
    accentColor: "FF6F00",
    backgroundColor: "FFFFFF",
    textColor: "263238",
    titleFont: "Microsoft YaHei",
    bodyFont: "Microsoft YaHei",
    style: "professional",
  },
  "体育课程": {
    primaryColor: "4CAF50",
    secondaryColor: "8BC34A",
    accentColor: "FF5722",
    backgroundColor: "F1F8E9",
    textColor: "333333",
    titleFont: "Microsoft YaHei",
    bodyFont: "Microsoft YaHei",
    style: "modern",
  },
  "语言培训": {
    primaryColor: "00838F",
    secondaryColor: "00ACC1",
    accentColor: "FF6D00",
    backgroundColor: "FFFFFF",
    textColor: "333333",
    titleFont: "Microsoft YaHei",
    bodyFont: "Microsoft YaHei",
    style: "classic",
  },
  "职业培训": {
    primaryColor: "37474F",
    secondaryColor: "546E7A",
    accentColor: "2196F3",
    backgroundColor: "FFFFFF",
    textColor: "263238",
    titleFont: "Microsoft YaHei",
    bodyFont: "Microsoft YaHei",
    style: "professional",
  },
  "其他": {
    primaryColor: "1976D2",
    secondaryColor: "42A5F5",
    accentColor: "FF9800",
    backgroundColor: "FFFFFF",
    textColor: "333333",
    titleFont: "Microsoft YaHei",
    bodyFont: "Microsoft YaHei",
    style: "modern",
  },
};

// ==================== AI深度分析 ====================

async function analyzeContentDeeply(
  content: string,
  options: PPTGenerationOptions
): Promise<PPTAnalysisResult> {
  const config = new Config();
  const client = new LLMClient(config);

  const courseType = options.courseType || "其他";
  const targetAudience = options.targetAudience || "学员";
  const designConfig = COURSE_DESIGN_CONFIG[courseType];

  const systemPrompt = `你是一位资深的教学设计师和PPT专家，擅长将教学内容转化为专业、美观、有逻辑的PPT演示文稿。

## 你的任务
根据用户提供的教学内容，设计一份专业的PPT课件。

## 分析流程（请严格按此执行）
1. **内容理解**：深度理解教学内容的核心知识点和教学目标
2. **结构规划**：按照教学逻辑拆分章节，确定每章的重点
3. **布局设计**：为每个知识点选择最合适的展示方式
4. **视觉建议**：提供配图描述，增强教学效果

## 输出要求
请以JSON格式输出，结构如下：

{
  "title": "课程标题",
  "subtitle": "副标题（可选）",
  "courseInfo": {
    "type": "${courseType}",
    "targetAudience": "${targetAudience}",
    "duration": 预估课时（分钟）,
    "difficulty": "入门|进阶|高级"
  },
  "outline": {
    "sections": [
      {
        "id": 1,
        "title": "章节标题",
        "description": "章节概述",
        "slideCount": 该章节页数,
        "keyPoints": ["要点1", "要点2"]
      }
    ],
    "totalSlides": 总页数
  },
  "slides": [
    {
      "id": 1,
      "layout": "布局类型（见下方说明）",
      "title": "页面标题",
      "subtitle": "副标题（可选）",
      "content": { /* 根据布局类型填充 */ },
      "teachingNote": "教学备注（可选）",
      "imagePrompt": "配图描述（可选，用于AI生成配图）"
    }
  ]
}

## 可用布局类型及content结构

### 1. cover（封面）
{
  "layout": "cover",
  "title": "课程标题",
  "subtitle": "副标题",
  "content": {
    "text": "机构名称/讲师信息"
  }
}

### 2. toc（目录）
{
  "layout": "toc",
  "title": "课程目录",
  "content": {
    "items": ["第一章 xxx", "第二章 xxx", ...]
  }
}

### 3. section-title（章节标题）
{
  "layout": "section-title",
  "title": "第一章",
  "subtitle": "章节名称",
  "content": {
    "text": "章节概述"
  }
}

### 4. key-points（要点列表）- 最常用
{
  "layout": "key-points",
  "title": "页面标题",
  "content": {
    "items": ["要点1", "要点2", "要点3", "要点4"]
  }
}

### 5. feature-cards（特点卡片）- 展示3-4个特点
{
  "layout": "feature-cards",
  "title": "页面标题",
  "content": {
    "features": [
      {"title": "特点1", "description": "详细说明"},
      {"title": "特点2", "description": "详细说明"},
      {"title": "特点3", "description": "详细说明"}
    ]
  }
}

### 6. process-flow（流程图）- 展示步骤
{
  "layout": "process-flow",
  "title": "页面标题",
  "content": {
    "process": [
      {"step": 1, "title": "步骤1", "description": "说明"},
      {"step": 2, "title": "步骤2", "description": "说明"},
      {"step": 3, "title": "步骤3", "description": "说明"}
    ]
  }
}

### 7. comparison（对比表格）
{
  "layout": "comparison",
  "title": "页面标题",
  "content": {
    "comparison": [
      {"aspect": "对比项1", "option1": "A方案", "option2": "B方案"},
      {"aspect": "对比项2", "option1": "A方案", "option2": "B方案"}
    ]
  }
}

### 8. two-column（双栏）
{
  "layout": "two-column",
  "title": "页面标题",
  "content": {
    "columns": [
      {"title": "左栏标题", "content": ["内容1", "内容2"]},
      {"title": "右栏标题", "content": ["内容1", "内容2"]}
    ]
  }
}

### 9. case-study（案例展示）
{
  "layout": "case-study",
  "title": "案例：xxx",
  "content": {
    "caseStudy": {
      "title": "案例标题",
      "background": "背景描述",
      "solution": "解决方案",
      "result": "结果"
    }
  }
}

### 10. quote（引用/名言）
{
  "layout": "quote",
  "content": {
    "quote": {
      "text": "引用内容",
      "author": "作者"
    }
  }
}

### 11. practice（练习互动）
{
  "layout": "practice",
  "title": "课堂练习",
  "content": {
    "practice": {
      "question": "问题",
      "options": ["选项A", "选项B", "选项C"],
      "hint": "提示"
    }
  }
}

### 12. summary（总结）
{
  "layout": "summary",
  "title": "课程总结",
  "content": {
    "summary": [
      {"number": 1, "content": "总结要点1"},
      {"number": 2, "content": "总结要点2"},
      {"number": 3, "content": "总结要点3"}
    ]
  }
}

### 13. ending（结束页）
{
  "layout": "ending",
  "title": "谢谢观看",
  "content": {}
}

## 设计原则

1. **封面要吸引人**：标题简洁有力，突出课程价值
2. **目录要清晰**：展示整体结构
3. **内容要精简**：每页3-5个要点，不要堆砌文字
4. **布局要丰富**：避免连续使用相同布局
5. **逻辑要连贯**：章节之间有过渡
6. **结尾要有力**：总结重点，引导行动

## 课程类型：${courseType}
## 目标学员：${targetAudience}

请根据课程特点，选择合适的布局和配图风格。`;

  const userPrompt = `请分析以下教学内容，设计一份专业的PPT课件：

---
${content.slice(0, 8000)}
---

要求：
1. 内容要完整覆盖所有知识点
2. 结构要清晰，逻辑要连贯
3. 每页内容精简，重点突出
4. 合理使用不同的布局类型
5. 为重要页面提供配图描述`;

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
      const result = JSON.parse(jsonMatch[0]);
      return {
        ...result,
        designSuggestion: designConfig,
      } as PPTAnalysisResult;
    }
  } catch (error) {
    console.error("AI分析失败:", error);
  }

  // 返回默认结构
  return createDefaultAnalysis(content, courseType, targetAudience);
}

function createDefaultAnalysis(
  content: string,
  courseType: CourseType,
  targetAudience: string
): PPTAnalysisResult {
  const lines = content.split("\n").filter((l) => l.trim());
  const title = lines[0]?.slice(0, 50) || "课程培训";

  return {
    title,
    courseInfo: {
      type: courseType,
      targetAudience,
      duration: 45,
      difficulty: "入门",
    },
    outline: {
      sections: [{ id: 1, title: "课程内容", description: "", slideCount: 3, keyPoints: [] }],
      totalSlides: 5,
    },
    slides: [
      { id: 1, layout: "cover", title, content: {} },
      {
        id: 2,
        layout: "key-points",
        title: "课程内容",
        content: { items: lines.slice(1, 5).map((l) => l.slice(0, 50)) },
      },
      { id: 3, layout: "ending", title: "谢谢观看", content: {} },
    ],
    designSuggestion: COURSE_DESIGN_CONFIG[courseType],
  };
}

// ==================== PPT生成引擎 ====================

async function generatePPTX(
  analysis: PPTAnalysisResult,
  options: PPTGenerationOptions
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  const design = analysis.designSuggestion;

  // 基础设置
  pptx.layout = "LAYOUT_16x9";
  pptx.title = analysis.title;
  pptx.author = options.merchantName || "南都AI";

  // 定义主题颜色
  const colors = {
    primary: design.primaryColor,
    secondary: design.secondaryColor,
    accent: design.accentColor,
    background: design.backgroundColor,
    text: design.textColor,
    white: "FFFFFF",
    lightGray: "F5F5F5",
    darkGray: "666666",
  };

  // 生成每一页
  for (const slide of analysis.slides) {
    createProSlide(pptx, slide, colors, options);
  }

  const output = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(output as unknown as Uint8Array);
}

function createProSlide(
  pptx: PptxGenJS,
  slideData: ProSlide,
  colors: Record<string, string>,
  options: PPTGenerationOptions
): void {
  const { layout, title, subtitle, content } = slideData;

  switch (layout) {
    case "cover":
      createCoverSlide(pptx, title, colors, options, subtitle);
      break;
    case "toc":
      createTOCSlide(pptx, content.items || [], colors);
      break;
    case "section-title":
      createSectionTitleSlide(pptx, title, colors, subtitle, content.text);
      break;
    case "key-points":
      createKeyPointsSlide(pptx, title, content.items || [], colors);
      break;
    case "feature-cards":
      createFeatureCardsSlide(pptx, title, content.features || [], colors);
      break;
    case "process-flow":
      createProcessFlowSlide(pptx, title, content.process || [], colors);
      break;
    case "comparison":
      createComparisonSlide(pptx, title, content.comparison || [], colors);
      break;
    case "two-column":
      createTwoColumnSlide(pptx, title, content.columns || [], colors);
      break;
    case "case-study":
      createCaseStudySlide(pptx, title, content.caseStudy!, colors);
      break;
    case "quote":
      createQuoteSlide(pptx, content.quote!, colors);
      break;
    case "practice":
      createPracticeSlide(pptx, title, content.practice!, colors);
      break;
    case "summary":
      createSummarySlide(pptx, title, content.summary || [], colors);
      break;
    case "ending":
      createEndingSlide(pptx, title, colors, options);
      break;
    default:
      createKeyPointsSlide(pptx, title, content.items || [], colors);
  }
}

// ==================== 专业幻灯片创建函数 ====================

function createCoverSlide(
  pptx: PptxGenJS,
  title: string,
  colors: Record<string, string>,
  options: PPTGenerationOptions,
  subtitle?: string
): void {
  const slide = pptx.addSlide();
  slide.background = { color: colors.background };

  // 顶部装饰条
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.3,
    fill: { color: colors.primary },
  });

  // 主标题
  slide.addText(title, {
    x: 0.8,
    y: 2.0,
    w: 8.4,
    h: 1.2,
    fontSize: 44,
    bold: true,
    color: colors.primary,
    align: "center",
    fontFace: "Microsoft YaHei",
  });

  // 副标题
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8,
      y: 3.3,
      w: 8.4,
      h: 0.6,
      fontSize: 20,
      color: colors.darkGray,
      align: "center",
      fontFace: "Microsoft YaHei",
    });
  }

  // 分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 3.5,
    y: 4.0,
    w: 3,
    h: 0.05,
    fill: { color: colors.accent },
  });

  // 机构信息
  if (options.merchantName) {
    slide.addText(options.merchantName, {
      x: 0.8,
      y: 4.3,
      w: 8.4,
      h: 0.4,
      fontSize: 14,
      color: colors.darkGray,
      align: "center",
    });
  }

  // 底部装饰
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 5.2,
    w: "100%",
    h: 0.3,
    fill: { color: colors.secondary },
  });
}

function createTOCSlide(
  pptx: PptxGenJS,
  items: string[],
  colors: Record<string, string>
): void {
  const slide = pptx.addSlide();
  slide.background = { color: colors.background };

  // 标题
  slide.addText("课程目录", {
    x: 0.8,
    y: 0.5,
    w: 8.4,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: colors.primary,
    fontFace: "Microsoft YaHei",
  });

  // 分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.3,
    w: 2,
    h: 0.05,
    fill: { color: colors.accent },
  });

  // 目录项
  items.slice(0, 6).forEach((item, index) => {
    const yPos = 1.7 + index * 0.6;
    const num = String(index + 1).padStart(2, "0");

    // 编号背景
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: yPos,
      w: 0.5,
      h: 0.45,
      fill: { color: colors.primary },
    });

    // 编号
    slide.addText(num, {
      x: 0.8,
      y: yPos,
      w: 0.5,
      h: 0.45,
      fontSize: 14,
      bold: true,
      color: colors.white,
      align: "center",
      valign: "middle",
    });

    // 目录文字
    slide.addText(item, {
      x: 1.5,
      y: yPos,
      w: 7.5,
      h: 0.45,
      fontSize: 18,
      color: colors.text,
      fontFace: "Microsoft YaHei",
    });
  });
}

function createSectionTitleSlide(
  pptx: PptxGenJS,
  title: string,
  colors: Record<string, string>,
  subtitle?: string,
  description?: string
): void {
  const slide = pptx.addSlide();
  slide.background = { color: colors.primary };

  // 大标题
  slide.addText(title, {
    x: 0.8,
    y: 2.0,
    w: 8.4,
    h: 1,
    fontSize: 48,
    bold: true,
    color: colors.white,
    align: "center",
    fontFace: "Microsoft YaHei",
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8,
      y: 3.1,
      w: 8.4,
      h: 0.6,
      fontSize: 24,
      color: colors.white,
      align: "center",
      fontFace: "Microsoft YaHei",
    });
  }

  if (description) {
    slide.addText(description, {
      x: 1.5,
      y: 4.0,
      w: 7,
      h: 0.5,
      fontSize: 14,
      color: colors.white,
      align: "center",
      transparency: 30,
    });
  }
}

function createKeyPointsSlide(
  pptx: PptxGenJS,
  title: string,
  items: string[],
  colors: Record<string, string>
): void {
  const slide = pptx.addSlide();
  slide.background = { color: colors.background };

  // 标题
  slide.addText(title, {
    x: 0.8,
    y: 0.5,
    w: 8.4,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: colors.primary,
    fontFace: "Microsoft YaHei",
  });

  // 分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.2,
    w: 1.5,
    h: 0.05,
    fill: { color: colors.accent },
  });

  // 要点
  items.slice(0, 6).forEach((item, index) => {
    const yPos = 1.5 + index * 0.7;

    // 圆点标记
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.9,
      y: yPos + 0.1,
      w: 0.18,
      h: 0.18,
      fill: { color: colors.primary },
    });

    // 要点文字
    slide.addText(item, {
      x: 1.3,
      y: yPos,
      w: 8,
      h: 0.5,
      fontSize: 18,
      color: colors.text,
      fontFace: "Microsoft YaHei",
    });
  });

  // 页码
  addPageNumber(slide, colors);
}

function createFeatureCardsSlide(
  pptx: PptxGenJS,
  title: string,
  features: FeatureItem[],
  colors: Record<string, string>
): void {
  const slide = pptx.addSlide();
  slide.background = { color: colors.background };

  // 标题
  slide.addText(title, {
    x: 0.8,
    y: 0.5,
    w: 8.4,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: colors.primary,
    fontFace: "Microsoft YaHei",
  });

  const cardCount = Math.min(features.length, 4);
  const cardWidth = 2.1;
  const cardGap = 0.3;
  const startX = (10 - (cardCount * cardWidth + (cardCount - 1) * cardGap)) / 2;

  features.slice(0, 4).forEach((feature, index) => {
    const xPos = startX + index * (cardWidth + cardGap);
    const yPos = 1.4;

    // 卡片背景
    slide.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: yPos,
      w: cardWidth,
      h: 3.5,
      fill: { color: colors.lightGray },
      line: { color: colors.primary, width: 1 },
    });

    // 顶部装饰
    slide.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: yPos,
      w: cardWidth,
      h: 0.08,
      fill: { color: feature.highlight ? colors.accent : colors.primary },
    });

    // 编号
    slide.addText(String(index + 1).padStart(2, "0"), {
      x: xPos,
      y: yPos + 0.3,
      w: cardWidth,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: colors.primary,
      align: "center",
    });

    // 标题
    slide.addText(feature.title, {
      x: xPos + 0.15,
      y: yPos + 1.0,
      w: cardWidth - 0.3,
      h: 0.5,
      fontSize: 16,
      bold: true,
      color: colors.text,
      align: "center",
    });

    // 描述
    slide.addText(feature.description, {
      x: xPos + 0.15,
      y: yPos + 1.6,
      w: cardWidth - 0.3,
      h: 1.6,
      fontSize: 12,
      color: colors.darkGray,
      align: "center",
      valign: "top",
    });
  });
}

function createProcessFlowSlide(
  pptx: PptxGenJS,
  title: string,
  process: ProcessStep[],
  colors: Record<string, string>
): void {
  const slide = pptx.addSlide();
  slide.background = { color: colors.background };

  // 标题
  slide.addText(title, {
    x: 0.8,
    y: 0.5,
    w: 8.4,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: colors.primary,
    fontFace: "Microsoft YaHei",
  });

  const stepCount = Math.min(process.length, 5);
  const stepWidth = 1.6;
  const stepGap = 0.4;
  const startX = (10 - (stepCount * stepWidth + (stepCount - 1) * stepGap)) / 2;

  process.slice(0, 5).forEach((step, index) => {
    const xPos = startX + index * (stepWidth + stepGap);
    const yPos = 1.8;

    // 连接箭头
    if (index > 0) {
      slide.addShape(pptx.ShapeType.rightArrow, {
        x: xPos - stepGap,
        y: yPos + 0.5,
        w: stepGap - 0.05,
        h: 0.3,
        fill: { color: colors.accent },
      });
    }

    // 步骤圆形
    slide.addShape(pptx.ShapeType.ellipse, {
      x: xPos + (stepWidth - 1.2) / 2,
      y: yPos,
      w: 1.2,
      h: 1.2,
      fill: { color: colors.primary },
    });

    // 步骤编号
    slide.addText(String(step.step), {
      x: xPos + (stepWidth - 1.2) / 2,
      y: yPos,
      w: 1.2,
      h: 1.2,
      fontSize: 28,
      bold: true,
      color: colors.white,
      align: "center",
      valign: "middle",
    });

    // 步骤标题
    slide.addText(step.title, {
      x: xPos,
      y: yPos + 1.4,
      w: stepWidth,
      h: 0.5,
      fontSize: 14,
      bold: true,
      color: colors.text,
      align: "center",
    });

    // 步骤描述
    slide.addText(step.description, {
      x: xPos,
      y: yPos + 1.9,
      w: stepWidth,
      h: 1.2,
      fontSize: 11,
      color: colors.darkGray,
      align: "center",
      valign: "top",
    });
  });
}

function createComparisonSlide(
  pptx: PptxGenJS,
  title: string,
  comparison: ComparisonItem[],
  colors: Record<string, string>
): void {
  const slide = pptx.addSlide();
  slide.background = { color: colors.background };

  // 标题
  slide.addText(title, {
    x: 0.8,
    y: 0.5,
    w: 8.4,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: colors.primary,
    fontFace: "Microsoft YaHei",
  });

  // 表头
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.3,
    w: 4,
    h: 0.5,
    fill: { color: colors.primary },
  });
  slide.addText("方案A", {
    x: 0.8,
    y: 1.3,
    w: 4,
    h: 0.5,
    fontSize: 14,
    bold: true,
    color: colors.white,
    align: "center",
    valign: "middle",
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 5.2,
    y: 1.3,
    w: 4,
    h: 0.5,
    fill: { color: colors.accent },
  });
  slide.addText("方案B", {
    x: 5.2,
    y: 1.3,
    w: 4,
    h: 0.5,
    fontSize: 14,
    bold: true,
    color: colors.white,
    align: "center",
    valign: "middle",
  });

  // 对比项
  comparison.slice(0, 5).forEach((item, index) => {
    const yPos = 2.0 + index * 0.55;

    // 对比项标签
    slide.addText(item.aspect, {
      x: 0.3,
      y: yPos,
      w: 0.4,
      h: 0.4,
      fontSize: 10,
      color: colors.darkGray,
      valign: "middle",
    });

    // 方案A
    slide.addText(item.option1, {
      x: 0.8,
      y: yPos,
      w: 4,
      h: 0.4,
      fontSize: 13,
      color: colors.text,
      align: "center",
      valign: "middle",
    });

    // 方案B
    slide.addText(item.option2, {
      x: 5.2,
      y: yPos,
      w: 4,
      h: 0.4,
      fontSize: 13,
      color: colors.text,
      align: "center",
      valign: "middle",
    });
  });
}

function createTwoColumnSlide(
  pptx: PptxGenJS,
  title: string,
  columns: ColumnItem[],
  colors: Record<string, string>
): void {
  const slide = pptx.addSlide();
  slide.background = { color: colors.background };

  // 标题
  slide.addText(title, {
    x: 0.8,
    y: 0.5,
    w: 8.4,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: colors.primary,
    fontFace: "Microsoft YaHei",
  });

  if (columns[0]) {
    // 左栏
    slide.addText(columns[0].title, {
      x: 0.8,
      y: 1.4,
      w: 4,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: colors.primary,
    });

    const leftContent = columns[0].content.map((item) => `• ${item}`).join("\n");
    slide.addText(leftContent, {
      x: 0.8,
      y: 2.0,
      w: 4,
      h: 2.5,
      fontSize: 14,
      color: colors.text,
      valign: "top",
    });
  }

  // 分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 4.95,
    y: 1.4,
    w: 0.02,
    h: 3.2,
    fill: { color: "E0E0E0" },
  });

  if (columns[1]) {
    // 右栏
    slide.addText(columns[1].title, {
      x: 5.2,
      y: 1.4,
      w: 4,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: colors.accent,
    });

    const rightContent = columns[1].content.map((item) => `• ${item}`).join("\n");
    slide.addText(rightContent, {
      x: 5.2,
      y: 2.0,
      w: 4,
      h: 2.5,
      fontSize: 14,
      color: colors.text,
      valign: "top",
    });
  }
}

function createCaseStudySlide(
  pptx: PptxGenJS,
  title: string,
  caseStudy: CaseStudyData,
  colors: Record<string, string>
): void {
  const slide = pptx.addSlide();
  slide.background = { color: colors.background };

  // 标题
  slide.addText(title || "案例展示", {
    x: 0.8,
    y: 0.5,
    w: 8.4,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: colors.primary,
    fontFace: "Microsoft YaHei",
  });

  if (!caseStudy) return;

  // 案例-标签
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.3,
    w: 0.8,
    h: 0.35,
    fill: { color: colors.primary },
  });
  slide.addText("背景", {
    x: 0.8,
    y: 1.3,
    w: 0.8,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: colors.white,
    align: "center",
    valign: "middle",
  });
  slide.addText(caseStudy.background, {
    x: 1.8,
    y: 1.3,
    w: 7.4,
    h: 0.6,
    fontSize: 13,
    color: colors.text,
  });

  // 解决方案
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 2.2,
    w: 0.8,
    h: 0.35,
    fill: { color: colors.accent },
  });
  slide.addText("方案", {
    x: 0.8,
    y: 2.2,
    w: 0.8,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: colors.white,
    align: "center",
    valign: "middle",
  });
  slide.addText(caseStudy.solution, {
    x: 1.8,
    y: 2.2,
    w: 7.4,
    h: 0.6,
    fontSize: 13,
    color: colors.text,
  });

  // 结果
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 3.1,
    w: 0.8,
    h: 0.35,
    fill: { color: "4CAF50" },
  });
  slide.addText("结果", {
    x: 0.8,
    y: 3.1,
    w: 0.8,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: colors.white,
    align: "center",
    valign: "middle",
  });
  slide.addText(caseStudy.result, {
    x: 1.8,
    y: 3.1,
    w: 7.4,
    h: 0.6,
    fontSize: 13,
    color: colors.text,
  });
}

function createQuoteSlide(
  pptx: PptxGenJS,
  quote: QuoteData,
  colors: Record<string, string>
): void {
  const slide = pptx.addSlide();
  slide.background = { color: colors.background };

  if (!quote) return;

  // 引号
  slide.addText('"', {
    x: 1,
    y: 1.5,
    w: 1,
    h: 1,
    fontSize: 72,
    color: colors.primary,
    transparency: 30,
  });

  // 引用内容
  slide.addText(quote.text, {
    x: 1.5,
    y: 2.2,
    w: 7,
    h: 1.5,
    fontSize: 22,
    italic: true,
    color: colors.text,
    align: "center",
    fontFace: "Microsoft YaHei",
  });

  // 作者
  if (quote.author) {
    slide.addText(`—— ${quote.author}`, {
      x: 1.5,
      y: 3.8,
      w: 7,
      h: 0.5,
      fontSize: 14,
      color: colors.darkGray,
      align: "right",
    });
  }
}

function createPracticeSlide(
  pptx: PptxGenJS,
  title: string,
  practice: PracticeData,
  colors: Record<string, string>
): void {
  const slide = pptx.addSlide();
  slide.background = { color: colors.background };

  // 标题
  slide.addText(title || "课堂练习", {
    x: 0.8,
    y: 0.5,
    w: 8.4,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: colors.primary,
    fontFace: "Microsoft YaHei",
  });

  if (!practice) return;

  // 问题
  slide.addText(practice.question, {
    x: 0.8,
    y: 1.5,
    w: 8.4,
    h: 0.8,
    fontSize: 18,
    color: colors.text,
    fontFace: "Microsoft YaHei",
  });

  // 选项
  if (practice.options) {
    practice.options.forEach((option, index) => {
      const yPos = 2.5 + index * 0.5;

      slide.addShape(pptx.ShapeType.ellipse, {
        x: 0.8,
        y: yPos,
        w: 0.35,
        h: 0.35,
        fill: { color: colors.lightGray },
        line: { color: colors.primary, width: 1 },
      });

      slide.addText(String.fromCharCode(65 + index), {
        x: 0.8,
        y: yPos,
        w: 0.35,
        h: 0.35,
        fontSize: 12,
        bold: true,
        color: colors.primary,
        align: "center",
        valign: "middle",
      });

      slide.addText(option, {
        x: 1.3,
        y: yPos,
        w: 7.9,
        h: 0.35,
        fontSize: 14,
        color: colors.text,
      });
    });
  }

  // 提示
  if (practice.hint) {
    slide.addText(`💡 提示：${practice.hint}`, {
      x: 0.8,
      y: 4.5,
      w: 8.4,
      h: 0.4,
      fontSize: 12,
      color: colors.darkGray,
      italic: true,
    });
  }
}

function createSummarySlide(
  pptx: PptxGenJS,
  title: string,
  summary: SummaryItem[],
  colors: Record<string, string>
): void {
  const slide = pptx.addSlide();
  slide.background = { color: colors.background };

  // 标题
  slide.addText(title || "课程总结", {
    x: 0.8,
    y: 0.5,
    w: 8.4,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: colors.primary,
    fontFace: "Microsoft YaHei",
  });

  // 分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.2,
    w: 1.5,
    h: 0.05,
    fill: { color: colors.accent },
  });

  summary.slice(0, 5).forEach((item, index) => {
    const yPos = 1.5 + index * 0.65;

    // 编号圆圈
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.8,
      y: yPos,
      w: 0.4,
      h: 0.4,
      fill: { color: colors.primary },
    });

    slide.addText(String(item.number || index + 1), {
      x: 0.8,
      y: yPos,
      w: 0.4,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: colors.white,
      align: "center",
      valign: "middle",
    });

    slide.addText(item.content, {
      x: 1.4,
      y: yPos,
      w: 7.8,
      h: 0.5,
      fontSize: 16,
      color: colors.text,
      fontFace: "Microsoft YaHei",
    });
  });
}

function createEndingSlide(
  pptx: PptxGenJS,
  title: string,
  colors: Record<string, string>,
  options: PPTGenerationOptions
): void {
  const slide = pptx.addSlide();
  slide.background = { color: colors.primary };

  // 主文字
  slide.addText(title || "谢谢观看", {
    x: 0.8,
    y: 2.0,
    w: 8.4,
    h: 1,
    fontSize: 48,
    bold: true,
    color: colors.white,
    align: "center",
    fontFace: "Microsoft YaHei",
  });

  // 分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 3.5,
    y: 3.2,
    w: 3,
    h: 0.08,
    fill: { color: colors.accent },
  });

  // 机构信息
  if (options.merchantName) {
    slide.addText(options.merchantName, {
      x: 0.8,
      y: 3.6,
      w: 8.4,
      h: 0.5,
      fontSize: 16,
      color: colors.white,
      align: "center",
      transparency: 20,
    });
  }

  slide.addText("由南都AI智能生成", {
    x: 0.8,
    y: 4.5,
    w: 8.4,
    h: 0.4,
    fontSize: 12,
    color: colors.white,
    align: "center",
    transparency: 40,
  });
}

function addPageNumber(slide: any, colors: Record<string, string>): void {
  // 页码会在生成时由pptxgenjs自动处理
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

// ==================== 主入口函数 ====================

/**
 * 专业级PPT生成（从文本内容）
 */
export async function generatePPTPro(
  content: string,
  options: PPTGenerationOptions = {}
): Promise<{ buffer: Buffer; analysis: PPTAnalysisResult }> {
  // 1. AI深度分析
  const analysis = await analyzeContentDeeply(content, options);

  // 2. 生成PPTX
  const buffer = await generatePPTX(analysis, options);

  return { buffer, analysis };
}

/**
 * 专业级PPT生成（从上传文件）
 */
export async function generatePPTFromFile(
  fileBuffer: Buffer,
  fileName: string,
  options: PPTGenerationOptions = {}
): Promise<{ buffer: Buffer; analysis: PPTAnalysisResult }> {
  // 1. 解析文档
  const content = await parseDocument(fileBuffer, fileName);

  // 2. 生成PPT
  return generatePPTPro(content, options);
}

/**
 * 获取课程设计配置
 */
export function getCourseDesignConfig(courseType: CourseType): DesignSuggestion {
  return COURSE_DESIGN_CONFIG[courseType] || COURSE_DESIGN_CONFIG["其他"];
}
