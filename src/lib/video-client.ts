/**
 * 视频生成服务适配层
 * 支持可灵AI、Runway、Pika等视频生成服务
 * 
 * 推荐使用可灵AI（快手），支持：
 * - 文生视频
 * - 图生视频
 * - 数字人生成
 * - 对口型功能
 */

import { KlingAIClient } from './kling-client';

export interface VideoConfig {
  provider: 'kling' | 'runway' | 'pika';
  accessKey?: string;
  secretKey?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  resolution?: '720p' | '1080p';
  model?: 'v1' | 'v1-5' | 'v2-5';
  mode?: 'std' | 'pro';
}

export interface VideoGenerationResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}

// 获取视频生成配置
export function getVideoConfig(): VideoConfig {
  const provider = (process.env.VIDEO_PROVIDER || 'kling') as VideoConfig['provider'];
  
  return {
    provider,
    accessKey: process.env.KLING_ACCESS_KEY,
    secretKey: process.env.KLING_SECRET_KEY,
    apiKey: process.env.VIDEO_API_KEY,
    baseUrl: process.env.KLING_BASE_URL || process.env.VIDEO_BASE_URL,
  };
}

// 视频生成客户端
export class VideoClient {
  private config: VideoConfig;

  constructor(config?: VideoConfig) {
    this.config = config || getVideoConfig();
  }

  // 生成视频
  async generate(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const { provider } = this.config;

    switch (provider) {
      case 'kling':
        return this.generateWithKling(request);
      case 'runway':
        return this.generateWithRunway(request);
      case 'pika':
        return this.generateWithPika(request);
      default:
        return this.generateWithKling(request);
    }
  }

  // 可灵AI生成
  private async generateWithKling(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const { prompt, duration = 5, aspectRatio = '16:9', model = 'v1-5', mode = 'std' } = request;

    if (!this.config.accessKey || !this.config.secretKey) {
      return {
        taskId: '',
        status: 'failed',
        error: '请配置可灵AI的Access Key和Secret Key。前往 https://klingai.com/cn/dev 获取。',
      };
    }

    try {
      const client = new KlingAIClient({
        accessKey: this.config.accessKey,
        secretKey: this.config.secretKey,
        baseUrl: this.config.baseUrl,
      });

      const taskId = await client.generateTextToVideo({
        prompt,
        duration,
        aspectRatio,
        model,
        mode,
      });

      return {
        taskId,
        status: 'pending',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '视频生成失败';
      
      // 特殊处理403错误
      if (errorMsg.includes('403') && errorMsg.includes('unauthorized consumer')) {
        return {
          taskId: '',
          status: 'failed',
          error: '可灵AI账户未开通服务或资源包已用尽。请前往 https://klingai.com/cn 购买资源包后重试。',
        };
      }
      
      return {
        taskId: '',
        status: 'failed',
        error: errorMsg,
      };
    }
  }

  // Runway生成
  private async generateWithRunway(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    return {
      taskId: '',
      status: 'failed',
      error: 'Runway视频生成暂未实现，请使用可灵AI',
    };
  }

  // Pika生成
  private async generateWithPika(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    return {
      taskId: '',
      status: 'failed',
      error: 'Pika视频生成暂未实现，请使用可灵AI',
    };
  }

  // 查询任务状态
  async getTaskStatus(taskId: string): Promise<VideoGenerationResponse> {
    if (this.config.provider === 'kling' && this.config.accessKey && this.config.secretKey) {
      try {
        const client = new KlingAIClient({
          accessKey: this.config.accessKey,
          secretKey: this.config.secretKey,
          baseUrl: this.config.baseUrl,
        });

        const result = await client.getTaskStatus(taskId);
        
        // 可灵AI状态: pending, processing, succeed, failed
        // 统一转换为: pending, processing, completed, failed
        const mappedStatus = result.status === 'succeed' ? 'completed' : result.status;
        
        return {
          taskId: result.taskId,
          status: mappedStatus as 'pending' | 'processing' | 'completed' | 'failed',
          videoUrl: result.result?.videoUrl,
          error: result.error,
        };
      } catch (error) {
        return {
          taskId,
          status: 'failed',
          error: error instanceof Error ? error.message : '查询失败',
        };
      }
    }

    return {
      taskId,
      status: 'failed',
      error: '不支持的服务商',
    };
  }
}

// 导出默认客户端
export const videoClient = new VideoClient();
