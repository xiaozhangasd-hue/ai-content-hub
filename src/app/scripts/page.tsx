"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  MessageSquare,
  Search,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Lightbulb,
  Heart,
  Star,
  TrendingUp,
  Users,
  Trash2,
  Edit,
  Bookmark,
  ChevronLeft,
} from "lucide-react";

interface ScriptTemplate {
  id: string;
  category: string;
  title: string;
  question: string;
  answer: string;
  tags?: string;
  usageCount: number;
  createdAt: string;
}

// 预置话术库
const presetScripts = [
  // 价格异议
  {
    category: "价格异议",
    title: "太贵了",
    question: "家长说：你们价格太贵了，别的机构比你们便宜很多",
    answer: `理解您的想法。其实价格确实是我们很多家长关心的问题。

我想跟您分享三点：

第一，我们的师资。我们的老师都是专业院校毕业，有丰富的教学经验。比如我们的舞蹈老师，是XX舞蹈学院的研究生，教过的学生在XX比赛中拿过奖。

第二，我们的课程体系。我们用的是自主研发的课程体系，每个孩子都会根据自身情况制定个性化学习计划，而不是大锅饭式的教学。

第三，我们的成果。您可以看看我们学员的展示视频，很多孩子在我们这里学习一年后，变化是非常明显的。

要不这样，我给您安排一节免费体验课，您带孩子来感受一下我们的教学质量，到时候您再判断值不值，可以吗？`,
    tags: "价格,太贵,对比",
  },
  {
    category: "价格异议",
    title: "没优惠吗",
    question: "家长问：现在报名有什么优惠吗？",
    answer: `您很会选时间！我们现在正好有活动：

✅ 现在报名，立减XXX元
✅ 赠送价值XXX元的教材礼包
✅ 老带新还能再减XXX元

不过优惠名额有限，只有前XX个名额。您要是觉得我们这边还不错，建议您趁现在锁定优惠，毕竟错过这波活动，下次就不知道什么时候了。

您看您是报XX课时还是XX课时？我帮您算算能省多少钱。`,
    tags: "优惠,活动,折扣",
  },
  {
    category: "价格异议",
    title: "分期付款",
    question: "家长说：一次性交这么多钱有点压力",
    answer: `我理解您的顾虑。其实我们这边支持分期付款的：

📌 无息分期：分X期，每期只需要XXX元
📌 灵活选择：您可以选择按月或者按季度支付
📌 没有手续费：全程零利息零手续费

这样算下来，每个月只要几百块钱，相当于每天也就一杯奶茶的钱，就能让孩子接受专业的艺术教育，性价比还是很高的。

您看分期的话，您比较倾向哪种方式？我帮您安排一下。`,
    tags: "分期,付款方式,压力",
  },
  // 时间异议
  {
    category: "时间异议",
    title: "没时间",
    question: "家长说：孩子平时功课太忙了，没时间学",
    answer: `我特别理解您，现在孩子确实学业压力挺大的。

不过我想跟您分享一个数据：在我们这边学习的孩子，有超过80%成绩都在班级前列。为什么呢？

因为艺术学习能培养孩子的专注力、时间管理能力和创造力，这些能力对学习其实很有帮助的。

而且我们这边时间很灵活：
⏰ 周末班：周六/周日，每次只要1小时
⏰ 平时班：晚上6点-8点，您可以根据孩子放学时间来选
⏰ 寒暑假：有集训班，集中学习效率更高

要不我帮您看下哪个时间段比较合适？您把孩子平时的安排跟我说说，我来帮您规划。`,
    tags: "没时间,忙碌,时间安排",
  },
  {
    category: "时间异议",
    title: "考虑一下",
    question: "家长说：我再考虑考虑吧",
    answer: `没问题，这么重要的事情确实需要好好考虑。

不过我想提醒您几点：

📌 第一，孩子学习的黄金期其实很短。XX年龄段是培养艺术兴趣最好的时期，错过这个阶段，以后想学效果可能就没那么好了。

📌 第二，我们现在的优惠名额有限，只有前XX个。您考虑的同时，名额可能就被其他家长占用了。

📌 第三，我建议您可以先带孩子来体验一下，亲身体验比任何考虑都有用。

要不这样，我给您预约这周末的体验课，您带孩子来感受一下我们的教学环境和师资，到时候再做决定也不迟，您看怎么样？`,
    tags: "考虑,犹豫,拖延",
  },
  // 决策异议
  {
    category: "决策异议",
    title: "问问孩子",
    question: "家长说：我回去问问孩子想不想学",
    answer: `这个想法特别好！尊重孩子的意愿非常重要。

不过我想跟您分享一个小建议：

很多孩子一开始说自己不想学，其实是因为对这门艺术不了解，或者觉得自己学不会。

最好的方式是带孩子来体验一下：
✨ 在轻松愉快的环境中接触这门艺术
✨ 让孩子感受到学习的乐趣
✨ 专业老师会引导孩子发现兴趣点

我们这边的体验课，孩子上完后95%都说想继续学。因为我们的老师特别会调动孩子的兴趣，学习氛围也很好。

要不我帮您约个时间？周末的体验课名额比较紧俏，您看周六还是周日方便？`,
    tags: "问问孩子,孩子意愿,兴趣",
  },
  {
    category: "决策异议",
    title: "和家里人商量",
    question: "家长说：我回去和家里人商量一下",
    answer: `当然可以，家里大事确实需要商量。

不过在您和家人商量的时候，我可以给您发一些资料，方便您和家人了解：

📋 我们的教学环境和师资介绍视频
📋 学员学习成果展示
📋 课程详细安排和收费标准
📋 其他家长的真实评价

另外，如果您家人方便的话，也可以一起带孩子来体验课，这样他们能更直观地感受我们的教学质量。

要不我先把资料发给您？您加我微信，我发给您详细资料，有什么问题随时问我。`,
    tags: "商量,家人,讨论",
  },
  {
    category: "决策异议",
    title: "试听后再决定",
    question: "家长说：我想先试听看看效果再决定",
    answer: `没问题！试听课是我们最受欢迎的项目，让孩子先体验再决定，非常明智。

我们的试听课是这么安排的：
🎯 专业老师一对一或小班授课
🎯 根据孩子年龄和基础量身定制内容
🎯 让孩子真正体验到学习的乐趣
🎯 课后老师会给孩子专业的学习建议

试听课价值XXX元，现在我们有个活动，您可以免费体验一节。

您看您比较方便的时间是？我来帮您安排老师：
周六上午 10:00-11:00
周六下午 14:00-15:00
周日上午 10:00-11:00

哪个时间您比较方便？`,
    tags: "试听,体验,效果",
  },
  // 信任异议
  {
    category: "信任异议",
    title: "担心学不会",
    question: "家长担心：我家孩子没什么天赋，能学会吗？",
    answer: `我特别理解您的担心。其实这是我们很多家长都会有的顾虑。

但我想跟您分享一个真实数据：在我们这边学习的孩子，90%以上都能达到预期的学习效果。

为什么呢？

✨ 我们的老师特别擅长因材施教，会根据每个孩子的特点调整教学方法
✨ 我们的课程设置循序渐进，从易到难，孩子不会感到压力
✨ 我们注重培养孩子的兴趣和自信心，让孩子爱上学习

而且，艺术学习最重要的不是天赋，而是兴趣和坚持。只要孩子愿意学，配合专业老师的指导，一定能看到进步的。

您可以带孩子来体验一下，老师会在课后给您一个专业的学习建议，到时候您再做决定也可以。`,
    tags: "天赋,学不会,担心",
  },
  {
    category: "信任异议",
    title: "担心坚持不下来",
    question: "家长担心：孩子三分钟热度，怕坚持不下来",
    answer: `您的担心很有道理，很多家长都有这个问题。

其实孩子能不能坚持，很大程度上取决于我们的引导方式：

📌 好的老师：我们的老师不仅教得好，更懂得如何激发孩子的兴趣，让孩子爱上学习
📌 好的氛围：我们这边有很多小朋友一起学习，孩子有了小伙伴，更有动力
📌 及时反馈：我们每节课都会给孩子鼓励和反馈，让孩子有成就感
📌 家长配合：我们会定期给家长反馈孩子的学习进度，家校配合效果更好

另外，我们这边有灵活的请假和补课制度，如果孩子临时有事，可以调整时间，不会落下进度。

要不您先带孩子来体验一下，感受一下我们的教学方式？`,
    tags: "坚持,三分钟热度,半途而废",
  },
  {
    category: "信任异议",
    title: "担心教学质量",
    question: "家长问：你们教学质量怎么样？能保证效果吗？",
    answer: `这个问题问得特别好！教学质量是我们最重视的。

我可以从几个方面给您介绍：

【师资力量】
我们的老师都是经过严格筛选的：
🎓 专业院校毕业（如XX艺术学院、XX师范等）
🎓 有3年以上教学经验
🎓 定期参加培训，不断提升

【教学体系】
我们使用的是自主研发的教学体系：
📖 针对不同年龄段设计
📖 循序渐进，科学合理
📖 每个孩子有个性化学习计划

【成果展示】
您可以看看我们学员的作品：
（展示学员视频/图片）
这些孩子大多数都是零基础开始学的。

而且我们有【不满意退款承诺】：如果您在第一节课后不满意，我们可以全额退款。您看这样够有诚意吗？`,
    tags: "教学质量,效果保证,师资",
  },
  // 课程异议
  {
    category: "课程异议",
    title: "距离太远",
    question: "家长说：你们这边太远了，不太方便",
    answer: `我理解您的顾虑，距离确实是一个需要考虑的因素。

不过我想跟您分享几点：

🚗 交通便利：我们这边XX地铁站出来就到，门口有停车位，接送很方便
📚 时间集中：每周只要来一次，一次1小时，实际路上花的时间并不多
⭐ 好的学校值得付出：优质的教育资源对孩子的成长非常重要，很多家长开车1小时送孩子来学习
🎁 我们有接送服务：如果您实在不方便，我们这边有家长拼车群，可以和其他家长一起

而且您想想，如果找一家近但教学质量一般的机构，孩子学了一年没太大进步，那时间和金钱反而更浪费。

要不您周末带孩子来体验一下？我帮您约个时间，您顺便感受一下交通方不方便。`,
    tags: "距离,远,不方便",
  },
  {
    category: "课程异议",
    title: "课时太多",
    question: "家长说：你们课时太多了，怕孩子学不完",
    answer: `我理解您的担心。其实我们设置课时是充分考虑了孩子的学习规律的：

📌 艺术学习需要持续性和规律性，断断续续学效果不好
📌 我们的课时有效期很长，您可以根据孩子的时间灵活安排
📌 如果孩子学习进度快，可以升级到更高阶的课程
📌 我们的课时是可以转让的，万一用不完，可以转给亲戚朋友

而且说实话，给孩子报班，最怕的就是课时太少，孩子刚入门就学完了，前面的努力就白费了。

我们这边很多家长一开始也担心课时多，但孩子学了之后发现不够用，又续费的。因为孩子爱上了学习，主动要求多学。

要不您先报一个短期体验班试试看？`,
    tags: "课时,太多,学不完",
  },
];

