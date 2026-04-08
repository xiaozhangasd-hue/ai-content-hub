import { NextRequest, NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import mammoth from "mammoth";

// 导入模板系统
import {
  PPT_THEMES,
  getTheme,
  getRecommendedTheme,
  type SlideData,
  type SlideLayoutType,
  type ContentAnalysis,
  type ContentSection,
  type PPTTheme,
} from "@/lib/ppt-templates";

// 动态导入 pdf-parse
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

// ==================== 文档解析 ====================

interface ParsedDocument {
  title: string;
  content: string;
  sections: {
    heading: string;
    level: number;
    content: string[];
  }[];
  metadata: {
    wordCount: number;
    sourceType: string;
  };
}

// 解析Word文档
async function parseWordDocument(buffer: Buffer): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;
  
  // 解析章节结构（根据换行和标题格式）
  const lines = text.split('\n').filter(line => line.trim());
  const sections: ParsedDocument['sections'] = [];
  let currentSection: ParsedDocument['sections'][0] | null = null;
  let title = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 检测标题（通常是一行中较短且后面没有标点的）
    const isHeading = 
      trimmed.length < 50 && 
      !trimmed.endsWith('。') && 
      !trimmed.endsWith('，') &&
      !trimmed.endsWith('、') &&
      (trimmed.startsWith('第') || trimmed.startsWith('一') || 
       trimmed.startsWith('二') || trimmed.startsWith('三') ||
       trimmed.startsWith('四') || trimmed.startsWith('五') ||
       trimmed.startsWith('1') || trimmed.startsWith('2') ||
       trimmed.match(/^[一二三四五六七八九十]+[、.．]/) ||
       trimmed.match(/^[0-9]+[、.．\s]/));
    
    if (isHeading && trimmed.length > 2) {
      // 保存之前的章节
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // 新章节
      const level = trimmed.startsWith('第') ? 1 : 
                    trimmed.match(/^[一二三四五六七八九十]+[、.．]/) ? 1 : 2;
      
      currentSection = {
        heading: trimmed.replace(/^[0-9一二三四五六七八九十]+[、.．\s]+/, ''),
        level,
        content: [],
      };
      
      // 第一个标题作为文档标题
      if (!title && level === 1) {
        title = trimmed;
      }
    } else if (currentSection) {
      currentSection.content.push(trimmed);
    } else if (!title && trimmed.length < 50) {
      title = trimmed;
    }
  }
  
  // 保存最后一个章节
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return {
    title: title || '未命名文档',
    content: text,
    sections,
    metadata: {
      wordCount: text.length,
      sourceType: 'word',
    },
  };
}

// 解析PDF文档
async function parsePDFDocument(buffer: Buffer): Promise<ParsedDocument> {
  const data = await pdfParse(buffer);
  const text = data.text;
  
  // 简单的章节解析
  const lines = text.split('\n').filter((line: string) => line.trim());
  const sections: ParsedDocument['sections'] = [];
  let currentSection: ParsedDocument['sections'][0] | null = null;
  let title = data.info?.Title || '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // PDF标题检测
    const isHeading = 
      trimmed.length < 50 && 
      !trimmed.endsWith('。') &&
      (trimmed.match(/^[第0-9一二三四五六七八九十]+[章节]/) ||
       trimmed.match(/^[0-9]+\.[0-9]*/) ||
       trimmed === trimmed.toUpperCase());
    
    if (isHeading) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: trimmed,
        level: trimmed.includes('第') && trimmed.includes('章') ? 1 : 2,
        content: [],
      };
      if (!title) title = trimmed;
    } else if (currentSection) {
      currentSection.content.push(trimmed);
    } else if (!title && trimmed.length < 50) {
      title = trimmed;
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return {
    title: title || '未命名文档',
    content: text,
    sections,
    metadata: {
      wordCount: text.length,
      sourceType: 'pdf',
    },
  };
}

