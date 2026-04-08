"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  PartyPopper,
  Gift,
  Users,
  Clock,
  MapPin,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
} from "lucide-react";

interface Activity {
  id: string;
  title: string;
  type: string;
  description: string;
  content: string;
  date?: string;
  createdAt: string;
}

const activityTemplates = [
  {
    type: "体验课",
    icon: "🎯",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    templates: [
      {
        title: "周末体验课邀约",
        description: "适合邀约意向家长参加周末免费体验课",
        content: `【XX艺术中心】周末体验课邀约

亲爱的家长您好！🎉

感谢您对XX艺术中心的关注！我们诚邀您和孩子参加本周末的免费体验课活动：

📅 活动时间：周六/周日 XX:XX-XX:XX
📍 活动地点：XX艺术中心（详细地址）
👧 招募对象：X-X岁儿童（限X组家庭）
🎁 活动福利：
  • 专业老师一对一指导
  • 现场评估孩子艺术天赋
  • 报名即享XX元优惠
  • 赠送精美礼品一份

💡 温馨提示：
  1. 请提前10分钟到场
  2. 建议家长陪同参与
  3. 名额有限，先到先得

✅ 报名方式：
  回复"孩子姓名+年龄+联系方式"即可预约
  或直接致电：XXXXXXXXXXX

期待与您和孩子的相遇！🌟`,
      },
      {
        title: "寒暑假集训营",
        description: "适合寒暑假集中招生",
        content: `【XX艺术中心】寒暑假集训营火热招生！

🎭 让孩子的假期更有意义！

亲爱的家长，XX艺术中心寒暑假集训营开始招募啦！

✨ 课程亮点：
  ✅ 小班教学，每班不超过X人
  ✅ 专业老师全程指导
  ✅ 系统化课程，快速提升
  ✅ 结业汇报演出
  ✅ 颁发结业证书

📅 时间安排：
  第一期：X月X日-X月X日
  第二期：X月X日-X月X日
  每期X天，每天X小时

💰 特惠价格：
  原价：XXXX元
  早鸟价：XXXX元（X月X日前）
  团报更优惠：X人团报每人立减XXX元

🎁 报名即送：
  • 精美教材一套
  • 练习服一件
  • 学习大礼包

📞 咨询热线：XXXXXXXXXXX
📍 地址：XXXXXXXXXXX

名额有限，预报从速！🌟`,
      },
    ],
  },
  {
    type: "节日活动",
    icon: "🎄",
    color: "bg-green-100 text-green-700 border-green-200",
    templates: [
      {
        title: "六一儿童节活动",
        description: "六一儿童节主题活动方案",
        content: `【XX艺术中心】六一儿童节特别活动！

🎈 快乐童年，艺术相伴！

亲爱的家长和小朋友们：

六一儿童节快到啦！XX艺术中心特别策划了一场充满欢乐的活动：

🎭 活动内容：
  ✨ 才艺展示秀（学员表演）
  ✨ 亲子互动游戏
  ✨ 创意手工DIY
  ✨ 抽奖环节（丰厚奖品等你拿）
  ✨ 精美茶歇

📅 活动时间：6月1日 XX:XX-XX:XX
📍 活动地点：XX艺术中心
👧 参与对象：X-X岁儿童及家长

🎁 活动福利：
  📌 所有参与小朋友获赠节日礼物
  📌 现场报名享特别优惠
  📌 老学员带新学员双方都有礼

🎟 参与方式：
  转发本条朋友圈集满XX个赞
  截图发给老师即可参加

名额有限，先到先得！
让这个六一不一样！🎉`,
      },
      {
        title: "春节联欢会",
        description: "春节年终汇演活动方案",
        content: `【XX艺术中心】春节联欢晚会邀请函

🎊 金鼠辞旧岁，金牛迎新春！

亲爱的家长朋友们：

感谢您一年来对XX艺术中心的信任与支持！在新春佳节来临之际，我们诚邀您参加：

✨ XX艺术中心春节联欢晚会 ✨

🎭 精彩节目：
  • 学员才艺展示
  • 教师精彩表演
  • 亲子互动环节
  • 年度颁奖典礼
  • 幸运抽奖

📅 演出时间：X月X日 XX:XX
📍 演出地点：XXXXXX
👗 着装要求：喜庆服装/正装

🎁 精美伴手礼：
  ✅ 所有家庭获赠新年礼包
  ✅ 抽奖环节（一等奖XX、二等奖XX...）
  ✅ 新年特别优惠

📞 报名方式：
  请在X月X日前联系老师确认参加人数

期待您的光临！让我们共同见证孩子的成长！🌟`,
      },
      {
        title: "母亲节感恩活动",
        description: "母亲节亲子活动方案",
        content: `【XX艺术中心】母亲节特别活动

💐 爱在母亲节，感恩有你！

亲爱的家长：

母亲节即将到来，XX艺术中心特别策划了一场充满爱的活动：

🌸 活动主题：感恩母亲，爱在心间

🎭 活动内容：
  ✨ 亲子互动游戏
  ✨ 孩子为妈妈制作礼物
  ✨ 才艺表演（献给妈妈的歌）
  ✨ "妈妈我想对您说"环节
  ✨ 合影留念

📅 活动时间：5月X日 XX:XX-XX:XX
📍 活动地点：XX艺术中心
👧 参与对象：X-X岁儿童及妈妈

🎁 惊喜福利：
  📌 每位妈妈获赠康乃馨一支
  📌 亲子写真一张
  📌 现场报名享母亲节特惠

🎫 参与方式：
  转发朋友圈+评论"我要参加"
  截图发给老师即可报名

名额有限，快来和妈妈一起度过难忘的母亲节吧！💕`,
      },
    ],
  },
  {
    type: "促销活动",
    icon: "🎁",
    color: "bg-red-100 text-red-700 border-red-200",
    templates: [
      {
        title: "周年庆活动",
        description: "机构周年庆促销方案",
        content: `【XX艺术中心】X周年庆典！超值优惠来袭！

🎉 感恩有您，一路同行！

XX艺术中心X岁啦！为了感谢各位家长的支持，我们准备了超值优惠活动：

💥 超值优惠：
  📌 全场课程X折起
  📌 报名即送价值XXX元大礼包
  📌 老带新，双方各减XXX元
  📌 充值XXX元送XXX元
  📌 抽奖赢取免单机会

🎁 大礼包包含：
  ✅ 精美教材
  ✅ 练习服
  ✅ 学员专属书包
  ✅ XX节免费课程

📅 活动时间：X月X日-X月X日
📍 活动地点：XX艺术中心

⚠️ 特别提醒：
  • 优惠名额有限，仅限前XX名
  • 活动期间报名，额外赠送XX
  • 推荐好友报名，推荐人和好友都有礼

📞 咨询热线：XXXXXXXXXXX
📍 地址：XXXXXXXXXXX

错过再等一年！快来抢购吧！🌟`,
      },
      {
        title: "双十一活动",
        description: "双十一促销活动方案",
        content: `【XX艺术中心】双十一狂欢节！

🛒 双十一来啦！课程钜惠！

亲爱的家长：

XX艺术中心双十一特别活动开始啦！

💥 惊爆价：
  🔥 11.11元抢价值XXX元体验课（限前XX名）
  🔥 课程包低至X折
  🔥 报名立减XXX元
  🔥 两人同行，一人免单

🎁 双十一特惠套餐：
  
  【套餐A】XX课程包
  原价：XXXX元
  双十一价：XXXX元
  赠送：教材+练习服+XX节课程

  【套餐B】XX课程包
  原价：XXXX元
  双十一价：XXXX元
  赠送：教材+练习服+XX节课程+XX

⏰ 活动时间：
  预售期：X月X日-X月X日
  爆款日：11月11日当天

⚠️ 温馨提示：
  • 名额有限，先到先得
  • 定金XX元可抵XX元
  • 支持分期付款

📞 抢购热线：XXXXXXXXXXX
📍 地址：XXXXXXXXXXX

错过再等一年！快来抢购！🛍️`,
      },
    ],
  },
  {
    type: "学员展示",
    icon: "🌟",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    templates: [
      {
        title: "学员成果展示",
        description: "学员学习成果展示文案",
        content: `【XX艺术中心】学员风采展示 ✨

🌟 让我们一起见证成长！

恭喜XX小朋友完成XX课程的学习！

从刚开始的零基础，到现在能够XX，孩子的进步我们有目共睹！

📊 学习成果：
  ✅ 掌握了XX技能
  ✅ 能够独立完成XX
  ✅ 参加了XX演出/比赛
  ✅ 获得了XX证书/奖项

👏 感谢家长的信任和支持！
👏 感谢老师的专业指导！

🎯 下一步计划：
  继续学习XX课程，向更高水平进发！

💡 想让孩子也拥有这样的蜕变吗？
  联系我们，开启孩子的艺术之旅！
  
📞 咨询热线：XXXXXXXXXXX
📍 地址：XXXXXXXXXXX

#XX艺术中心 #学员风采 #艺术教育`,
      },
      {
        title: "学员生日祝福",
        description: "学员生日祝福文案",
        content: `【XX艺术中心】生日快乐！🎂

🎈 祝XX小朋友生日快乐！

又长大一岁啦！愿你在艺术的道路上越走越远，越来越棒！

🌟 这一年，你在XX艺术中心：
  • 完成了XX课程的学习
  • 参加了XX次演出
  • 获得了XX的进步
  • 收获了友谊和快乐

🎁 老师送你的生日祝福：
  （老师寄语）

💕 感谢家长的信任，让我们一起见证孩子的成长！

💡 想给孩子一个有意义的童年吗？
  欢迎加入XX艺术中心大家庭！

📞 咨询热线：XXXXXXXXXXX

#生日快乐 #XX艺术中心 #成长记录`,
      },
    ],
  },
];

