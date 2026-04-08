/**
 * 视频处理队列
 * 注意：在 serverless 环境中使用同步处理模式
 * 仅在有 Redis 连接时才使用队列模式
 */

import { prisma } from "./prisma";
import { getVideoProcessor, ProcessingOptions, ProcessingResult } from "./video-processor";

// 日志记录函数
function log(level: "info" | "warn" | "error", message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    module: "VideoQueue",
    message,
    ...data,
  };
  console.log(JSON.stringify(logEntry));
}

// 任务数据类型
export interface VideoProcessingJobData {
  taskId: string;
  videoUrl: string;
  merchantId: string;
  teacherId?: string;
  campusId?: string;
  lessonId?: string;
  options?: ProcessingOptions;
}

// Redis 连接配置
const REDIS_URL = process.env.REDIS_URL;

// 是否启用队列模式（仅在有 Redis 且非 serverless 环境时启用）
const USE_QUEUE = !!REDIS_URL && process.env.NODE_ENV !== 'production';

// 动态导入 bull 的类型
type BullQueue<T> = {
  add: (data: T, opts?: { jobId?: string }) => Promise<{ id: string }>;
  process: (handler: (job: { data: T; id: string; progress: (p: number) => void }) => Promise<unknown>) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  getWaitingCount: () => Promise<number>;
  getActiveCount: () => Promise<number>;
  getCompletedCount: () => Promise<number>;
  getFailedCount: () => Promise<number>;
  clean: (grace: number, type: string) => Promise<unknown[]>;
  close: () => Promise<void>;
};

// 队列实例（延迟初始化）
let videoQueue: BullQueue<VideoProcessingJobData> | null = null;
let isWorkerInitialized = false;

/**
 * 动态获取 Bull 队列（仅在需要时加载）
 */