// 解析纯文本
function parseTextContent(text: string): ParsedDocument {
  const lines = text.split('\n').filter(line => line.trim());
  const sections: ParsedDocument['sections'] = [];
  let currentSection: ParsedDocument['sections'][0] | null = null;
  let title = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 标题检测
    const isHeading = 
      trimmed.length < 50 && 
      !trimmed.endsWith('。') &&
      !trimmed.endsWith('，') &&
      (trimmed.match(/^[一二三四五六七八九十]+[、.．]/) ||
       trimmed.match(/^[0-9]+[、.．\s]/));
    
    if (isHeading) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: trimmed.replace(/^[0-9一二三四五六七八九十]+[、.．\s]+/, ''),
        level: 1,
        content: [],
      };
      if (!title) title = currentSection.heading;
    } else if (currentSection) {
      currentSection.content.push(trimmed);
    } else if (!title && trimmed.length < 50) {
      title = trimmed;
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return {
    title: title || '未命名文档',
    content: text,
    sections,
    metadata: {
      wordCount: text.length,
      sourceType: 'text',
    },
  };
}

// ==================== AI内容分析 ====================

async function analyzeContentWithAI(
  document: ParsedDocument
): Promise<ContentAnalysis> {
  const systemPrompt = `你是一位专业的PPT设计师和内容分析师。

请分析用户提供的文档内容，返回以下信息：
1. 内容类别：education（教育培训）、business（商务汇报）、creative（创意设计）、technical（技术文档）、general（通用）
2. 文档结构类型：linear（线性）、hierarchical（层级）、modular（模块化）
3. 详细的章节分析，每个章节需要：
   - 标题
   - 层级
   - 核心内容
   - 关键要点（3-5个）
   - 推荐的PPT布局类型

布局类型可选值：
- cover: 封面页
- toc: 目录页
- section: 章节标题页
- text-only: 纯文字页
- text-image: 文字+图片
- image-text: 图片+文字
- two-column: 双栏布局
- three-column: 三栏布局
- quote: 引用页
- list: 列表页
- features: 特点展示
- comparison: 对比页
- timeline: 时间线
- chart: 图表页
- summary: 总结页
- ending: 结束页

请以JSON格式输出，格式如下：
{
  "title": "文档标题",
  "subtitle": "副标题（如有）",
  "category": "education",
  "structure": {
    "type": "hierarchical",
    "sections": [
      {
        "title": "章节标题",
        "level": 1,
        "content": ["段落1", "段落2"],
        "keyPoints": ["要点1", "要点2", "要点3"],
        "suggestedLayout": "text-only"
      }
    ]
  },
  "suggestedTheme": "education-blue",
  "estimatedSlides": 10
}`;

  const contentPreview = document.content.slice(0, 3000);
  
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `文档标题：${document.title}\n\n文档内容：\n${contentPreview}\n\n请分析这份文档并给出PPT设计建议。`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error("AI分析失败");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    return JSON.parse(content);
  } catch {
    // 返回默认分析结果
    return {
      title: document.title,
      category: 'general',
      structure: {
        type: 'linear',
        sections: document.sections.map(s => ({
          title: s.heading,
          level: s.level,
          content: s.content,
          keyPoints: s.content.slice(0, 3),
          suggestedLayout: 'text-only' as SlideLayoutType,
        })),
      },
      suggestedTheme: 'minimal-white',
      estimatedSlides: document.sections.length + 2,
    };
  }
}

// ==================== PPT生成 ====================

interface PPTGenerationOptions {
  theme: string;
  title: string;
  subtitle?: string;
  author?: string;
  slides: SlideData[];
}

// 创建封面页
function createCoverSlide(
  pptx: PptxGenJS,
  theme: PPTTheme,
  title: string,
  subtitle?: string
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };
  
  // 主标题
  slide.addText(title, {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 1.2,
    fontSize: 44,
    bold: true,
    color: theme.colors.title,
    align: 'center',
    fontFace: theme.fonts.title,
  });
  
  // 副标题
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5,
      y: 3.5,
      w: 9,
      h: 0.6,
      fontSize: 20,
      color: theme.colors.subtitle,
      align: 'center',
      fontFace: theme.fonts.body,
    });
  }
  
  // 装饰元素
  slide.addShape(pptx.ShapeType.rect, {
    x: 4,
    y: 4.3,
    w: 2,
    h: 0.08,
    fill: { color: theme.colors.accent },
  });
  
  // 底部信息
  slide.addText('由南都AI智能生成', {
    x: 0.5,
    y: 5,
    w: 9,
    h: 0.3,
    fontSize: 10,
    color: theme.colors.subtitle,
    align: 'center',
  });
}

