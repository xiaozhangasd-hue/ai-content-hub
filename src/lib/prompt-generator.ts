/**
 * 智能提示词生成服务
 * 
 * 根据机构信息和用户选择的场景，自动生成专业的AI提示词
 * 用户无需了解prompt，只需选择科目和场景
 */

// 教培行业科目分类
export const SUBJECT_CATEGORIES = {
  "艺术培训": ["美术绘画", "书法", "音乐", "舞蹈", "钢琴", "古筝", "吉他", "声乐"],
  "语言培训": ["少儿口才", "英语", "小语种", "作文写作", "阅读理解"],
  "学科辅导": ["数学", "语文", "英语", "物理", "化学", "生物"],
  "运动培训": ["游泳", "篮球", "足球", "乒乓球", "跆拳道", "武术"],
  "科技培训": ["少儿编程", "机器人", "乐高", "科学实验"],
  "早教托育": ["早教", "托班", "亲子课程", "感统训练"],
  "职业技能": ["职业技能培训", "资格证考试", "成人教育"],
};

// 图片风格选项
export const IMAGE_STYLES = [
  { id: "poster", name: "招生海报", desc: "适合朋友圈、微信群推广" },
  { id: "banner", name: "横幅广告", desc: "适合公众号、网站头图" },
  { id: "card", name: "课程卡片", desc: "适合课程介绍、价目表" },
  { id: "certificate", name: "荣誉证书", desc: "展示机构资质、学员成果" },
  { id: "activity", name: "活动宣传", desc: "节日活动、促销优惠" },
];

// 图片艺术风格
export const IMAGE_ART_STYLES = [
  { id: "cartoon", name: "卡通风格", desc: "可爱活泼，适合儿童教育" },
  { id: "anime", name: "动漫风格", desc: "日系动漫，青春活力" },
  { id: "illustration", name: "插画风格", desc: "手绘质感，温馨文艺" },
  { id: "watercolor", name: "水彩风格", desc: "柔和淡雅，艺术感强" },
  { id: "flat", name: "扁平设计", desc: "简约现代，信息清晰" },
  { id: "3d_cartoon", name: "3D卡通", desc: "立体可爱，吸引眼球" },
];

// 视频场景选项
export const VIDEO_SCENES = [
  { id: "course_promo", name: "课程宣传", description: "展示课程特色、吸引报名" },
  { id: "activity_show", name: "活动展示", description: "课堂活动、节日庆典" },
  { id: "brand_story", name: "品牌故事", description: "机构文化、办学理念" },
  { id: "teaching_scene", name: "教学场景", description: "真实课堂、师生互动" },
  { id: "student_work", name: "学员成果", description: "作品展示、进步对比" },
  { id: "environment", name: "环境展示", description: "教室环境、设施设备" },
];

// 视频风格选项
export const VIDEO_STYLES = [
  "温馨治愈",
  "活泼动感",
  "专业大气",
  "现代简约",
  "青春活力",
  "优雅知性",
  "科技未来",
  "卡通动漫",
  "手绘插画",
];

// 对口型/数字人场景
export const AVATAR_SCENES = [
  { id: "welcome", name: "欢迎致辞", desc: "机构介绍、热情欢迎" },
  { id: "course_intro", name: "课程介绍", desc: "课程特色、招生信息" },
  { id: "promo", name: "促销活动", desc: "限时优惠、报名福利" },
  { id: "tips", name: "教育小知识", desc: "专业分享、建立信任" },
  { id: "festival", name: "节日祝福", desc: "节日问候、品牌曝光" },
];

// 机构信息类型
export interface MerchantInfo {
  // 基础信息
  name: string;           // 机构名称
  city: string;           // 城市
  address: string;        // 详细地址
  phone: string;          // 联系电话
  
  // 经营信息
  category: string;       // 行业分类（艺术培训、语言培训等）
  subjects: string[];     // 具体科目（美术、钢琴等）
  targetAge: string;      // 目标年龄段
  features: string[];     // 特色优势
  
  // 品牌信息
  slogan: string;         // 企业标语
  philosophy: string;     // 教育理念
  brandStyle: string;     // 品牌调性（专业/温馨/活泼等）
  
  // 视觉信息
  brandColor: string;     // 品牌色
  logoUrl?: string;       // Logo图片
}

// 场景配置类型
export interface SceneConfig {
  sceneId: string;        // 场景ID
  subject?: string;       // 选择的具体科目
  customText?: string;    // 自定义文案补充
}

/**
 * 生成图片提示词
 */
