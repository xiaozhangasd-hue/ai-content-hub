/**
 * 腾讯云COS对象存储工具类
 * 支持图片/视频上传、进度回调、文件类型校验、错误重试
 */

import COS from "cos-nodejs-sdk-v5";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";

// 日志记录函数
function log(level: "info" | "warn" | "error", message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    module: "COSClient",
    message,
    ...data,
  };
  console.log(JSON.stringify(logEntry));
}

// 配置类型
interface COSConfig {
  bucket: string;
  region: string;
  secretId: string;
  secretKey: string;
}

// 上传结果
interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

// 上传选项
interface UploadOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  onProgress?: (progress: number) => void;
  retryCount?: number;
}

// 默认配置
const DEFAULT_IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_VIDEO_MAX_SIZE = 500 * 1024 * 1024; // 500MB
const DEFAULT_RETRY_COUNT = 3;

// 允许的MIME类型
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];

/**
 * COS客户端类
 */
export class COSClient {
  private cos: COS;
  private bucket: string;
  private region: string;
  private baseUrl: string;

  constructor(config?: Partial<COSConfig>) {
    const finalConfig: COSConfig = {
      bucket: config?.bucket || process.env.COS_BUCKET || "",
      region: config?.region || process.env.COS_REGION || "ap-beijing",
      secretId: config?.secretId || process.env.COS_SECRET_ID || "",
      secretKey: config?.secretKey || process.env.COS_SECRET_KEY || "",
    };

    if (!finalConfig.bucket || !finalConfig.secretId || !finalConfig.secretKey) {
      throw new Error("COS配置缺失：请检查环境变量 COS_BUCKET, COS_SECRET_ID, COS_SECRET_KEY");
    }

    this.bucket = finalConfig.bucket;
    this.region = finalConfig.region;
    this.baseUrl = `https://${this.bucket}.cos.${this.region}.myqcloud.com`;

    this.cos = new COS({
      SecretId: finalConfig.secretId,
      SecretKey: finalConfig.secretKey,
    });

    log("info", "COS客户端初始化成功", { bucket: this.bucket, region: this.region });
  }

  /**
   * 生成唯一文件名
   */
  private generateKey(originalName: string, prefix: string = "uploads"): string {
    const timestamp = Date.now();
    const hash = createHash("md5")
      .update(`${timestamp}-${originalName}-${Math.random()}`)
      .digest("hex")
      .substring(0, 8);
    const ext = path.extname(originalName);
    return `${prefix}/${timestamp}-${hash}${ext}`;
  }

