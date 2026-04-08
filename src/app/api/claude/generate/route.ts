import { NextRequest, NextResponse } from "next/server";
import { AIClient, ChatMessage } from "@/lib/ai-client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// 文案生成系统提示词
const SYSTEM_PROMPT = `你是一个专业的教培行业AI内容策划专家，专门为教培商家生成高质量的宣传文案。

你的核心任务：根据商家提供的店铺基本信息，自动生成多条高质量的宣传文案。

【核心原则】
1. 语言规范：使用正常的中国人说话方式，不生造词语，不用奇怪比喻
2. 结构清晰：分段+要点，方便阅读
3. 真实可信：用具体事实说话，不夸大不虚假
4. 简洁有力：每条文案控制在100-150字

【文案风格】
- 使用emoji表情增加亲和力（如：✅ ❌ 🌟 📍 📞 🎁）
- 突出地域优势
- 强调特色卖点
- 结尾要有明确的行动召唤

【严禁事项】
- 不要使用英文单词或拼音
- 不要使用"长出舌头"等奇怪比喻
- 不要使用空洞的形容词
- 不要超过150字`;

// 五种文案模板
const COPYWRITING_TEMPLATES = {
  痛点切入型: `你的孩子是否：
❌ 上课不敢举手发言？
❌ 在陌生人面前说话结巴？
❌ 缺乏自信，不敢表达？

来{店铺名称}！
✅ {特色优势}
✅ {主要课程}全方位训练
✅ 让孩子从胆小怯懦到自信大方

🌟 现在预约，免费试听课！
📍 {城市}{地址}
📞 {电话}`,

  效果展示型: `3个月前，孩子还是个不敢说话的小透明
3个月后，他站在舞台上自信演讲，全场掌声雷动！

这就是{店铺名称}的魔力！
🎤 专业训练，让孩子爱上表达
🎭 舞台实战，让孩子学会自信

🔥 周末免费试听，仅限前20名！
📍 {城市}{地址}
📞 {电话}`,

  情感共鸣型: `孩子的成长，不该止步于成绩单

在{店铺名称}，我们相信：
好的{经营范围}，是孩子一生的财富
自信的表达，是孩子最亮的标签

🌟 我们提供：
• {主要课程}
• {特色优势}

🎁 周末免费试听名额开放！
让孩子开启成长的第一步

📍 {城市}{地址}
📞 {电话}`,

  专业权威型: `选择{店铺名称}，给孩子专业的{经营范围}！

✨ 国家级认证师资团队
✨ 小班精品授课（1:6师生比）
✨ {主要课程}三大课程体系
✨ 每月实战演练+舞台汇演

90%的家长反馈：
孩子学习3个月后，表达能力、自信心、社交能力全面提升！

📍 {城市}{地址}
📞 {电话}
🎁 预约免费试听，限额20名！`,

  简洁直接型: `【{店铺名称}】专业{经营范围}机构

📚 课程：{主要课程}
👨‍🏫 师资：{特色优势}
🎯 对象：{目标人群}
📍 地址：{城市}{地址}

🌟 新学员福利：
• 免费试听一节
• 能力测评
• 报名立减500元

📞 咨询电话：{电话}
立即预约，开启成长之旅！`
};

interface ShopInfoInput {
  shopName: string;
  city: string;
  address: string;
  phone: string;
  businessScope?: string;  // 经营范围
  targetAudience?: string; // 目标人群
  brandTone?: string;      // 品牌调性
  mainCourses?: string;    // 主要课程
  features?: string;       // 特色优势
}

/**
 * 智能推断缺失信息
 */
