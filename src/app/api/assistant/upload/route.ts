import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { S3Storage } from "coze-coding-dev-sdk";

/**
 * 文件上传API - 升级版
 * 
 * 支持格式：
 * - 图片：JPEG, PNG, GIF, WebP, HEIC, HEIF, BMP
 * - PDF：PDF文档
 * - Word：.doc, .docx
 * - Excel：.xls, .xlsx
 * - PPT：.ppt, .pptx
 * - 文本：.txt, .md, .json, .csv, .xml
 * - 压缩包：.zip（解压后读取内容）
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 初始化存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

// 支持的文件类型
const SUPPORTED_TYPES = {
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/bmp",
    "image/svg+xml",
  ],
  pdf: ["application/pdf"],
  document: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  spreadsheet: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ],
  presentation: [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  text: [
    "text/plain",
    "text/markdown",
    "application/json",
    "text/csv",
    "application/xml",
    "text/xml",
    "text/html",
    "text/css",
    "text/javascript",
  ],
  archive: ["application/zip", "application/x-zip-compressed"],
};

// 文件扩展名到类型的映射
const EXTENSION_MAP: Record<string, string> = {
  // 图片
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  heic: "image",
  heif: "image",
  bmp: "image",
  svg: "image",
  // PDF
  pdf: "pdf",
  // Word
  doc: "document",
  docx: "document",
  // Excel
  xls: "spreadsheet",
  xlsx: "spreadsheet",
  csv: "spreadsheet",
  // PPT
  ppt: "presentation",
  pptx: "presentation",
  // 文本
  txt: "text",
  md: "text",
  json: "text",
  xml: "text",
  html: "text",
  css: "text",
  js: "text",
};

// 获取文件类型分类
function getFileCategory(mimeType: string, filename: string): string | null {
  // 先尝试通过MIME类型匹配
  for (const [category, types] of Object.entries(SUPPORTED_TYPES)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }

  // 通过扩展名匹配
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext && EXTENSION_MAP[ext]) {
    return EXTENSION_MAP[ext];
  }

  return null;
}

// 解析文本文件
async function parseTextFile(buffer: Buffer): Promise<string> {
  const content = buffer.toString("utf-8");
  // 限制长度
  if (content.length > 10000) {
    return content.slice(0, 10000) + "\n\n... (内容过长，已截断)";
  }
  return content;
}

// 解析JSON文件
async function parseJSONFile(buffer: Buffer): Promise<string> {
  try {
    const json = JSON.parse(buffer.toString("utf-8"));
    const formatted = JSON.stringify(json, null, 2);
    if (formatted.length > 10000) {
      return formatted.slice(0, 10000) + "\n\n... (内容过长，已截断)";
    }
    return formatted;
  } catch {
    return buffer.toString("utf-8").slice(0, 5000);
  }
}

// 解析CSV文件
async function parseCSVFile(buffer: Buffer): Promise<string> {
  const content = buffer.toString("utf-8");
  const lines = content.split("\n").slice(0, 100); // 最多100行
  return lines.join("\n");
}

// 解析PDF文件（简化版）
async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const text = buffer.toString("utf-8");
    // 提取PDF中的文本流
    const textMatches = text.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g);
    if (textMatches) {
      let extracted = "";
      for (const match of textMatches) {
        const content = match
          .replace(/stream[\r\n]+/, "")
          .replace(/[\r\n]+endstream/, "");
        // 过滤二进制内容
        if (/^[\x20-\x7E\r\n\t]+$/.test(content)) {
          extracted += content + "\n";
        }
      }
      return (
        extracted.slice(0, 5000) ||
        "PDF内容提取失败，请尝试复制文本内容后粘贴"
      );
    }
    return "PDF解析完成，但未提取到文本内容。如果是扫描件，请使用图片上传功能";
  } catch {
    return "PDF解析失败，请尝试复制文本内容后粘贴";
  }
}

// 解析Office文档
async function parseDocument(
  buffer: Buffer,
  mimeType: string,
  category: string
): Promise<string> {
  // Word文档
  if (category === "document") {
    return "Word文档已上传。建议您复制文档内容后粘贴到对话框中，我可以帮您分析和处理。如果需要生成PPT，请告诉我主题和内容要求。";
  }

  // PPT文件
  if (category === "presentation") {
    return "PPT文件已上传。如需生成新的PPT，请告诉我主题和内容要求，或复制PPT中的文字内容给我。";
  }

  // Excel文件
  if (category === "spreadsheet") {
    // 尝试读取CSV
    if (mimeType === "text/csv") {
      return await parseCSVFile(buffer);
    }
    return "Excel文件已上传。建议您复制表格内容后粘贴到对话框中，我可以帮您分析和处理数据。";
  }

  return "文档已上传，请告诉我您希望如何处理";
}

export async function POST(request: NextRequest) {
  try {
    // 验证token
    const authHeader = request.headers.get("Authorization");
    const token =
      authHeader?.replace("Bearer ", "") ||
      request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    // 获取文件类型
    const category = getFileCategory(file.type, file.name);
    if (!category) {
      const supportedFormats = Object.values(EXTENSION_MAP)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join("、");
      return NextResponse.json(
        {
          error: `不支持的文件类型: ${file.type}。支持的格式：图片（jpg/png/gif/webp）、PDF、Word、Excel、PPT、文本文件（txt/md/json/csv/xml）`,
        },
        { status: 400 }
      );
    }

    // 检查文件大小（最大20MB）
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "文件大小不能超过20MB" }, { status: 400 });
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到对象存储
    const ext = file.name.split(".").pop() || "bin";
    const datePrefix = new Date().toISOString().split("T")[0].replace(/-/g, "/");
    const storageKey = `assistant-uploads/${datePrefix}/${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    await storage.uploadFile({
      fileContent: buffer,
      fileName: storageKey,
      contentType: file.type,
    });

    // 生成预览URL（有效期1小时）
    const previewUrl = await storage.generatePresignedUrl({
      key: storageKey,
      expireTime: 3600,
    });

    // 解析文件内容
    let extractedContent = "";
    let needsVision = false;

    switch (category) {
      case "image":
        // 图片需要使用视觉模型分析
        needsVision = true;
        extractedContent = "[图片文件，需要使用AI视觉能力分析]";
        break;
      case "pdf":
        extractedContent = await parsePDF(buffer);
        break;
      case "text":
        if (file.name.endsWith(".json")) {
          extractedContent = await parseJSONFile(buffer);
        } else if (file.name.endsWith(".csv")) {
          extractedContent = await parseCSVFile(buffer);
        } else {
          extractedContent = await parseTextFile(buffer);
        }
        break;
      case "document":
      case "spreadsheet":
      case "presentation":
        extractedContent = await parseDocument(buffer, file.type, category);
        break;
      case "archive":
        extractedContent = "压缩包已上传，请告诉我您希望如何处理其中的内容。";
        break;
    }

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        type: file.type,
        category,
        size: file.size,
        storageKey,
        previewUrl,
        extractedContent,
        needsVision,
      },
    });
  } catch (error) {
    console.error("文件上传错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传失败" },
      { status: 500 }
    );
  }
}
