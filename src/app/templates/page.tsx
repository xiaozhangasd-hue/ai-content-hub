"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  Image,
  Video,
  Sparkles,
  Calendar,
  Gift,
  Users,
  BookOpen,
  Trophy,
  Heart,
  Camera,
  Star,
  Zap,
  ChevronRight,
  Music,
  Palette,
  Code,
  Dumbbell,
  Baby,
  GraduationCap,
  Pen,
  Brain,
  Languages,
  Calculator,
} from "lucide-react";

// 模板分类
const categories = [
  { id: "all", name: "全部" },
  { id: "festival", name: "节日营销" },
  { id: "scene", name: "应用场景" },
  { id: "industry", name: "行业模板" },
];

// 节日模板
const festivalTemplates = [
  {
    id: "new-year",
    name: "新年招生",
    desc: "新年新气象，开启学习新篇章",
    icon: Calendar,
    color: "from-red-500 to-red-600",
    type: "文案",
    preview: `🎉 新年新起点，给孩子最好的礼物！

🌟 {机构名称}新年特惠开启
报名即享新年专属福利：

✅ 新生报名享8折优惠
✅ 老带新双方各减200元
✅ 报名即送精美大礼包
✅ 前50名额外赠送体验课

📍 地址：{地址}
📞 咨询热线：{电话}

⏰ 限时优惠，名额有限！
让孩子在新的一年赢在起跑线！`,
  },
  {
    id: "spring",
    name: "春季招生",
    desc: "春季开学季，迎接新学期",
    icon: Star,
    color: "from-green-500 to-green-600",
    type: "文案",
    preview: `🌸 春暖花开，学习正当时！

{机构名称}春季班火热招生中
给孩子一个充实的春天~

✨ 为什么选择我们？
• 专业师资团队，教学经验丰富
• 小班教学模式，关注每个孩子
• 系统课程体系，因材施教
• 趣味互动课堂，快乐学习

🎁 春季特惠：
早鸟价立减300元！
团报更有额外优惠！

📍 地址：{地址}
📞 电话：{电话}
预约免费试听，名额有限！`,
  },
  {
    id: "children-day",
    name: "儿童节活动",
    desc: "六一儿童节专属营销",
    icon: Gift,
    color: "from-pink-500 to-pink-600",
    type: "文案",
    preview: `🎈 六一儿童节特别活动来啦！

{机构名称}邀您共度快乐时光
给孩子一个难忘的儿童节！

🎪 活动亮点：
• 趣味体验课堂，激发学习兴趣
• 互动小游戏，赢取精美礼品
• 专业老师现场指导
• 免费拍照留念

🎁 参与即送：
精美小礼物 + 体验课优惠券

📅 时间：6月1日
📍 地点：{地址}
📞 报名热线：{电话}

适龄儿童免费参加，名额有限！`,
  },
  {
    id: "summer",
    name: "暑期特训",
    desc: "暑假集训营招生",
    icon: Zap,
    color: "from-orange-500 to-orange-600",
    type: "文案",
    preview: `☀️ 暑假不虚度，成长加速度！

{机构名称}暑期特训营开始报名
让孩子的暑假更有意义~

📚 课程特色：
✓ 小班精品教学，关注每个孩子
✓ 专业老师辅导，快速提升能力
✓ 趣味互动课堂，学习不再枯燥
✓ 成果展示汇报，见证孩子成长

🎯 适合人群：
{适合年龄/年级}

⏰ 上课时间：7月-8月
📍 地址：{地址}
📞 咨询电话：{电话}

🔥 早鸟优惠进行中，名额有限！`,
  },
  {
    id: "back-to-school",
    name: "开学季",
    desc: "开学季招生宣传",
    icon: BookOpen,
    color: "from-blue-500 to-blue-600",
    type: "文案",
    preview: `📚 新学期，新起点！

{机构名称}助孩子赢在起跑线
开学季特别招生中~

🎯 精品课程：
• {课程1}
• {课程2}
• {课程3}

✨ 我们的优势：
• 专业师资 · 因材施教
• 小班教学 · 关注成长
• 趣味课堂 · 快乐学习

🎁 开学礼包：
报名即送学习大礼包！

📍 地址：{地址}
📞 电话：{电话}

预约免费试听，感受不一样的课堂！`,
  },
  {
    id: "double-11",
    name: "双十一活动",
    desc: "双十一促销活动",
    icon: Gift,
    color: "from-purple-500 to-purple-600",
    type: "文案",
    preview: `🔥 双十一狂欢节，全年最低价！

{机构名称}年度最大优惠来袭
错过再等一年！

💥 超值福利：
✓ 全场课程8折起
✅ 报名即送大礼包
✅ 老带新双倍积分
✅ 团报再减500元

💰 定金翻倍：
预付100抵300
预付200抵500

⏰ 活动时间：11.1-11.11
📍 地址：{地址}
📞 电话：{电话}

名额有限，先到先得！`,
  },
  {
    id: "teachers-day",
    name: "教师节",
    desc: "感恩教师节活动",
    icon: Heart,
    color: "from-rose-500 to-rose-600",
    type: "文案",
    preview: `💝 教师节，致敬每一位引路人

{机构名称}感恩教师节特别活动

🌟 致敬辛勤的园丁们
我们深知教育的不易
更懂得每一份付出

🎁 教师专属福利：
• 教师子女报名享8折
• 免费体验课一节
• 精美礼品一份

📅 活动时间：9月10日
📍 地址：{地址}
📞 电话：{电话}

感谢每一位教育工作者！`,
  },
  {
    id: "mid-autumn",
    name: "中秋节",
    desc: "中秋团圆主题活动",
    icon: Sparkles,
    color: "from-amber-500 to-amber-600",
    type: "文案",
    preview: `🥮 月圆中秋，阖家团圆

{机构名称}祝大家中秋快乐！

🎊 中秋特别活动：
• 亲子DIY月饼
• 中秋文化课堂
• 互动小游戏
• 精美伴手礼

👨‍👩‍👧‍👦 欢迎家长和孩子一起参加
感受传统文化的魅力

📅 时间：中秋节当天
📍 地址：{地址}
📞 报名热线：{电话}

名额有限，提前预约！`,
  },
];

