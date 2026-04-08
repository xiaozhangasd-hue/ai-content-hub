/**
 * 朋友圈素材模板库 - 根据不同科目生成专属内容
 */

// 科目配置
export const SUBJECT_CONFIG = {
  // 艺术培训
  "美术绘画": {
    emoji: "🎨",
    color: "bg-pink-100 text-pink-700 border-pink-200",
    keywords: ["绘画", "美术", "画画", "色彩", "创意"],
    benefits: ["培养审美能力", "提升创造力", "锻炼专注力", "情感表达"],
    skills: ["线条练习", "色彩搭配", "构图技巧", "创意表现"],
  },
  "书法": {
    emoji: "✍️",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    keywords: ["书法", "毛笔", "写字", "国风", "传统文化"],
    benefits: ["修身养性", "提升专注力", "传承文化", "培养气质"],
    skills: ["握笔姿势", "笔画练习", "结构布局", "章法创作"],
  },
  "舞蹈": {
    emoji: "💃",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    keywords: ["舞蹈", "跳舞", "形体", "舞台", "优美"],
    benefits: ["塑造形体", "提升气质", "增强自信", "锻炼身体"],
    skills: ["基本功", "舞步练习", "节奏感", "舞台表现"],
  },
  "钢琴": {
    emoji: "🎹",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    keywords: ["钢琴", "琴键", "音乐", "演奏", "优雅"],
    benefits: ["培养乐感", "开发智力", "提升专注", "陶冶情操"],
    skills: ["指法练习", "乐理知识", "曲目演奏", "音乐表达"],
  },
  "古筝": {
    emoji: "🎵",
    color: "bg-red-100 text-red-700 border-red-200",
    keywords: ["古筝", "国乐", "传统", "优雅", "古典"],
    benefits: ["传承国乐", "培养气质", "修身养性", "艺术修养"],
    skills: ["指法技巧", "曲目学习", "音乐表现", "舞台演奏"],
  },
  "吉他": {
    emoji: "🎸",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    keywords: ["吉他", "弹唱", "音乐", "青春", "活力"],
    benefits: ["培养兴趣", "展现自我", "社交能力", "音乐素养"],
    skills: ["和弦练习", "弹唱技巧", "节奏掌握", "曲目演奏"],
  },
  "声乐": {
    emoji: "🎤",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    keywords: ["声乐", "唱歌", "演唱", "声音", "舞台"],
    benefits: ["提升自信", "表达情感", "气息训练", "舞台表现"],
    skills: ["气息控制", "音准训练", "情感表达", "舞台表演"],
  },

  // 语言培训
  "少儿口才": {
    emoji: "🎙️",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    keywords: ["口才", "演讲", "表达", "自信", "舞台"],
    benefits: ["提升自信", "表达清晰", "逻辑思维", "社交能力"],
    skills: ["发音训练", "朗诵技巧", "演讲表达", "舞台展示"],
  },
  "英语": {
    emoji: "🔤",
    color: "bg-sky-100 text-sky-700 border-sky-200",
    keywords: ["英语", "口语", "外教", "国际", "交流"],
    benefits: ["语言能力", "国际视野", "思维能力", "交流沟通"],
    skills: ["口语发音", "单词记忆", "阅读理解", "英语表达"],
  },
  "作文写作": {
    emoji: "📝",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    keywords: ["作文", "写作", "阅读", "表达", "文学"],
    benefits: ["提升表达", "逻辑思维", "想象力", "文学素养"],
    skills: ["素材积累", "结构布局", "语言表达", "创意写作"],
  },

  // 运动培训
  "游泳": {
    emoji: "🏊",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    keywords: ["游泳", "泳池", "健身", "自救", "水上"],
    benefits: ["强身健体", "自救技能", "增强体质", "塑形瘦身"],
    skills: ["水性适应", "泳姿学习", "速度提升", "耐力训练"],
  },
  "篮球": {
    emoji: "🏀",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    keywords: ["篮球", "运动", "团队", "活力", "阳光"],
    benefits: ["强身健体", "团队协作", "反应能力", "竞争意识"],
    skills: ["运球技巧", "投篮练习", "团队配合", "战术理解"],
  },
  "跆拳道": {
    emoji: "🥋",
    color: "bg-red-100 text-red-700 border-red-200",
    keywords: ["跆拳道", "武术", "精神", "礼仪", "强身"],
    benefits: ["强身健体", "防身技能", "意志品质", "礼仪修养"],
    skills: ["基本动作", "品势练习", "实战技巧", "精神修养"],
  },
  "武术": {
    emoji: "🥋",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    keywords: ["武术", "功夫", "传统文化", "精神", "强身"],
    benefits: ["强身健体", "传承文化", "意志品质", "防身技能"],
    skills: ["基本功", "套路练习", "实战技巧", "精神修养"],
  },

  // 科技培训
  "少儿编程": {
    emoji: "💻",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    keywords: ["编程", "逻辑", "思维", "未来", "科技"],
    benefits: ["逻辑思维", "创造力", "解决问题", "未来竞争力"],
    skills: ["编程思维", "代码基础", "项目实践", "创新创作"],
  },
  "机器人": {
    emoji: "🤖",
    color: "bg-teal-100 text-teal-700 border-teal-200",
    keywords: ["机器人", "科技", "创新", "动手", "智能"],
    benefits: ["动手能力", "创新思维", "科技素养", "团队协作"],
    skills: ["结构搭建", "编程控制", "创意设计", "团队协作"],
  },

  // 早教托育
  "早教": {
    emoji: "👶",
    color: "bg-pink-100 text-pink-700 border-pink-200",
    keywords: ["早教", "启蒙", "亲子", "成长", "陪伴"],
    benefits: ["启蒙开发", "亲子互动", "社交能力", "习惯养成"],
    skills: ["感官训练", "认知发展", "语言启蒙", "社交互动"],
  },

  // 默认
  "default": {
    emoji: "📚",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    keywords: ["教育", "成长", "学习", "进步"],
    benefits: ["全面发展", "快乐成长", "能力提升", "兴趣培养"],
    skills: ["基础学习", "能力培养", "实践应用", "持续进步"],
  },
};