const categories = [
  { id: "all", name: "全部话术", icon: BookOpen },
  { id: "价格异议", name: "价格异议", icon: "💰" },
  { id: "时间异议", name: "时间异议", icon: "⏰" },
  { id: "决策异议", name: "决策异议", icon: "🤔" },
  { id: "信任异议", name: "信任异议", icon: "✨" },
  { id: "课程异议", name: "课程异议", icon: "📚" },
];

export default function ScriptsPage() {
  return (
    <Suspense fallback={<ScriptsLoading />}>
      <ScriptsPageContent />
    </Suspense>
  );
}

function ScriptsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500">加载中...</p>
      </div>
    </div>
  );
}

function ScriptsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const initialQuestion = searchParams.get("question") || "";

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState(initialQuestion);
  const [customQuestion, setCustomQuestion] = useState(initialQuestion);
  const [aiAnswer, setAiAnswer] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ScriptTemplate[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newScript, setNewScript] = useState({
    category: "价格异议",
    title: "",
    question: "",
    answer: "",
    tags: "",
  });

  useEffect(() => {
    // 加载预置话术 + 用户自定义话术
    loadTemplates();
    loadFavorites();
  }, []);

  useEffect(() => {
    if (initialQuestion) {
      handleGenerateAI();
    }
  }, []);

  const loadTemplates = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/scripts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("加载话术失败:", error);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem("scriptFavorites");
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const toggleFavorite = (id: string) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    localStorage.setItem("scriptFavorites", JSON.stringify(newFavorites));
    toast.success(favorites.includes(id) ? "已取消收藏" : "已收藏");
  };

  const handleAddScript = async () => {
    if (!newScript.title || !newScript.question || !newScript.answer) {
      toast.error("请填写完整信息");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/scripts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newScript),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("话术已添加");
        setIsAddDialogOpen(false);
        setNewScript({
          category: "价格异议",
          title: "",
          question: "",
          answer: "",
          tags: "",
        });
        loadTemplates();
      } else {
        toast.error(data.error || "添加失败");
      }
    } catch (error) {
      toast.error("添加失败");
    }
  };

  const handleDeleteScript = async (id: string) => {
    if (!confirm("确定要删除这条话术吗？")) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/scripts?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        toast.success("已删除");
        loadTemplates();
      }
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const handleGenerateAI = async () => {
    if (!customQuestion.trim()) {
      toast.error("请输入家长的问题");
      return;
    }

    setIsGenerating(true);
    setAiAnswer("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `你是一位专业的教培机构招生顾问，擅长处理家长的各种异议和问题。
请针对家长的问题，给出专业、有说服力的回复话术。

要求：
1. 语气亲切、专业，让家长感到被尊重
2. 回答要有逻辑，可以用"第一、第二、第三"或"首先、其次、最后"等结构
3. 要体现机构的价值和优势
4. 结尾要给出下一步行动建议，比如"安排体验课"或"加微信了解详情"
5. 适当使用表情符号增加亲和力
6. 回答不要太长，控制在200-300字左右`,
            },
            {
              role: "user",
              content: `家长说：${customQuestion}\n\n请给我一个专业的回复话术。`,
            },
          ],
        }),
      });

      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "生成失败" }));
        toast.error(errorData.error || "生成失败，请重试");
        setIsGenerating(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        toast.error("无法读取响应流");
        setIsGenerating(false);
        return;
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const json = JSON.parse(data);
              if (json.content) {
                setAiAnswer((prev) => prev + json.content);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error("生成话术失败:", error);
      toast.error("生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("已复制到剪贴板");
  };

  const handleUseTemplate = async (template: ScriptTemplate) => {
    // 预设话术不需要更新数据库
    if (template.id.startsWith('preset-')) return;
    
    const token = localStorage.getItem("token");
    try {
      await fetch("/api/scripts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: template.id }),
      });
      loadTemplates();
    } catch (error) {
      console.error("更新使用次数失败:", error);
    }
  };

  // 合并预置话术和用户自定义话术
  const allScripts: ScriptTemplate[] = [
    ...presetScripts.map((s, index) => ({
      id: `preset-${index}`,
      category: s.category,
      title: s.title,
      question: s.question,
      answer: s.answer,
      tags: s.tags,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    })),
    ...templates.map((t) => ({
      id: t.id,
      category: t.category,
      title: t.title,
      question: t.question,
      answer: t.answer,
      tags: t.tags || "",
      usageCount: t.usageCount,
      createdAt: t.createdAt,
    })),
  ];

  // 过滤话术
  const filteredScripts = allScripts.filter((script) => {
    const matchesCategory = selectedCategory === "all" || script.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      script.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 按使用次数排序
  const sortedScripts = [...filteredScripts].sort((a, b) => b.usageCount - a.usageCount);

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDark ? '' : ''}`}>
      {/* 背景效果 */}
      <div className={`fixed inset-0 -z-10 ${isDark ? 'bg-gradient-to-br from-[#0a0e1a] via-[#0d1425] to-[#0a1628]' : 'bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50'}`}>
        {isDark && (
          <div className="absolute inset-0 opacity-30" 
            style={{
              backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        )}
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] ${isDark ? 'bg-purple-400/20' : 'bg-purple-400/15'} rounded-full blur-3xl`} />
        <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] ${isDark ? 'bg-blue-400/20' : 'bg-blue-400/15'} rounded-full blur-3xl`} />
      </div>

      {/* 顶部导航 */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b shadow-sm ${isDark ? 'bg-[#0d1425]/80 border-white/5' : 'bg-white/80 border-gray-100/50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className={`gap-2 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <ChevronLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>异议话术库</span>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-indigo-500"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加话术
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* AI智能生成 */}
        <Card className="mb-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">AI 智能话术生成</h3>
                <p className="text-sm text-white/80">输入家长的问题，AI 帮您生成专业回复</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Input
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="家长说：考虑考虑吧..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button 
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                {isGenerating ? "生成中..." : "生成话术"}
              </Button>
            </div>
            {aiAnswer && (
              <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">AI 建议回复：</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(aiAnswer, "ai")}
                    className="text-white hover:bg-white/10"
                  >
                    {copiedId === "ai" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{aiAnswer}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 分类标签 */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id 
                ? "bg-purple-600 hover:bg-purple-700 text-white" 
                : isDark 
                  ? "border-white/20 text-gray-300 hover:bg-white/10" 
                  : "border-gray-200 text-gray-700"
              }
            >
              {typeof cat.icon === "string" ? cat.icon : <cat.icon className="w-4 h-4 mr-1" />}
              {cat.name}
            </Button>
          ))}
        </div>

        {/* 搜索 */}
        <div className="relative mb-6">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索话术..."
            className={`pl-10 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : ''}`}
          />
        </div>

        {/* 话术列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedScripts.map((script) => {
            const isExpanded = expandedId === script.id;
            const displayAnswer = isExpanded ? script.answer : script.answer.slice(0, 150) + "...";
            const isFavorite = favorites.includes(script.id);
            const isCustom = !script.id.startsWith("preset-");

            return (
              <Card
                key={script.id}
                className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white/80 border-gray-100'} backdrop-blur-sm hover:shadow-lg transition-all ${
                  isFavorite ? "ring-2 ring-amber-200" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                        {script.category}
                      </Badge>
                      <Badge variant="outline" className={`${isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {script.title}
                      </Badge>
                      {isCustom && (
                        <Badge variant="outline" className={`${isDark ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          自定义
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {script.usageCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mr-2">
                          <TrendingUp className="w-3 h-3" />
                          {script.usageCount}次
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(script.id)}
                        className={`h-8 w-8 p-0 ${isFavorite ? "text-amber-500" : "text-gray-400"}`}
                      >
                        <Bookmark className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  </div>

                  <div className={`mb-3 p-2 rounded-lg text-sm ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                    {script.question}
                  </div>

                  <div className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {displayAnswer}
                  </div>

                  <div className={`flex items-center justify-between mt-4 pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-2">
                      {script.tags?.split(",").map((tag: string) => (
                        <span key={tag} className="text-xs text-gray-400">#{tag.trim()}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : script.id)}
                      >
                        {isExpanded ? (
                          <><ChevronUp className="w-4 h-4" /> 收起</>
                        ) : (
                          <><ChevronDown className="w-4 h-4" /> 展开</>
                        )}
                      </Button>
                      {isCustom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteScript(script.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleCopy(script.answer, script.id);
                          handleUseTemplate(script);
                        }}
                      >
                        {copiedId === script.id ? (
                          <><Check className="w-4 h-4 mr-1" /> 已复制</>
                        ) : (
                          <><Copy className="w-4 h-4 mr-1" /> 复制</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {sortedScripts.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">没有找到相关话术</p>
            <p className="text-sm text-gray-400 mt-2">试试其他关键词，或使用AI生成</p>
          </div>
        )}
      </main>

      {/* 添加自定义话术弹窗 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>添加自定义话术</DialogTitle>
            <DialogDescription>添加您自己常用的销售话术</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-500">分类</label>
                <Select value={newScript.category} onValueChange={(v) => setNewScript({ ...newScript, category: v })}>
                  <SelectTrigger className="text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="价格异议">价格异议</SelectItem>
                    <SelectItem value="时间异议">时间异议</SelectItem>
                    <SelectItem value="决策异议">决策异议</SelectItem>
                    <SelectItem value="信任异议">信任异议</SelectItem>
                    <SelectItem value="课程异议">课程异议</SelectItem>
                    <SelectItem value="续费话术">续费话术</SelectItem>
                    <SelectItem value="邀约话术">邀约话术</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-500">标题</label>
                <Input
                  value={newScript.title}
                  onChange={(e) => setNewScript({ ...newScript, title: e.target.value })}
                  placeholder="如：太贵了"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-500">家长问题</label>
              <Textarea
                value={newScript.question}
                onChange={(e) => setNewScript({ ...newScript, question: e.target.value })}
                placeholder="家长可能会说什么..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-500">回复话术</label>
              <Textarea
                value={newScript.answer}
                onChange={(e) => setNewScript({ ...newScript, answer: e.target.value })}
                placeholder="您的专业回复..."
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-500">标签（逗号分隔）</label>
              <Input
                value={newScript.tags}
                onChange={(e) => setNewScript({ ...newScript, tags: e.target.value })}
                placeholder="如：价格,优惠,对比"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
            <Button onClick={handleAddScript} className="bg-gradient-to-r from-purple-500 to-indigo-500">
              添加话术
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