// 场景模板 - 扩展内容
const sceneTemplates = [
  {
    id: "recruit",
    name: "招生宣传",
    desc: "吸引新生报名",
    icon: Users,
    color: "from-blue-500 to-blue-600",
    type: "文案",
    preview: `🎯 {机构名称}火热招生中！

给孩子一个更好的未来
从这里开始~

📚 我们提供：
• {课程1}
• {课程2}
• {课程3}

✨ 为什么选择我们？
• 专业师资团队
• 小班教学模式
• 因材施教理念
• 趣味互动课堂

🎁 新生福利：
报名即享优惠 + 大礼包

📍 地址：{地址}
📞 电话：{电话}

预约免费试听！`,
  },
  {
    id: "trial",
    name: "体验课推广",
    desc: "引导试听体验",
    icon: Sparkles,
    color: "from-cyan-500 to-cyan-600",
    type: "文案",
    preview: `🌟 免费体验课来啦！

{机构名称}诚邀您和孩子
亲身体验我们的课堂魅力

🎪 体验课亮点：
✓ 真实课堂体验
✓ 专业老师指导
✓ 学习效果立见
✓ 趣味互动环节

🎁 到店即送：
精美小礼品 + 专业测评

⏰ 体验时间：
{时间段}

📍 地址：{地址}
📞 预约热线：{电话}

名额有限，先到先得！`,
  },
  {
    id: "showcase",
    name: "学员成果",
    desc: "展示学习效果",
    icon: Trophy,
    color: "from-yellow-500 to-yellow-600",
    type: "文案",
    preview: `🏆 学员成果展示

恭喜{学员名字}同学
在{比赛/考试}中取得优异成绩！

🌟 学习历程：
• 入学时间：{时间}
• 学习课程：{课程}
• 进步亮点：{进步内容}

💪 老师寄语：
{老师评价}

🎉 我们见证每一个孩子的成长
为每一个进步喝彩！

📍 {机构名称}
📞 {电话}`,
  },
  {
    id: "daily",
    name: "日常动态",
    desc: "分享教学日常",
    icon: Camera,
    color: "from-green-500 to-green-600",
    type: "文案",
    preview: `📸 课堂精彩瞬间

今天{课程}课堂上
孩子们表现太棒了！

✨ 课堂亮点：
• {活动内容1}
• {活动内容2}
• {活动内容3}

😊 看着孩子们专注的眼神
和取得进步后的笑容
就是我们最大的动力！

💪 每一堂课都在用心
每一个孩子都在进步

📍 {机构名称}
📞 {电话}`,
  },
  {
    id: "brand",
    name: "品牌故事",
    desc: "展示机构文化",
    icon: Heart,
    color: "from-pink-500 to-pink-600",
    type: "文案",
    preview: `💕 {机构名称}的故事

我们相信教育不只是传授知识
更是点燃梦想的火种

🌟 我们的初心：
让每个孩子都能找到自己的光芒
让每个家庭都能看到孩子的进步

📚 我们的理念：
• 因材施教，关注每个孩子
• 寓教于乐，激发学习兴趣
• 家校共育，陪伴孩子成长

🎯 我们的承诺：
用心教学，用爱陪伴

📍 地址：{地址}
📞 电话：{电话}

选择我们，选择放心！`,
  },
  {
    id: "activity",
    name: "活动招募",
    desc: "活动宣传招募",
    icon: Gift,
    color: "from-purple-500 to-purple-600",
    type: "文案",
    preview: `🎊 {活动名称}来啦！

{机构名称}特别策划
给孩子一个难忘的经历

🎪 活动内容：
• {活动环节1}
• {活动环节2}
• {活动环节3}

👨‍👩‍👧‍👦 适合人群：
{适合年龄}

🎁 活动福利：
参与即送精美礼品

📅 活动时间：{日期}
📍 活动地点：{地址}
📞 报名热线：{电话}

名额有限，先报先得！`,
  },
  {
    id: "course-intro",
    name: "课程介绍",
    desc: "详细介绍课程",
    icon: BookOpen,
    color: "from-indigo-500 to-indigo-600",
    type: "文案",
    preview: `📖 {课程名称}课程介绍

让孩子爱上学习，从这里开始

🎯 课程目标：
培养孩子的{能力}

📚 课程内容：
• 第1阶段：{内容}
• 第2阶段：{内容}
• 第3阶段：{内容}

👨‍🏫 授课老师：
{老师介绍}

⏰ 上课时间：
{时间段}

💰 课程费用：
{价格信息}

📍 地址：{地址}
📞 电话：{电话}`,
  },
  {
    id: "teacher-intro",
    name: "师资介绍",
    desc: "展示教师风采",
    icon: GraduationCap,
    color: "from-teal-500 to-teal-600",
    type: "文案",
    preview: `👩‍🏫 师资介绍 | {老师名字}

{科目/课程}主讲老师

🎓 教育背景：
{学历/专业}

🏆 荣誉资质：
• {资质1}
• {资质2}
• {资质3}

💡 教学特色：
{教学风格/特点}

❤️ 教学理念：
{教学理念}

👨‍👩‍👧 学生/家长评价：
"{评价内容}"

📍 {机构名称}
📞 {电话}`,
  },
];

