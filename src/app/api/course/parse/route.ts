import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 解析Word文档
async function parseWord(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.error("解析Word失败:", error);
    return "";
  }
}

// 解析PDF文档 - 使用动态导入避免ESM问题
async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    // 动态导入 pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = await import("pdf-parse").then((m: any) => m.default || m.PDFParse || m);
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (error) {
    console.error("解析PDF失败:", error);
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未找到上传文件" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name || "file";

    let content = "";

    // 根据文件类型解析
    if (filename.toLowerCase().endsWith(".docx") || filename.toLowerCase().endsWith(".doc")) {
      content = await parseWord(buffer);
    } else if (filename.toLowerCase().endsWith(".pdf")) {
      content = await parsePDF(buffer);
    } else {
      // 尝试作为文本读取
      content = buffer.toString("utf-8");
    }

    // 清理内容
    content = content
      .replace(/\s+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!content || content.length < 10) {
      return NextResponse.json({ error: "无法解析文件内容或内容过少" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      filename,
      content: content.slice(0, 10000), // 限制长度
      length: content.length,
    });
  } catch (error) {
    console.error("文件解析错误:", error);
    return NextResponse.json(
      { error: "文件解析失败，请检查文件格式" },
      { status: 500 }
    );
  }
}
