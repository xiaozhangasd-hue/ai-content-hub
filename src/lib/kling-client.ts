/**
 * 可灵AI客户端
 * 支持视频生成、数字人、对口型等功能
 * 
 * 文档：https://app.klingai.com/cn/dev/document-api/apiReference
 */

import crypto from 'crypto';

// 可灵AI配置
export interface KlingConfig {
  accessKey: string;
  secretKey: string;
  baseUrl?: string;
}

// 视频生成请求
export interface VideoGenerationRequest {
  prompt: string;
  model?: 'v1' | 'v1-5' | 'v2-5';
  mode?: 'std' | 'pro';
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  callbackUrl?: string;
}

// 数字人生成请求
export interface AvatarGenerationRequest {
  name: string;
  image?: string;
  audio?: string;
  text?: string;
  model?: 'v1' | 'v2';
  duration?: number;
}

// 对口型请求 - 支持音频模式和文本模式
export interface LipSyncRequest {
  videoUrl: string;
  // 音频模式
  audioUrl?: string;
  // 文本模式（自动生成语音）
  text?: string;
  voiceId?: string;
  voiceLanguage?: 'zh' | 'en';
  voiceSpeed?: number;
}

// 图片生成请求
export interface ImageGenerationRequest {
  prompt: string;
  model?: 'v1' | 'v1-5';
  style?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '3:4' | '4:3';
  negativePrompt?: string;
}

// 任务响应
export interface TaskResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'succeed' | 'failed';
  progress?: number;
  result?: {
    videoUrl?: string;
    coverUrl?: string;
    duration?: number;
  };
  error?: string;
}

/**
 * 可灵AI客户端类
 */
export class KlingAIClient {
  private config: KlingConfig;
  private baseUrl: string;

  constructor(config?: KlingConfig) {
    this.config = config || {
      accessKey: process.env.KLING_ACCESS_KEY || '',
      secretKey: process.env.KLING_SECRET_KEY || '',
    };
    // 可灵AI官方API域名
    this.baseUrl = process.env.KLING_BASE_URL || 'https://api-beijing.klingai.com';
  }