// 创建目录页
function createTOCSlide(
  pptx: PptxGenJS,
  theme: PPTTheme,
  sections: { number: number; title: string }[]
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };
  
  // 标题
  slide.addText('目录', {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: theme.colors.title,
    fontFace: theme.fonts.title,
  });
  
  // 分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.2,
    w: 1.5,
    h: 0.06,
    fill: { color: theme.colors.accent },
  });
  
  // 目录项
  const itemsPerColumn = Math.ceil(sections.length / 2);
  const startY = 1.6;
  const itemHeight = 0.7;
  
  sections.forEach((section, index) => {
    const isLeftColumn = index < itemsPerColumn;
    const xPos = isLeftColumn ? 0.8 : 5.3;
    const yPos = startY + (isLeftColumn ? index : index - itemsPerColumn) * itemHeight;
    
    // 编号圆圈
    slide.addShape(pptx.ShapeType.ellipse, {
      x: xPos,
      y: yPos,
      w: 0.35,
      h: 0.35,
      fill: { color: theme.colors.primary },
    });
    
    // 编号文字
    slide.addText(String(index + 1), {
      x: xPos,
      y: yPos,
      w: 0.35,
      h: 0.35,
      fontSize: 14,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });
    
    // 标题
    slide.addText(section.title, {
      x: xPos + 0.5,
      y: yPos,
      w: isLeftColumn ? 3.5 : 3.5,
      h: 0.35,
      fontSize: 16,
      color: theme.colors.text,
      fontFace: theme.fonts.body,
    });
  });
}

// 创建章节标题页
function createSectionSlide(
  pptx: PptxGenJS,
  theme: PPTTheme,
  title: string,
  sectionNumber: number
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };
  
  // 大号编号
  slide.addText(String(sectionNumber).padStart(2, '0'), {
    x: 0.5,
    y: 1.5,
    w: 3,
    h: 1.5,
    fontSize: 72,
    bold: true,
    color: theme.colors.primary,
    transparency: 20,
    fontFace: theme.fonts.title,
  });
  
  // 章节标题
  slide.addText(title, {
    x: 0.5,
    y: 2.8,
    w: 9,
    h: 1,
    fontSize: 36,
    bold: true,
    color: theme.colors.title,
    fontFace: theme.fonts.title,
  });
  
  // 装饰线
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 4,
    w: 2,
    h: 0.06,
    fill: { color: theme.colors.accent },
  });
}

// 创建内容页 - 纯文字
function createTextOnlySlide(
  pptx: PptxGenJS,
  theme: PPTTheme,
  title: string,
  paragraphs: string[]
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };
  
  // 标题
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
  
  // 分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.1,
    w: 1.5,
    h: 0.05,
    fill: { color: theme.colors.accent },
  });
  
  // 段落内容
  const content = paragraphs.join('\n\n');
  slide.addText(content, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 3.5,
    fontSize: 16,
    color: theme.colors.text,
    fontFace: theme.fonts.body,
    valign: 'top',
    lineSpacing: 28,
  });
}

// 创建列表页
function createListSlide(
  pptx: PptxGenJS,
  theme: PPTTheme,
  title: string,
  items: string[]
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };
  
  // 标题
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
  
  // 分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.1,
    w: 1.5,
    h: 0.05,
    fill: { color: theme.colors.accent },
  });
  
  // 列表项
  const itemHeight = 0.65;
  const startY = 1.5;
  
  items.slice(0, 6).forEach((item, index) => {
    const yPos = startY + index * itemHeight;
    
    // 项目符号
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: yPos + 0.15,
      w: 0.15,
      h: 0.15,
      fill: { color: theme.colors.primary },
    });
    
    // 文字
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

