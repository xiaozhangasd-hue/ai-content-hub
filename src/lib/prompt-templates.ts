/**
 * 教培机构智能提示词系统
 * 专为教育培训行业设计，支持智能匹配场景、风格、语气
 */

// ==================== 商家信息类型 ====================

export interface ShopInfo {
  // 必填信息
  shopName: string;      // 店铺名称
  city: string;          // 城市
  address: string;       // 详细地址
  phone: string;         // 联系电话
  
  // 选填信息（用于智能匹配）
  businessScope?: BusinessScope;      // 经营范围
  targetAudience?: TargetAudience;    // 目标人群
  brandTone?: BrandTone;              // 品牌调性
  mainCourses?: string[];             // 主要课程
  features?: string[];                // 特色优势
  logoUrl?: string;                   // 机构Logo
}

// 经营范围
export type BusinessScope = 
  | "艺术培训"    // 钢琴、舞蹈、美术、书法等
  | "学科辅导"    // 语数英、理化生等
  | "早教启蒙"    // 0-6岁早教
  | "STEAM教育"   // 编程、机器人、科学实验
  | "语言培训"    // 英语、小语种
  | "运动培训"    // 篮球、游泳、武术
  | "职业培训"    // 成人职业教育
  | "托育托管"    // 托班、晚托
  | "素质教育";   // 口才、思维、专注力

// 目标人群
export type TargetAudience =
  | "0-3岁婴幼儿"
  | "3-6岁幼儿"
  | "6-12岁小学生"
  | "12-18岁中学生"
  | "成人学员"
  | "家长群体";

// 品牌调性
export type BrandTone = 
  | "专业权威"    // 强调师资、资质、成果
  | "温馨亲切"    // 强调关爱、陪伴、成长
  | "活泼有趣"    // 强调快乐、互动、兴趣
  | "高端精英"    // 强调品质、定制、VIP服务
  | "平价亲民";   // 强调性价比、便民、实惠

// 内容类型
export type ContentType = "文案" | "图片" | "视频";

// ==================== 场景模板 ====================

export interface SceneTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "营销" | "运营" | "品牌";
}

// 场景列表
export const sceneTemplates: SceneTemplate[] = [
  { id: "recruitment", name: "招生宣传", description: "吸引新生报名", icon: "Megaphone", category: "营销" },
  { id: "trial-class", name: "体验课推广", description: "引导试听体验", icon: "Ticket", category: "营销" },
  { id: "promotion", name: "优惠活动", description: "促销优惠信息", icon: "Percent", category: "营销" },
  { id: "course-intro", name: "课程介绍", description: "介绍课程内容", icon: "BookOpen", category: "运营" },
  { id: "student-showcase", name: "学员成果", description: "展示学习效果", icon: "Trophy", category: "运营" },
  { id: "daily-share", name: "日常动态", description: "分享教学日常", icon: "Camera", category: "运营" },
  { id: "brand-story", name: "品牌故事", description: "展示机构文化", icon: "Heart", category: "品牌" },
  { id: "teacher-intro", name: "师资介绍", description: "展示教师风采", icon: "Users", category: "品牌" },
];

// 内容模板列表
export const contentTemplates = [
  { id: "moments-ad", name: "朋友圈招生文案", type: "文案", scene: "recruitment", description: "适合发朋友圈的招生宣传文案" },
  { id: "moments-trial", name: "朋友圈体验课", type: "文案", scene: "trial-class", description: "引导报名体验课的朋友圈文案" },
  { id: "moments-promo", name: "朋友圈促销", type: "文案", scene: "promotion", description: "优惠活动朋友圈推广文案" },
  { id: "wechat-article", name: "公众号文章", type: "文案", scene: "course-intro", description: "深度课程介绍文章" },
  { id: "video-script", name: "短视频脚本", type: "文案", scene: "daily-share", description: "抖音/视频号短视频脚本" },
  { id: "poster-recruit", name: "招生海报", type: "图片", scene: "recruitment", description: "精美招生海报设计" },
  { id: "poster-trial", name: "体验课海报", type: "图片", scene: "trial-class", description: "体验课活动海报" },
  { id: "poster-promo", name: "促销海报", type: "图片", scene: "promotion", description: "优惠活动宣传海报" },
  { id: "moments-image", name: "朋友圈配图", type: "图片", scene: "daily-share", description: "日常分享配图" },
  { id: "banner", name: "宣传横幅", type: "图片", scene: "brand-story", description: "机构宣传横幅" },
  { id: "video-promo", name: "宣传视频", type: "视频", scene: "brand-story", description: "机构宣传片" },
  { id: "video-course", name: "课程介绍视频", type: "视频", scene: "course-intro", description: "课程内容展示视频" },
  { id: "video-activity", name: "活动展示视频", type: "视频", scene: "daily-share", description: "教学活动记录视频" },
];

