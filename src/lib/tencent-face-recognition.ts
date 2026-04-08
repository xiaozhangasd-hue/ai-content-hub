/**
 * 腾讯云人脸识别API服务
 * 使用 @tencentcloud/iai-nodejs-sdk
 * 文档: https://cloud.tencent.com/document/product/867/32770
 */

import * as tencentcloud from "tencentcloud-sdk-nodejs-iai";
import { createHash } from "crypto";

const IaiClient = tencentcloud.iai.v20200303.Client;

// 日志记录函数
function log(level: "info" | "warn" | "error", message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    module: "TencentFaceRecognition",
    message,
    ...data,
  };
  console.log(JSON.stringify(logEntry));
}

// 配置类型
interface FaceRecognitionConfig {
  secretId: string;
  secretKey: string;
  region: string;
  groupId: string;
}

// 人脸识别结果
interface FaceSearchResult {
  studentId: string;
  name: string;
  confidence: number;
  personId?: string;
}

// 人脸信息
interface FaceInfo {
  faceId: string;
  personId: string;
  gender?: number;
  age?: number;
}

// 视频帧识别结果
interface VideoFrameResult {
  studentId: string;
  name: string;
  confidence: number;
  frameTime: number; // 帧时间（秒）
}

// 视频人脸提取结果
interface VideoFaceExtractionResult {
  studentId: string;
  name: string;
  confidence: number;
  startTime: number;
  endTime: number;
}

// 默认配置
const DEFAULT_CONFIDENCE_THRESHOLD = 80; // 80%

/**
 * 腾讯云人脸识别客户端类
 */
export class FaceRecognitionClient {
  private client: InstanceType<typeof tencentcloud.iai.v20200303.Client>;
  private groupId: string;
  private confidenceThreshold: number;

  constructor(config?: Partial<FaceRecognitionConfig>) {
    const finalConfig: FaceRecognitionConfig = {
      secretId: config?.secretId || process.env.TENCENT_SECRET_ID || "",
      secretKey: config?.secretKey || process.env.TENCENT_SECRET_KEY || "",
      region: config?.region || process.env.TENCENT_FACE_API_REGION || "ap-beijing",
      groupId: config?.groupId || process.env.TENCENT_FACE_GROUP_ID || "classroom-students",
    };

    if (!finalConfig.secretId || !finalConfig.secretKey) {
      throw new Error("腾讯云人脸识别配置缺失：请检查环境变量 TENCENT_SECRET_ID, TENCENT_SECRET_KEY");
    }

    this.groupId = finalConfig.groupId;
    this.confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD;

    // 初始化客户端
    this.client = new IaiClient({
      credential: {
        secretId: finalConfig.secretId,
        secretKey: finalConfig.secretKey,
      },
      region: finalConfig.region,
    });

    log("info", "腾讯云人脸识别客户端初始化成功", {
      region: finalConfig.region,
      groupId: this.groupId,
    });
  }