// 创建双栏布局页
function createTwoColumnSlide(
  pptx: PptxGenJS,
  theme: PPTTheme,
  title: string,
  leftColumn: string[],
  rightColumn: string[]
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };
  
  // 标题
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
  
  // 分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.1,
    w: 1.5,
    h: 0.05,
    fill: { color: theme.colors.accent },
  });
  
  // 左栏
  const leftContent = leftColumn.map(item => `• ${item}`).join('\n');
  slide.addText(leftContent, {
    x: 0.5,
    y: 1.5,
    w: 4.2,
    h: 3.5,
    fontSize: 14,
    color: theme.colors.text,
    fontFace: theme.fonts.body,
    valign: 'top',
  });
  
  // 中间分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 4.9,
    y: 1.5,
    w: 0.02,
    h: 3,
    fill: { color: 'E0E0E0' },
  });
  
  // 右栏
  const rightContent = rightColumn.map(item => `• ${item}`).join('\n');
  slide.addText(rightContent, {
    x: 5.2,
    y: 1.5,
    w: 4.2,
    h: 3.5,
    fontSize: 14,
    color: theme.colors.text,
    fontFace: theme.fonts.body,
    valign: 'top',
  });
}

// 创建特点展示页
function createFeaturesSlide(
  pptx: PptxGenJS,
  theme: PPTTheme,
  title: string,
  features: { title: string; description: string }[]
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };
  
  // 标题
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
  
  // 分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.1,
    w: 1.5,
    h: 0.05,
    fill: { color: theme.colors.accent },
  });
  
  // 特点卡片
  const cardWidth = 2.8;
  const cardGap = 0.3;
  const startX = (10 - (features.length * cardWidth + (features.length - 1) * cardGap)) / 2;
  
  features.slice(0, 4).forEach((feature, index) => {
    const xPos = startX + index * (cardWidth + cardGap);
    const yPos = 1.6;
    
    // 卡片背景
    slide.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: yPos,
      w: cardWidth,
      h: 3.2,
      fill: { color: 'F5F5F5' },
      line: { color: theme.colors.primary, width: 1 },
    });
    
    // 编号
    slide.addText(String(index + 1).padStart(2, '0'), {
      x: xPos,
      y: yPos + 0.2,
      w: cardWidth,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: theme.colors.primary,
      align: 'center',
    });
    
    // 标题
    slide.addText(feature.title, {
      x: xPos + 0.15,
      y: yPos + 0.9,
      w: cardWidth - 0.3,
      h: 0.5,
      fontSize: 16,
      bold: true,
      color: theme.colors.title,
      align: 'center',
    });
    
    // 描述
    slide.addText(feature.description, {
      x: xPos + 0.15,
      y: yPos + 1.5,
      w: cardWidth - 0.3,
      h: 1.5,
      fontSize: 12,
      color: theme.colors.text,
      align: 'center',
      valign: 'top',
    });
  });
}

// 创建引用页
function createQuoteSlide(
  pptx: PptxGenJS,
  theme: PPTTheme,
  quote: string,
  author?: string
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };
  
  // 引号装饰
  slide.addText('"', {
    x: 1,
    y: 1.5,
    w: 1,
    h: 1,
    fontSize: 72,
    color: theme.colors.primary,
    transparency: 30,
  });
  
  // 引用内容
  slide.addText(quote, {
    x: 1.5,
    y: 2,
    w: 7,
    h: 1.5,
    fontSize: 24,
    italic: true,
    color: theme.colors.text,
    align: 'center',
    fontFace: theme.fonts.body,
  });
  
  // 作者
  if (author) {
    slide.addText(`—— ${author}`, {
      x: 1.5,
      y: 3.6,
      w: 7,
      h: 0.5,
      fontSize: 16,
      color: theme.colors.subtitle,
      align: 'right',
    });
  }
}

// 创建对比页
function createComparisonSlide(
  pptx: PptxGenJS,
  theme: PPTTheme,
  title: string,
  comparisons: { label: string; left: string; right: string }[]
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };
  
  // 标题
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
  
  // 表头
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.2,
    w: 4.3,
    h: 0.5,
    fill: { color: theme.colors.primary },
  });
  slide.addText('传统方式', {
    x: 0.5,
    y: 1.2,
    w: 4.3,
    h: 0.5,
    fontSize: 14,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
  });
  
  slide.addShape(pptx.ShapeType.rect, {
    x: 5.2,
    y: 1.2,
    w: 4.3,
    h: 0.5,
    fill: { color: theme.colors.accent },
  });
  slide.addText('现在方式', {
    x: 5.2,
    y: 1.2,
    w: 4.3,
    h: 0.5,
    fontSize: 14,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
  });
  
  // 对比内容
  comparisons.slice(0, 5).forEach((item, index) => {
    const yPos = 1.9 + index * 0.6;
    
    // 左侧
    slide.addText(item.left, {
      x: 0.5,
      y: yPos,
      w: 4.3,
      h: 0.5,
      fontSize: 14,
      color: theme.colors.text,
      align: 'center',
    });
    
    // 右侧
    slide.addText(item.right, {
      x: 5.2,
      y: yPos,
      w: 4.3,
      h: 0.5,
      fontSize: 14,
      color: theme.colors.text,
      align: 'center',
    });
    
    // 分隔线
    if (index < comparisons.length - 1) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.5,
        y: yPos + 0.5,
        w: 9,
        h: 0.01,
        fill: { color: 'E8E8E8' },
      });
    }
  });
}