export function generateImagePrompt(
  merchant: MerchantInfo,
  config: { sceneId: string; subject?: string; customText?: string; artStyle?: string }
): string {
  const { sceneId, subject, customText, artStyle } = config;
  
  // 艺术风格映射
  const artStyleMap: Record<string, string> = {
    "cartoon": "卡通风格，可爱活泼，圆润造型，明快色彩，适合儿童",
    "anime": "日系动漫风格，清新明亮，青春活力，精致线条",
    "illustration": "手绘插画风格，温馨文艺，柔和笔触，艺术感",
    "watercolor": "水彩画风，淡雅柔和，渐变色，艺术氛围",
    "flat": "扁平化设计，简约现代，几何图形，色彩鲜明",
    "3d_cartoon": "3D卡通风格，立体可爱，圆润造型，柔和光影",
  };
  
  const styleDesc = artStyleMap[artStyle || "cartoon"] || artStyleMap["cartoon"];
  
  // 科目相关的视觉元素（儿童友好）
  const subjectVisuals: Record<string, string> = {
    "美术绘画": "彩色画笔、调色盘、颜料、画架、小朋友的画作、彩虹色",
    "书法": "毛笔、宣纸、墨汁、书法作品、中国风元素、可爱的毛笔卡通形象",
    "音乐": "跳跃的音符、钢琴键、乐器、乐谱、音乐符号装饰",
    "舞蹈": "舞蹈教室、镜子、舞蹈鞋、卡通小女孩跳舞姿势",
    "钢琴": "黑白琴键、钢琴、乐谱、可爱的卡通小朋友弹琴",
    "古筝": "古筝、传统服饰、中国风元素、可爱的卡通人物",
    "吉他": "吉他、音符、舞台灯光、卡通小朋友弹吉他",
    "声乐": "麦克风、舞台、聚光灯、卡通小朋友唱歌",
    "少儿口才": "舞台、麦克风、自信的卡通小朋友、演讲手势",
    "英语": "英文字母ABC、地球仪、书本、可爱的卡通小朋友",
    "作文写作": "书本、钢笔、稿纸、阅读角、可爱的文具卡通",
    "数学": "可爱的数字1-10、几何图形、计算器、数学符号",
    "编程": "可爱的机器人角色、积木、电脑、代码元素、科技感",
    "机器人": "可爱的机器人角色、积木玩具、科技实验室",
    "游泳": "泳池、水花、泳镜、卡通小朋友游泳、夏日清凉感",
    "篮球": "篮球场、篮球、卡通小朋友打篮球、活力阳光",
    "跆拳道": "跆拳道服、腰带、训练场地、卡通小朋友练武术",
    "早教": "彩色玩具、积木、亲子互动、温馨教室、可爱的动物元素",
  };

  // 通用风格要求（针对教培机构，面向家长和孩子）
  const styleRequirements = `
【重要风格要求 - 必须严格遵守】：
1. 艺术风格：${styleDesc}
2. 【关键】人物特征：必须是亚洲/中国儿童面孔！黑头发、黑眼睛、黄皮肤、典型的东方面孔特征！绝对禁止欧美面孔、金发碧眼！
3. 色彩：明亮欢乐、温暖柔和、适合儿童审美
4. 氛围：快乐学习、积极向上、温馨亲切
5. 避免写实风格，采用卡通/插画/动漫风格
6. 【再次强调】所有人物必须是亚洲/中国儿童面孔！不要白人、不要欧美风格人物！

【人物外观强制要求】：
- 头发：黑色或深棕色
- 眼睛：黑色或深棕色，典型的东方眼型
- 肤色：健康的黄色/小麦色
- 面部特征：圆润的脸型、典型的亚洲五官
- 如果无法确保亚洲面孔，请使用无人物的纯场景设计
`;

  // 场景对应的提示词模板
  const sceneTemplates: Record<string, string> = {
    "poster": `
生成一张${merchant.category}招生海报图片：
- 主题：${subject || merchant.subjects[0]}培训招生
- 视觉元素：${subjectVisuals[subject || merchant.subjects[0]] || "教室、书本、学习氛围、可爱的卡通元素"}
- 品牌色：${merchant.brandColor || "蓝色系"}
- 信息展示区域：机构名称"${merchant.name}"、电话"${merchant.phone}"
- 整体氛围：欢乐温馨、适合儿童、让家长放心
${customText ? `- 补充要求：${customText}` : ""}
${styleRequirements}
要求：构图美观、色彩明快欢乐、适合朋友圈分享、高清4K
    `,
    "banner": `
生成一张${merchant.category}宣传横幅图片：
- 尺寸：宽幅横向（适合公众号头图）
- 内容：${subject || merchant.subjects[0]}课程推广
- 视觉元素：${subjectVisuals[subject || merchant.subjects[0]] || "教室环境、可爱的卡通小朋友"}
- 品牌展示：${merchant.name}、${merchant.slogan || "让孩子快乐成长"}
- 配色：${merchant.brandColor || "蓝色"}为主色调
${customText ? `- 补充：${customText}` : ""}
${styleRequirements}
要求：视觉冲击力强、欢乐活泼、适合网络传播
    `,
    "card": `
生成一张${subject || merchant.subjects[0]}课程卡片图片：
- 类型：课程介绍卡片
- 内容：展示${subject || merchant.subjects[0]}课程特色
- 视觉元素：${subjectVisuals[subject || merchant.subjects[0]]}
- 特色标签：${merchant.features.slice(0, 3).join("、")}
- 联系方式：${merchant.phone}
${customText ? `- 补充：${customText}` : ""}
${styleRequirements}
要求：适合发朋友圈、卡片式设计、信息一目了然
    `,
    "certificate": `
生成一张${merchant.name}荣誉证书风格图片：
- 类型：展示机构实力、学员成果
- 视觉元素：可爱的奖杯、证书、奖章、星星、彩虹
- 机构名称：${merchant.name}
- 展示内容：优秀学员、教学成果
- 氛围：温馨可爱、充满成就感
${customText ? `- 补充：${customText}` : ""}
${styleRequirements}
要求：增强信任感、适合展示机构实力、欢乐庆祝氛围
    `,
    "activity": `
生成一张${merchant.category}活动宣传图片：
- 类型：促销活动、节日活动
- 活动主题：${customText || "限时优惠活动"}
- 机构信息：${merchant.name}、${merchant.phone}
- 视觉元素：礼物盒、优惠券、气球、彩带、星星、欢乐氛围
- 风格：热闹欢乐、吸引眼球
- 配色：${merchant.brandColor || "红色系"}
${styleRequirements}
要求：促销信息醒目、欢乐感强、促进转化
    `,
  };

  return (sceneTemplates[sceneId] || sceneTemplates["poster"]).trim();
}

