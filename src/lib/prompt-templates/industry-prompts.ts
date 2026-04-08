/**
 * 行业专属提示词模板
 * 根据不同行业生成精准的话术和内容
 */

// 行业分类及其特性
export const INDUSTRY_CONFIGS: Record<string, {
  name: string;
  keywords: string[];
  tone: string;
  targetAudience: string;
  painPoints: string[];
  sellingPoints: string[];
  visualStyle: string[];
  examplePhrases: string[];
}> = {
  // 艺术培训类
  art: {
    name: "艺术培训",
    keywords: ["创意", "审美", "表达", "想象力", "艺术素养"],
    tone: "优雅、启发性、温暖",
    targetAudience: "注重孩子全面发展的家长",
    painPoints: ["孩子缺乏创造力", "只会模仿不会创作", "艺术启蒙难"],
    sellingPoints: ["培养审美能力", "激发创造力", "专业艺术导师", "小班教学"],
    visualStyle: ["水彩风格", "卡通可爱", "文艺清新", "色彩丰富"],
    examplePhrases: [
      "让艺术成为孩子一生的朋友",
      "每个孩子都是天生的艺术家",
      "用画笔描绘多彩童年",
      "艺术启蒙，从心开始"
    ]
  },
  
  dance: {
    name: "舞蹈培训",
    keywords: ["气质", "体态", "自信", "优雅", "协调性"],
    tone: "优雅、励志、活力",
    targetAudience: "希望孩子气质出众的家长",
    painPoints: ["孩子驼背含胸", "缺乏自信", "肢体不协调"],
    sellingPoints: ["矫正体态", "提升气质", "增强自信", "舞台展示"],
    visualStyle: ["动态飘逸", "唯美优雅", "青春活力", "舞台灯光"],
    examplePhrases: [
      "舞出自信，蹈出精彩",
      "气质从小培养，优雅一生相伴",
      "让每个孩子都是舞台上的主角",
      "用舞蹈点亮童年"
    ]
  },
  
  music: {
    name: "音乐培训",
    keywords: ["素养", "专注力", "情感表达", "艺术熏陶", "创造力"],
    tone: "专业、优雅、感性",
    targetAudience: "重视艺术修养的家长",
    painPoints: ["孩子坐不住", "缺乏艺术熏陶", "想学不知从何开始"],
    sellingPoints: ["专业考级", "培养专注力", "提升艺术修养", "名师指导"],
    visualStyle: ["古典优雅", "现代简约", "温馨氛围", "专业录音棚"],
    examplePhrases: [
      "音乐是心灵的语言",
      "让音符陪伴成长",
      "从零基础到舞台之星",
      "每一个音符都是梦想的种子"
    ]
  },
  
  // 体育培训类
  sports: {
    name: "体育培训",
    keywords: ["健康", "坚韧", "团队", "自信", "体魄"],
    tone: "活力、励志、阳光",
    targetAudience: "关注孩子身心健康的家长",
    painPoints: ["孩子体质弱", "沉迷电子产品", "缺乏运动习惯"],
    sellingPoints: ["增强体质", "培养毅力", "团队精神", "专业教练"],
    visualStyle: ["动感活力", "阳光户外", "专业场馆", "运动元素"],
    examplePhrases: [
      "强健体魄，从现在开始",
      "运动是最好的教育",
      "让孩子爱上运动",
      "拼搏中成长，汗水中绽放"
    ]
  },
  
  swimming: {
    name: "游泳培训",
    keywords: ["安全", "生存技能", "健康", "自信", "全身运动"],
    tone: "安全、专业、阳光",
    targetAudience: "重视安全教育和健康的家长",
    painPoints: ["怕水", "缺乏安全意识", "想学找不到好教练"],
    sellingPoints: ["专业救生员", "小班教学", "恒温泳池", "安全第一"],
    visualStyle: ["清爽蓝色", "水中动感", "安全温馨", "专业泳池"],
    examplePhrases: [
      "学会游泳，终身受益",
      "安全戏水，快乐成长",
      "专业的游泳培训，守护孩子的水上安全",
      "让孩子在水中自由畅游"
    ]
  },
  
  martial_arts: {
    name: "武术/跆拳道",
    keywords: ["强身", "防身", "礼仪", "意志力", "传统文化"],
    tone: "正气、励志、传统",
    targetAudience: "希望孩子坚强自信的家长",
    painPoints: ["孩子胆小懦弱", "缺乏纪律意识", "身体素质差"],
    sellingPoints: ["强身健体", "防身自卫", "培养意志", "礼仪教育"],
    visualStyle: ["传统武术风", "正气凛然", "动感力量", "道馆氛围"],
    examplePhrases: [
      "习武修身，强国有我",
      "以武会友，以德服人",
      "练出精气神，武出中华魂",
      "文武双全，德才兼备"
    ]
  },
  
  // 科技培训类
  programming: {
    name: "编程培训",
    keywords: ["逻辑思维", "创造力", "未来竞争力", "解决问题", "人工智能"],
    tone: "科技感、专业、前沿",
    targetAudience: "重视未来竞争力的家长",
    painPoints: ["孩子沉迷游戏", "逻辑思维差", "对编程感兴趣但不知如何开始"],
    sellingPoints: ["培养逻辑思维", "游戏化学习", "竞赛辅导", "项目实战"],
    visualStyle: ["科技感", "代码元素", "机器人", "未来感"],
    examplePhrases: [
      "编程，给孩子面向未来的能力",
      "从游戏玩家到游戏创造者",
      "用代码改变世界",
      "逻辑思维，从编程开始"
    ]
  },
  
  robotics: {
    name: "机器人培训",
    keywords: ["动手能力", "创新思维", "STEM", "工程思维", "团队协作"],
    tone: "科技、创新、有趣",
    targetAudience: "重视动手能力和创新思维的家长",
    painPoints: ["孩子动手能力差", "缺乏创新思维", "对科学感兴趣"],
    sellingPoints: ["动手实践", "创新思维", "竞赛平台", "项目制学习"],
    visualStyle: ["机器人元素", "科技实验室", "创客空间", "未来科技"],
    examplePhrases: [
      "亲手创造，未来无限",
      "机器人，开启科技之门",
      "动手动脑，创新未来",
      "让孩子成为小小发明家"
    ]
  },
  
  // 学科辅导类
  english: {
    name: "英语培训",
    keywords: ["国际视野", "沟通能力", "口语", "应试", "兴趣培养"],
    tone: "国际化、专业、活泼",
    targetAudience: "重视英语能力的家长",
    painPoints: ["哑巴英语", "单词记不住", "缺乏语言环境"],
    sellingPoints: ["外教口语", "沉浸式教学", "趣味学习", "提分保障"],
    visualStyle: ["国际化元素", "活泼可爱", "英语字母", "对话气泡"],
    examplePhrases: [
      "让英语成为孩子的第二母语",
      "Speak out, Stand out!",
      "从不敢开口到自信表达",
      "英语启蒙，快乐起步"
    ]
  },
  
  // 早教幼教类
  early_education: {
    name: "早教/幼教",
    keywords: ["启蒙", "潜能开发", "亲子", "社交能力", "习惯养成"],
    tone: "温馨、专业、关爱",
    targetAudience: "0-6岁孩子的家长",
    painPoints: ["不知如何早教", "孩子不合群", "习惯培养难"],
    sellingPoints: ["科学育儿", "亲子互动", "专业师资", "潜能开发"],
    visualStyle: ["温馨可爱", "亲子元素", "卡通动物", "柔和色彩"],
    examplePhrases: [
      "启蒙童年，点亮未来",
      "陪伴是最好的教育",
      "每个宝宝都是潜力股",
      "科学早教，赢在起点"
    ]
  },
  
  // 其他
  other: {
    name: "综合培训",
    keywords: ["成长", "进步", "专业", "用心", "成果"],
    tone: "专业、真诚、可靠",
    targetAudience: "追求孩子全面发展的家长",
    painPoints: ["学习效率低", "缺乏兴趣", "找不到好机构"],
    sellingPoints: ["专业师资", "个性化教学", "成果显著", "用心服务"],
    visualStyle: ["专业大气", "温馨教育", "成长元素", "成功案例"],
    examplePhrases: [
      "用心教育，静待花开",
      "每个孩子都值得被认真对待",
      "专业的事交给专业的人",
      "让进步看得见"
    ]
  }
};