// 创建总结页
function createSummarySlide(
  pptx: PptxGenJS,
  theme: PPTTheme,
  title: string,
  items: string[]
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };
  
  // 标题
  slide.addText(title || '课程总结', {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: theme.colors.title,
    fontFace: theme.fonts.title,
  });
  
  // 分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.1,
    w: 1.5,
    h: 0.05,
    fill: { color: theme.colors.accent },
  });
  
  // 总结要点
  items.slice(0, 5).forEach((item, index) => {
    const yPos = 1.5 + index * 0.7;
    
    // 编号
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
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });
    
    // 文字
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

// 创建结束页
function createEndingSlide(
  pptx: PptxGenJS,
  theme: PPTTheme,
  title: string
) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.colors.background };
  
  // 主文字
  slide.addText(title || '谢谢观看', {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 1,
    fontSize: 48,
    bold: true,
    color: theme.colors.title,
    align: 'center',
    fontFace: theme.fonts.title,
  });
  
  // 装饰线
  slide.addShape(pptx.ShapeType.rect, {
    x: 4,
    y: 3.4,
    w: 2,
    h: 0.08,
    fill: { color: theme.colors.accent },
  });
  
  // 底部信息
  slide.addText('由南都AI智能生成', {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.3,
    fontSize: 12,
    color: theme.colors.subtitle,
    align: 'center',
  });
}

// 主PPT生成函数
async function generatePPT(options: PPTGenerationOptions): Promise<Buffer> {
  const pptx = new PptxGenJS();
  const theme = getTheme(options.theme);
  
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = options.title;
  pptx.author = options.author || '南都AI';
  
  for (const slideData of options.slides) {
    
    switch (slideData.layout) {
      case 'cover':
        createCoverSlide(pptx, theme, slideData.title, slideData.subtitle);
        break;
        
      case 'toc':
        const sections = slideData.content?.sections?.map((s, i) => ({
          number: i + 1,
          title: s.title || '',
        })) || [];
        createTOCSlide(pptx, theme, sections);
        break;
        
      case 'section':
        const sectionNum = slideData.content?.sections?.[0]?.number || 1;
        createSectionSlide(pptx, theme, slideData.title, sectionNum as number);
        break;
        
      case 'text-only':
        createTextOnlySlide(pptx, theme, slideData.title, slideData.content?.paragraphs || []);
        break;
        
      case 'list':
        createListSlide(pptx, theme, slideData.title, slideData.content?.items || []);
        break;
        
      case 'two-column':
        createTwoColumnSlide(
          pptx, 
          theme, 
          slideData.title, 
          slideData.content?.leftColumn || [],
          slideData.content?.rightColumn || []
        );
        break;
        
      case 'features':
        const features = slideData.content?.features?.map(f => ({
          title: f.title,
          description: f.description,
        })) || [];
        createFeaturesSlide(pptx, theme, slideData.title, features as any);
        break;
        
      case 'quote':
        createQuoteSlide(pptx, theme, slideData.content?.quote || slideData.title, slideData.content?.author);
        break;
        
      case 'comparison':
        createComparisonSlide(pptx, theme, slideData.title, slideData.content?.comparison || []);
        break;
        
      case 'summary':
        createSummarySlide(pptx, theme, slideData.title, slideData.content?.items || []);
        break;
        
      case 'ending':
        createEndingSlide(pptx, theme, slideData.title);
        break;
        
      default:
        // 默认使用列表布局
        createListSlide(pptx, theme, slideData.title, slideData.content?.items || slideData.content?.paragraphs || []);
    }
  }
  
  const output = await pptx.write({ outputType: 'nodebuffer' });
  return Buffer.from(output as unknown as Uint8Array);
}