// ==================== 智能匹配系统 ====================

export function matchSceneElements(scope: BusinessScope): {
  keywords: string[];
  scenes: string[];
  features: string[];
} {
  const mapping: Record<BusinessScope, { keywords: string[]; scenes: string[]; features: string[] }> = {
    "艺术培训": {
      keywords: ["钢琴", "舞蹈", "美术", "书法", "音乐", "艺术素养"],
      scenes: ["recruitment", "student-showcase", "course-intro"],
      features: ["专业师资", "考级辅导", "演出机会", "艺术氛围"]
    },
    "学科辅导": {
      keywords: ["语文", "数学", "英语", "物理", "化学", "提分"],
      scenes: ["recruitment", "student-showcase", "course-intro"],
      features: ["提分效果", "名师授课", "小班教学", "个性化辅导"]
    },
    "早教启蒙": {
      keywords: ["早教", "启蒙", "亲子", "感统", "认知发展"],
      scenes: ["recruitment", "trial-class", "daily-share"],
      features: ["亲子互动", "专业教具", "发育评估", "温馨环境"]
    },
    "STEAM教育": {
      keywords: ["编程", "机器人", "科学实验", "创客", "思维"],
      scenes: ["recruitment", "student-showcase", "course-intro"],
      features: ["动手实践", "创新思维", "竞赛辅导", "项目式学习"]
    },
    "语言培训": {
      keywords: ["英语", "口语", "小语种", "雅思", "托福"],
      scenes: ["recruitment", "course-intro", "student-showcase"],
      features: ["外教授课", "沉浸式环境", "考级辅导", "实用口语"]
    },
    "运动培训": {
      keywords: ["篮球", "游泳", "武术", "体能", "运动"],
      scenes: ["recruitment", "daily-share", "student-showcase"],
      features: ["专业场地", "安全教学", "比赛机会", "体能提升"]
    },
    "职业培训": {
      keywords: ["职业技能", "考证", "就业", "提升"],
      scenes: ["recruitment", "course-intro", "brand-story"],
      features: ["就业推荐", "实操培训", "证书辅导", "行业对接"]
    },
    "托育托管": {
      keywords: ["托班", "晚托", "接送", "照护"],
      scenes: ["recruitment", "daily-share", "brand-story"],
      features: ["安全照护", "营养餐食", "作业辅导", "弹性时间"]
    },
    "素质教育": {
      keywords: ["口才", "思维", "专注力", "礼仪", "综合"],
      scenes: ["recruitment", "student-showcase", "course-intro"],
      features: ["能力提升", "全面发展", "趣味教学", "成果可见"]
    }
  };
  
  return mapping[scope] || { keywords: [], scenes: [], features: [] };
}

export function matchVisualStyle(tone: BrandTone): {
  imageStyle: string;
  colorScheme: string;
  atmosphere: string;
} {
  const mapping: Record<BrandTone, { imageStyle: string; colorScheme: string; atmosphere: string }> = {
    "专业权威": {
      imageStyle: "professional, clean, organized, well-lit, modern interior, certificate display",
      colorScheme: "blue and white, professional colors, corporate style",
      atmosphere: "professional, trustworthy, academic atmosphere"
    },
    "温馨亲切": {
      imageStyle: "warm, cozy, natural light, soft colors, family-friendly, caring environment",
      colorScheme: "warm tones, pastel colors, gentle lighting",
      atmosphere: "welcoming, nurturing, home-like feeling"
    },
    "活泼有趣": {
      imageStyle: "colorful, dynamic, playful, bright, fun elements, energetic atmosphere",
      colorScheme: "vibrant colors, rainbow palette, cheerful tones",
      atmosphere: "lively, exciting, kid-friendly, fun learning"
    },
    "高端精英": {
      imageStyle: "luxury, elegant, sophisticated, premium materials, exclusive environment",
      colorScheme: "gold, black, elegant colors, premium feel",
      atmosphere: "exclusive, refined, high-end, prestigious"
    },
    "平价亲民": {
      imageStyle: "simple, practical, clean, accessible, community-oriented",
      colorScheme: "fresh colors, simple palette, approachable tones",
      atmosphere: "friendly, accessible, community-focused"
    }
  };
  
  return mapping[tone] || mapping["专业权威"];
}