  /**
   * 添加人脸到人脸库
   * @param studentId 学生ID
   * @param image 图片Buffer
   * @param name 学生姓名（可选，用于存储在人脸库中）
   */
  async addFace(studentId: string, image: Buffer, name?: string): Promise<void> {
    const personId = `student-${studentId}`;

    log("info", "开始添加人脸", { studentId, personId, imageSize: image.length });

    try {
      // 先检查人员是否已存在
      const personExists = await this.checkPersonExists(personId);

      if (personExists) {
        // 如果人员已存在，添加人脸
        await this.addFaceToPerson(personId, image);
        log("info", "人脸添加成功（人员已存在）", { studentId, personId });
      } else {
        // 创建新人员并添加人脸
        await this.createPerson(personId, image, name || studentId);
        log("info", "人脸添加成功（新建人员）", { studentId, personId });
      }
    } catch (error) {
      log("error", "添加人脸失败", {
        studentId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 检查人员是否存在
   */
  private async checkPersonExists(personId: string): Promise<boolean> {
    try {
      const response = await this.client.GetPersonBaseInfo({
        PersonId: personId,
      });
      return !!response.PersonName;
    } catch {
      return false;
    }
  }

  /**
   * 创建人员并添加人脸
   */
  private async createPerson(personId: string, image: Buffer, name: string): Promise<void> {
    const imageBase64 = image.toString("base64");

    const response = await this.client.CreatePerson({
      GroupId: this.groupId,
      PersonId: personId,
      PersonName: name,
      Image: imageBase64,
      QualityControl: 1, // 开启质量检测
      UniquePersonControl: 1, // 不允许重复人员
    });

    log("info", "创建人员成功", {
      personId,
      faceId: response.FaceId,
      personName: name,
    });
  }

  /**
   * 向已存在的人员添加人脸
   */
  private async addFaceToPerson(personId: string, image: Buffer): Promise<void> {
    const imageBase64 = image.toString("base64");

    const response = await this.client.CreateFace({
      PersonId: personId,
      Images: [imageBase64],
      QualityControl: 1,
    });

    log("info", "添加人脸成功", {
      personId,
      faceIdCount: response.FaceModelVersion?.length || 0,
    });
  }

  /**
   * 人脸搜索
   * @param image 图片Buffer
   * @param maxResults 最大返回结果数
   * @returns 识别结果数组
   */
  async searchFaces(image: Buffer, maxResults: number = 5): Promise<FaceSearchResult[]> {
    log("info", "开始人脸搜索", { imageSize: image.length, maxResults });

    try {
      const imageBase64 = image.toString("base64");

      const response = await this.client.SearchFaces({
        GroupIds: [this.groupId],
        Image: imageBase64,
        MaxPersonNum: maxResults,
        MinFaceSize: 34, // 最小人脸尺寸
        QualityControl: 1, // 开启质量检测
      });

      const results: FaceSearchResult[] = [];

      if (response.Results && response.Results.length > 0) {
        for (const result of response.Results) {
          if (result.Candidates && result.Candidates.length > 0) {
            for (const candidate of result.Candidates) {
              // 提取学生ID（从 personId 中）
              const studentId = this.extractStudentId(candidate.PersonId || "");
              const confidence = Math.round(candidate.Score || 0);

              // 只返回置信度超过阈值的结果
              if (confidence >= this.confidenceThreshold) {
                results.push({
                  studentId,
                  name: candidate.PersonName || "",
                  confidence,
                  personId: candidate.PersonId,
                });
              }
            }
          }
        }
      }

      log("info", "人脸搜索完成", { resultCount: results.length });
      return results;
    } catch (error) {
      log("error", "人脸搜索失败", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 从 personId 中提取学生ID
   */
  private extractStudentId(personId: string): string {
    if (personId.startsWith("student-")) {
      return personId.replace("student-", "");
    }
    return personId;
  }

  /**
   * 删除人脸
   * @param studentId 学生ID
   */
  async deleteFace(studentId: string): Promise<void> {
    const personId = `student-${studentId}`;

    log("info", "开始删除人脸", { studentId, personId });

    try {
      // 删除整个人员（包括所有人脸）
      await this.client.DeletePerson({
        PersonId: personId,
      });

      log("info", "删除人脸成功", { studentId, personId });
    } catch (error) {
      // 如果人员不存在，忽略错误
      const errorCode = (error as any)?.code;
      if (errorCode === "InvalidParameter.PersonIdNotExist") {
        log("warn", "人员不存在，跳过删除", { studentId, personId });
        return;
      }

      log("error", "删除人脸失败", {
        studentId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 从视频中提取人脸
   * @param videoUrl 视频URL
   * @param frameInterval 帧提取间隔（秒），默认1秒
   * @returns 识别结果
   */
  async extractFacesFromVideo(
    videoUrl: string,
    frameInterval: number = 1
  ): Promise<VideoFaceExtractionResult[]> {
    log("info", "开始从视频提取人脸", { videoUrl, frameInterval });

    // 注意：这个方法需要配合视频处理工具类使用
    // 这里只提供接口定义，实际实现需要：
    // 1. 使用 FFmpeg 提取视频帧
    // 2. 对每帧调用人脸识别API
    // 3. 汇总结果并合并相邻时间段

    throw new Error("此方法需要配合 VideoProcessor 使用，请调用 VideoProcessor.processVideoWithFaceDetection()");
  }

  /**
   * 批量人脸搜索（用于视频帧处理）
   * @param frames 帧数组（包含时间和图片Buffer）
   * @returns 每帧的识别结果
   */
  async searchFacesInFrames(
    frames: Array<{ time: number; image: Buffer }>
  ): Promise<Array<{ time: number; faces: FaceSearchResult[] }>> {
    log("info", "开始批量搜索帧中人脸", { frameCount: frames.length });

    const results: Array<{ time: number; faces: FaceSearchResult[] }> = [];

    // 并发处理（限制并发数）
    const batchSize = 5;
    for (let i = 0; i < frames.length; i += batchSize) {
      const batch = frames.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (frame) => {
          try {
            const faces = await this.searchFaces(frame.image, 3);
            return { time: frame.time, faces };
          } catch {
            return { time: frame.time, faces: [] };
          }
        })
      );

      results.push(...batchResults);
    }

    log("info", "批量帧人脸搜索完成", { resultCount: results.length });
    return results;
  }

  /**
   * 获取人脸库信息
   */
  async getGroupInfo(): Promise<{
    groupId: string;
    groupName: string;
    personCount: number;
    faceCount: number;
  }> {
    try {
      const response = await this.client.GetGroupInfo({
        GroupId: this.groupId,
      });

      // 使用类型断言处理SDK类型定义不完整的情况
      const resp = response as any;

      return {
        groupId: this.groupId,
        groupName: resp.GroupName || this.groupId,
        personCount: resp.PersonCount || 0,
        faceCount: resp.FaceCount || 0,
      };
    } catch (error) {
      log("error", "获取人脸库信息失败", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 获取人员信息
   */
  async getPersonInfo(studentId: string): Promise<{
    personId: string;
    name: string;
    faceCount: number;
    faces: FaceInfo[];
  }> {
    const personId = `student-${studentId}`;

    try {
      const response = await this.client.GetPersonGroupInfo({
        PersonId: personId,
      });

      // 使用类型断言处理SDK类型定义不完整的情况
      const resp = response as any;

      return {
        personId,
        name: resp.PersonName || studentId,
        faceCount: resp.FaceCount || 0,
        faces: (resp.FaceInfos || []).map((face: any) => ({
          faceId: face.FaceId || "",
          personId,
          gender: face.Gender,
          age: face.Age,
        })),
      };
    } catch (error) {
      log("error", "获取人员信息失败", {
        studentId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 检测人脸质量
   * @param image 图片Buffer
   * @returns 质量评估结果
   */
  async detectFaceQuality(image: Buffer): Promise<{
    score: number;
    hasFace: boolean;
    faceCount: number;
    quality: {
      clarity: number;
      brightness: number;
      completeness: number;
    };
  }> {
    const imageBase64 = image.toString("base64");

    try {
      const response = await this.client.DetectFace({
        Image: imageBase64,
        FaceModelVersion: "3.0",
        NeedFaceAttributes: 1,
        NeedQualityDetection: 1,
      });

      if (!response.ImageWidth || !response.FaceInfos || response.FaceInfos.length === 0) {
        return {
          score: 0,
          hasFace: false,
          faceCount: 0,
          quality: { clarity: 0, brightness: 0, completeness: 0 },
        };
      }

      const faceInfo = response.FaceInfos[0];
      const qualityInfo = faceInfo.FaceQualityInfo as any;
      return {
        score: qualityInfo?.Score || 0,
        hasFace: true,
        faceCount: response.FaceInfos.length,
        quality: {
          clarity: qualityInfo?.Clarity || 0,
          brightness: qualityInfo?.Brightness || 0,
          completeness: qualityInfo?.Completeness || 0,
        },
      };
    } catch (error) {
      log("error", "检测人脸质量失败", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 设置置信度阈值
   */
  setConfidenceThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 100) {
      throw new Error("置信度阈值必须在 0-100 之间");
    }
    this.confidenceThreshold = threshold;
    log("info", "置信度阈值已更新", { threshold });
  }

  /**
   * 创建人脸库（如果不存在）
   */
  async ensureGroupExists(): Promise<void> {
    try {
      await this.getGroupInfo();
      log("info", "人脸库已存在", { groupId: this.groupId });
    } catch {
      // 人脸库不存在，创建新的
      try {
        await this.client.CreateGroup({
          GroupId: this.groupId,
          GroupName: "教室学生人脸库",
          GroupExDescriptions: ["用于识别教室内的学生"],
        });
        log("info", "人脸库创建成功", { groupId: this.groupId });
      } catch (createError) {
        log("error", "创建人脸库失败", {
          error: createError instanceof Error ? createError.message : String(createError),
        });
        throw createError;
      }
    }
  }
}

// 导出单例实例
let faceRecognitionInstance: FaceRecognitionClient | null = null;

export function getFaceRecognitionClient(): FaceRecognitionClient {
  if (!faceRecognitionInstance) {
    faceRecognitionInstance = new FaceRecognitionClient();
  }
  return faceRecognitionInstance;
}

export default FaceRecognitionClient;