/**
 * 生成视频提示词
 */
export function generateVideoPrompt(
  merchant: MerchantInfo,
  sceneId: string,
  style?: string,
  customText?: string,
  duration: number = 5
): string {
  const subject = merchant.subjects[0] || "综合课程";
  
  const subjectScenes: Record<string, string> = {
    "美术绘画": "可爱的亚洲儿童专注绘画、老师耐心指导、色彩斑斓的儿童画作展示、画笔在纸上快乐涂抹",
    "书法": "老师示范书法、中国小朋友认真练字、毛笔在宣纸上书写、儿童书法作品展示",
    "音乐": "乐器演奏、儿童合唱排练、音乐表演、音符跳动",
    "舞蹈": "舞蹈排练、可爱的小朋友跳舞、舞台表演、孩子们跟着节拍欢乐舞动",
    "钢琴": "亚洲儿童钢琴演奏、小手指在琴键上跳跃、音乐流淌、优雅可爱",
    "少儿口才": "中国儿童自信演讲、舞台表演、手势配合、欢乐笑容",
    "英语": "英语课堂互动、中国小朋友开口说英语、趣味教学、外教交流",
    "编程": "小朋友操作电脑、编程界面、可爱机器人演示、科技感",
    "游泳": "泳池训练、教练指导、水花飞溅、亚洲儿童在水中快乐畅游",
    "篮球": "篮球训练、投篮、团队合作、阳光活力的中国儿童",
    "早教": "亲子互动、游戏学习、温馨氛围、孩子笑声、可爱的玩具",
  };

  const styleDescriptions: Record<string, string> = {
    "温馨治愈": "暖色调、柔和光线、舒适氛围、温暖感、欢乐温馨",
    "活泼动感": "明快节奏、跳跃剪辑、青春活力、动感音乐、欢乐跳跃",
    "专业大气": "稳定构图、专业灯光、大气视角、权威感",
    "现代简约": "简洁构图、留白设计、现代感、高级感",
    "青春活力": "明亮色彩、快速剪辑、年轻感、活力四射、欢乐奔跑",
    "优雅知性": "优雅构图、柔和色调、知性氛围、品质感",
    "科技未来": "科技蓝、未来感、科技元素、创新感",
    "卡通动漫": "卡通风格、动漫感、可爱活泼、明快色彩、圆润造型",
    "手绘插画": "手绘质感、插画风格、温馨文艺、艺术感",
  };

  // 通用视频风格要求（针对教培机构，面向家长和孩子）
  const styleRequirements = `
【重要风格要求 - 必须严格遵守】：
1. 【关键】所有出镜人物必须是亚洲/中国儿童面孔！黑头发、黑眼睛、黄皮肤、典型的东方面孔特征！绝对禁止欧美面孔！
2. 儿童形象要可爱、健康、阳光、笑容灿烂
3. 氛围要欢乐、积极向上、温馨亲切
4. 画面明亮、色彩饱和、适合儿童观看
5. 展现快乐学习的场景，让孩子和家长都感到愉悦
6. 注意：这是${duration}秒短视频，画面要精简，不要贪多

【人物外观强制要求】：
- 头发：黑色或深棕色
- 眼睛：黑色或深棕色，典型的东方眼型
- 肤色：健康的黄色/小麦色
- 面部特征：圆润的脸型、典型的亚洲五官
- 如果无法确保亚洲面孔，请使用无人物的纯场景设计
`;

  const sceneTemplates: Record<string, string> = {
    "course_promo": `
${style ? `风格：${style}，${styleDescriptions[style] || ""}` : ""}
生成一段${duration}秒${merchant.category}${subject}课程宣传短视频：
- 机构名称：${merchant.name}
- 核心画面（${duration}秒内完成）：${subjectScenes[subject] || "课堂教学场景、师生互动、欢乐氛围"}
- 教学特色：${merchant.features.slice(0, 2).join("、")}
- 教育理念：${merchant.philosophy || "寓教于乐，快乐成长"}
- 视觉风格：温馨欢乐、${merchant.brandColor ? `品牌色${merchant.brandColor}` : "明亮色彩"}
- 画面要求：高清4K、色彩饱满、构图美观
${customText ? `- 补充要求：${customText}` : ""}
- 结尾信息：联系电话${merchant.phone}
${styleRequirements}
要求：${duration}秒内完成核心画面展示、画面流畅自然、欢乐温馨、吸引家长报名、适合朋友圈和抖音分享
    `,
    "activity_show": `
${style ? `风格：${style}，${styleDescriptions[style] || ""}` : ""}
生成一段${duration}秒${merchant.name}${subject}课堂活动短视频：
- 活动场景（${duration}秒内）：${subjectScenes[subject] || "教室互动、欢乐游戏"}
- 氛围：欢乐、活泼、孩子笑声、积极向上
- 参与者：可爱的亚洲儿童认真参与、老师热情指导
- 机构信息：${merchant.name}
- 视觉风格：欢乐温馨
${customText ? `- 活动主题：${customText}` : ""}
${styleRequirements}
要求：${duration}秒内展示最精彩的课堂瞬间、突出孩子快乐学习的状态、适合朋友圈分享
    `,
    "brand_story": `
${style ? `风格：${style}，${styleDescriptions[style] || ""}` : ""}
生成一段${duration}秒${merchant.name}品牌宣传短视频：
- 核心画面（${duration}秒内）：机构外观、温馨教室、可爱的孩子们
- 品牌标语：${merchant.slogan || "让每个孩子都能发光"}
- 展示重点：机构环境、教学氛围
- 联系电话：${merchant.phone}
${customText ? `- 补充要求：${customText}` : ""}
${styleRequirements}
要求：${duration}秒内完成核心展示、温馨欢乐、适合朋友圈传播
    `,
    "teaching_scene": `
${style ? `风格：${style}，${styleDescriptions[style] || ""}` : ""}
生成一段${duration}秒${merchant.name}${subject}教学场景短视频：
- 核心画面（${duration}秒内）：${subjectScenes[subject] || "课堂教学、欢乐互动"}
- 教学特色：${merchant.features[0] || "小班教学、个性化指导"}
- 画面：老师认真讲解、亚洲儿童专注学习
- 氛围：${merchant.brandStyle || "温馨欢乐"}
${customText ? `- 补充：${customText}` : ""}
${styleRequirements}
要求：${duration}秒内展示最精彩的教学瞬间、欢乐氛围、增强家长信任
    `,
    "student_work": `
${style ? `风格：${style}，${styleDescriptions[style] || ""}` : ""}
生成一段${duration}秒${merchant.name}学员成果展示短视频：
- 核心画面（${duration}秒内）：可爱的亚洲儿童展示作品、自信笑容
- 科目：${subject}
- 展示重点：学员作品、学习成果
- 机构：${merchant.name}
${customText ? `- 补充：${customText}` : ""}
${styleRequirements}
要求：${duration}秒内展示成果亮点、欢乐庆祝氛围、吸引家长报名
    `,
    "environment": `
${style ? `风格：${style}，${styleDescriptions[style] || ""}` : ""}
生成一段${duration}秒${merchant.name}机构环境展示短视频：
- 核心画面（${duration}秒内）：明亮的教室、温馨的前台、儿童休息区
- 风格：${merchant.brandStyle || "温馨明亮"}、干净整洁
- 机构名称：${merchant.name}
- 电话：${merchant.phone}
${customText ? `- 补充：${customText}` : ""}
${styleRequirements}
要求：${duration}秒内展示环境亮点、温馨明亮、增强家长信任
    `,
  };

  return (sceneTemplates[sceneId] || sceneTemplates["course_promo"]).trim();
}