  /**
   * 验证文件类型和大小
   */
  private validateFile(
    file: { size: number; mimeType: string; name: string },
    options: UploadOptions
  ): void {
    const { maxSize, allowedMimeTypes } = options;

    if (maxSize && file.size > maxSize) {
      throw new Error(`文件大小超出限制：最大允许 ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimeType)) {
      throw new Error(`不支持的文件类型：${file.mimeType}，允许的类型：${allowedMimeTypes.join(", ")}`);
    }
  }

  /**
   * 执行上传（带重试）
   */
  private async uploadWithRetry(
    key: string,
    buffer: Buffer,
    options: UploadOptions,
    currentRetry: number = 0
  ): Promise<UploadResult> {
    const maxRetry = options.retryCount ?? DEFAULT_RETRY_COUNT;

    try {
      return await this.doUpload(key, buffer, options);
    } catch (error) {
      if (currentRetry < maxRetry) {
        log("warn", `上传失败，准备重试`, {
          key,
          retry: currentRetry + 1,
          maxRetry,
          error: error instanceof Error ? error.message : String(error),
        });

        // 指数退避
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, currentRetry)));

        return this.uploadWithRetry(key, buffer, options, currentRetry + 1);
      }

      log("error", `上传失败，已达最大重试次数`, {
        key,
        maxRetry,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * 执行实际上传操作
   */
  private async doUpload(
    key: string,
    buffer: Buffer,
    options: UploadOptions
  ): Promise<UploadResult> {
    const { onProgress } = options;

    return new Promise((resolve, reject) => {
      this.cos.putObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
          Body: buffer,
          onProgress: (progressData) => {
            const percent = Math.round(progressData.percent * 100);
            onProgress?.(percent);
            log("info", "上传进度", { key, percent });
          },
        },
        (err, data) => {
          if (err) {
            log("error", "上传失败", { key, error: err.message });
            reject(new Error(`上传失败: ${err.message}`));
            return;
          }

          const url = `${this.baseUrl}/${key}`;
          log("info", "上传成功", { key, url });

          resolve({
            url,
            key,
            size: buffer.length,
            mimeType: data.headers?.["content-type"] || "application/octet-stream",
          });
        }
      );
    });
  }

  /**
   * 上传图片
   * @param file 文件对象（包含 buffer, mimeType, size, name）
   * @returns 上传后的CDN地址
   */
  async uploadImage(
    file: {
      buffer: Buffer;
      mimeType: string;
      size: number;
      name: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<string> {
    log("info", "开始上传图片", { fileName: file.name, size: file.size });

    // 验证文件
    this.validateFile(file, {
      maxSize: DEFAULT_IMAGE_MAX_SIZE,
      allowedMimeTypes: ALLOWED_IMAGE_TYPES,
    });

    // 生成文件key
    const key = this.generateKey(file.name, "images");

    // 上传
    const result = await this.uploadWithRetry(key, file.buffer, {
      maxSize: DEFAULT_IMAGE_MAX_SIZE,
      allowedMimeTypes: ALLOWED_IMAGE_TYPES,
      onProgress,
      retryCount: DEFAULT_RETRY_COUNT,
    });

    return result.url;
  }

  /**
   * 批量上传图片
   * @param files 文件数组
   * @param onProgress 进度回调（当前索引，总数，当前进度）
   * @returns 上传后的CDN地址数组
   */
  async uploadImages(
    files: Array<{
      buffer: Buffer;
      mimeType: string;
      size: number;
      name: string;
    }>,
    onProgress?: (currentIndex: number, total: number, progress: number) => void
  ): Promise<string[]> {
    log("info", "开始批量上传图片", { count: files.length });

    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await this.uploadImage(file, (progress) => {
        onProgress?.(i, files.length, progress);
      });
      urls.push(url);
    }

    log("info", "批量上传图片完成", { count: urls.length });
    return urls;
  }

  /**
   * 上传视频
   * @param file 文件对象
   * @param onProgress 进度回调
   * @returns 上传后的CDN地址
   */
  async uploadVideo(
    file: {
      buffer: Buffer;
      mimeType: string;
      size: number;
      name: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<string> {
    log("info", "开始上传视频", { fileName: file.name, size: file.size });

    // 验证文件
    this.validateFile(file, {
      maxSize: DEFAULT_VIDEO_MAX_SIZE,
      allowedMimeTypes: ALLOWED_VIDEO_TYPES,
    });

    // 生成文件key
    const key = this.generateKey(file.name, "videos");

    // 上传（使用分片上传以支持大文件）
    const result = await this.uploadLargeFile(key, file.buffer, onProgress);

    return result.url;
  }

  /**
   * 分片上传大文件
   */
  private async uploadLargeFile(
    key: string,
    buffer: Buffer,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      // 对于Buffer上传，使用putObject替代uploadFile
      // uploadFile主要用于文件路径上传
      this.cos.putObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
          Body: buffer,
        },
        (err, data) => {
          if (err) {
            log("error", "上传失败", { key, error: err.message });
            reject(new Error(`上传失败: ${err.message}`));
            return;
          }

          const url = `${this.baseUrl}/${key}`;
          log("info", "上传成功", { key, url });
          onProgress?.(100);

          resolve({
            url,
            key,
            size: buffer.length,
            mimeType: "video/mp4",
          });
        }
      );
    });
  }

  /**
   * 删除文件
   * @param key 文件key或完整URL
   */
  async deleteFile(key: string): Promise<void> {
    // 如果传入的是完整URL，提取key
    let fileKey = key;
    if (key.startsWith(this.baseUrl)) {
      fileKey = key.replace(`${this.baseUrl}/`, "");
    }

    log("info", "开始删除文件", { key: fileKey });

    return new Promise((resolve, reject) => {
      this.cos.deleteObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: fileKey,
        },
        (err) => {
          if (err) {
            log("error", "删除文件失败", { key: fileKey, error: err.message });
            reject(new Error(`删除失败: ${err.message}`));
            return;
          }

          log("info", "删除文件成功", { key: fileKey });
          resolve();
        }
      );
    });
  }

  /**
   * 批量删除文件
   * @param keys 文件key数组
   */
  async deleteFiles(keys: string[]): Promise<void> {
    log("info", "开始批量删除文件", { count: keys.length });

    const fileKeys = keys.map((key) => {
      if (key.startsWith(this.baseUrl)) {
        return key.replace(`${this.baseUrl}/`, "");
      }
      return key;
    });

    return new Promise((resolve, reject) => {
      this.cos.deleteMultipleObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Objects: fileKeys.map((key) => ({ Key: key })),
        },
        (err, data) => {
          if (err) {
            log("error", "批量删除失败", { error: err.message });
            reject(new Error(`批量删除失败: ${err.message}`));
            return;
          }

          if (data?.Error?.length) {
            log("warn", "部分文件删除失败", { errors: data.Error });
          }

          log("info", "批量删除完成", { deleted: data?.Deleted?.length || 0 });
          resolve();
        }
      );
    });
  }

  /**
   * 获取文件临时访问URL（带签名）
   * @param key 文件key
   * @param expires 过期时间（秒），默认1小时
   */
  async getSignedUrl(key: string, expires: number = 3600): Promise<string> {
    let fileKey = key;
    if (key.startsWith(this.baseUrl)) {
      fileKey = key.replace(`${this.baseUrl}/`, "");
    }

    return new Promise((resolve, reject) => {
      this.cos.getObjectUrl(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: fileKey,
          Sign: true,
          Expires: expires,
        },
        (err, data) => {
          if (err) {
            reject(new Error(`获取签名URL失败: ${err.message}`));
            return;
          }
          resolve(data.Url);
        }
      );
    });
  }

  /**
   * 检查文件是否存在
   * @param key 文件key
   */
  async fileExists(key: string): Promise<boolean> {
    let fileKey = key;
    if (key.startsWith(this.baseUrl)) {
      fileKey = key.replace(`${this.baseUrl}/`, "");
    }

    return new Promise((resolve) => {
      this.cos.headObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: fileKey,
        },
        (err) => {
          resolve(!err);
        }
      );
    });
  }

  /**
   * 从本地文件路径上传图片
   */
  async uploadImageFromPath(filePath: string, onProgress?: (progress: number) => void): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const mimeType = this.getMimeType(ext);
    const name = path.basename(filePath);

    return this.uploadImage(
      {
        buffer,
        mimeType,
        size: buffer.length,
        name,
      },
      onProgress
    );
  }

  /**
   * 从本地文件路径上传视频
   */
  async uploadVideoFromPath(filePath: string, onProgress?: (progress: number) => void): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const mimeType = this.getMimeType(ext);
    const name = path.basename(filePath);

    return this.uploadVideo(
      {
        buffer,
        mimeType,
        size: buffer.length,
        name,
      },
      onProgress
    );
  }

  /**
   * 根据扩展名获取MIME类型
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".avi": "video/x-msvideo",
      ".webm": "video/webm",
    };
    return mimeTypes[ext.toLowerCase()] || "application/octet-stream";
  }
}

// 导出单例实例
let cosClientInstance: COSClient | null = null;

export function getCOSClient(): COSClient {
  if (!cosClientInstance) {
    cosClientInstance = new COSClient();
  }
  return cosClientInstance;
}

export default COSClient;
