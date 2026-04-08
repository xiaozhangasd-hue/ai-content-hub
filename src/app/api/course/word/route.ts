import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

// 使用AI生成课程文档内容
async function generateCourseDocument(
  topic: string,
  courseType: string,
  targetAudience: string,
  duration: number
): Promise<{
  title: string;
  subtitle: string;
  outline: { section: string; points: string[] }[];
  content: { section: string; content: string }[];
  summary: string;
}> {
  const systemPrompt = `你是一位专业的教育培训课程设计师，擅长编写详细的课程文档。

请根据用户提供的课程信息，生成一份完整的课程文档，包含：
1. 课程概述
2. 课程大纲（分章节）
3. 详细内容（每个章节的具体内容）
4. 课程总结

要求：
- 内容要实用、有条理
- 适合${targetAudience}学习
- 课程类型：${courseType}
- 内容要足够详细，方便老师备课使用

请以JSON格式输出。`;

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
          content: `课程主题：${topic}
课程类型：${courseType}
目标学员：${targetAudience}
课程时长：${duration}分钟

请生成详细的课程文档内容。`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error("AI生成内容失败");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("AI返回格式错误");
  }
}

// 创建Word文档
async function createWordDocument(
  courseData: {
    title: string;
    subtitle: string;
    outline: { section: string; points: string[] }[];
    content: { section: string; content: string }[];
    summary: string;
  }
): Promise<Buffer> {
  const children: Paragraph[] = [];

  // 标题
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: courseData.title || "课程文档",
          bold: true,
          size: 56,
          color: "1A5276",
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // 副标题
  if (courseData.subtitle) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: courseData.subtitle,
            size: 28,
            color: "7F8C8D",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // 分隔线
  children.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "3498DB" },
      },
      spacing: { after: 400 },
    })
  );

  // 课程大纲
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "📚 课程大纲",
          bold: true,
          size: 32,
          color: "2C3E50",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
    })
  );

  if (courseData.outline) {
    courseData.outline.forEach((item, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${item.section}`,
              bold: true,
              size: 24,
              color: "34495E",
            }),
          ],
          spacing: { before: 100 },
        })
      );

      if (item.points) {
        item.points.forEach((point) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `    • ${point}`,
                  size: 22,
                  color: "5D6D7E",
                }),
              ],
              spacing: { before: 50 },
            })
          );
        });
      }
    });
  }

  // 课程内容
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "📖 课程内容",
          bold: true,
          size: 32,
          color: "2C3E50",
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  if (courseData.content) {
    courseData.content.forEach((section) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.section,
              bold: true,
              size: 28,
              color: "1A5276",
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      // 将内容按段落分割
      const paragraphs = section.content.split("\n").filter((p) => p.trim());
      paragraphs.forEach((para) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para,
                size: 22,
                color: "34495E",
              }),
            ],
            spacing: { before: 80 },
          })
        );
      });
    });
  }

  // 课程总结
  if (courseData.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "📝 课程总结",
            bold: true,
            size: 32,
            color: "2C3E50",
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    const summaryParagraphs = courseData.summary.split("\n").filter((p) => p.trim());
    summaryParagraphs.forEach((para) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: para,
              size: 22,
              color: "34495E",
            }),
          ],
          spacing: { before: 80 },
        })
      );
    });
  }

  // 页脚信息
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "— 由南都AI生成 —",
          size: 20,
          color: "BDC3C7",
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, courseType, targetAudience, duration, action, courseData } = body;

    // 验证token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    if (action === "generate_content") {
      // 仅生成内容预览
      const data = await generateCourseDocument(
        topic,
        courseType,
        targetAudience,
        duration
      );
      return NextResponse.json(data);
    }

    if (action === "generate_doc") {
      // 使用已有内容生成文档
      if (!courseData) {
        return NextResponse.json({ error: "请提供课程内容" }, { status: 400 });
      }

      const buffer = await createWordDocument(courseData);

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(topic || "课程文档")}.docx"`,
        },
      });
    }

    // 默认：生成内容并返回文档
    const data = await generateCourseDocument(
      topic,
      courseType,
      targetAudience,
      duration
    );

    const buffer = await createWordDocument(data);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(topic || "课程文档")}.docx"`,
      },
    });
  } catch (error) {
    console.error("Word文档生成错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成失败" },
      { status: 500 }
    );
  }
}