/**
 * 生成数字人/对口型文案
 */
export function generateAvatarScript(
  merchant: MerchantInfo,
  config: SceneConfig
): string {
  const { sceneId, subject, customText } = config;
  
  const sceneScripts: Record<string, string> = {
    "welcome": `
家长朋友们好！欢迎来到${merchant.name}！
我们专注${merchant.category}教育，秉承"${merchant.philosophy || "让每个孩子都能发光"}"的理念。
${merchant.features[0] ? `我们的特色是${merchant.features[0]}。` : ""}
地址：${merchant.city}${merchant.address}，欢迎来电咨询：${merchant.phone}
    `,
    "course_intro": `
想让孩子学好${subject || merchant.subjects[0]}？来${merchant.name}就对了！
我们${merchant.features.length > 0 ? `有${merchant.features[0]}，` : ""}专业的师资团队，科学的教学方法。
让孩子在快乐中学习，在学习中成长！
现在报名更有优惠，电话：${merchant.phone}
    `,
    "promo": `
好消息！${merchant.name}限时特惠活动开始啦！
${customText || "报名${subject || merchant.subjects[0]}课程，立享优惠价格"}
名额有限，先到先得！
地址：${merchant.city}${merchant.address}
咨询热线：${merchant.phone}
    `,
    "tips": `
家长朋友们，今天分享一个关于${subject || merchant.subjects[0]}学习的小知识。
${customText || "坚持练习是进步的关键，每天花15分钟，效果看得见！"}
${merchant.name}，陪伴孩子每一步成长。
咨询热线：${merchant.phone}
    `,
    "festival": `
${customText || "祝大家节日快乐！"}
${merchant.name}祝所有家长和小朋友们节日快乐，阖家幸福！
我们的${merchant.subjects[0]}课程持续招生中，欢迎咨询：${merchant.phone}
    `,
  };

  return (sceneScripts[sceneId] || sceneScripts["welcome"]).trim();
}

