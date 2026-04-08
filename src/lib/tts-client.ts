/**
 * TTS (Text-to-Speech) 服务
 * 支持多种语音合成引擎：MiniMax、硅基流动(Fish Speech/CosyVoice)
 */

// TTS服务提供商
export type TTSProvider = 'minimax' | 'siliconflow' | 'fishaudio';

// TTS配置
export interface TTSConfig {
  provider: TTSProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  groupId?: string; // MiniMax需要
}

// 音色选项
export interface VoiceOption {
  id: string;
  name: string;
  desc: string;
  gender: 'male' | 'female' | 'child';
  preview?: string;
  provider: TTSProvider;
}

// TTS请求参数
export interface TTSRequest {
  text: string;
  voiceId: string;
  speed?: number; // 0.5-2.0
  format?: 'mp3' | 'wav' | 'pcm';
}

// TTS响应
export interface TTSResponse {
  audioUrl?: string;
  audioData?: Buffer;
  duration?: number; // 音频时长(秒)
}

// 预设音色列表 - 高质量自然语音
export const VOICE_OPTIONS: VoiceOption[] = [
  // MiniMax 高质量音色
  {
    id: 'female-tianmei',
    name: '甜美女声',
    desc: '温柔甜美，适合教育场景',
    gender: 'female',
    provider: 'minimax',
    preview: '大家好，欢迎来到我们的机构！'
  },
  {
    id: 'female-shaonv',
    name: '少女音',
    desc: '活泼可爱，亲和力强',
    gender: 'female',
    provider: 'minimax',
    preview: '小朋友们好呀，今天我们来学习新知识！'
  },
  {
    id: 'female-chengshu',
    name: '成熟女声',
    desc: '稳重专业，适合商务场景',
    gender: 'female',
    provider: 'minimax',
    preview: '您好，很高兴为您介绍我们的课程体系。'
  },
  {
    id: 'male-qn-qingxu',
    name: '情感男声',
    desc: '富有感染力',
    gender: 'male',
    provider: 'minimax',
    preview: '让我们一起见证孩子的成长与蜕变。'
  },
  {
    id: 'male-chengshu',
    name: '沉稳男声',
    desc: '专业可靠',
    gender: 'male',
    provider: 'minimax',
    preview: '我们的课程帮助孩子建立扎实的基础。'
  },
  {
    id: 'presenter_male',
    name: '主持人男声',
    desc: '播音腔，正式场合',
    gender: 'male',
    provider: 'minimax',
    preview: '各位家长朋友们，大家好！'
  },
  // 硅基流动 Fish Speech 音色
  {
    id: 'fishaudio/female-1',
    name: 'Fish女声',
    desc: '自然流畅',
    gender: 'female',
    provider: 'siliconflow',
    preview: '这是一段示例语音'
  },
  {
    id: 'fishaudio/male-1',
    name: 'Fish男声',
    desc: '清晰有力',
    gender: 'male',
    provider: 'siliconflow',
    preview: '这是一段示例语音'
  },
];

// 获取TTS配置
export function getTTSConfig(): TTSConfig {
  const provider = (process.env.TTS_PROVIDER || 'siliconflow') as TTSProvider;
  
  switch (provider) {
    case 'minimax':
      return {
        provider: 'minimax',
        apiKey: process.env.MINIMAX_API_KEY || '',
        groupId: process.env.MINIMAX_GROUP_ID || '',
        baseUrl: process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat',
      };
    
    case 'siliconflow':
      return {
        provider: 'siliconflow',
        apiKey: process.env.SILICONFLOW_API_KEY || '',
        baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
        model: 'fishaudio/fish-speech-1.5',
      };
    
    case 'fishaudio':
      return {
        provider: 'fishaudio',
        apiKey: process.env.FISHAUDIO_API_KEY || process.env.SILICONFLOW_API_KEY || '',
        baseUrl: 'https://api.fish.audio/v1',
        model: 'fish-speech-1.5',
      };
    
    default:
      return {
        provider: 'siliconflow',
        apiKey: process.env.SILICONFLOW_API_KEY || '',
        baseUrl: 'https://api.siliconflow.cn/v1',
      };
  }
}

// TTS客户端
export class TTSClient {
  private config: TTSConfig;

  constructor(config?: TTSConfig) {
    this.config = config || getTTSConfig();
  }

  // MiniMax TTS
  private async minimaxSynthesize(request: TTSRequest): Promise<TTSResponse> {
    const { text, voiceId, speed = 1.0, format = 'mp3' } = request;
    
    if (!this.config.apiKey || !this.config.groupId) {
      throw new Error('请配置MiniMax API Key和Group ID');
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v1/t2a_v2?GroupId=${this.config.groupId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: 'speech-01-turbo',
            text: text,
            voice_setting: {
              voice_id: voiceId,
              speed: speed,
              vol: 1.0,
              pitch: 0,
            },
            audio_setting: {
              sample_rate: 32000,
              bitrate: 128000,
              format: format,
              channel: 1,
            },
            pronunciation_dict: {
              tone: [],
            },
            timestamp_boot_enabled: false,
            timestamp_enabled: false,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`MiniMax TTS失败: ${response.status} ${error}`);
      }

      // MiniMax返回的是二进制音频数据
      const arrayBuffer = await response.arrayBuffer();
      const audioData = Buffer.from(arrayBuffer);
      
      return {
        audioData,
        duration: Math.ceil(text.length / 4), // 估算时长
      };
    } catch (error) {
      console.error('MiniMax TTS错误:', error);
      throw error;
    }
  }

  // 硅基流动 TTS (OpenAI兼容格式)
  private async siliconflowSynthesize(request: TTSRequest): Promise<TTSResponse> {
    const { text, voiceId, speed = 1.0, format = 'mp3' } = request;
    
    if (!this.config.apiKey) {
      throw new Error('请配置硅基流动API Key');
    }

    try {
      // 硅基流动使用OpenAI兼容的TTS API
      const response = await fetch(`${this.config.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'fishaudio/fish-speech-1.5',
          input: text,
          voice: voiceId,
          speed: speed,
          response_format: format,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`硅基流动TTS失败: ${response.status} ${error}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioData = Buffer.from(arrayBuffer);
      
      return {
        audioData,
        duration: Math.ceil(text.length / 4),
      };
    } catch (error) {
      console.error('硅基流动TTS错误:', error);
      throw error;
    }
  }

  // 统一接口
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    switch (this.config.provider) {
      case 'minimax':
        return this.minimaxSynthesize(request);
      case 'siliconflow':
      case 'fishaudio':
        return this.siliconflowSynthesize(request);
      default:
        return this.siliconflowSynthesize(request);
    }
  }

  // 获取可用音色列表
  getAvailableVoices(): VoiceOption[] {
    return VOICE_OPTIONS.filter(v => v.provider === this.config.provider);
  }
}

// 导出默认客户端
export const ttsClient = new TTSClient();
