/**
 * 百度智能云人脸识别API服务
 * 文档: https://cloud.baidu.com/doc/FACE/s/Hl37c1ucb
 */

interface BaiduFaceConfig {
  apiKey: string;
  secretKey: string;
  appId?: string;
  groupId?: string;
}

interface FaceDetectionResult {
  faceId: string;
  location: {
    left: number;
    top: number;
    width: number;
    height: number;
    rotation: number;
  };
  faceToken: string;
  quality: number;
  age?: number;
  gender?: string;
  expression?: string;
}

interface FaceMatchResult {
  faceToken: string;
  score: number;
  userId?: string;
  userInfo?: string;
}

interface BaiduTokenResponse {
  access_token: string;
  expires_in: number;
}

export class BaiduFaceService {
  private config: BaiduFaceConfig;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;
  
  // API基础URL
  private readonly BASE_URL = "https://aip.baidubce.com/rest/2.0/face/v3";
  
  constructor(config?: Partial<BaiduFaceConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.BAIDU_FACE_API_KEY || "",
      secretKey: config?.secretKey || process.env.BAIDU_FACE_SECRET_KEY || "",
      appId: config?.appId || process.env.BAIDU_FACE_APP_ID || "",
      groupId: config?.groupId || process.env.BAIDU_FACE_GROUP_ID || "student_faces",
    };
  }
  
  /**
   * 获取Access Token
   */
  private async getAccessToken(): Promise<string> {
    // 如果token还有效，直接返回
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }
    
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.config.apiKey}&client_secret=${this.config.secretKey}`;
    
    const response = await fetch(url, { method: "POST" });
    
    if (!response.ok) {
      throw new Error(`获取百度Access Token失败: ${response.status}`);
    }
    
    const data: BaiduTokenResponse = await response.json();
    
    this.accessToken = data.access_token;
    // 提前5分钟过期
    this.tokenExpireTime = Date.now() + (data.expires_in - 300) * 1000;
    
    return this.accessToken;
  }
  
  /**
   * 人脸检测 - 检测图片中的人脸
   * @param imageBase64 Base64编码的图片
   * @param options 检测选项
   */
  async detectFace(
    imageBase64: string,
    options: {
      maxFaceNum?: number;
      faceField?: string; // age,gender,expression,quality等
    } = {}
  ): Promise<FaceDetectionResult[]> {
    const token = await this.getAccessToken();
    
    const body = {
      image: imageBase64,
      image_type: "BASE64",
      max_face_num: options.maxFaceNum || 10,
      face_field: options.faceField || "age,gender,expression,quality,face_type",
    };
    
    const response = await fetch(
      `${this.BASE_URL}/detect?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    
    if (!response.ok) {
      throw new Error(`人脸检测失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error_code && data.error_code !== 0) {
      throw new Error(`人脸检测错误: ${data.error_msg}`);
    }
    
    return (data.result?.face_list || []).map((face: any) => ({
      faceId: face.face_token,
      location: face.location,
      faceToken: face.face_token,
      quality: face.quality?.score || 0,
      age: face.age,
      gender: face.gender?.type,
      expression: face.expression?.type,
    }));
  }
  
  /**
   * 人脸注册 - 将人脸注册到指定用户
   * @param imageBase64 Base64编码的图片
   * @param userId 用户ID（学员ID）
   * @param userInfo 用户信息（可选）
   */
  async registerFace(
    imageBase64: string,
    userId: string,
    userInfo?: string
  ): Promise<{ faceToken: string; location: any }> {
    const token = await this.getAccessToken();
    
    const body = {
      image: imageBase64,
      image_type: "BASE64",
      group_id: this.config.groupId,
      user_id: userId,
      user_info: userInfo || "",
      quality_control: "NORMAL", // 图片质量检查
      liveness_control: "NONE", // 活体检测（可选LOW/MEDIUM/HIGH）
    };
    
    const response = await fetch(
      `${this.BASE_URL}/faceset/user/add?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    
    if (!response.ok) {
      throw new Error(`人脸注册失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error_code && data.error_code !== 0) {
      throw new Error(`人脸注册错误: ${data.error_msg}`);
    }
    
    return {
      faceToken: data.result?.face_token,
      location: data.result?.location,
    };
  }
  
  /**
   * 人脸搜索 - 在人脸库中搜索相似人脸
   * @param imageBase64 Base64编码的图片
   * @param maxUserNum 返回的最相似用户数量
   */
  async searchFace(
    imageBase64: string,
    maxUserNum: number = 5
  ): Promise<FaceMatchResult[]> {
    const token = await this.getAccessToken();
    
    const body = {
      image: imageBase64,
      image_type: "BASE64",
      group_id_list: this.config.groupId,
      max_user_num: maxUserNum,
      match_threshold: 70, // 相似度阈值（0-100）
    };
    
    const response = await fetch(
      `${this.BASE_URL}/search?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    
    if (!response.ok) {
      throw new Error(`人脸搜索失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error_code && data.error_code !== 0) {
      throw new Error(`人脸搜索错误: ${data.error_msg}`);
    }
    
    return (data.result?.user_list || []).map((user: any) => ({
      faceToken: user.face_token,
      score: user.score,
      userId: user.user_id,
      userInfo: user.user_info,
    }));
  }
  
  /**
   * 人脸比对 - 比对两张照片是否为同一人
   * @param image1Base64 第一张图片
   * @param image2Base64 第二张图片
   */
  async matchFace(
    image1Base64: string,
    image2Base64: string
  ): Promise<{ score: number; isSamePerson: boolean }> {
    const token = await this.getAccessToken();
    
    const body = [
      {
        image: image1Base64,
        image_type: "BASE64",
      },
      {
        image: image2Base64,
        image_type: "BASE64",
      },
    ];
    
    const response = await fetch(
      `${this.BASE_URL}/match?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    
    if (!response.ok) {
      throw new Error(`人脸比对失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error_code && data.error_code !== 0) {
      throw new Error(`人脸比对错误: ${data.error_msg}`);
    }
    
    const score = data.result?.score || 0;
    return {
      score,
      isSamePerson: score >= 80, // 80分以上认为是同一人
    };
  }
  
  /**
   * 删除用户人脸
   * @param userId 用户ID
   * @param faceToken 人脸token（可选，不传则删除该用户所有人脸）
   */
  async deleteFace(userId: string, faceToken?: string): Promise<boolean> {
    const token = await this.getAccessToken();
    
    const body: any = {
      group_id: this.config.groupId,
      user_id: userId,
    };
    
    if (faceToken) {
      body.face_token = faceToken;
    }
    
    const response = await fetch(
      `${this.BASE_URL}/faceset/face/delete?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    
    if (!response.ok) {
      throw new Error(`删除人脸失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.error_code === 0;
  }
  
  /**
   * 获取用户人脸列表
   * @param userId 用户ID
   */
  async getUserFaces(userId: string): Promise<{ faceToken: string; createTime: string }[]> {
    const token = await this.getAccessToken();
    
    const body = {
      group_id: this.config.groupId,
      user_id: userId,
    };
    
    const response = await fetch(
      `${this.BASE_URL}/faceset/face/getlist?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    
    if (!response.ok) {
      throw new Error(`获取人脸列表失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error_code && data.error_code !== 0) {
      return [];
    }
    
    return (data.result?.face_list || []).map((face: any) => ({
      faceToken: face.face_token,
      createTime: face.create_time,
    }));
  }
}

// 导出单例实例
export const baiduFaceService = new BaiduFaceService();
