import { NextRequest, NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 导出PPTX文件
 * 生成可编辑的PowerPoint文件
 */

interface Slide {
  id: number;
  type: "cover" | "content" | "highlight" | "interactive" | "ending";
  title: string;
  subtitle?: string;
  content: string[];
  teacherNote?: string;
  interaction?: string;
  imageUrl?: string;
  bgColor?: string;
  accentColor?: string;
}

interface Storyboard {
  title: string;
  subtitle?: string;
  slides: Slide[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyboard } = body as { storyboard: Storyboard };

    if (!storyboard || !storyboard.slides || storyboard.slides.length === 0) {
      return NextResponse.json({ error: "无效的数据" }, { status: 400 });
    }

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_16x9";
    pptx.title = storyboard.title;
    pptx.author = "AI课件生成系统";

    // 主题颜色
    const themeColor = storyboard.slides[0]?.bgColor || "8B5CF6";
    const accentColor = storyboard.slides[0]?.accentColor || "EC4899";

    for (const slide of storyboard.slides) {
      const pptSlide = pptx.addSlide();

      // 背景图片
      if (slide.imageUrl) {
        pptSlide.background = {
          path: slide.imageUrl,
        };
      } else {
        pptSlide.background = { color: slide.bgColor || themeColor };
      }

      // 根据类型添加内容
      switch (slide.type) {
        case "cover":
          addCoverSlide(pptSlide, slide);
          break;
        case "content":
          addContentSlide(pptSlide, slide);
          break;
        case "highlight":
          addHighlightSlide(pptSlide, slide);
          break;
        case "interactive":
          addInteractiveSlide(pptSlide, slide);
          break;
        case "ending":
          addEndingSlide(pptSlide, slide);
          break;
        default:
          addContentSlide(pptSlide, slide);
      }

      // 添加页码
      pptSlide.addText(`${slide.id}`, {
        x: 9.2,
        y: 5.2,
        w: 0.6,
        h: 0.3,
        fontSize: 10,
        color: "FFFFFF",
        align: "right",
      });
    }

    // 生成Buffer
    const buffer = await pptx.write({ outputType: "nodebuffer" });

    return new NextResponse(new Uint8Array(buffer as Uint8Array), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(storyboard.title)}.pptx"`,
      },
    });
  } catch (error) {
    console.error("生成PPTX错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成失败" },
      { status: 500 }
    );
  }
}

// 封面页
function addCoverSlide(slide: ReturnType<PptxGenJS["addSlide"]>, data: Slide) {
  // 半透明遮罩
  slide.addShape("rect" as never, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: data.bgColor || "8B5CF6", transparency: 30 },
  });

  // 主标题
  slide.addText(data.title, {
    x: 0.5,
    y: 2.0,
    w: 9,
    h: 1.2,
    fontSize: 44,
    bold: true,
    color: "FFFFFF",
    align: "center",
    fontFace: "Microsoft YaHei",
    shadow: { type: "outer", blur: 8, offset: 2, angle: 45, color: "000000", opacity: 0.4 },
  });

  // 副标题
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 0.5,
      y: 3.2,
      w: 9,
      h: 0.6,
      fontSize: 24,
      color: "FFFFFF",
      align: "center",
      fontFace: "Microsoft YaHei",
    });
  }

  // 欢迎语
  data.content.slice(0, 3).forEach((text, i) => {
    slide.addText(text, {
      x: 0.5,
      y: 4.0 + i * 0.5,
      w: 9,
      h: 0.4,
      fontSize: 18,
      color: "FFFFFF",
      align: "center",
      fontFace: "Microsoft YaHei",
    });
  });
}

// 内容页
function addContentSlide(slide: ReturnType<PptxGenJS["addSlide"]>, data: Slide) {
  // 半透明遮罩
  slide.addShape("rect" as never, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: "000000", transparency: 50 },
  });

  // 标题
  slide.addText(data.title, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: "FFFFFF",
    align: "center",
    fontFace: "Microsoft YaHei",
    shadow: { type: "outer", blur: 6, offset: 2, angle: 45, color: "000000", opacity: 0.5 },
  });

  // 内容列表
  data.content.slice(0, 5).forEach((text, i) => {
    // 背景
    slide.addShape("roundRect" as never, {
      x: 0.8,
      y: 1.5 + i * 0.85,
      w: 8.4,
      h: 0.7,
      fill: { color: "FFFFFF", transparency: 80 },
      line: { color: "FFFFFF", width: 0.5 },
    });

    // 序号
    slide.addText(String(i + 1), {
      x: 1.0,
      y: 1.6 + i * 0.85,
      w: 0.5,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: "FFFFFF",
      align: "center",
      fontFace: "Microsoft YaHei",
    });

    // 文字
    slide.addText(text, {
      x: 1.6,
      y: 1.55 + i * 0.85,
      w: 7.4,
      h: 0.6,
      fontSize: 18,
      color: "FFFFFF",
      fontFace: "Microsoft YaHei",
    });
  });
}