export default function ActivitiesPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customActivity, setCustomActivity] = useState({
    title: "",
    type: "体验课",
    description: "",
    content: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("已复制到剪贴板");
  };

  const handlePreview = (activity: any) => {
    setSelectedActivity(activity);
    setShowPreviewModal(true);
  };

  const handleGenerateAI = async () => {
    if (!customActivity.title) {
      toast.error("请输入活动主题");
      return;
    }

    setIsGenerating(true);
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
              content: `你是一位专业的教培机构活动策划师，擅长撰写各种活动方案和文案。
请根据用户提供的活动主题，生成一份完整的活动策划文案。

要求：
1. 文案要有吸引力，符合教培机构的专业形象
2. 内容包括活动时间、地点、内容、福利、报名方式等
3. 使用表情符号增加亲和力
4. 格式清晰，便于家长阅读
5. 结尾要有号召性用语`,
            },
            {
              role: "user",
              content: `请帮我策划一个${customActivity.type}活动，主题是：${customActivity.title}。

${customActivity.description ? `活动简介：${customActivity.description}` : ""}`,
            },
          ],
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (reader) {
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
                result += json.content;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      setCustomActivity({ ...customActivity, content: result });
      toast.success("文案生成成功！");
    } catch (error) {
      console.error("生成失败:", error);
      toast.error("生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredTemplates = selectedType === "all"
    ? activityTemplates
    : activityTemplates.filter((t) => t.type === selectedType);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景效果 */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-pink-50/30 to-slate-50 -z-10">
        <div className="absolute inset-0 opacity-30" 
          style={{
            backgroundImage: `linear-gradient(rgba(236, 72, 153, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(236, 72, 153, 0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-pink-600" />
              <span className="font-semibold text-gray-900">活动策划</span>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              AI 生成
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 分类标签 */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={selectedType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("all")}
            className={selectedType === "all" ? "bg-pink-600 hover:bg-pink-700" : ""}
          >
            全部模板
          </Button>
          {activityTemplates.map((template) => (
            <Button
              key={template.type}
              variant={selectedType === template.type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(template.type)}
              className={selectedType === template.type ? "bg-pink-600 hover:bg-pink-700" : ""}
            >
              {template.icon} {template.type}
            </Button>
          ))}
        </div>

        {/* 模板列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTemplates.map((category) =>
            category.templates.map((template, index) => (
              <Card
                key={`${category.type}-${index}`}
                className="bg-white/80 backdrop-blur-sm border-gray-100 hover:shadow-lg transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={category.color}>
                        {category.icon} {category.type}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-2">{template.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{template.description}</p>

                  <div className="text-sm text-gray-600 line-clamp-3 mb-3 whitespace-pre-wrap">
                    {template.content.slice(0, 150)}...
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview({ ...template, type: category.type, icon: category.icon })}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      预览
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCopy(template.content, `${category.type}-${index}`)}
                    >
                      {copiedId === `${category.type}-${index}` ? (
                        <><Check className="w-4 h-4 mr-1" /> 已复制</>
                      ) : (
                        <><Copy className="w-4 h-4 mr-1" /> 复制</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* 创建活动弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-600" />
                AI 生成活动文案
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                ✕
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">活动主题 *</label>
                <Input
                  value={customActivity.title}
                  onChange={(e) => setCustomActivity({ ...customActivity, title: e.target.value })}
                  placeholder="如：国庆节体验课活动"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">活动类型</label>
                <select
                  value={customActivity.type}
                  onChange={(e) => setCustomActivity({ ...customActivity, type: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm"
                >
                  <option value="体验课">体验课</option>
                  <option value="节日活动">节日活动</option>
                  <option value="促销活动">促销活动</option>
                  <option value="学员展示">学员展示</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">活动简介（可选）</label>
                <Textarea
                  value={customActivity.description}
                  onChange={(e) => setCustomActivity({ ...customActivity, description: e.target.value })}
                  placeholder="简单描述活动内容、目标人群等..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600"
              >
                {isGenerating ? "生成中..." : "✨ AI 生成文案"}
              </Button>

              {customActivity.content && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">生成结果</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(customActivity.content, "custom")}
                    >
                      {copiedId === "custom" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-80 overflow-y-auto">
                    {customActivity.content}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 预览弹窗 */}
      {showPreviewModal && selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-600" />
                {selectedActivity.title}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPreviewModal(false)}>
                ✕
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-pink-100 text-pink-700">
                  {selectedActivity.icon} {selectedActivity.type}
                </Badge>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                {selectedActivity.content}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPreviewModal(false)}
                >
                  关闭
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600"
                  onClick={() => {
                    handleCopy(selectedActivity.content, "preview");
                    setShowPreviewModal(false);
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  复制文案
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