// ==================== API处理 ====================

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // 处理文件上传
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const theme = formData.get('theme') as string || 'education-blue';
      
      if (!file) {
        return NextResponse.json({ error: '请上传文件' }, { status: 400 });
      }
      
      // 解析文件
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name.toLowerCase();
      let parsedDoc: ParsedDocument;
      
      if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        parsedDoc = await parseWordDocument(buffer);
      } else if (fileName.endsWith('.pdf')) {
        parsedDoc = await parsePDFDocument(buffer);
      } else {
        // 当作纯文本处理
        const text = buffer.toString('utf-8');
        parsedDoc = parseTextContent(text);
      }
      
      // AI分析内容
      const analysis = await analyzeContentWithAI(parsedDoc);
      
      // 生成幻灯片数据
      const slides: SlideData[] = [];
      
      // 封面页
      slides.push({
        layout: 'cover',
        title: analysis.title,
        subtitle: analysis.subtitle,
      });
      
      // 目录页（如果章节超过2个）
      if (analysis.structure.sections.length > 2) {
        slides.push({
          layout: 'toc',
          title: '目录',
          content: {
            sections: analysis.structure.sections.map((s, i) => ({
              number: i + 1,
              title: s.title,
            })),
          },
        });
      }
      
      // 内容页
      let sectionCounter = 0;
      for (const section of analysis.structure.sections) {
        sectionCounter++;
        
        // 章节标题页（一级标题）
        if (section.level === 1) {
          slides.push({
            layout: 'section',
            title: section.title,
            content: {
              sections: [{ number: sectionCounter, title: section.title }],
            },
          });
        }
        
        // 内容页
        slides.push({
          layout: section.suggestedLayout,
          title: section.title,
          content: {
            paragraphs: section.content,
            items: section.keyPoints,
          },
        });
      }
      
      // 总结页
      const keyPoints = analysis.structure.sections
        .flatMap(s => s.keyPoints)
        .slice(0, 5);
      
      if (keyPoints.length > 0) {
        slides.push({
          layout: 'summary',
          title: '总结',
          content: {
            items: keyPoints,
          },
        });
      }
      
      // 结束页
      slides.push({
        layout: 'ending',
        title: '谢谢观看',
      });
      
      // 生成PPT
      const pptBuffer = await generatePPT({
        theme: theme || analysis.suggestedTheme,
        title: analysis.title,
        subtitle: analysis.subtitle,
        slides,
      });
      
      return new NextResponse(new Uint8Array(pptBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(analysis.title)}.pptx"`,
        },
      });
    }
    
    // 处理JSON请求（预览/编辑模式）
    const body = await request.json();
    const { action, ...params } = body;
    
    if (action === 'parse') {
      // 解析文档
      const { content, type } = params;
      let parsedDoc: ParsedDocument;
      
      if (type === 'text') {
        parsedDoc = parseTextContent(content);
      } else {
        parsedDoc = {
          title: '解析内容',
          content: content,
          sections: [],
          metadata: { wordCount: content.length, sourceType: type },
        };
      }
      
      const analysis = await analyzeContentWithAI(parsedDoc);
      
      return NextResponse.json({
        success: true,
        document: parsedDoc,
        analysis,
      });
    }
    
    if (action === 'analyze') {
      // 仅分析内容
      const { content } = params;
      const parsedDoc = parseTextContent(content);
      const analysis = await analyzeContentWithAI(parsedDoc);
      
      return NextResponse.json({
        success: true,
        analysis,
      });
    }
    
    if (action === 'generate') {
      // 根据提供的slides生成PPT
      const { title, subtitle, theme, slides } = params;
      
      const pptBuffer = await generatePPT({
        theme: theme || 'education-blue',
        title: title || '未命名演示',
        subtitle,
        slides,
      });
      
      return new NextResponse(new Uint8Array(pptBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(title || '演示文稿')}.pptx"`,
        },
      });
    }
    
    return NextResponse.json({ error: '未知操作' }, { status: 400 });
    
  } catch (error) {
    console.error('PPT生成错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败' },
      { status: 500 }
    );
  }
}