// 根据行业获取配置
export function getIndustryConfig(industry: string): typeof INDUSTRY_CONFIGS.art {
  // 尝试精确匹配
  if (INDUSTRY_CONFIGS[industry]) {
    return INDUSTRY_CONFIGS[industry];
  }
  
  // 尝试模糊匹配
  const lowerIndustry = industry.toLowerCase();
  for (const [key, config] of Object.entries(INDUSTRY_CONFIGS)) {
    if (config.name.includes(industry) || 
        lowerIndustry.includes(key) ||
        key.includes(lowerIndustry)) {
      return config;
    }
  }
  
  // 返回默认配置
  return INDUSTRY_CONFIGS.other;
}

// 生成行业专属的系统提示词补充
export function generateIndustryPrompt(industry: string, subject?: string): string {
  const config = getIndustryConfig(industry);
  
  let prompt = `\n\n## 行业专属知识 - ${config.name}\n\n`;
  prompt += `### 核心关键词\n${config.keywords.join("、")}\n\n`;
  prompt += `### 话术风格\n${config.tone}\n\n`;
  prompt += `### 目标受众\n${config.targetAudience}\n\n`;
  prompt += `### 用户痛点\n${config.painPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n`;
  prompt += `### 核心卖点\n${config.sellingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n`;
  prompt += `### 视觉风格建议\n${config.visualStyle.join("、")}\n\n`;
  prompt += `### 优秀文案示例\n${config.examplePhrases.map((p, i) => `${i + 1}. "${p}"`).join("\n")}\n\n`;
  
  if (subject) {
    prompt += `### 当前科目：${subject}\n\n`;
    prompt += `请结合${config.name}行业特点和${subject}课程特性，生成精准的内容。\n`;
  }
  
  return prompt;
}