/**
 * 根据机构名称智能推断科目
 */
export function inferSubjectsFromName(name: string): string[] {
  const keywords: Record<string, string[]> = {
    "艺术": ["美术绘画", "书法"],
    "美术": ["美术绘画", "书法"],
    "音乐": ["音乐", "钢琴", "声乐"],
    "钢琴": ["钢琴"],
    "舞蹈": ["舞蹈"],
    "口才": ["少儿口才"],
    "英语": ["英语"],
    "编程": ["少儿编程", "机器人"],
    "机器人": ["机器人", "少儿编程"],
    "游泳": ["游泳"],
    "篮球": ["篮球"],
    "跆拳道": ["跆拳道"],
    "早教": ["早教", "亲子课程"],
    "作文": ["作文写作"],
    "数学": ["数学"],
    "国学": ["书法", "国学"],
  };

  for (const [keyword, subjects] of Object.entries(keywords)) {
    if (name.includes(keyword)) {
      return subjects;
    }
  }
  
  return ["综合课程"];
}

/**
 * 获取科目推荐的目标年龄段
 */
export function getTargetAgeBySubject(subject: string): string {
  const ageMap: Record<string, string> = {
    "早教": "0-3岁",
    "亲子课程": "0-3岁",
    "少儿口才": "4-12岁",
    "少儿编程": "6-15岁",
    "美术绘画": "4-15岁",
    "舞蹈": "4-15岁",
    "钢琴": "5-15岁",
    "英语": "3-15岁",
    "游泳": "4岁以上",
    "篮球": "6-15岁",
    "跆拳道": "5-15岁",
    "作文写作": "7-15岁",
    "数学": "6-18岁",
  };
  
  return ageMap[subject] || "4-15岁";
}