// 重点页
function addHighlightSlide(slide: ReturnType<PptxGenJS["addSlide"]>, data: Slide) {
  // 半透明遮罩
  slide.addShape("rect" as never, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: "000000", transparency: 50 },
  });

  // 标题
  slide.addText(data.title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: "FFFFFF",
    align: "center",
    fontFace: "Microsoft YaHei",
  });

  // 重点卡片
  const cardWidth = 2.5;
  const totalCards = Math.min(data.content.length, 4);
  const startX = (10 - totalCards * cardWidth - (totalCards - 1) * 0.3) / 2;

  data.content.slice(0, 4).forEach((text, i) => {
    const x = startX + i * (cardWidth + 0.3);

    // 卡片背景
    slide.addShape("roundRect" as never, {
      x,
      y: 1.8,
      w: cardWidth,
      h: 3.0,
      fill: { color: "FFFFFF", transparency: 85 },
      line: { color: "FFFFFF", width: 0.5 },
    });

    // 序号
    slide.addText(String(i + 1), {
      x,
      y: 2.0,
      w: cardWidth,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: "FFFFFF",
      align: "center",
      fontFace: "Microsoft YaHei",
    });

    // 文字
    slide.addText(text, {
      x: x + 0.2,
      y: 2.7,
      w: cardWidth - 0.4,
      h: 2.0,
      fontSize: 16,
      color: "FFFFFF",
      align: "center",
      fontFace: "Microsoft YaHei",
      valign: "top",
    });
  });
}

// 互动页
function addInteractiveSlide(slide: ReturnType<PptxGenJS["addSlide"]>, data: Slide) {
  // 半透明遮罩
  slide.addShape("rect" as never, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: "000000", transparency: 50 },
  });

  // 标题
  slide.addText(data.title, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: "FFFFFF",
    align: "center",
    fontFace: "Microsoft YaHei",
  });

  // 互动提示
  if (data.interaction) {
    slide.addShape("roundRect" as never, {
      x: 1.5,
      y: 2.8,
      w: 7,
      h: 1.5,
      fill: { color: "FFFFFF", transparency: 80 },
      line: { color: "FFFFFF", width: 0.5 },
    });

    slide.addText(data.interaction, {
      x: 1.8,
      y: 3.0,
      w: 6.4,
      h: 1.2,
      fontSize: 20,
      color: "FFFFFF",
      align: "center",
      fontFace: "Microsoft YaHei",
    });
  }

  // 内容提示
  if (data.content.length > 0) {
    slide.addText(data.content.join("\n"), {
      x: 1,
      y: 4.5,
      w: 8,
      h: 1.0,
      fontSize: 14,
      color: "FFFFFF",
      align: "center",
      fontFace: "Microsoft YaHei",
    });
  }
}

// 结束页
function addEndingSlide(slide: ReturnType<PptxGenJS["addSlide"]>, data: Slide) {
  // 半透明遮罩
  slide.addShape("rect" as never, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: data.bgColor || "8B5CF6", transparency: 30 },
  });

  // 主标题
  slide.addText(data.title, {
    x: 0.5,
    y: 1.8,
    w: 9,
    h: 1.0,
    fontSize: 48,
    bold: true,
    color: "FFFFFF",
    align: "center",
    fontFace: "Microsoft YaHei",
    shadow: { type: "outer", blur: 8, offset: 2, angle: 45, color: "000000", opacity: 0.4 },
  });

  // 内容
  data.content.slice(0, 5).forEach((text, i) => {
    slide.addText(text, {
      x: 0.5,
      y: 3.2 + i * 0.5,
      w: 9,
      h: 0.4,
      fontSize: 20,
      color: "FFFFFF",
      align: "center",
      fontFace: "Microsoft YaHei",
    });
  });
}