// 生成图片提示词增强模板
export function enhanceImagePrompt(
  description: string,
  industry: string,
  style?: string
): string {
  const config = getIndustryConfig(industry);
  
  // 构建增强后的提示词
  const styleGuide = style || config.visualStyle[0];
  const keywords = config.keywords.slice(0, 3).join("、");
  
  return `${description}。风格要求：${styleGuide}，体现${keywords}的氛围。画面要温馨、专业、有吸引力，适合教育培训行业使用。避免出现外国人面孔，人物应该是亚洲人形象。`;
}

// 生成文案增强模板
export function enhanceCopywritingPrompt(
  type: string,
  industry: string,
  subject?: string
): string {
  const config = getIndustryConfig(industry);
  
  let prompt = `\n\n### 文案创作指南\n\n`;
  prompt += `**行业特点**：${config.name}\n`;
  prompt += `**话术风格**：${config.tone}\n`;
  prompt += `**目标受众**：${config.targetAudience}\n\n`;
  
  prompt += `**必须包含的要素**：\n`;
  prompt += `1. 痛点共鸣：直击家长关心的${config.painPoints[0]}问题\n`;
  prompt += `2. 解决方案：突出${config.sellingPoints[0]}的优势\n`;
  prompt += `3. 行动召唤：明确告诉家长下一步该做什么\n\n`;
  
  prompt += `**参考话术**：\n`;
  config.examplePhrases.forEach(phrase => {
    prompt += `- ${phrase}\n`;
  });
  
  if (subject) {
    prompt += `\n**科目关联**：文案要自然融入${subject}相关内容，让家长感受到专业性和针对性。\n`;
  }
  
  return prompt;
}