// 根据科目生成素材
export function generateMomentsForSubject(subject: string): MomentContent[] {
  const config = SUBJECT_CONFIG[subject as keyof typeof SUBJECT_CONFIG] || SUBJECT_CONFIG.default;
  
  return [
    // ========== 教育知识类 ==========
    {
      id: `${subject}-edu-1`,
      category: "教育知识",
      title: `孩子学${subject}的黄金期`,
      summary: `抓住孩子学习${subject}的最佳时期，事半功倍`,
      content: `${config.emoji} 孩子学${subject}的黄金期，家长千万别错过！

科学研究证明：每个年龄段都有最适合学习的内容。

【${subject}最佳学习期】
📌 3-5岁：启蒙阶段，培养兴趣
📌 5-8岁：黄金阶段，快速进步
📌 8-12岁：提升阶段，深度学习

【为什么要抓住黄金期？】
✅ 学习效率最高
✅ 兴趣最容易培养
✅ 效果最显著
✅ 基础最牢固

【错过会怎样？】
⚠️ 学习效率下降
⚠️ 需要更多时间弥补
⚠️ 可能错过最佳窗口期

💡 建议：如果孩子到了适合的年龄，一定要抓住机会！

${config.benefits.map((b, i) => `学习${subject}能够${b}`).join("、")}。

#${subject}学习 #黄金期 #儿童教育`,
      tags: `${subject},黄金期,教育`,
    },
    {
      id: `${subject}-edu-2`,
      category: "教育知识",
      title: `学${subject}的${config.benefits.length}大好处`,
      summary: `${config.benefits.join("、")}，让孩子全面发展`,
      content: `${config.emoji} 学${subject}对孩子有什么好处？

很多家长问：为什么要让孩子学${subject}？

【${config.benefits.length}大核心好处】

${config.benefits.map((b, i) => `${i + 1}️⃣ ${b}
通过${subject}学习，孩子在这方面会得到明显提升`).join("\n\n")}

【真实案例】
我们很多学员学了${subject}后：
✅ 变得更加自信
✅ 专注力明显提升
✅ 表达能力增强
✅ 综合素质全面提高

【家长评价】
"孩子学了${subject}后，整个人都不一样了，更阳光自信了！"

💡 选择适合孩子的${subject}课程，让成长看得见！

#${subject}教育 #儿童成长 #素质教育`,
      tags: `${subject},好处,成长`,
    },
    {
      id: `${subject}-edu-3`,
      category: "教育知识",
      title: `如何判断孩子适不适合学${subject}`,
      summary: `${config.keywords.join("、")}，这些信号说明孩子有潜力`,
      content: `${config.emoji} 怎么判断孩子适不适合学${subject}？

很多家长担心：我家孩子能学会吗？有天赋吗？

其实，每个孩子都有潜力，关键是发现和培养！

【${config.keywords.length}个信号，说明孩子有潜力】

${config.keywords.slice(0, 5).map((k, i) => `✅ 信号${i + 1}：对${k}感兴趣
孩子看到相关内容会特别关注`).join("\n\n")}

【家长该怎么办？】
📌 观察孩子的兴趣
📌 带孩子免费体验
📌 让专业老师评估
📌 给孩子选择的权利

【我们的建议】
不要过早下定论，让孩子先试试！
很多时候，孩子的潜力超乎想象。

带孩子来免费体验一下，让专业老师帮您评估~

#${subject}天赋 #潜力开发 #家长必读`,
      tags: `${subject},天赋,潜力`,
    },
    {
      id: `${subject}-edu-4`,
      category: "教育知识",
      title: `学${subject}会影响学习吗`,
      summary: "合理安排时间，学习特长两不误",
      content: `${config.emoji} 学${subject}会影响学习吗？

这是很多家长的顾虑。答案是：恰恰相反！

【数据说话】
📊 学习${subject}的孩子，成绩反而更好
📊 时间管理能力更强
📊 专注力明显提升

【为什么反而更好？】

⏰ 时间管理
孩子要在有限时间内完成学习+${subject}练习
→ 被迫学会高效利用时间
→ 学习效率反而提高

🎯 专注力提升
${subject}学习需要高度专注
→ 形成了专注的习惯
→ 学习时也更容易集中注意力

💪 自信心的建立
在${subject}学习中获得的成就感
→ 激发了学习动力
→ 对自己更有信心

【关键在于方法】
✅ 合理安排时间
✅ 家长支持鼓励
✅ 找到靠谱的机构

#${subject}学习 #学业成绩 #时间管理`,
      tags: `${subject},学习,影响`,
    },
    {
      id: `${subject}-edu-5`,
      category: "教育知识",
      title: `${subject}学习的${config.skills.length}个阶段`,
      summary: `${config.skills.join(" → ")}，循序渐进才能学好`,
      content: `${config.emoji} ${subject}学习的正确路径

学${subject}不是一蹴而就的，需要循序渐进！

【学习阶段】

${config.skills.map((s, i) => `📌 第${i + 1}阶段：${s}
${i === 0 ? "打好基础最重要" : i === config.skills.length - 1 ? "综合运用，展现成果" : "持续进步，稳步提升"}`).join("\n\n")}

【每个阶段多长时间？】
✅ 入门阶段：1-3个月
✅ 提升阶段：3-6个月
✅ 进阶阶段：6-12个月
✅ 精通阶段：持续学习

【给家长的建议】
不要急于求成，让孩子稳扎稳打
每个阶段都要打好基础
坚持比速度更重要

【我们的教学】
系统化的课程体系
循序渐进的教学方法
让每个孩子都能学有所成

#${subject}学习 #循序渐进 #教学方法`,
      tags: `${subject},阶段,学习`,
    },

    // ========== 学员案例类 ==========
    {
      id: `${subject}-case-1`,
      category: "学员案例",
      title: `从零基础到自信展示`,
      summary: `看看这位学员学习${subject}的变化`,
      content: `${config.emoji} 学员蜕变故事

XX小朋友，${subject}学习前后对比：

【学习前】
😔 不敢在众人面前表现
😔 缺乏自信
😔 ${config.benefits[config.benefits.length - 1] || "能力"}有待提升

【学习3个月后】
😊 变得自信开朗
😊 敢于展示自己
😊 ${config.skills[0]}进步明显
😊 家人都说变化大

【妈妈的话】
"孩子学了${subject}后，整个人都不一样了！以前内向不爱说话，现在自信多了。老师教得真好！"

【老师点评】
每个孩子都是潜力股！
只要方法对，坚持学，就能看到变化。

💪 给孩子一个机会，让他们发光！

#${subject}案例 #学员成长 #蜕变`,
      tags: `${subject},案例,蜕变`,
    },
    {
      id: `${subject}-case-2`,
      category: "学员案例",
      title: `学员获奖喜报`,
      summary: `祝贺XX同学在${subject}比赛中获奖`,
      content: `🏆 喜报！热烈祝贺XX同学获得${subject}比赛一等奖！

【获奖详情】
🏅 比赛：XX${subject}大赛
🏅 组别：X组
🏅 奖项：一等奖
🏅 学习时长：X年

【获奖感言】
"谢谢老师一直以来的指导！刚开始觉得好难，但老师很耐心，一点点教我。现在我能站在舞台上展示自己了！"

【老师寄语】
从第一次上台紧张到发抖，到现在自信展示，这个成长过程是最珍贵的。一等奖是努力的结果，但更珍贵的是孩子收获了自信和勇气！

【给家长的话】
每个孩子都有无限可能，给他们机会，他们会给你惊喜！

👏 为所有努力的孩子点赞！

#${subject}获奖 #学员风采 #喜报`,
      tags: `${subject},获奖,喜报`,
    },
    {
      id: `${subject}-case-3`,
      category: "学员案例",
      title: `学员日常练习`,
      summary: `坚持练习是进步的关键`,
      content: `${config.emoji} 今日练习打卡

XX小朋友的${subject}日常练习 👇

从刚开始的：
❌ ${config.skills[0]}不熟练
❌ 容易出错
❌ 不太自信

到现在的：
✅ ${config.skills[0]}标准流畅
✅ 越来越熟练
✅ 充满自信

【家长心语】
"每天进步一点点，坚持下去，真的能看到变化。"

【老师点评】
坚持就是胜利！每一天的练习都在积累，量变终会带来质变。

💪 每一个认真练习的孩子，都值得被记录。

你们家的宝贝今天练习了吗？

#${subject}练习 #打卡 #坚持`,
      tags: `${subject},练习,打卡`,
    },
    {
      id: `${subject}-case-4`,
      category: "学员案例",
      title: `老学员续费了`,
      summary: "家长的信任是最好的认可",
      content: `💝 今天收到了一份特别的信任

XX妈妈给孩子续费了${subject}课程。

【为什么续费？】

家长的原话：
"孩子在这里学了一年，变化真的很大。老师很负责，教得也好，孩子特别喜欢来上课。"

【我们做到了】

✅ 真正关注每个孩子
不是流水线式教学，而是因材施教

✅ 及时沟通反馈
让家长知道孩子学了什么、进步在哪里

✅ 用心教学
每一节课都认真对待

✅ 长期陪伴
不是教完就完，而是陪伴孩子成长

【感谢所有家长的信任】
孩子的成长，是我们最大的动力。

#${subject}续费 #家长信任 #用心教学`,
      tags: `${subject},续费,信任`,
    },

    // ========== 课堂花絮类 ==========
    {
      id: `${subject}-class-1`,
      category: "课堂花絮",
      title: `今日${subject}课堂`,
      summary: `看孩子们认真学习的样子`,
      content: `${config.emoji} 今日${subject}课堂小花絮

看，孩子们专注的样子多可爱！💕

今天教的是${config.skills[0]}，大家学得可认真了：
👶 XX虽然刚来不久，但已经很努力了
👶 XX今天是第一次来，表现超棒
👶 XX上周有点小问题，这周完全掌握了

【课堂亮点】
✨ 今天全员完成教学目标
✨ 孩子们互相帮助，一起进步
✨ 几个小朋友还不想下课呢

【老师心里话】
看着孩子们一点点进步，真的很有成就感。
每一个孩子的成长，都值得被记录。

💕 想让孩子也加入吗？
私信我了解课程详情~

#${subject}课堂 #日常记录 #专注的样子`,
      tags: `${subject},课堂,日常`,
    },
    {
      id: `${subject}-class-2`,
      category: "课堂花絮",
      title: `老师手把手教学`,
      summary: "专业细致的教学方式",
      content: `${config.emoji} 一个动作，老师教了5遍

今天的${subject}课上，有个小朋友一直做不好一个动作。

老师没有着急，而是：
✅ 一遍遍示范
✅ 手把手纠正
✅ 耐心讲解要领
✅ 鼓励再试一次

第5次，孩子终于做对了！
那一刻，孩子开心得跳了起来！

【我们的教学理念】
不放弃任何一个孩子
每个孩子的进度不同，但都会学会

【家长评价】
"老师真的很有耐心，怪不得孩子喜欢来这里！"

💕 这就是我们，用心教好每一节课。

#${subject}教学 #耐心指导 #用心`,
      tags: `${subject},教学,耐心`,
    },
    {
      id: `${subject}-class-3`,
      category: "课堂花絮",
      title: `新学员第一节课`,
      summary: `欢迎新朋友加入${subject}大家庭`,
      content: `${config.emoji} 今天来了一个新朋友

XX小朋友今天第一次来上${subject}课。

【上课前】
🥺 有点紧张，拉着妈妈不放手
🥺 不敢跟老师打招呼

【上课后】
😊 主动跟老师说再见
😊 问妈妈"下次什么时候来"
😊 还交到了新朋友

【妈妈说】
"本来担心孩子不适应，没想到这么喜欢！老师您们真有办法。"

【我们是这样做的】
✅ 热情欢迎，让孩子感受到温暖
✅ 循序渐进，不给孩子压力
✅ 及时鼓励，增强孩子信心

💕 每一个新朋友，我们都会用心对待。

#${subject}体验 #新学员 #欢迎`,
      tags: `${subject},新学员,体验`,
    },

    // ========== 招生信息类 ==========
    {
      id: `${subject}-recruit-1`,
      category: "招生信息",
      title: `${subject}课程招生中`,
      summary: `${subject}课程火热报名，欢迎体验`,
      content: `${config.emoji} ${subject}课程招生啦！

【招生对象】
👧 对${subject}感兴趣的孩子

【课程内容】
📚 ${config.skills.join("、")}
循序渐进，系统学习

【课程安排】
📅 周末班：周六/周日
📅 平时班：周一至周五晚上

【报名福利】
🎁 免费试听一节课
🎁 前XX名报名享优惠
🎁 报名即送教材礼包

【为什么选择我们？】
✅ 专业师资团队
✅ 系统化教学体系
✅ 小班教学，关注每个孩子
✅ 家长好评如潮

📞 咨询热线：XXXXXXXXXXX
📍 地址：XXXXXXXXXXX

名额有限，欢迎预约试听！

#${subject}招生 #报名 #限时优惠`,
      tags: `${subject},招生,报名`,
    },
    {
      id: `${subject}-recruit-2`,
      category: "招生信息",
      title: `${subject}免费体验课`,
      summary: "先体验再报名，让孩子自己做选择",
      content: `${config.emoji} ${subject}免费体验课预约中！

【为什么先试听？】
✅ 让孩子体验${subject}课程
✅ 感受老师的教学风格
✅ 了解我们的教学环境
✅ 再决定是否报名

【试听内容】
📌 一节正式课（非推销）
📌 老师评估孩子基础
📌 给出学习建议

【体验后家长说】
"本来不确定孩子喜不喜欢，试听后孩子主动说想学！"
"老师很专业，教得很好，孩子很喜欢。"

【预约方式】
📞 电话：XXXXXXXXXXX
💬 微信：XXXXXXXXXXX
📍 地址：XXXXXXXXXXX

💕 欢迎来免费体验！

#${subject}试听 #免费体验 #先试后报`,
      tags: `${subject},试听,免费`,
    },
    {
      id: `${subject}-recruit-3`,
      category: "招生信息",
      title: `${subject}暑期集训营`,
      summary: "暑假不虚度，来学${subject}吧",
      content: `☀️ ${subject}暑期集训营开始招募！

【集训时间】
📅 第一期：X月X日-X月X日
📅 第二期：X月X日-X月X日

【课程特色】
✅ 系统化学习${subject}
✅ ${config.skills.slice(0, 2).join("、")}
✅ 小班教学，效果更好
✅ 结业展示，见证成长

【报名福利】
🎁 早鸟价：立减XXX元
🎁 团报优惠：X人团报再减XXX元
🎁 赠送：教材+练习材料

【适合人群】
👧 想利用暑假学${subject}的孩子
👧 平时没时间，想集中学习的孩子

📞 咨询热线：XXXXXXXXXXX

名额有限，预报从速！

#${subject}暑假 #集训营 #学习`,
      tags: `${subject},暑假,集训`,
    },
    {
      id: `${subject}-recruit-4`,
      category: "招生信息",
      title: `${subject}老带新活动`,
      summary: "推荐好友报名，双方都有礼",
      content: `🎁 ${subject}老带新，福利来啦！

【活动内容】
老学员推荐新学员报名${subject}：
✅ 老学员：获得XX元学费抵扣
✅ 新学员：获得XX元报名优惠

【参与方式】
1. 老学员推荐朋友来体验
2. 朋友成功报名${subject}课程
3. 双方获得优惠

【活动时间】
即日起至XX月XX日

【温馨提示】
推荐人数不限，上不封顶！
推荐越多，优惠越多！

💕 感谢您的信任和推荐！

#${subject}老带新 #推荐有礼 #福利`,
      tags: `${subject},老带新,推荐`,
    },

    // ========== 节日祝福类 ==========
    {
      id: `${subject}-holiday-1`,
      category: "节日祝福",
      title: "六一儿童节快乐",
      summary: `祝所有学${subject}的小朋友节日快乐`,
      content: `${config.emoji} 六一儿童节快乐！

祝所有学${subject}的小朋友：
🎈 节日快乐，开心成长
🎈 ${config.benefits[0]}，越来越好
🎈 坚持学习，收获满满

感谢所有家长的支持和陪伴！
感谢所有老师的用心付出！

【今天孩子们最开心】
希望每一个孩子都能被爱包围
希望每一个童年都闪闪发光

💖 祝所有小朋友：
儿童节快乐！天天快乐！

#${subject}祝福 #儿童节 #快乐成长`,
      tags: `${subject},儿童节,祝福`,
    },
    {
      id: `${subject}-holiday-2`,
      category: "节日祝福",
      title: "新年快乐",
      summary: "新年祝福，感谢一路陪伴",
      content: `${config.emoji} 新年快乐！

感谢各位家长一年来的信任与支持！

【回望过去一年】
✨ 孩子们在${subject}上进步了很多
✨ ${config.skills.slice(0, 2).join("、")}都有了明显提升
✨ 很多孩子变得自信了
✨ 收获了满满的成长

【展望新的一年】
💪 继续用心教学
💪 陪伴孩子成长
💪 让每个孩子都能发光

【新年祝福】
愿孩子们：
🌟 ${subject}越学越好
🌟 快乐成长，天天开心

XX${subject}中心全体老师
恭祝大家新年快乐！

#${subject}祝福 #新年快乐 #感恩`,
      tags: `${subject},新年,祝福`,
    },
    {
      id: `${subject}-holiday-3`,
      category: "节日祝福",
      title: "母亲节快乐",
      summary: "感恩每一位伟大的妈妈",
      content: `💐 母亲节快乐！

感谢每一位默默付出的妈妈：
✨ 风里雨里接送孩子学${subject}
✨ 陪伴孩子练习${config.skills[0]}
✨ 给予无限支持和鼓励

【孩子们的礼物】
让妈妈看到自己在${subject}上的进步，就是最好的礼物！

【我们想说】
每一个坚持送孩子来学${subject}的妈妈，都是伟大的妈妈！
孩子的成长，有您的一半功劳！

💕 祝所有妈妈：
节日快乐，永远年轻美丽！

#${subject}祝福 #母亲节 #感恩`,
      tags: `${subject},母亲节,感恩`,
    },

    // ========== 机构宣传类 ==========
    {
      id: `${subject}-promo-1`,
      category: "机构宣传",
      title: `为什么选择我们学${subject}`,
      summary: "专业师资、完善体系、用心服务",
      content: `${config.emoji} 为什么选择我们学${subject}？

【专业师资】
✅ ${subject}专业出身
✅ 多年教学经验
✅ 懂孩子，会教学

【完善体系】
✅ 系统化${subject}课程
✅ ${config.skills.join(" → ")}
✅ 循序渐进，稳步提升

【用心服务】
✅ 免费试听体验
✅ 小班教学，关注每个孩子
✅ 及时反馈，家校沟通

【学员成果】
🏆 很多学员在${subject}比赛中获奖
🏆 考级通过率高
🏆 家长好评如潮

💪 选择我们，让孩子在${subject}中快乐成长！

📞 咨询热线：XXXXXXXXXXX
📍 地址：XXXXXXXXXXX

#${subject}教学 #专业机构 #家长信赖`,
      tags: `${subject},宣传,专业`,
    },
    {
      id: `${subject}-promo-2`,
      category: "机构宣传",
      title: `${subject}教学成果`,
      summary: `看看孩子们学${subject}的成果`,
      content: `${config.emoji} ${subject}教学成果展示

【成果数据】
✅ 学员总数：XXX人
✅ 考级通过率：XX%
✅ 比赛获奖：XX人次
✅ 家长好评率：XX%

【学员进步】
从零基础到能够：
📌 ${config.skills[0]}标准熟练
📌 ${config.skills[1]}稳步提升
📌 整体水平明显进步
📌 自信展示自己

【家长评价】
"孩子学了${subject}后变化很大，感谢老师的用心教学！"
"选择这里是对的，孩子进步肉眼可见！"

【我们的承诺】
让每个孩子都能学有所成
让每个家长都能放心托付

💕 欢迎来参观、试听！

#${subject}成果 #教学实力 #学员风采`,
      tags: `${subject},成果,实力`,
    },
    {
      id: `${subject}-promo-3`,
      category: "机构宣传",
      title: `${subject}教学理念`,
      summary: "不只是教技能，更是在培养能力",
      content: `${config.emoji} 我们的${subject}教学理念

【我们不教】
❌ 僵化的技巧
❌ 只追求速度
❌ 一刀切的教学

【我们培养】
✅ ${config.benefits.join("、")}
✅ 终身的兴趣
✅ 持续的热情

【我们的使命】
让每个孩子都能在${subject}中
找到乐趣、收获成长

【我们的承诺】
用心教好每一节课
用爱陪伴每一个孩子
用专业成就每一个梦想

🌟 选择我们，让孩子爱上${subject}！

#${subject}理念 #用心教学 #教育`,
      tags: `${subject},理念,教学`,
    },
  ];
}

// 根据分类获取多个科目的素材
export function generateMomentsForSubjects(subjects: string[]): MomentContent[] {
  const allMoments: MomentContent[] = [];
  const usedIds = new Set<string>();

  for (const subject of subjects) {
    const moments = generateMomentsForSubject(subject);
    for (const moment of moments) {
      if (!usedIds.has(moment.id)) {
        allMoments.push(moment);
        usedIds.add(moment.id);
      }
    }
  }

  return allMoments;
}

// 获取所有可用科目
export function getAllSubjects(): string[] {
  return Object.keys(SUBJECT_CONFIG).filter(k => k !== "default");
}

// 素材内容类型
export interface MomentContent {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  tags?: string;
}