function inferMissingInfo(info: ShopInfoInput): ShopInfoInput {
  const result = { ...info };
  
  // 推断经营范围
  if (!result.businessScope && result.shopName) {
    const name = result.shopName.toLowerCase();
    if (name.includes('口才') || name.includes('演讲')) {
      result.businessScope = '少儿口才';
    } else if (name.includes('编程') || name.includes('机器人')) {
      result.businessScope = '少儿编程';
    } else if (name.includes('舞蹈')) {
      result.businessScope = '舞蹈培训';
    } else if (name.includes('音乐') || name.includes('钢琴')) {
      result.businessScope = '音乐培训';
    } else if (name.includes('美术') || name.includes('绘画')) {
      result.businessScope = '美术培训';
    } else if (name.includes('英语')) {
      result.businessScope = '英语培训';
    } else {
      result.businessScope = '素质教育';
    }
  }
  
  // 推断目标人群
  if (!result.targetAudience) {
    if (result.businessScope?.includes('少儿') || result.businessScope?.includes('儿童')) {
      result.targetAudience = '儿童';
    } else if (result.businessScope?.includes('职业')) {
      result.targetAudience = '成年人';
    } else {
      result.targetAudience = '儿童';
    }
  }
  
  // 默认品牌调性
  if (!result.brandTone) {
    result.brandTone = '亲和温暖';
  }
  
  // 默认主要课程
  if (!result.mainCourses) {
    result.mainCourses = '优质课程';
  }
  
  // 默认特色优势
  if (!result.features) {
    result.features = '专业教学';
  }
  
  return result;
}

/**
 * 填充模板
 */
function fillTemplate(template: string, info: ShopInfoInput): string {
  return template
    .replace(/{店铺名称}/g, info.shopName)
    .replace(/{城市}/g, info.city)
    .replace(/{地址}/g, info.address)
    .replace(/{电话}/g, info.phone)
    .replace(/{经营范围}/g, info.businessScope || '素质教育')
    .replace(/{目标人群}/g, info.targetAudience || '儿童')
    .replace(/{主要课程}/g, info.mainCourses || '优质课程')
    .replace(/{特色优势}/g, info.features || '专业教学');
}

/**
 * 生成文案（使用国内AI模型）
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    
    const { 
      shopName, 
      city, 
      address, 
      phone,
      businessScope,
      targetAudience,
      brandTone,
      mainCourses,
      features
    } = body;

    // 验证必填信息
    if (!shopName || !city || !address || !phone) {
      return NextResponse.json(
        { error: "请提供完整的机构信息：店铺名称、城市、地址、电话" },
        { status: 400 }
      );
    }

    // 智能推断缺失信息
    const fullInfo = inferMissingInfo({
      shopName,
      city,
      address,
      phone,
      businessScope,
      targetAudience,
      brandTone,
      mainCourses,
      features
    });

    console.log("机构信息:", fullInfo);

    // 使用国内AI模型生成文案
    const client = new AIClient();

    // 构建提示词
    const userPrompt = `请为以下教培机构生成5条不同风格的宣传文案：

机构信息：
- 店铺名称：${fullInfo.shopName}
- 城市：${fullInfo.city}
- 地址：${fullInfo.address}
- 电话：${fullInfo.phone}
- 经营范围：${fullInfo.businessScope}
- 目标人群：${fullInfo.targetAudience}
- 主要课程：${fullInfo.mainCourses}
- 特色优势：${fullInfo.features}

请按以下格式输出5条文案：
1. 痛点切入型（朋友圈风格）
2. 效果展示型（对比故事）
3. 情感共鸣型（价值主张）
4. 专业权威型（展示实力）
5. 简洁直接型（信息清晰）

每条文案控制在100-150字，使用emoji表情，突出地域和特色。`;

    // 调用国内AI模型
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ];

    const generatedContent = await client.chat(messages, {
      temperature: 0.8,
      maxTokens: 2000,
    });

    // 创建内容记录
    const content = await prisma.content.create({
      data: {
        merchantId: user.merchantId || "",
        type: "text",
        title: `${shopName} - 宣传文案`,
        description: `经营范围：${fullInfo.businessScope}，目标人群：${fullInfo.targetAudience}`,
        status: "completed",
        prompt: userPrompt,
        content: generatedContent,
      },
    });

    return NextResponse.json({
      success: true,
      contentId: content.id,
      content: generatedContent,
      inferredInfo: fullInfo,  // 返回推断的信息
    });
  } catch (error) {
    console.error("文案生成错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "文案生成失败" },
      { status: 500 }
    );
  }
}