// 行业模板 - 扩展内容
const industryTemplates = [
  {
    id: "speech",
    name: "少儿口才",
    desc: "演讲、朗诵、主持培训",
    icon: Languages,
    color: "from-blue-500 to-blue-600",
    type: "文案",
    preview: `🎤 让孩子敢说、会说、说得好！

{机构名称}少儿口才训练营
培养小小演说家

📚 课程体系：
• 基础发音训练
• 诗歌朗诵表演
• 故事演讲表达
• 即兴口语训练
• 小主持人培养

🎯 课程收获：
✓ 克服胆怯，自信表达
✓ 吐字清晰，声音洪亮
✓ 思维敏捷，逻辑清晰
✓ 台风稳健，大方得体

📅 适合年龄：4-12岁
📍 地址：{地址}
📞 电话：{电话}

免费试听课预约中！`,
  },
  {
    id: "art",
    name: "艺术培训",
    desc: "音乐、舞蹈、美术培训",
    icon: Palette,
    color: "from-pink-500 to-pink-600",
    type: "文案",
    preview: `🎨 艺术启蒙，从这里开始

{机构名称}艺术培训中心
让艺术成为孩子一生的财富

🎼 开设课程：
• 钢琴/小提琴/古筝
• 中国舞/拉丁舞/街舞
• 创意美术/素描/水彩

✨ 教学特色：
• 专业院校师资
• 一对一/小班教学
• 定期汇报演出
• 考级辅导培训

🎁 新生福利：
免费体验课 + 专业测评

📍 地址：{地址}
📞 电话：{电话}

让孩子在艺术的海洋中遨游！`,
  },
  {
    id: "tutoring",
    name: "学科辅导",
    desc: "语文、数学、英语辅导",
    icon: Calculator,
    color: "from-green-500 to-green-600",
    type: "文案",
    preview: `📚 学科辅导，成绩提升

{机构名称}文化课辅导中心
帮助孩子攻克学习难关

📖 开设科目：
• 语文阅读写作
• 数学思维训练
• 英语听说读写

🎯 教学特色：
• 同步学校课程
• 查漏补缺巩固
• 错题精讲精练
• 学习方法指导

👨‍🏫 师资力量：
重点学校退休教师
一线在职教师

📍 地址：{地址}
📞 电话：{电话}

预约免费测评，制定专属提升方案！`,
  },
  {
    id: "coding",
    name: "少儿编程",
    desc: "编程、机器人培训",
    icon: Code,
    color: "from-purple-500 to-purple-600",
    type: "文案",
    preview: `💻 编程改变未来

{机构名称}少儿编程
培养面向未来的小创客

🤖 课程体系：
• Scratch图形化编程
• Python人工智能入门
• C++算法编程
• 机器人编程
• 乐高机械构建

🎯 学习收获：
✓ 逻辑思维能力
✓ 问题解决能力
✓ 创新创造能力
✓ 团队协作能力

📅 适合年龄：6-15岁
📍 地址：{地址}
📞 电话：{电话}

免费体验课，开启编程之旅！`,
  },
  {
    id: "early-edu",
    name: "早教启蒙",
    desc: "0-6岁早教课程",
    icon: Baby,
    color: "from-orange-500 to-orange-600",
    type: "文案",
    preview: `👶 启蒙第一步，成长每一步

{机构名称}早教中心
陪伴宝宝快乐成长

🌟 课程体系：
• 亲子启蒙课程（0-1.5岁）
• 感统训练课程（1-3岁）
• 蒙氏课程（1.5-6岁）
• 脑力开发课程（2-6岁）
• 入园准备课程（2.5-4岁）

💖 教学理念：
尊重孩子天性
激发内在潜能
陪伴亲子成长

🎁 新客福利：
免费体验课 + 成长测评

📍 地址：{地址}
📞 电话：{电话}

给宝宝最好的开始！`,
  },
  {
    id: "sports",
    name: "运动培训",
    desc: "篮球、足球、游泳等",
    icon: Dumbbell,
    color: "from-cyan-500 to-cyan-600",
    type: "文案",
    preview: `🏀 强健体魄，快乐运动

{机构名称}体育运动中心
让运动成为孩子的习惯

🏅 开设课程：
• 篮球/足球/羽毛球
• 游泳启蒙/提高班
• 跆拳道/武术
• 体能训练/跳绳

⭐ 课程特色：
• 专业教练团队
• 科学训练体系
• 比赛考级通道
• 趣味教学方式

💪 运动的好处：
✓ 增强体质免疫力
✓ 培养团队精神
✓ 锻炼意志品质
✓ 促进身高发育

📍 地址：{地址}
📞 电话：{电话}

免费体验课预约中！`,
  },
  {
    id: "writing",
    name: "书法练字",
    desc: "硬笔、软笔书法",
    icon: Pen,
    color: "from-slate-500 to-slate-600",
    type: "文案",
    preview: `✍️ 一手好字，受益终身

{机构名称}书法培训
传承传统文化，写好中国字

🖌️ 课程设置：
• 硬笔书法（铅笔/钢笔）
• 软笔书法（毛笔）
• 书法考级辅导
• 国画入门

🎯 学习收获：
✓ 端正写字姿势
✓ 规范书写笔画
✓ 提升审美能力
✓ 培养耐心专注

👨‍🏫 师资介绍：
书法专业教师
多年教学经验

📅 适合年龄：6岁以上
📍 地址：{地址}
📞 电话：{电话}

免费试写体验！`,
  },
  {
    id: "brain",
    name: "脑力开发",
    desc: "记忆力、专注力训练",
    icon: Brain,
    color: "from-violet-500 to-violet-600",
    type: "文案",
    preview: `🧠 开发大脑潜能

{机构名称}脑力开发中心
让孩子更聪明地学习

🎯 课程内容：
• 超级记忆力训练
• 专注力提升课程
• 思维导图应用
• 快速阅读训练
• 逻辑思维训练

⭐ 课程效果：
✓ 记忆效率提升3-5倍
✓ 专注时长显著延长
✓ 学习兴趣明显提高
✓ 学习成绩稳步提升

📊 教学方式：
游戏化教学
情景式训练
阶段性测评

📍 地址：{地址}
📞 电话：{电话}

免费测评，定制训练方案！`,
  },
  {
    id: "music",
    name: "音乐培训",
    desc: "钢琴、声乐、器乐",
    icon: Music,
    color: "from-rose-500 to-rose-600",
    type: "文案",
    preview: `🎵 音乐点亮人生

{机构名称}音乐培训中心
用音乐滋养孩子的心灵

🎹 开设课程：
• 钢琴一对一
• 声乐/合唱
• 小提琴/大提琴
• 吉他/尤克里里
• 架子鼓

✨ 教学特色：
• 专业院校师资
• 考级专项辅导
• 定期音乐会演出
• 国际比赛机会

🎁 新生福利：
免费体验课 + 音乐素养测评

📍 地址：{地址}
📞 电话：{电话}

开启孩子的音乐之旅！`,
  },
];

