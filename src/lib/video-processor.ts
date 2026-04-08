/**
 * 视频处理工具类
 * 支持视频上传、人脸识别、精彩片段提取
 * 使用 Bull 队列异步处理，FFmpeg 视频处理
 */

import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { getCOSClient } from "./cos";
import { getFaceRecognitionClient } from "./tencent-face-recognition";

// 设置 FFmpeg 路径
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// 日志记录函数
function log(level: "info" | "warn" | "error", message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    module: "VideoProcessor",
    message,
    ...data,
  };
  console.log(JSON.stringify(logEntry));
}

// 处理状态
export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

// 识别到的学生信息
export interface DetectedStudent {
  studentId: string;
  name: string;
  confidence: number;
  firstAppearTime: number;
  lastAppearTime: number;
  appearances: number; // 出现次数
}

// 精彩片段
export interface VideoClip {
  studentId: string;
  name: string;
  confidence: number;
  startTime: number;
  endTime: number;
  duration: number;
  clipUrl: string;
  thumbnailUrl?: string;
}

// 处理结果
export interface ProcessingResult {
  taskId: string;
  status: ProcessingStatus;
  progress: number;
  videoUrl: string;
  duration: number;
  detectedStudents: DetectedStudent[];
  clips: VideoClip[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// 处理选项
export interface ProcessingOptions {
  frameInterval?: number; // 帧提取间隔（秒），默认1秒
  minClipDuration?: number; // 最小片段时长（秒），默认5秒
  maxClipDuration?: number; // 最大片段时长（秒），默认30秒
  confidenceThreshold?: number; // 置信度阈值，默认80
  mergeGap?: number; // 合并间隔（秒），默认3秒
  generateThumbnails?: boolean; // 是否生成缩略图
}

// 帧数据
interface FrameData {
  time: number;
  imagePath: string;
}

// 人脸识别结果
interface FrameFaceResult {
  time: number;
  studentId: string;
  name: string;
  confidence: number;
}

/**
 * 视频处理器类
 */
export class VideoProcessor {
  private cosClient = getCOSClient();
  private faceClient = getFaceRecognitionClient();
  private tempDir: string;

  constructor() {
    // 创建临时目录
    this.tempDir = path.join(tmpdir(), "video-processor");
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    log("info", "视频处理器初始化完成", { tempDir: this.tempDir });
  }

  /**
   * 获取视频信息
   */
  async getVideoInfo(videoPath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === "video");
        if (!videoStream) {
          reject(new Error("未找到视频流"));
          return;
        }

        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps: this.parseFps(videoStream.r_frame_rate || "30/1"),
          codec: videoStream.codec_name || "unknown",
        });
      });
    });
  }

  /**
   * 解析帧率
   */
  private parseFps(fpsString: string): number {
    const parts = fpsString.split("/");
    if (parts.length === 2) {
      return parseInt(parts[0]) / parseInt(parts[1]);
    }
    return parseFloat(fpsString);
  }

  /**
   * 从视频中提取帧
   */
  async extractFrames(
    videoPath: string,
    intervalSeconds: number = 1
  ): Promise<FrameData[]> {
    const frameDir = path.join(this.tempDir, `frames-${randomUUID()}`);
    fs.mkdirSync(frameDir, { recursive: true });

    const videoInfo = await this.getVideoInfo(videoPath);
    const totalFrames = Math.floor(videoInfo.duration / intervalSeconds);

    log("info", "开始提取帧", {
      videoPath,
      intervalSeconds,
      totalFrames,
      duration: videoInfo.duration,
    });

    return new Promise((resolve, reject) => {
      const frames: FrameData[] = [];
      let frameCount = 0;

      ffmpeg(videoPath)
        .fps(1 / intervalSeconds) // 每N秒提取一帧
        .output(path.join(frameDir, "frame-%04d.jpg"))
        .on("end", () => {
          // 收集所有帧
          const files = fs.readdirSync(frameDir).sort();
          for (let i = 0; i < files.length; i++) {
            const time = (i + 1) * intervalSeconds;
            frames.push({
              time: Math.min(time, videoInfo.duration),
              imagePath: path.join(frameDir, files[i]),
            });
          }
          log("info", "帧提取完成", { frameCount: frames.length });
          resolve(frames);
        })
        .on("error", (err) => {
          log("error", "帧提取失败", { error: err.message });
          reject(err);
        })
        .run();
    });
  }

  /**
   * 处理单个帧的人脸识别
   */
  async processFrameFaces(frame: FrameData): Promise<FrameFaceResult[]> {
    const imageBuffer = fs.readFileSync(frame.imagePath);
    const faces = await this.faceClient.searchFaces(imageBuffer, 3);

    return faces.map((face) => ({
      time: frame.time,
      studentId: face.studentId,
      name: face.name,
      confidence: face.confidence,
    }));
  }

  /**
   * 批量处理帧的人脸识别
   */
  async processFramesFaces(
    frames: FrameData[],
    onProgress?: (current: number, total: number) => void
  ): Promise<FrameFaceResult[]> {
    const results: FrameFaceResult[] = [];
    const batchSize = 5;

    for (let i = 0; i < frames.length; i += batchSize) {
      const batch = frames.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((frame) => this.processFrameFaces(frame))
      );

      for (const frameResults of batchResults) {
        results.push(...frameResults);
      }

      onProgress?.(Math.min(i + batchSize, frames.length), frames.length);
    }

    return results;
  }

  /**
   * 合并相邻的人脸识别结果
   */
  mergeFaceResults(
    results: FrameFaceResult[],
    options: ProcessingOptions
  ): DetectedStudent[] {
    const { mergeGap = 3 } = options;
    const studentMap = new Map<
      string,
      {
        studentId: string;
        name: string;
        maxConfidence: number;
        times: number[];
      }
    >();

    // 按学生分组
    for (const result of results) {
      const key = result.studentId;
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          studentId: result.studentId,
          name: result.name,
          maxConfidence: result.confidence,
          times: [],
        });
      }
      const entry = studentMap.get(key)!;
      entry.times.push(result.time);
      entry.maxConfidence = Math.max(entry.maxConfidence, result.confidence);
    }

    // 转换为 DetectedStudent 数组
    const detected: DetectedStudent[] = [];

    for (const entry of studentMap.values()) {
      const times = entry.times.sort((a, b) => a - b);
      const segments: Array<{ start: number; end: number }> = [];
      let currentSegment = { start: times[0], end: times[0] };

      for (let i = 1; i < times.length; i++) {
        if (times[i] - currentSegment.end <= mergeGap) {
          currentSegment.end = times[i];
        } else {
          segments.push(currentSegment);
          currentSegment = { start: times[i], end: times[i] };
        }
      }
      segments.push(currentSegment);

      // 找出最长的连续片段
      const longestSegment = segments.reduce(
        (max, seg) => (seg.end - seg.start > max.end - max.start ? seg : max),
        segments[0]
      );

      detected.push({
        studentId: entry.studentId,
        name: entry.name,
        confidence: entry.maxConfidence,
        firstAppearTime: longestSegment.start,
        lastAppearTime: longestSegment.end,
        appearances: times.length,
      });
    }

    return detected.sort((a, b) => b.appearances - a.appearances);
  }

  /**
   * 生成精彩片段
   */
  async generateClip(
    videoPath: string,
    startTime: number,
    endTime: number,
    studentId: string,
    options: ProcessingOptions
  ): Promise<{ clipPath: string; thumbnailPath?: string }> {
    const { minClipDuration = 5, maxClipDuration = 30, generateThumbnails = true } = options;

    // 调整时长
    let duration = endTime - startTime;
    if (duration < minClipDuration) {
      duration = minClipDuration;
    } else if (duration > maxClipDuration) {
      duration = maxClipDuration;
    }

    const clipId = `${studentId}-${Date.now()}`;
    const clipPath = path.join(this.tempDir, `clip-${clipId}.mp4`);
    const thumbnailPath = generateThumbnails
      ? path.join(this.tempDir, `thumb-${clipId}.jpg`)
      : undefined;

    log("info", "生成精彩片段", {
      startTime,
      duration,
      studentId,
      clipPath,
    });

    return new Promise((resolve, reject) => {
      let ffmpegCmd = ffmpeg(videoPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(clipPath)
        .videoCodec("libx264")
        .audioCodec("aac");

      if (generateThumbnails && thumbnailPath) {
        ffmpegCmd = ffmpegCmd.screenshots({
          timestamps: ["50%"],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: "320x?",
        });
      }

      ffmpegCmd
        .on("end", () => {
          log("info", "精彩片段生成完成", { clipPath, duration });
          resolve({
            clipPath,
            thumbnailPath: thumbnailPath && fs.existsSync(thumbnailPath) ? thumbnailPath : undefined,
          });
        })
        .on("error", (err) => {
          log("error", "精彩片段生成失败", { error: err.message });
          reject(err);
        })
        .run();
    });
  }

  /**
   * 处理视频（完整流程）
   */
  async processVideo(
    videoPathOrUrl: string,
    taskId: string,
    options: ProcessingOptions = {},
    onProgress?: (progress: number, status: string) => void
  ): Promise<ProcessingResult> {
    const {
      frameInterval = 1,
      confidenceThreshold = 80,
      minClipDuration = 5,
      maxClipDuration = 30,
    } = options;

    let localVideoPath: string;
    let isTempVideo = false;

    try {
      onProgress?.(5, "准备视频文件...");

      // 如果是URL，下载到本地
      if (videoPathOrUrl.startsWith("http")) {
        localVideoPath = await this.downloadVideo(videoPathOrUrl, taskId);
        isTempVideo = true;
      } else {
        localVideoPath = videoPathOrUrl;
      }

      // 获取视频信息
      onProgress?.(10, "分析视频...");
      const videoInfo = await this.getVideoInfo(localVideoPath);

      // 提取帧
      onProgress?.(20, "提取视频帧...");
      const frames = await this.extractFrames(localVideoPath, frameInterval);

      // 人脸识别
      onProgress?.(30, "识别帧中人脸...");
      const faceResults = await this.processFramesFaces(frames, (current, total) => {
        const progress = 30 + (current / total) * 30;
        onProgress?.(progress, `识别人脸 ${current}/${total}`);
      });

      // 过滤低置信度结果
      const filteredResults = faceResults.filter(
        (r) => r.confidence >= confidenceThreshold
      );

      // 合并结果
      onProgress?.(65, "分析识别结果...");
      const detectedStudents = this.mergeFaceResults(filteredResults, options);

      // 生成精彩片段
      const clips: VideoClip[] = [];
      const studentsWithClips = detectedStudents.slice(0, 10); // 最多生成10个片段

      onProgress?.(70, "生成精彩片段...");
      for (let i = 0; i < studentsWithClips.length; i++) {
        const student = studentsWithClips[i];
        const progress = 70 + (i / studentsWithClips.length) * 25;
        onProgress?.(progress, `生成片段 ${i + 1}/${studentsWithClips.length}`);

        try {
          const { clipPath, thumbnailPath } = await this.generateClip(
            localVideoPath,
            Math.max(0, student.firstAppearTime - 2), // 提前2秒开始
            student.lastAppearTime + 2, // 延后2秒结束
            student.studentId,
            options
          );

          // 上传片段到COS
          const clipBuffer = fs.readFileSync(clipPath);
          const clipUrl = await this.cosClient.uploadVideo({
            buffer: clipBuffer,
            mimeType: "video/mp4",
            size: clipBuffer.length,
            name: `clip-${student.studentId}-${taskId}.mp4`,
          });

          let thumbnailUrl: string | undefined;
          if (thumbnailPath && fs.existsSync(thumbnailPath)) {
            const thumbBuffer = fs.readFileSync(thumbnailPath);
            thumbnailUrl = await this.cosClient.uploadImage({
              buffer: thumbBuffer,
              mimeType: "image/jpeg",
              size: thumbBuffer.length,
              name: `thumb-${student.studentId}-${taskId}.jpg`,
            });
          }

          clips.push({
            studentId: student.studentId,
            name: student.name,
            confidence: student.confidence,
            startTime: student.firstAppearTime,
            endTime: student.lastAppearTime,
            duration: student.lastAppearTime - student.firstAppearTime,
            clipUrl,
            thumbnailUrl,
          });

          // 清理本地文件
          fs.unlinkSync(clipPath);
          if (thumbnailPath && fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
          }
        } catch (clipError) {
          log("warn", "生成片段失败，跳过", {
            studentId: student.studentId,
            error: clipError instanceof Error ? clipError.message : String(clipError),
          });
        }
      }

      onProgress?.(95, "清理临时文件...");

      // 清理帧文件
      const frameDir = path.dirname(frames[0]?.imagePath || "");
      if (frameDir && fs.existsSync(frameDir)) {
        fs.rmSync(frameDir, { recursive: true, force: true });
      }

      // 清理下载的临时视频
      if (isTempVideo && fs.existsSync(localVideoPath)) {
        fs.unlinkSync(localVideoPath);
      }

      onProgress?.(100, "处理完成");

      // 上传原视频到COS（如果还没上传）
      let videoUrl = videoPathOrUrl;
      if (!videoPathOrUrl.startsWith("http")) {
        const videoBuffer = fs.readFileSync(localVideoPath);
        videoUrl = await this.cosClient.uploadVideo({
          buffer: videoBuffer,
          mimeType: "video/mp4",
          size: videoBuffer.length,
          name: `video-${taskId}.mp4`,
        });
      }

      return {
        taskId,
        status: "completed",
        progress: 100,
        videoUrl,
        duration: videoInfo.duration,
        detectedStudents,
        clips,
        createdAt: new Date(),
        completedAt: new Date(),
      };
    } catch (error) {
      log("error", "视频处理失败", {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        taskId,
        status: "failed",
        progress: 0,
        videoUrl: videoPathOrUrl,
        duration: 0,
        detectedStudents: [],
        clips: [],
        error: error instanceof Error ? error.message : String(error),
        createdAt: new Date(),
      };
    }
  }

  /**
   * 下载视频到本地
   */
  private async downloadVideo(url: string, taskId: string): Promise<string> {
    const localPath = path.join(this.tempDir, `video-${taskId}.mp4`);

    log("info", "下载视频", { url, localPath });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`下载视频失败: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(localPath, buffer);

    log("info", "视频下载完成", { size: buffer.length, localPath });
    return localPath;
  }

  /**
   * 清理所有临时文件
   */
  cleanup(): void {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
      fs.mkdirSync(this.tempDir, { recursive: true });
      log("info", "临时文件已清理");
    }
  }
}

// 导出单例实例
let videoProcessorInstance: VideoProcessor | null = null;

export function getVideoProcessor(): VideoProcessor {
  if (!videoProcessorInstance) {
    videoProcessorInstance = new VideoProcessor();
  }
  return videoProcessorInstance;
}

export default VideoProcessor;
