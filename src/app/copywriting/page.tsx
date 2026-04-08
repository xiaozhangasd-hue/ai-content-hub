"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  Store,
  Briefcase,
  Users,
  Palette,
  BookOpen,
  Star,
  Loader2,
  FileText,
  MessageSquare,
  Lightbulb,
} from "lucide-react";

interface User {
  id: string;
  phone: string;
  name?: string;
}

interface ShopInfoInput {
  shopName: string;
  city: string;
  address: string;
  phone: string;
  businessScope?: string;
  targetAudience?: string;
  brandTone?: string;
  mainCourses?: string;
  features?: string;
}

export default function CopywritingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [result, setResult] = useState<string>("");
  const [inferredInfo, setInferredInfo] = useState<ShopInfoInput | null>(null);

  const [formData, setFormData] = useState<ShopInfoInput>({
    shopName: "",
    city: "",
    address: "",
    phone: "",
    businessScope: "",
    targetAudience: "",
    brandTone: "",
    mainCourses: "",
    features: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));

    const savedShopInfo = localStorage.getItem("shopInfo");
    if (savedShopInfo) {
      const saved = JSON.parse(savedShopInfo);
      setFormData({
        shopName: saved.shopName || "",
        city: saved.city || "",
        address: saved.address || "",
        phone: saved.phone || "",
        businessScope: saved.businessScope || "",
        targetAudience: saved.targetAudience || "",
        brandTone: saved.brandTone || "",
        mainCourses: saved.mainCourses?.join("、") || "",
        features: saved.features?.join("、") || "",
      });
    }
  }, [router]);

  useEffect(() => {
    if (formData.shopName) {
      localStorage.setItem("shopInfo", JSON.stringify(formData));
    }
  }, [formData]);

  const handleGenerate = async () => {
    if (!formData.shopName || !formData.city || !formData.address || !formData.phone) {
      toast.error("请填写完整的机构信息");
      return;
    }

    setIsLoading(true);
    setResult("");
    setInferredInfo(null);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/claude/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "生成失败");
      }

      setResult(data.content);
      setInferredInfo(data.inferredInfo);
      toast.success("文案生成成功！");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    toast.success("已复制到剪贴板");
    setTimeout(() => setCopied(null), 2000);
  };

  const parseCopywritings = (content: string): { title: string; content: string }[] => {
    const results: { title: string; content: string }[] = [];
    const lines = content.split('\n');
    let currentTitle = "";
    let currentContent = "";
    
    for (const line of lines) {
      const titleMatch = line.match(/^\d+[.、．]\s*(.+)/);
      if (titleMatch) {
        if (currentContent.trim()) {
          results.push({ title: currentTitle || "文案", content: currentContent.trim() });
        }
        currentTitle = titleMatch[1].trim();
        currentContent = "";
      } else if (line.trim()) {
        currentContent += line + "\n";
      }
    }
    
    if (currentContent.trim()) {
      results.push({ title: currentTitle || "文案", content: currentContent.trim() });
    }
    
    if (results.length === 0) {
      results.push({ title: "生成的文案", content: content });
    }
    
    return results;
  };

  if (!user) {
    return null;
  }

  const copywritings = result ? parseCopywritings(result) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">智能文案生成</h1>
              <p className="text-xs text-gray-500">AI自动生成多条宣传文案</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：信息输入 */}
          <div className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-base">机构信息</CardTitle>
                  <Badge className="bg-blue-100 text-blue-600">必填</Badge>
                </div>
                <CardDescription className="text-xs">
                  填写基础信息，AI将智能生成多条宣传文案
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-sm text-gray-700">
                    机构名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="例如：欧若拉少儿口才"
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">城市 <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="例如：南阳市"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">联系电话 <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="例如：17538235191"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">详细地址 <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="例如：北京路271号"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-orange-500" />
                  <CardTitle className="text-base">智能匹配</CardTitle>
                  <Badge variant="outline" className="text-xs">选填</Badge>
                </div>
                <CardDescription className="text-xs">
                  不填写系统将自动推断
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-sm text-gray-700">
                      <Briefcase className="w-3 h-3" />
                      经营范围
                    </Label>
                    <Select
                      value={formData.businessScope}
                      onValueChange={(value) => setFormData({ ...formData, businessScope: value })}
                    >
                      <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900">
                        <SelectValue placeholder="自动推断" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="少儿口才">少儿口才</SelectItem>
                        <SelectItem value="少儿编程">少儿编程</SelectItem>
                        <SelectItem value="艺术培训">艺术培训</SelectItem>
                        <SelectItem value="舞蹈培训">舞蹈培训</SelectItem>
                        <SelectItem value="音乐培训">音乐培训</SelectItem>
                        <SelectItem value="美术培训">美术培训</SelectItem>
                        <SelectItem value="英语培训">英语培训</SelectItem>
                        <SelectItem value="学科辅导">学科辅导</SelectItem>
                        <SelectItem value="职业培训">职业培训</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-sm text-gray-700">
                      <Users className="w-3 h-3" />
                      目标人群
                    </Label>
                    <Select
                      value={formData.targetAudience}
                      onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}
                    >
                      <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900">
                        <SelectValue placeholder="自动推断" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="儿童">儿童（3-12岁）</SelectItem>
                        <SelectItem value="青少年">青少年（12-18岁）</SelectItem>
                        <SelectItem value="成年人">成年人</SelectItem>
                        <SelectItem value="职场人士">职场人士</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-sm text-gray-700">
                    <Palette className="w-3 h-3" />
                    品牌调性
                  </Label>
                  <Select
                    value={formData.brandTone}
                    onValueChange={(value) => setFormData({ ...formData, brandTone: value })}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue placeholder="默认：亲和温暖" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="专业权威">专业权威</SelectItem>
                      <SelectItem value="亲和温暖">亲和温暖</SelectItem>
                      <SelectItem value="高端时尚">高端时尚</SelectItem>
                      <SelectItem value="活泼可爱">活泼可爱</SelectItem>
                      <SelectItem value="简洁商务">简洁商务</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-sm text-gray-700">
                    <BookOpen className="w-3 h-3" />
                    主要课程
                  </Label>
                  <Input
                    placeholder="例如：演讲、辩论、主持"
                    value={formData.mainCourses}
                    onChange={(e) => setFormData({ ...formData, mainCourses: e.target.value })}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-sm text-gray-700">
                    <Star className="w-3 h-3" />
                    特色优势
                  </Label>
                  <Input
                    placeholder="例如：小班教学、国家级师资"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在生成文案...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  一键生成5条文案
                </>
              )}
            </Button>
          </div>

          {/* 右侧：生成结果 */}
          <div className="space-y-4">
            {result ? (
              <>
                {inferredInfo && (
                  <Card className="bg-blue-50 border border-blue-200">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-600">AI智能推断：</span>
                        <span className="text-gray-900">
                          经营范围=<strong>{inferredInfo.businessScope}</strong>，
                          目标人群=<strong>{inferredInfo.targetAudience}</strong>
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {copywritings.map((item, index) => (
                  <Card key={index} className="bg-white border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <CardTitle className="text-sm">{item.title}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(item.content, index)}
                          className="h-8"
                        >
                          {copied === index ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              复制
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                        {item.content}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-orange-500" />
                      使用建议
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 space-y-2">
                    <p>• <strong>朋友圈</strong>：选择"痛点切入型"或"效果展示型"，配一张机构照片</p>
                    <p>• <strong>微信群</strong>：选择"情感共鸣型"或"简洁直接型"，适合家长群推广</p>
                    <p>• <strong>海报传单</strong>：选择"专业权威型"，适合印刷宣传</p>
                    <p>• <strong>公众号</strong>：可选择任意文案，在此基础上扩展</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-white border-0 shadow-sm h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">填写机构信息</h3>
                  <p className="text-sm text-gray-500">
                    输入基础信息后，AI将自动生成5条不同风格的宣传文案
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