export function matchContentTone(audience: TargetAudience): {
  textTone: string;
  keyPhrases: string[];
  callToAction: string;
} {
  const mapping: Record<TargetAudience, { textTone: string; keyPhrases: string[]; callToAction: string }> = {
    "0-3岁婴幼儿": {
      textTone: "亲切温柔，强调安全感和成长发育",
      keyPhrases: ["宝宝成长", "亲子时光", "早教启蒙", "快乐成长"],
      callToAction: "预约免费体验课，和宝宝一起成长"
    },
    "3-6岁幼儿": {
      textTone: "活泼有趣，强调探索和兴趣培养",
      keyPhrases: ["趣味学习", "探索发现", "兴趣培养", "快乐童年"],
      callToAction: "带孩子来体验吧，开启快乐学习之旅"
    },
    "6-12岁小学生": {
      textTone: "积极向上，强调能力提升和自信成长",
      keyPhrases: ["能力提升", "自信成长", "兴趣发展", "学习进步"],
      callToAction: "预约试听，让孩子爱上学习"
    },
    "12-18岁中学生": {
      textTone: "专业务实，强调效果和未来规划",
      keyPhrases: ["提分", "升学", "名校", "未来规划"],
      callToAction: "免费测评，制定专属学习方案"
    },
    "成人学员": {
      textTone: "专业简洁，强调实用价值和职业发展",
      keyPhrases: ["职场提升", "技能进阶", "考证", "就业"],
      callToAction: "咨询课程，开启职业新篇章"
    },
    "家长群体": {
      textTone: "真诚可信，强调教育理念和孩子成长",
      keyPhrases: ["教育理念", "孩子成长", "家长放心", "专业师资"],
      callToAction: "预约参观，了解我们的教育理念"
    }
  };
  
  return mapping[audience] || mapping["家长群体"];
}

// ==================== 优秀文案示例 ====================

const GOOD_EXAMPLES = {
  "素质教育-口才": `【好口才，让孩子更自信】

各位家长好！您的孩子是否遇到这些情况：
- 明明知道答案，却不敢举手发言
- 在家里能说会道，出门就害羞
- 不懂得如何表达自己的想法

欧若拉少儿口才专注6-12岁儿童口才训练，小班教学，每班不超过8人。我们通过游戏化教学、情景模拟、舞台展示等方式，帮助孩子：

✓ 敢于开口，自信表达
✓ 逻辑清晰，有条有理  
✓ 仪态大方，举止得体

开业优惠：首次试听课免费，报名享8折
地址：南阳市北京路271号
电话：17538235191

名额有限，先到先得！`,

  "艺术培训-钢琴": `【用音乐点亮孩子的童年】

阳光钢琴教室开始招生啦！

专为5-12岁小朋友设计：
• 专业钢琴老师，耐心细致
• 一对一教学，因材施教
• 考级辅导，系统学习

为什么要学钢琴？
1. 培养艺术修养，提升气质
2. 锻炼手脑协调，开发智力
3. 培养专注力，养成好习惯

现在报名，送教材+练习琴
地址：朝阳区建国路88号
电话：13800138000

欢迎带孩子来试听！`,

  "学科辅导": `【新学期，帮孩子打好基础】

家长朋友们好！

孩子学习遇到困难，家长辅导力不从心？
新学期新起点，阳光教育来帮您！

【我们的特色】
✓ 小班教学，关注每个孩子
✓ 方法引导，不只是讲题
✓ 定期反馈，家长看得见

【开设课程】
小学：语文、数学、英语
初中：语数英、理化生

【限时优惠】
报名一学期，享9折
老带新，各减200元

地址：海淀区中关村大街100号
电话：13900139000

免费试听，满意再报名！`
};

// ==================== 提示词生成器 ====================

/**
 * 生成文案提示词（优化版）
 */
