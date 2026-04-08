"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Share2,
  Search,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  ChevronRight,
  Settings,
  AlertCircle,
} from "lucide-react";
import {
  generateMomentsForSubjects,
  getAllSubjects,
  SUBJECT_CONFIG,
  type MomentContent,
} from "@/lib/moment-templates";

interface MerchantInfo {
  name: string;
  city: string;
  address: string;
  phone: string;
  category: string;
  subjects: string[];
  targetAge: string;
  features: string[];
  slogan: string;
  philosophy: string;
  brandStyle: string;
  brandColor: string;
  logoUrl?: string;
}

const categories = [
  { id: "all", name: "全部素材", icon: BookOpen },
  { id: "教育知识", name: "教育知识", icon: "📚" },
  { id: "学员案例", name: "学员案例", icon: "🌟" },
  { id: "课堂花絮", name: "课堂花絮", icon: "📸" },
  { id: "节日祝福", name: "节日祝福", icon: "🎉" },
  { id: "机构宣传", name: "机构宣传", icon: "🏆" },
  { id: "招生信息", name: "招生信息", icon: "📢" },
];

export default function MomentsPage() {
  const router = useRouter();
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  const [momentTemplates, setMomentTemplates] = useState<MomentContent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<MomentContent | null>(null);
  const [customContent, setCustomContent] = useState({
    topic: "",
    style: "professional",
    content: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // 加载商家信息和生成素材
  useEffect(() => {
    const saved = localStorage.getItem("merchantInfo");
    if (saved) {
      const info = JSON.parse(saved);
      setMerchantInfo(info);
      
      // 根据科目生成素材
      if (info.subjects && info.subjects.length > 0) {
        const moments = generateMomentsForSubjects(info.subjects);
        setMomentTemplates(moments);
      }
    }
  }, []);

  const handleCopy = async (text: string, id: string) => {
    // 替换占位符
    let finalText = text;
    if (merchantInfo) {
      finalText = finalText
        .replace(/XXXXXXXXXXX/g, merchantInfo.phone || "XXXXXXXXXXX")
        .replace(/XX艺术中心/g, merchantInfo.name || "XX培训中心")
        .replace(/XX培训中心/g, merchantInfo.name || "XX培训中心");
    }
    
    await navigator.clipboard.writeText(finalText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("已复制到剪贴板");
  };

  const handlePreview = (moment: MomentContent) => {
    setSelectedMoment(moment);
    setShowPreviewModal(true);
  };

  const handleGenerateAI = async () => {
    if (!customContent.topic) {
      toast.error("请输入素材主题");
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const subject = merchantInfo?.subjects?.[0] || "课程";
      
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
              content: `你是一位专业的教培机构营销文案师，专门为${merchantInfo?.name || "培训机构"}撰写朋友圈内容。

机构信息：
- 名称：${merchantInfo?.name || "XX培训中心"}
- 类型：${merchantInfo?.category || "教育培训"}
- 主营课程：${merchantInfo?.subjects?.join("、") || "综合课程"}
- 联系电话：${merchantInfo?.phone || "XXXXXXXXXXX"}
- 地址：${merchantInfo?.city || ""}${merchantInfo?.address || ""}

请根据用户提供的主题，生成一条适合发朋友圈的文案。

要求：
1. 内容要有价值，能引起家长共鸣
2. 使用表情符号增加亲和力
3. 结构清晰，适合手机阅读
4. 适当使用换行和分段
5. 结尾可以加相关话题标签
6. ${customContent.style === "professional" ? "风格专业、权威" : "风格轻松、有趣"}
7. 机构名称、电话等信息使用真实的`,
            },
            {
              role: "user",
              content: `请帮我写一条关于"${customContent.topic}"的朋友圈文案。`,
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

      setCustomContent({ ...customContent, content: result });
      toast.success("文案生成成功！");
    } catch (error) {
      console.error("生成失败:", error);
      toast.error("生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // 过滤素材
  const filteredMoments = momentTemplates.filter((moment) => {
    const matchesCategory = selectedCategory === "all" || moment.category === selectedCategory;
    const matchesSubject = selectedSubject === "all" || moment.id.startsWith(selectedSubject);
    const matchesSearch = !searchQuery || 
      moment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      moment.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSubject && matchesSearch;
  });

  // 获取商家的科目列表
  const merchantSubjects = merchantInfo?.subjects || [];

  // 如果没有设置科目，显示引导页面
  if (merchantInfo && (!merchantInfo.subjects || merchantInfo.subjects.length === 0)) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-cyan-50/30 to-slate-50 -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/20 rounded-full blur-3xl" />
        </div>

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
                <Share2 className="w-5 h-5 text-cyan-600" />
                <span className="font-semibold text-gray-900">朋友圈素材库</span>
              </div>
              <div className="w-20"></div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="max-w-lg mx-auto bg-white border-cyan-200 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-cyan-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">请先设置机构类目</h2>
              <p className="text-gray-500 mb-6">
                设置您机构的主营课程后，我们将为您生成专属的朋友圈素材库，
                包含教育知识、学员案例、招生文案等内容。
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-600 mb-2">已支持的课程类型：</p>
                <div className="flex flex-wrap gap-2">
                  {getAllSubjects().slice(0, 12).map((subject) => {
                    const config = SUBJECT_CONFIG[subject as keyof typeof SUBJECT_CONFIG];
                    return (
                      <Badge key={subject} variant="outline" className="text-xs">
                        {config?.emoji} {subject}
                      </Badge>
                    );
                  })}
                  <Badge variant="outline" className="text-xs text-gray-400">
                    等{getAllSubjects().length}种课程
                  </Badge>
                </div>
              </div>

              <Button
                onClick={() => router.push("/settings")}
                className="bg-gradient-to-r from-cyan-600 to-teal-600"
              >
                <Settings className="w-4 h-4 mr-2" />
                去设置机构信息
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景效果 */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-cyan-50/30 to-slate-50 -z-10">
        <div className="absolute inset-0 opacity-30" 
          style={{
            backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/20 rounded-full blur-3xl" />
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
              <Share2 className="w-5 h-5 text-cyan-600" />
              <span className="font-semibold text-gray-900">朋友圈素材库</span>
              <Badge variant="outline" className="text-xs">{filteredMoments.length}条素材</Badge>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI 创作
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 当前机构信息 */}
        {merchantInfo && merchantInfo.subjects && merchantInfo.subjects.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-cyan-50 to-teal-50 border-cyan-200">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {merchantInfo.subjects.slice(0, 3).map((subject) => {
                      const config = SUBJECT_CONFIG[subject as keyof typeof SUBJECT_CONFIG];
                      return (
                        <Badge key={subject} variant="outline" className="bg-white border-cyan-200 text-cyan-700">
                          {config?.emoji} {subject}
                        </Badge>
                      );
                    })}
                    {merchantInfo.subjects.length > 3 && (
                      <Badge variant="outline" className="bg-white">+{merchantInfo.subjects.length - 3}</Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">专属素材库</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/settings")}
                  className="text-cyan-600 hover:text-cyan-700"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  修改
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 分类和科目筛选 */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* 科目筛选 */}
          {merchantSubjects.length > 1 && (
            <div className="flex items-center gap-2 mr-4">
              {merchantSubjects.map((subject) => {
                const config = SUBJECT_CONFIG[subject as keyof typeof SUBJECT_CONFIG];
                const count = momentTemplates.filter(m => m.id.startsWith(subject)).length;
                return (
                  <Button
                    key={subject}
                    variant={selectedSubject === subject ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSubject(subject)}
                    className={selectedSubject === subject ? "bg-teal-600 hover:bg-teal-700" : ""}
                  >
                    {config?.emoji} {subject} ({count})
                  </Button>
                );
              })}
              <Button
                variant={selectedSubject === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSubject("all")}
                className={selectedSubject === "all" ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                全部
              </Button>
            </div>
          )}
        </div>

        {/* 内容类型筛选 */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const count = cat.id === "all" 
              ? filteredMoments.length 
              : momentTemplates.filter(m => 
                  m.category === cat.id && 
                  (selectedSubject === "all" || m.id.startsWith(selectedSubject))
                ).length;
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={selectedCategory === cat.id 
                  ? "bg-cyan-600 hover:bg-cyan-700" 
                  : "border-gray-200"
                }
              >
                {typeof cat.icon === "string" ? cat.icon : <cat.icon className="w-4 h-4 mr-1" />}
                {cat.name}
                <span className="ml-1 text-xs opacity-70">({count})</span>
              </Button>
            );
          })}
        </div>

        {/* 搜索 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索标题或内容关键词..."
            className="pl-10"
          />
        </div>

        {/* 素材列表 - 卡片形式，只显示概要 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMoments.map((moment) => {
            const subjectKey = moment.id.split("-")[0];
            const config = SUBJECT_CONFIG[subjectKey as keyof typeof SUBJECT_CONFIG];
            
            return (
              <Card
                key={moment.id}
                className="bg-white/80 backdrop-blur-sm border-gray-100 hover:shadow-lg hover:border-cyan-200 transition-all cursor-pointer group"
                onClick={() => handlePreview(moment)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${config?.color || "bg-gray-100 text-gray-700"} text-xs`}>
                        {config?.emoji} {subjectKey}
                      </Badge>
                      <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 text-xs">
                        {moment.category}
                      </Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-cyan-500 transition-colors" />
                  </div>

                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-cyan-700 transition-colors">
                    {moment.title}
                  </h3>

                  <p className="text-sm text-gray-500 line-clamp-2">{moment.summary}</p>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    {moment.tags?.split(",").slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs text-gray-400">#{tag.trim()}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredMoments.length === 0 && (
          <div className="text-center py-12">
            <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">没有找到相关素材</p>
          </div>
        )}
      </main>

      {/* 预览弹窗 */}
      {showPreviewModal && selectedMoment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-white sticky top-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                  {selectedMoment.category}
                </Badge>
                <CardTitle className="text-lg">{selectedMoment.title}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowPreviewModal(false)}>
                ✕
              </Button>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto flex-1">
              <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
                {selectedMoment.content
                  .replace(/XXXXXXXXXXX/g, merchantInfo?.phone || "XXXXXXXXXXX")
                  .replace(/XX艺术中心/g, merchantInfo?.name || "XX培训中心")
                  .replace(/XX培训中心/g, merchantInfo?.name || "XX培训中心")
                }
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                {selectedMoment.tags?.split(",").map((tag) => (
                  <span key={tag} className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </CardContent>
            <div className="p-4 border-t bg-white flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPreviewModal(false)}
              >
                关闭
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600"
                onClick={() => {
                  handleCopy(selectedMoment.content, selectedMoment.id);
                  setShowPreviewModal(false);
                }}
              >
                {copiedId === selectedMoment.id ? (
                  <><Check className="w-4 h-4 mr-2" /> 已复制</>
                ) : (
                  <><Copy className="w-4 h-4 mr-2" /> 复制全文</>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* AI 创作弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-600" />
                AI 创作朋友圈素材
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                ✕
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">素材主题 *</label>
                <Input
                  value={customContent.topic}
                  onChange={(e) => setCustomContent({ ...customContent, topic: e.target.value })}
                  placeholder={`如：${merchantInfo?.subjects?.[0] || "课程"}学习的技巧、如何提高学习效率...`}
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">文案风格</label>
                <div className="flex gap-2">
                  <Button
                    variant={customContent.style === "professional" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCustomContent({ ...customContent, style: "professional" })}
                    className={customContent.style === "professional" ? "bg-cyan-600" : ""}
                  >
                    专业权威
                  </Button>
                  <Button
                    variant={customContent.style === "casual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCustomContent({ ...customContent, style: "casual" })}
                    className={customContent.style === "casual" ? "bg-cyan-600" : ""}
                  >
                    轻松有趣
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-cyan-600 to-teal-600"
              >
                {isGenerating ? "生成中..." : "✨ AI 生成文案"}
              </Button>

              {customContent.content && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">生成结果</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(customContent.content, "custom")}
                    >
                      {copiedId === "custom" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-80 overflow-y-auto">
                    {customContent.content}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