// 图片模板
const imageTemplates = [
  {
    id: "poster",
    name: "招生海报",
    desc: "吸睛招生宣传海报",
    type: "图片",
    prompt: "教培机构招生海报，简约现代风格，包含课程信息和联系方式，适合社交媒体传播",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "activity",
    name: "活动海报",
    desc: "活动宣传推广海报",
    type: "图片",
    prompt: "教培机构活动宣传海报，节日主题，温馨活泼风格，适合朋友圈分享",
    color: "from-pink-500 to-pink-600",
  },
  {
    id: "course",
    name: "课程卡片",
    desc: "课程介绍卡片图",
    type: "图片",
    prompt: "教培机构课程介绍卡片，简洁专业风格，展示课程亮点和优势",
    color: "from-green-500 to-green-600",
  },
];

// 视频模板
const videoTemplates = [
  {
    id: "intro",
    name: "机构介绍",
    desc: "机构环境展示视频",
    type: "视频",
    prompt: "教培机构环境展示视频，教室场景，学生上课画面，温馨专业氛围",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "student",
    name: "学员风采",
    desc: "学员学习成果展示",
    type: "视频",
    prompt: "教培机构学员上课视频，专注学习场景，师生互动画面，积极向上氛围",
    color: "from-orange-500 to-orange-600",
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"text" | "image" | "video">("text");

  const handleUseTemplate = (template: typeof festivalTemplates[0]) => {
    localStorage.setItem("selectedTemplate", JSON.stringify(template));
    toast.success("模板已选择，请填写机构信息后生成");
    router.push("/dashboard");
  };

  const TemplateCard = ({ template, category }: { template: typeof festivalTemplates[0]; category: string }) => (
    <Card
      key={template.id}
      className="bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center flex-shrink-0`}>
            <template.icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <Badge variant="secondary" className="text-xs">{template.type}</Badge>
            </div>
            <p className="text-sm text-gray-500">{template.desc}</p>
          </div>
          <ChevronRight
            className={`w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-all ${
              selectedTemplate === template.id ? "rotate-90 text-blue-500" : ""
            }`}
          />
        </div>

        {selectedTemplate === template.id && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 mb-3 overflow-auto max-h-64 font-sans leading-relaxed">
              {template.preview}
            </pre>
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                handleUseTemplate(template);
              }}
            >
              使用此模板
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-1">
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">模板库</h1>
                  <p className="text-xs text-gray-500">精选行业营销模板</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 类型切换 */}
        <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
          <Button
            variant={selectedTab === "text" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedTab("text")}
            className={selectedTab === "text" ? "bg-white shadow-sm" : ""}
          >
            <FileText className="w-4 h-4 mr-1" />
            文案模板
          </Button>
          <Button
            variant={selectedTab === "image" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedTab("image")}
            className={selectedTab === "image" ? "bg-white shadow-sm" : ""}
          >
            <Image className="w-4 h-4 mr-1" />
            图片模板
          </Button>
          <Button
            variant={selectedTab === "video" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedTab("video")}
            className={selectedTab === "video" ? "bg-white shadow-sm" : ""}
          >
            <Video className="w-4 h-4 mr-1" />
            视频模板
          </Button>
        </div>

        {/* 分类标签 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className={activeCategory === cat.id ? "bg-blue-600" : ""}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {selectedTab === "text" && (
          <>
            {/* 节日营销模板 */}
            {(activeCategory === "all" || activeCategory === "festival") && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-500" />
                  节日营销模板
                  <Badge variant="secondary" className="text-xs">{festivalTemplates.length}个</Badge>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {festivalTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} category="festival" />
                  ))}
                </div>
              </div>
            )}

            {/* 应用场景模板 */}
            {(activeCategory === "all" || activeCategory === "scene") && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  应用场景模板
                  <Badge variant="secondary" className="text-xs">{sceneTemplates.length}个</Badge>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sceneTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} category="scene" />
                  ))}
                </div>
              </div>
            )}

            {/* 行业模板 */}
            {(activeCategory === "all" || activeCategory === "industry") && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-500" />
                  行业专属模板
                  <Badge variant="secondary" className="text-xs">{industryTemplates.length}个</Badge>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {industryTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} category="industry" />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 图片模板 */}
        {selectedTab === "image" && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-pink-500" />
              图片模板
              <Badge variant="secondary" className="text-xs">{imageTemplates.length}个</Badge>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {imageTemplates.map((template) => (
                <Card key={template.id} className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-5">
                    <div className={`w-full h-32 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center mb-3`}>
                      <Image className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{template.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{template.desc}</p>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => {
                      localStorage.setItem("selectedImageTemplate", JSON.stringify(template));
                      toast.success("模板已选择，请前往工作台生成");
                      router.push("/dashboard");
                    }}>
                      使用此模板
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 视频模板 */}
        {selectedTab === "video" && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-500" />
              视频模板
              <Badge variant="secondary" className="text-xs">{videoTemplates.length}个</Badge>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoTemplates.map((template) => (
                <Card key={template.id} className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-5">
                    <div className={`w-full h-32 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center mb-3`}>
                      <Video className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{template.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{template.desc}</p>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => {
                      localStorage.setItem("selectedVideoTemplate", JSON.stringify(template));
                      toast.success("模板已选择，请前往工作台生成");
                      router.push("/dashboard");
                    }}>
                      使用此模板
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 使用提示 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-900 mb-2">💡 使用提示</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 点击模板卡片可展开预览详细内容</li>
            <li>• 模板中的 <span className="font-mono bg-blue-100 px-1 rounded">{"{机构名称}"}</span> 等占位符会自动替换为您填写的机构信息</li>
            <li>• 选择模板后跳转到工作台，填写信息即可生成个性化内容</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