  /**
   * 生成JWT Token（可灵AI鉴权要求）
   */
  private generateJwtToken(): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.config.accessKey,
      exp: now + 1800,
      nbf: now - 5,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    const token = this.generateJwtToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * 文生视频
   */
  async generateTextToVideo(request: VideoGenerationRequest): Promise<string> {
    const { prompt, model = 'v2-5', mode = 'std', duration = 5, aspectRatio = '16:9' } = request;

    if (!this.config.accessKey || !this.config.secretKey) {
      throw new Error('请配置可灵AI的Access Key和Secret Key');
    }

    const modelMap: Record<string, string> = {
      'v1': 'kling-v1',
      'v1-5': 'kling-v1-5',
      'v1-6': 'kling-v1-6',
      'v2-1': 'kling-v2-1-master',
      'v2-5': 'kling-v2-5-turbo',
      'v2-6': 'kling-v2-6',
    };

    const modelName = modelMap[model] || 'kling-v2-5-turbo';

    try {
      const response = await fetch(`${this.baseUrl}/v1/videos/text2video`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model_name: modelName,
          prompt,
          mode,
          duration: String(duration),
          aspect_ratio: aspectRatio,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`视频生成失败: ${response.status} ${error}`);
      }

      const data = await response.json();
      return data.data?.task_id || data.task_id;
    } catch (error) {
      console.error('可灵AI视频生成错误:', error);
      throw error;
    }
  }

  /**
   * 图生视频
   */
  async generateImageToVideo(imageUrl: string, prompt?: string, options?: Partial<VideoGenerationRequest>): Promise<string> {
    if (!this.config.accessKey || !this.config.secretKey) {
      throw new Error('请配置可灵AI的Access Key和Secret Key');
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/videos/image2video`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: options?.model || 'v1-5',
          image: imageUrl,
          prompt,
          mode: options?.mode || 'std',
          duration: options?.duration || 5,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`视频生成失败: ${response.status} ${error}`);
      }

      const data = await response.json();
      return data.task_id;
    } catch (error) {
      console.error('可灵AI图生视频错误:', error);
      throw error;
    }
  }

  /**
   * 数字人生成
   */
  async generateAvatar(request: AvatarGenerationRequest): Promise<string> {
    const { name, image, audio, text, model = 'v2', duration = 30 } = request;

    if (!this.config.accessKey || !this.config.secretKey) {
      throw new Error('请配置可灵AI的Access Key和Secret Key');
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/avatars/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          name,
          image,
          audio,
          text,
          duration,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`数字人生成失败: ${response.status} ${error}`);
      }

      const data = await response.json();
      return data.task_id;
    } catch (error) {
      console.error('可灵AI数字人生成错误:', error);
      throw error;
    }
  }

  /**
   * 对口型（让视频中的人物说话）
   * 支持两种模式：
   * 1. 音频模式：传入 audioUrl
   * 2. 文本模式：传入 text + voiceId，系统自动生成语音
   */
  async lipSync(request: LipSyncRequest): Promise<string> {
    const { videoUrl, audioUrl, text, voiceId, voiceLanguage, voiceSpeed } = request;

    if (!this.config.accessKey || !this.config.secretKey) {
      throw new Error('请配置可灵AI的Access Key和Secret Key');
    }

    // 构建请求体
    const requestBody: {
      input: {
        video: string;
        audio?: string;
        audio_type?: string;
        text?: string;
        voice_id?: string;
        voice_language?: string;
        voice_speed?: number;
      };
    } = {
      input: {
        video: videoUrl,
      },
    };

    // 判断是音频模式还是文本模式
    if (audioUrl) {
      // 音频模式
      requestBody.input.audio = audioUrl;
      requestBody.input.audio_type = 'url';
    } else if (text) {
      // 文本模式 - 自动生成语音
      requestBody.input.text = text;
      requestBody.input.voice_id = voiceId || 'genshin_klee2';
      requestBody.input.voice_language = voiceLanguage || 'zh';
      requestBody.input.voice_speed = voiceSpeed || 1;
    } else {
      throw new Error('请提供音频URL或文本内容');
    }

    try {
      console.log('可灵AI对口型请求:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${this.baseUrl}/v1/videos/lip-sync`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('可灵AI对口型响应:', responseText);

      if (!response.ok) {
        throw new Error(`对口型失败: ${response.status} ${responseText}`);
      }

      const data = JSON.parse(responseText);
      return data.data?.task_id || data.task_id;
    } catch (error) {
      console.error('可灵AI对口型错误:', error);
      throw error;
    }
  }

  /**
   * 查询任务状态
   */
  async getTaskStatus(taskId: string, taskType: 'text2video' | 'image2video' | 'lip-sync' = 'text2video'): Promise<TaskResponse> {
    if (!this.config.accessKey || !this.config.secretKey) {
      throw new Error('请配置可灵AI的Access Key和Secret Key');
    }

    try {
      const url = `${this.baseUrl}/v1/videos/${taskType}/${taskId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`查询任务失败: ${response.status} ${error}`);
      }

      const data = await response.json();
      const status = data.data?.task_status || data.task_status;
      
      return {
        taskId: data.data?.task_id || data.task_id,
        status: status,
        progress: status === 'succeed' ? 100 : data.progress,
        result: status === 'succeed' ? {
          videoUrl: data.data?.task_result?.videos?.[0]?.url || data.task_result?.videos?.[0]?.url,
          coverUrl: data.data?.task_result?.videos?.[0]?.cover_url || data.task_result?.videos?.[0]?.cover_url,
          duration: data.data?.task_result?.videos?.[0]?.duration || data.task_result?.videos?.[0]?.duration,
        } : undefined,
        error: status === 'failed' ? (data.data?.task_status_msg || data.task_status_msg) : undefined,
      };
    } catch (error) {
      console.error('查询任务状态错误:', error);
      throw error;
    }
  }

  /**
   * 等待任务完成
   */
  async waitForCompletion(taskId: string, taskType: 'text2video' | 'image2video' | 'lip-sync' = 'text2video', maxWaitTime: number = 600000): Promise<TaskResponse> {
    const startTime = Date.now();
    const pollInterval = 5000;

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getTaskStatus(taskId, taskType);
      
      if (status.status === 'succeed') {
        return status;
      } else if (status.status === 'failed') {
        throw new Error(status.error || '任务失败');
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('任务超时');
  }

  /**
   * 文生图 - 使用可灵AI生成图片
   * API文档: https://app.klingai.com/cn/dev/document-api/apiReference
   */
  async generateImage(request: ImageGenerationRequest): Promise<TaskResponse> {
    const { prompt, model = 'v1', style, aspectRatio = '1:1', negativePrompt } = request;

    if (!this.config.accessKey || !this.config.secretKey) {
      return {
        taskId: '',
        status: 'failed',
        error: '请配置可灵AI的Access Key和Secret Key',
      };
    }

    try {
      // 可灵AI图片生成接口
      const response = await fetch(`${this.baseUrl}/v1/images/text2image`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: model === 'v1-5' ? 'kling-v1-5' : 'kling-v1',
          prompt,
          style: style || 'random',
          aspect_ratio: aspectRatio,
          negative_prompt: negativePrompt,
          image_num: 1, // 生成1张图片
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        
        // 如果文生图接口不存在，回退到使用视频接口的静态帧
        if (response.status === 404) {
          console.log('可灵AI文生图接口不可用，尝试替代方案...');
          return this.generateImageAlternative(prompt, aspectRatio);
        }
        
        throw new Error(`图片生成失败: ${response.status} ${error}`);
      }

      const data = await response.json();
      const taskId = data.data?.task_id || data.task_id;
      
      return {
        taskId,
        status: 'pending',
      };
    } catch (error) {
      console.error('可灵AI图片生成错误:', error);
      return {
        taskId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : '图片生成失败',
      };
    }
  }

  /**
   * 替代方案：通过视频生成静态图片
   */
  private async generateImageAlternative(prompt: string, aspectRatio: string): Promise<TaskResponse> {
    try {
      // 使用视频生成，但只取第一帧
      const taskId = await this.generateTextToVideo({
        prompt,
        duration: 1, // 最短时长
        aspectRatio: aspectRatio as any,
        model: 'v1-5',
        mode: 'std',
      });

      return {
        taskId,
        status: 'pending',
      };
    } catch (error) {
      return {
        taskId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : '图片生成失败',
      };
    }
  }

  /**
   * 查询图片生成任务状态
   */
  async getImageTaskStatus(taskId: string): Promise<TaskResponse> {
    if (!this.config.accessKey || !this.config.secretKey) {
      throw new Error('请配置可灵AI的Access Key和Secret Key');
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/images/text2image/${taskId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`查询任务失败: ${response.status} ${error}`);
      }

      const data = await response.json();
      const status = data.data?.task_status || data.task_status;
      
      return {
        taskId: data.data?.task_id || data.task_id,
        status: status,
        progress: status === 'succeed' ? 100 : data.progress,
        result: status === 'succeed' ? {
          videoUrl: data.data?.task_result?.images?.[0]?.url || data.task_result?.images?.[0]?.url,
        } : undefined,
        error: status === 'failed' ? (data.data?.task_status_msg || data.task_status_msg) : undefined,
      };
    } catch (error) {
      console.error('查询图片任务状态错误:', error);
      throw error;
    }
  }
}

// 导出默认客户端
export const klingClient = new KlingAIClient();