export function generateTextPrompt(
  shopInfo: ShopInfo,
  sceneId: string,
  templateId: string
): string {
  const { shopName, city, address, phone, businessScope, targetAudience, brandTone, mainCourses, features } = shopInfo;
  
  const sceneName = getSceneName(sceneId);
  
  // 构建提示词
  let prompt = `你是一位专业的教育培训行业文案撰稿人，请为以下机构撰写一条${sceneName}朋友圈文案。

## 机构信息
- 名称：${shopName}
- 地址：${city}${address}
- 电话：${phone}
${businessScope ? `- 类型：${businessScope}` : ""}
${mainCourses && mainCourses.length > 0 ? `- 课程：${mainCourses.join("、")}` : ""}
${features && features.length > 0 ? `- 特色：${features.join("、")}` : ""}

## 写作要求（必须严格遵守）

1. **结构清晰**：使用分段+要点形式，方便阅读
2. **直击痛点**：开头用疑问或场景切入，引起家长共鸣
3. **真实可信**：用具体事实说话，不要空洞的形容词
4. **语言规范**：使用正常的中文表达，不要生造词语
5. **结尾引导**：包含地址、电话、优惠信息，引导咨询

## 禁止事项（违反将导致文案无效）

❌ 不要使用奇怪或不恰当的比喻（如"长出舌头"、"鲜活的舌头"等）
❌ 不要使用任何表情符号
❌ 不要使用英文单词或中英混合表达
❌ 不要添加"--图片"、"--视频"等无关标记
❌ 不要使用夸张、虚假的宣传语
❌ 不要使用书面语和官话套话
❌ 不要超过200字

## 写作风格

`;

  // 根据目标人群添加语气
  if (targetAudience) {
    const tone = matchContentTone(targetAudience);
    prompt += `- 目标人群：${targetAudience}
- 语气风格：${tone.textTone}
- 关键词：${tone.keyPhrases.join("、")}
- 行动号召：${tone.callToAction}

`;
  }

  // 添加优秀示例
  if (businessScope === "素质教育" && mainCourses?.includes("口才")) {
    prompt += `## 优秀示例参考

${GOOD_EXAMPLES["素质教育-口才"]}

请参考以上示例的风格和结构，但不要照抄，根据实际机构信息创作。

`;
  } else if (businessScope === "艺术培训") {
    prompt += `## 优秀示例参考

${GOOD_EXAMPLES["艺术培训-钢琴"]}

请参考以上示例的风格和结构，但不要照抄，根据实际机构信息创作。

`;
  } else if (businessScope === "学科辅导") {
    prompt += `## 优秀示例参考

${GOOD_EXAMPLES["学科辅导"]}

请参考以上示例的风格和结构，但不要照抄，根据实际机构信息创作。

`;
  }

  prompt += `请直接输出文案内容，不要有任何解释或说明。`;

  return prompt;
}

/**
 * 生成图片提示词（包含机构信息）- 使用中文
 * 注意：AI生成的图片仅作为背景素材，机构名称、电话等文字可能无法精确生成
 */
export function generateImagePrompt(
  shopInfo: ShopInfo,
  sceneId: string,
  templateId: string
): string {
  const { shopName, city, address, phone, businessScope, brandTone, targetAudience, mainCourses } = shopInfo;
  
  const visualStyle = brandTone ? matchVisualStyle(brandTone) : null;
  
  // 构建中文提示词
  let prompt = "";
  
  // 根据场景生成海报描述
  if (sceneId === "recruitment" || sceneId === "trial-class") {
    prompt = `教育培训机构招生海报，机构名称"${shopName}"，`;
    prompt += `专业教学环境，明亮现代教室，孩子们快乐学习，温馨欢迎氛围，`;
    prompt += `海报上显示机构名称"${shopName}"，`;
    prompt += `底部联系信息区域显示电话"${phone}"和地址"${city}${address}"，`;
  } else if (sceneId === "course-intro") {
    prompt = `课程介绍海报，机构"${shopName}"${businessScope || "培训中心"}，`;
    prompt += `专业课程展示，清晰课程结构，`;
    prompt += `现代教育设计风格，`;
    prompt += `海报显示机构名称"${shopName}"，`;
    if (mainCourses && mainCourses.length > 0) {
      prompt += `展示课程：${mainCourses.join("、")}，`;
    }
  } else if (sceneId === "student-showcase") {
    prompt = `学员成果展示海报，机构"${shopName}"，`;
    prompt += `快乐学员展示作品，自豪的老师家长，`;
    prompt += `专业展示学习成果，`;
    prompt += `海报显示机构名称"${shopName}"，`;
  } else {
    prompt = `宣传图片，机构"${shopName}"${businessScope || "教育培训"}，`;
    prompt += `专业教学环境，现代化设施，`;
    prompt += `优质学习氛围，`;
    prompt += `图片显示机构名称"${shopName}"，`;
  }
  
  // 添加视觉风格（中文）
  if (visualStyle) {
    prompt += `风格：${visualStyle.atmosphere}，`;
  }
  
  // 目标人群特征
  if (targetAudience) {
    if (targetAudience.includes("幼儿") || targetAudience.includes("婴幼儿")) {
      prompt += `儿童友好环境，色彩丰富活泼元素，`;
    } else if (targetAudience.includes("中学生") || targetAudience.includes("成人")) {
      prompt += `专业专注的学习环境，`;
    }
  }
  
  // 质量要求
  prompt += `高质量商业摄影，专业灯光，海报设计，4K分辨率，文字清晰可见`;
  
  return prompt;
}

