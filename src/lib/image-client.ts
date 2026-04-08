/**
 * 图片生成服务适配层
 * 支持多种图片生成服务：可灵AI、硅基流动、智谱AI等
 */

import { KlingAIClient } from './kling-client';

// 图片生成配置
export interface ImageConfig {
  provider: 'kling' | 'siliconflow' | 'zhipu' | 'dashscope';
  apiKey?: string;
  accessKey?: string;
  secretKey?: string;
  baseUrl?: string;
}

// 图片生成请求
export interface ImageGenerationRequest {
  prompt: string;
  size?: '512x512' | '768x768' | '1024x1024' | '1280x720' | '1920x1080';
  style?: string;
  negativePrompt?: string;
}

// 获取图片生成配置
export function getImageConfig(): ImageConfig {
  const provider = (process.env.IMAGE_PROVIDER || 'kling') as ImageConfig['provider'];
  
  switch (provider) {
    case 'kling':
      return {
        provider: 'kling',
        accessKey: process.env.KLING_ACCESS_KEY || '',
        secretKey: process.env.KLING_SECRET_KEY || '',
        baseUrl: process.env.KLING_BASE_URL,
      };
    
    case 'siliconflow':
      return {
        provider: 'siliconflow',
        apiKey: process.env.SILICONFLOW_API_KEY || '',
        baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
      };
    
    case 'zhipu':
      return {
        provider: 'zhipu',
        apiKey: process.env.ZHIPU_API_KEY || '',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      };
    
    default:
      return {
        provider: 'kling',
        accessKey: process.env.KLING_ACCESS_KEY || '',
        secretKey: process.env.KLING_SECRET_KEY || '',
      };
  }
}

// 图片生成客户端
export class ImageClient {
  private config: ImageConfig;

  constructor(config?: ImageConfig) {
    this.config = config || getImageConfig();
  }

  // 生成图片
  async generate(request: ImageGenerationRequest): Promise<string[]> {
    switch (this.config.provider) {
      case 'kling':
        return this.generateWithKling(request);
      case 'siliconflow':
        return this.generateWithSiliconFlow(request);
      case 'zhipu':
        return this.generateWithZhipu(request);
      default:
        return this.generateWithKling(request);
    }
  }

  // 可灵AI生成（推荐）
  private async generateWithKling(request: ImageGenerationRequest): Promise<string[]> {
    const { prompt, size = '1024x1024', style, negativePrompt } = request;

    if (!this.config.accessKey || !this.config.secretKey) {
      throw new Error('请配置可灵AI的Access Key和Secret Key（环境变量：KLING_ACCESS_KEY, KLING_SECRET_KEY）');
    }

    try {
      // 尺寸映射
      const aspectRatioMap: Record<string, string> = {
        '512x512': '1:1',
        '768x768': '1:1',
        '1024x1024': '1:1',
        '1280x720': '16:9',
        '1920x1080': '16:9',
        '720x1280': '9:16',
        '1080x1920': '9:16',
      };

      // 亚洲人面孔强制提示词 - 可灵是中国公司，中文提示词效果更好
      const asianFacePrompt = "亚洲儿童，中国儿童，黑头发，黑眼睛，中国面孔，不要欧美人，不要白人，不要金发, Asian children, Chinese children, black hair, dark brown eyes, Asian facial features, no Western faces";
      
      // 构建完整提示词
      const fullPrompt = `${prompt}, ${asianFacePrompt}`;
      
      // 负向提示词
      const fullNegativePrompt = `${negativePrompt || ''}, Western faces, blonde hair, blue eyes, Caucasian, non-Asian, 欧美人, 白人, 金发`;

      const client = new KlingAIClient({
        accessKey: this.config.accessKey,
        secretKey: this.config.secretKey,
        baseUrl: this.config.baseUrl,
      });

      // 提交图片生成任务
      const result = await client.generateImage({
        prompt: fullPrompt,
        style,
        aspectRatio: aspectRatioMap[size] as any,
        negativePrompt: fullNegativePrompt,
      });

      if (result.status === 'failed') {
        throw new Error(result.error || '图片生成失败');
      }

      // 轮询等待结果
      const maxWaitTime = 120000; // 2分钟
      const startTime = Date.now();
      const pollInterval = 3000;

      while (Date.now() - startTime < maxWaitTime) {
        const status = await client.getImageTaskStatus(result.taskId);
        
        if (status.status === 'succeed' && status.result?.videoUrl) {
          return [status.result.videoUrl];
        } else if (status.status === 'failed') {
          throw new Error(status.error || '图片生成失败');
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      throw new Error('图片生成超时');
    } catch (error) {
      console.error('可灵AI图片生成错误:', error);
      throw error;
    }
  }

  // 硅基流动生成（备选）
  private async generateWithSiliconFlow(request: ImageGenerationRequest): Promise<string[]> {
    const { prompt, size = '1024x1024' } = request;

    if (!this.config.apiKey) {
      throw new Error('请配置SILICONFLOW_API_KEY');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'Kwai-Kolors/Kolors',
          prompt,
          image_size: size,
          batch_size: 1,
          num_inference_steps: 20,
          guidance_scale: 7.5,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`图片生成失败: ${response.status} ${error}`);
      }

      const data = await response.json();
      return data.images?.map((item: { url: string }) => item.url).filter(Boolean) || [];
    } catch (error) {
      console.error('硅基流动图片生成错误:', error);
      throw error;
    }
  }

  // 智谱AI生成
  private async generateWithZhipu(request: ImageGenerationRequest): Promise<string[]> {
    const { prompt, size = '1024x1024' } = request;

    if (!this.config.apiKey) {
      throw new Error('请配置ZHIPU_API_KEY');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'cogview-3',
          prompt,
          size,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`图片生成失败: ${response.status} ${error}`);
      }

      const data = await response.json();
      return data.data?.map((item: { url: string }) => item.url).filter(Boolean) || [];
    } catch (error) {
      console.error('智谱AI图片生成错误:', error);
      throw error;
    }
  }
}

// 导出默认客户端
export const imageClient = new ImageClient();