async function getBullQueue(): Promise<BullQueue<VideoProcessingJobData> | null> {
  if (!USE_QUEUE) {
    return null;
  }

  if (!videoQueue) {
    try {
      // 动态导入 bull，避免 Turbopack 构建错误
      const Bull = (await import("bull")).default;
      
      videoQueue = new Bull<VideoProcessingJobData>("video-processing", REDIS_URL!, {
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
          timeout: 30 * 60 * 1000,
        },
        settings: {
          stalledInterval: 30000,
          maxStalledCount: 3,
        },
      }) as unknown as BullQueue<VideoProcessingJobData>;

      log("info", "视频处理队列创建成功", { mode: "queue" });
      setupQueueEvents(videoQueue);
    } catch (error) {
      log("error", "创建队列失败，将使用同步模式", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  return videoQueue;
}

/**
 * 设置队列事件监听
 */
function setupQueueEvents(queue: BullQueue<VideoProcessingJobData>) {
  queue.on("completed", (...args: unknown[]) => {
    const job = args[0] as { id: string; data: VideoProcessingJobData };
    log("info", "任务完成", { jobId: job.id, taskId: job.data.taskId });
  });

  queue.on("failed", (...args: unknown[]) => {
    const job = args[0] as { id: string; data: VideoProcessingJobData } | undefined;
    const err = args[1] as Error;
    log("error", "任务失败", {
      jobId: job?.id,
      taskId: job?.data?.taskId,
      error: err?.message,
    });
  });

  queue.on("stalled", (...args: unknown[]) => {
    const job = args[0] as { id: string; data: VideoProcessingJobData };
    log("warn", "任务停滞", { jobId: job.id, taskId: job.data.taskId });
  });

  queue.on("error", (...args: unknown[]) => {
    const error = args[0] as Error;
    log("error", "队列错误", { error: error?.message });
  });
}

/**
 * 初始化 Worker（仅在启用队列模式时）
 */
export async function initVideoWorker() {
  const queue = await getBullQueue();
  if (!queue) {
    log("info", "未启用队列模式，跳过 Worker 初始化");
    return;
  }

  if (isWorkerInitialized) {
    return;
  }

  const processor = getVideoProcessor();

  queue.process(async (job) => {
    const { taskId, videoUrl, options } = job.data;

    log("info", "开始处理视频任务", { taskId, jobId: job.id });

    try {
      await prisma.videoProcessingTask.update({
        where: { taskId },
        data: {
          status: "processing",
          startedAt: new Date(),
        },
      });

      const result = await processor.processVideo(
        videoUrl,
        taskId,
        options,
        async (progress, status) => {
          await prisma.videoProcessingTask.update({
            where: { taskId },
            data: { progress },
          });
          job.progress(progress);
          log("info", "处理进度更新", { taskId, progress, status });
        }
      );

      await saveProcessingResult(result);
      return result;
    } catch (error) {
      log("error", "视频处理任务失败", {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });

      await prisma.videoProcessingTask.update({
        where: { taskId },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  });

  isWorkerInitialized = true;
  log("info", "视频处理 Worker 初始化完成");
}

/**
 * 保存处理结果到数据库
 */
async function saveProcessingResult(result: ProcessingResult) {
  const { taskId, status, progress, duration, detectedStudents, clips, error } = result;

  await prisma.videoProcessingTask.update({
    where: { taskId },
    data: {
      status,
      progress,
      videoDuration: duration,
      detectedStudents: detectedStudents.length > 0 ? JSON.stringify(detectedStudents) : null,
      completedAt: status === "completed" ? new Date() : null,
      errorMessage: error,
    },
  });

  if (clips.length > 0) {
    await prisma.aiVideoClip.createMany({
      data: clips.map((clip) => ({
        taskId,
        studentId: clip.studentId,
        studentName: clip.name,
        confidence: clip.confidence,
        startTime: clip.startTime,
        endTime: clip.endTime,
        duration: clip.duration,
        clipUrl: clip.clipUrl,
        thumbnailUrl: clip.thumbnailUrl,
      })),
    });
  }

  log("info", "处理结果已保存", { taskId, clipCount: clips.length });
}

/**
 * 添加视频处理任务
 */
export async function addVideoProcessingJob(data: VideoProcessingJobData): Promise<string> {
  // 创建数据库记录
  const task = await prisma.videoProcessingTask.create({
    data: {
      taskId: data.taskId,
      merchantId: data.merchantId,
      teacherId: data.teacherId,
      campusId: data.campusId,
      lessonId: data.lessonId,
      videoUrl: data.videoUrl,
      options: data.options ? JSON.stringify(data.options) : null,
      status: "pending",
    },
  });

  const queue = await getBullQueue();

  if (queue) {
    // 队列模式：添加到队列
    const job = await queue.add(data, {
      jobId: data.taskId,
    });
    log("info", "视频处理任务已添加到队列", {
      taskId: data.taskId,
      jobId: job.id,
    });
  } else {
    // 同步模式：立即处理（在后台）
    log("info", "同步模式：开始处理视频任务", { taskId: data.taskId });
    
    // 不等待处理完成，立即返回任务ID
    processVideoAsync(data).catch((error) => {
      log("error", "异步处理视频任务失败", {
        taskId: data.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  return task.taskId;
}

/**
 * 异步处理视频（同步模式下使用）
 */
async function processVideoAsync(data: VideoProcessingJobData) {
  const processor = getVideoProcessor();

  try {
    // 更新状态为处理中
    await prisma.videoProcessingTask.update({
      where: { taskId: data.taskId },
      data: {
        status: "processing",
        startedAt: new Date(),
      },
    });

    // 处理视频
    const result = await processor.processVideo(
      data.videoUrl,
      data.taskId,
      data.options,
      async (progress, status) => {
        await prisma.videoProcessingTask.update({
          where: { taskId: data.taskId },
          data: { progress },
        });
        log("info", "处理进度更新", { taskId: data.taskId, progress, status });
      }
    );

    // 保存结果
    await saveProcessingResult(result);
  } catch (error) {
    log("error", "视频处理失败", {
      taskId: data.taskId,
      error: error instanceof Error ? error.message : String(error),
    });

    await prisma.videoProcessingTask.update({
      where: { taskId: data.taskId },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

/**
 * 获取任务状态
 */
export async function getTaskStatus(taskId: string) {
  const task = await prisma.videoProcessingTask.findUnique({
    where: { taskId },
    include: {
      clips: true,
    },
  });

  if (!task) {
    return null;
  }

  return {
    taskId: task.taskId,
    status: task.status,
    progress: task.progress,
    videoUrl: task.videoUrl,
    videoDuration: task.videoDuration,
    errorMessage: task.errorMessage,
    detectedStudents: task.detectedStudents ? JSON.parse(task.detectedStudents) : [],
    clips: task.clips.map((clip) => ({
      id: clip.id,
      studentId: clip.studentId,
      studentName: clip.studentName,
      confidence: clip.confidence,
      startTime: clip.startTime,
      endTime: clip.endTime,
      duration: clip.duration,
      clipUrl: clip.clipUrl,
      thumbnailUrl: clip.thumbnailUrl,
    })),
    createdAt: task.createdAt,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
  };
}

/**
 * 获取队列统计信息
 */
export async function getQueueStats() {
  const queue = await getBullQueue();

  if (!queue) {
    // 同步模式：从数据库获取统计
    const [pending, processing, completed, failed] = await Promise.all([
      prisma.videoProcessingTask.count({ where: { status: "pending" } }),
      prisma.videoProcessingTask.count({ where: { status: "processing" } }),
      prisma.videoProcessingTask.count({ where: { status: "completed" } }),
      prisma.videoProcessingTask.count({ where: { status: "failed" } }),
    ]);

    return {
      waiting: pending,
      active: processing,
      completed,
      failed,
      total: pending + processing + completed + failed,
      mode: "sync",
    };
  }

  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
    mode: "queue",
  };
}

/**
 * 清理已完成/失败的任务
 */
export async function cleanQueue(gracePeriodMs: number = 24 * 60 * 60 * 1000) {
  const queue = await getBullQueue();

  if (queue) {
    await queue.clean(gracePeriodMs, "completed");
    await queue.clean(gracePeriodMs, "failed");
  }

  log("info", "队列清理完成", { gracePeriodMs });
}

export default {
  getBullQueue,
  initVideoWorker,
  addVideoProcessingJob,
  getTaskStatus,
  getQueueStats,
  cleanQueue,
};
