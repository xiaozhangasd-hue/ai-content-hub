import { NextRequest, NextResponse } from "next/server";
import { S3Storage } from "coze-coding-dev-sdk";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 初始化存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

// 支持的媒体类型
const ALLOWED_MEDIA_TYPES = {
  photo: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/heic",
    "image/heif",
  ],
  video: [
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/mov",
  ],
};

// 获取文件类型
function getMediaType(mimeType: string): "photo" | "video" | null {
  if (ALLOWED_MEDIA_TYPES.photo.includes(mimeType)) return "photo";
  if (ALLOWED_MEDIA_TYPES.video.includes(mimeType)) return "video";
  return null;
}

// 生成缩略图（视频）
async function generateVideoThumbnail(videoBuffer: Buffer): Promise<Buffer | null> {
  // TODO: 使用FFmpeg生成视频缩略图
  // 暂时返回null，后续集成FFmpeg
  return null;
}

// 生成图片缩略图
async function generateImageThumbnail(imageBuffer: Buffer, maxWidth: number = 300): Promise<Buffer | null> {
  // TODO: 使用sharp生成缩略图
  // 暂时返回null，后续集成sharp
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // 验证token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const merchantId = formData.get("merchantId") as string;
    const campusId = formData.get("campusId") as string | null;
    const studentId = formData.get("studentId") as string | null;
    const classId = formData.get("classId") as string | null;
    const lessonId = formData.get("lessonId") as string | null;
    const description = formData.get("description") as string | null;
    const tags = formData.get("tags") as string | null;
    const recordDate = formData.get("recordDate") as string | null;

    if (!file) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    if (!merchantId) {
      return NextResponse.json({ error: "缺少商家ID" }, { status: 400 });
    }

    // 检查文件类型
    const mediaType = getMediaType(file.type);
    if (!mediaType) {
      return NextResponse.json(
        { error: "不支持的文件类型，请上传图片或视频" },
        { status: 400 }
      );
    }

    // 检查文件大小（最大100MB）
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "文件大小不能超过100MB" },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成存储路径
    const ext = file.name.split('.').pop() || (mediaType === "photo" ? "jpg" : "mp4");
    const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '/');
    const fileName = `student-media/${merchantId}/${datePrefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    console.log(`开始上传${mediaType === "photo" ? "图片" : "视频"}:`, fileName);

    // 上传到对象存储
    const storageKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    console.log("上传成功:", storageKey);

    // 生成缩略图（可选）
    let thumbnailKey: string | null = null;
    if (mediaType === "photo") {
      // TODO: 生成图片缩略图
    } else if (mediaType === "video") {
      // TODO: 生成视频缩略图
    }

    // 保存到数据库
    const media = await prisma.studentMedia.create({
      data: {
        merchantId,
        campusId: campusId || null,
        studentId: studentId || null,
        teacherId: payload.teacherId || null,
        classId: classId || null,
        lessonId: lessonId || null,
        type: mediaType,
        storageKey,
        thumbnailKey,
        fileName: file.name,
        fileSize: file.size,
        width: null, // TODO: 从图片元数据获取
        height: null,
        duration: null, // TODO: 从视频元数据获取
        description,
        tags,
        recordDate: recordDate ? new Date(recordDate) : new Date(),
        faceDetected: false,
        faceCount: 0,
      },
    });

    console.log("媒体记录创建成功:", media.id);

    // 生成预览URL（有效期1小时）
    const previewUrl = await storage.generatePresignedUrl({
      key: storageKey,
      expireTime: 3600,
    });

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        type: media.type,
        fileName: media.fileName,
        fileSize: media.fileSize,
        storageKey: media.storageKey,
        previewUrl,
        createdAt: media.createdAt,
      },
      message: `${mediaType === "photo" ? "图片" : "视频"}上传成功`,
    });
  } catch (error) {
    console.error("媒体上传错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传失败" },
      { status: 500 }
    );
  }
}