/**
 * 生成视频提示词（包含机构信息）- 使用中文
 */
export function generateVideoPrompt(
  shopInfo: ShopInfo,
  sceneId: string,
  templateId: string
): string {
  const { shopName, businessScope, brandTone, mainCourses } = shopInfo;
  
  const visualStyle = brandTone ? matchVisualStyle(brandTone) : null;
  
  let prompt = "";
  
  if (sceneId === "recruitment" || sceneId === "trial-class") {
    prompt = `招生宣传视频，机构"${shopName}"${businessScope || "教育培训"}，`;
    prompt += `展示专业教学环境和优质师资，`;
    prompt += `学生快乐学习，温馨师生互动，`;
    prompt += `视频中展示机构名称"${shopName}"，`;
  } else if (sceneId === "course-intro") {
    prompt = `课程介绍视频，机构"${shopName}"，`;
    prompt += `展示课程内容和教学特色，`;
    prompt += `专业教学方法，清晰学习路径，`;
    if (mainCourses && mainCourses.length > 0) {
      prompt += `课程包括${mainCourses.join("、")}，`;
    }
  } else if (sceneId === "student-showcase") {
    prompt = `学员成果展示视频，机构"${shopName}"，`;
    prompt += `展示学员学习成果和进步，`;
    prompt += `快乐学员和自豪家长，优秀学习效果，`;
  } else {
    prompt = `宣传视频，机构"${shopName}"${businessScope || "教育培训"}，`;
    prompt += `展示专业教学服务和优质学习环境，`;
    prompt += `温馨欢迎氛围，`;
  }
  
  if (visualStyle) {
    prompt += `风格：${visualStyle.atmosphere}，`;
  }
  
  prompt += `高质量，专业，电影感，流畅转场`;
  
  return prompt;
}

/**
 * 获取场景名称
 */
function getSceneName(sceneId: string): string {
  const scene = sceneTemplates.find(s => s.id === sceneId);
  return scene?.name || "营销";
}

// ==================== 选项列表 ====================

export const businessScopeOptions = [
  { value: "艺术培训", label: "艺术培训", desc: "钢琴、舞蹈、美术、书法等" },
  { value: "学科辅导", label: "学科辅导", desc: "语数英、理化生等" },
  { value: "早教启蒙", label: "早教启蒙", desc: "0-6岁早教" },
  { value: "STEAM教育", label: "STEAM教育", desc: "编程、机器人、科学实验" },
  { value: "语言培训", label: "语言培训", desc: "英语、小语种" },
  { value: "运动培训", label: "运动培训", desc: "篮球、游泳、武术" },
  { value: "职业培训", label: "职业培训", desc: "成人职业教育" },
  { value: "托育托管", label: "托育托管", desc: "托班、晚托" },
  { value: "素质教育", label: "素质教育", desc: "口才、思维、专注力" },
];

export const targetAudienceOptions = [
  { value: "0-3岁婴幼儿", label: "0-3岁婴幼儿" },
  { value: "3-6岁幼儿", label: "3-6岁幼儿" },
  { value: "6-12岁小学生", label: "6-12岁小学生" },
  { value: "12-18岁中学生", label: "12-18岁中学生" },
  { value: "成人学员", label: "成人学员" },
  { value: "家长群体", label: "家长群体" },
];

export const brandToneOptions = [
  { value: "专业权威", label: "专业权威", desc: "强调师资、资质、成果" },
  { value: "温馨亲切", label: "温馨亲切", desc: "强调关爱、陪伴、成长" },
  { value: "活泼有趣", label: "活泼有趣", desc: "强调快乐、互动、兴趣" },
  { value: "高端精英", label: "高端精英", desc: "强调品质、定制、VIP服务" },
  { value: "平价亲民", label: "平价亲民", desc: "强调性价比、便民、实惠" },
];
