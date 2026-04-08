/**
 * 文案生成工具 - 升级版
 * 
 * 特性：
 * 1. 支持行业专属话术
 * 2. 双重生成模式：先构思再输出
 * 3. 更细腻的内容生成
 */

import { LLMClient, Config } from "coze-coding-dev-sdk";
import { getIndustryConfig } from "@/lib/prompt-templates/industry-prompts";

interface CopywritingParams {
  type: "poster" | "moment" | "activity" | "course";
  subject?: string;
  target?: string;
  keyPoints?: string[];
  tone?: string;
  length?: "短" | "中" | "长";
  customPrompt?: string;
  // 新增：行业和机构信息
  industry?: string;
  merchantName?: string;
}

interface CopywritingResult {
  success: boolean;
  content?: string;
  title?: string;
  hashtags?: string[];
  thinking?: string; // 创作思路
  error?: string;
}

// 文案类型模板（增强版）
const COPYWRITING_TEMPLATES: Record<string, string> = {
  poster: `请为教培机构生成一张招生海报的文案。

## 创作要求

### 第一步：分析目标用户
- 思考家长的痛点和需求
- 确定最能打动他们的利益点

### 第二步：确定核心信息
- 主标题：不超过8个字，要有冲击力
- 副标题：不超过12个字，突出核心卖点
- 正文：50-100字，说明课程特色和优惠
- 行动号召：明确的下一步行动

### 第三步：输出文案
格式要求：
【主标题】xxx
【副标题】xxx
【正文】xxx
【行动号召】xxx

注意：文案要有温度，能引起家长共鸣。`,

  moment: `请为教培机构生成一条朋友圈招生文案。

## 创作要求

### 第一步：确定风格
- 朋友圈文案要像朋友聊天，不要太广告
- 开头要吸引眼球，可以用疑问句或共鸣句
- 中间介绍课程/活动亮点
- 结尾自然引导互动

### 第二步：内容结构
1. 开头（1-2句话）：引发兴趣或共鸣
2. 中间（2-3句话）：核心价值传递
3. 结尾（1句话）：引导行动
4. 适当使用emoji增加亲和力（不超过5个）
5. 添加3-5个话题标签

### 第三步：输出文案
直接输出文案内容，最后附上话题标签。`,

  activity: `请为教培机构生成一个活动宣传文案。

## 创作要求

### 第一步：活动亮点提取
- 确定活动最吸引人的点
- 思考家长为什么要参加

### 第二步：信息组织
- 活动名称（简洁有力）
- 活动亮点（3-5个要点）
- 活动详情（时间、地点、对象）
- 参与方式和优惠
- 行动号召（营造紧迫感）

### 第三步：输出文案
格式自由，但要清晰易读，重点突出。`,

  course: `请为教培机构生成一个课程介绍文案。

## 创作要求

### 第一步：课程定位
- 明确课程适合什么年龄段
- 确定课程的核心竞争力

### 第二步：内容组织
1. 课程名称（专业且吸引人）
2. 适合人群（具体年龄和特点）
3. 课程特色（3-5个亮点）
4. 学习收获（孩子能得到什么）
5. 教学理念（让家长放心）
6. 报名方式

### 第三步：输出文案
专业但亲切，让家长信任并产生兴趣。`,
};

// 长度对应的字数建议
const LENGTH_GUIDE: Record<string, string> = {
  短: "总字数控制在100字以内，言简意赅",
  中: "总字数控制在200-300字，信息完整",
  长: "总字数控制在400-500字，详细丰富",
};

export async function generateCopywriting(params: CopywritingParams): Promise<CopywritingResult> {
  const {
    type,
    subject,
    target,
    keyPoints,
    tone,
    length = "中",
    customPrompt,
    industry,
    merchantName,
  } = params;

  try {
    const config = new Config();
    const client = new LLMClient(config);

    // 获取行业配置
    const industryConfig = industry ? getIndustryConfig(industry) : null;

    // 构建系统提示词
    let systemPrompt = `你是一位资深的教培行业文案策划，擅长撰写吸引家长的招生文案。

## 你的文案特点
1. 有温度：让家长感受到你的真诚
2. 有痛点：直击家长关心的问题
3. 有价值：突出课程/活动的好处
4. 有行动：明确告诉家长下一步该做什么`;

    // 添加行业专属知识
    if (industryConfig) {
      systemPrompt += `\n\n## 行业专业知识 - ${industryConfig.name}

### 目标受众
${industryConfig.targetAudience}

### 用户痛点
${industryConfig.painPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

### 核心卖点
${industryConfig.sellingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

### 话术风格
${industryConfig.tone}

### 优秀文案示例
${industryConfig.examplePhrases.map((p) => `- "${p}"`).join("\n")}`;
    }

    // 构建用户提示词
    const template = COPYWRITING_TEMPLATES[type] || COPYWRITING_TEMPLATES.poster;
    let prompt = customPrompt || template;

    // 添加长度要求
    prompt += `\n\n### 字数要求\n${LENGTH_GUIDE[length]}`;

    // 添加上下文信息
    if (merchantName || subject || target || keyPoints || tone) {
      prompt += "\n\n## 本次创作信息";
      if (merchantName) prompt += `\n- 机构名称：${merchantName}`;
      if (subject) prompt += `\n- 课程/科目：${subject}`;
      if (target) prompt += `\n- 目标人群：${target}`;
      if (keyPoints && keyPoints.length > 0) {
        prompt += `\n- 核心卖点：${keyPoints.join("、")}`;
      }
      if (tone) prompt += `\n- 期望风格：${tone}`;
    }

    // 添加行业关键词建议
    if (industryConfig && !subject) {
      prompt += `\n\n### 建议使用的关键词\n${industryConfig.keywords.slice(0, 5).join("、")}`;
    }

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: prompt },
    ];

    const response = await client.invoke(messages, {
      model: "doubao-seed-2-0-pro-260215", // 使用更强模型
      temperature: 0.8,
    });

    const content = response.content;

    // 提取标题
    const titleMatch = content.match(/【主标题】(.+)/) || content.match(/^#+\s*(.+)/m);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // 提取话题标签
    const hashtagMatch = content.match(/#[\u4e00-\u9fa5\w]+/g);
    const hashtags = hashtagMatch || undefined;

    return {
      success: true,
      content,
      title,
      hashtags,
    };
  } catch (error) {
    console.error("Copywriting generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "文案生成失败",
    };
  }
}
