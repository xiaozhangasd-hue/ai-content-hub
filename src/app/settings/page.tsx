"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ArrowLeft, Store, Sparkles, Check, Loader2, Camera, X, Lightbulb, BookOpen, Users, Star, Palette, MessageSquare, PartyPopper, Building2, ChevronRight } from "lucide-react";
import { SUBJECT_CATEGORIES, inferSubjectsFromName, getTargetAgeBySubject, type MerchantInfo } from "@/lib/prompt-generator";
import { useTheme } from "@/contexts/ThemeContext";

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500">加载中...</p>
      </div>
    </div>
  );
}

function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isWelcome, setIsWelcome] = useState(false);
  
  const [formData, setFormData] = useState<MerchantInfo>({
    name: "",
    city: "",
    address: "",
    phone: "",
    category: "",
    subjects: [],
    targetAge: "",
    features: [],
    slogan: "",
    philosophy: "",
    brandStyle: "",
    brandColor: "",
    logoUrl: "",
  });

  // 特色优势输入
  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => {
    // 检查是否是新注册用户
    if (searchParams.get("welcome") === "1") {
      setIsWelcome(true);
    }
    
    // 加载已保存的信息
    const saved = localStorage.getItem("merchantInfo");
    if (saved) {
      const data = JSON.parse(saved);
      setFormData(data);
      if (data.logoUrl) {
        setLogoPreview(data.logoUrl);
      }
    }
  }, [searchParams]);

  // 机构名称变化时，智能推断科目
  useEffect(() => {
    if (formData.name && !formData.category) {
      const inferred = inferSubjectsFromName(formData.name);
      if (inferred[0] !== "综合课程") {
        // 找到对应的分类
        for (const [category, subjects] of Object.entries(SUBJECT_CATEGORIES)) {
          if (subjects.some(s => inferred.includes(s))) {
            setFormData(prev => ({
              ...prev,
              category,
              subjects: inferred,
            }));
            toast.success(`已智能识别为「${category}」`);
            break;
          }
        }
      }
    }
  }, [formData.name]);

  // 科目变化时，自动设置目标年龄
  useEffect(() => {
    if (formData.subjects.length > 0 && !formData.targetAge) {
      const age = getTargetAgeBySubject(formData.subjects[0]);
      setFormData(prev => ({ ...prev, targetAge: age }));
    }
  }, [formData.subjects]);

  // Logo上传
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("图片大小不能超过2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setLogoPreview(url);
        setFormData(prev => ({ ...prev, logoUrl: url }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 添加特色
  const addFeature = () => {
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput("");
    }
  };

  // 保存信息
  const handleSave = async () => {
    if (!formData.name || !formData.city || !formData.address || !formData.phone) {
      toast.error("请填写完整的机构信息");
      return;
    }

    setIsLoading(true);
    try {
      localStorage.setItem("merchantInfo", JSON.stringify(formData));
      toast.success("机构信息保存成功！");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      toast.error("保存失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 获取当前分类下的科目
  const availableSubjects = formData.category ? SUBJECT_CATEGORIES[formData.category as keyof typeof SUBJECT_CATEGORIES] || [] : [];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-[#0a0e1a] via-[#0d1425] to-[#0a1628]' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30'}`}>
      {/* 背景光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 ${isDark ? 'bg-blue-500/15' : 'bg-blue-400/20'} rounded-full blur-3xl`} />
        <div className={`absolute top-1/2 -left-20 w-60 h-60 ${isDark ? 'bg-purple-500/10' : 'bg-purple-400/15'} rounded-full blur-3xl`} />
      </div>
      
      {/* 顶部导航 */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b ${isDark ? 'bg-[#0d1425]/80 border-white/5' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className={`gap-1 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>机构信息配置</h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>一次填写，全局复用</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 欢迎提示 */}
          {isWelcome && (
            <Alert className={`${isDark ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'}`}>
              <PartyPopper className="w-5 h-5 text-blue-500" />
              <AlertDescription className="ml-2">
                <span className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>欢迎加入南都AI！</span>
                <span className={`${isDark ? 'text-blue-200' : 'text-blue-700'} ml-1`}>请完善您的机构信息，系统将根据这些信息为您生成更精准的营销内容。</span>
              </AlertDescription>
            </Alert>
          )}
          
          {/* 校区管理入口 */}
          <Card 
            className={`cursor-pointer transition-all ${isDark ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 hover:from-emerald-500/15 hover:to-teal-500/15' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:from-emerald-100 hover:to-teal-100'}`}
            onClick={() => router.push("/settings/campus")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>校区管理</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>管理连锁机构的各个校区，实现数据隔离</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
              </div>
            </CardContent>
          </Card>
          
          {/* 基础信息 */}
          <Card className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-500" />
                <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>基础信息</CardTitle>
                <Badge className={`${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>必填</Badge>
              </div>
              <CardDescription className={isDark ? 'text-gray-400' : ''}>填写机构基本信息，AI将根据这些信息智能生成内容</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Logo和名称 */}
              <div className="flex gap-6">
                <div className="space-y-2">
                  <Label className={isDark ? 'text-gray-300' : ''}>机构Logo</Label>
                  <label className="cursor-pointer block">
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <div className={`w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${isDark ? 'bg-white/5 border-white/20 hover:border-blue-400' : 'bg-gray-100 border-gray-300 hover:border-blue-400'}`}>
                      {logoPreview ? (
                        <div className="relative w-full h-full">
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogoPreview("");
                              setFormData(prev => ({ ...prev, logoUrl: "" }));
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <Camera className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      )}
                    </div>
                  </label>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label className={isDark ? 'text-gray-300' : ''}>机构名称 <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="请输入机构名称"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : ''}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={isDark ? 'text-gray-300' : ''}>所在城市 <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="例如：北京市"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className={isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={isDark ? 'text-gray-300' : ''}>联系电话 <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="例如：13800138000"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={isDark ? 'text-gray-300' : ''}>详细地址 <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="例如：朝阳区建国路88号SOHO现代城A座"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className={isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : ''}
                />
              </div>
            </CardContent>
          </Card>

          {/* 经营信息 */}
          <Card className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>经营信息</CardTitle>
                <Badge variant="outline" className={isDark ? 'border-white/20 text-gray-400' : ''}>选填</Badge>
              </div>
              <CardDescription className={isDark ? 'text-gray-400' : ''}>选择经营类目，AI将自动优化生成内容</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={isDark ? 'text-gray-300' : ''}>行业分类</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subjects: [] }))}
                  >
                    <SelectTrigger className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}>
                      <SelectValue placeholder="选择行业分类" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? 'bg-[#1a1f2e] border-white/10' : ''}>
                      {Object.keys(SUBJECT_CATEGORIES).map((category) => (
                        <SelectItem key={category} value={category} className={isDark ? 'text-gray-300 focus:bg-white/5' : ''}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={isDark ? 'text-gray-300' : ''}>目标年龄段</Label>
                  <Select
                    value={formData.targetAge}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, targetAge: value }))}
                  >
                    <SelectTrigger className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}>
                      <SelectValue placeholder="选择年龄段" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? 'bg-[#1a1f2e] border-white/10' : ''}>
                      <SelectItem value="0-3岁" className={isDark ? 'text-gray-300 focus:bg-white/5' : ''}>0-3岁（早教）</SelectItem>
                      <SelectItem value="3-6岁" className={isDark ? 'text-gray-300 focus:bg-white/5' : ''}>3-6岁（幼儿）</SelectItem>
                      <SelectItem value="4-12岁" className={isDark ? 'text-gray-300 focus:bg-white/5' : ''}>4-12岁（少儿）</SelectItem>
                      <SelectItem value="6-15岁" className={isDark ? 'text-gray-300 focus:bg-white/5' : ''}>6-15岁（青少年）</SelectItem>
                      <SelectItem value="全年龄段" className={isDark ? 'text-gray-300 focus:bg-white/5' : ''}>全年龄段</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 科目选择 */}
              {formData.category && (
                <div className="space-y-2">
                  <Label className={isDark ? 'text-gray-300' : ''}>开设课程（可多选）</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableSubjects.map((subject) => (
                      <Badge
                        key={subject}
                        variant={formData.subjects.includes(subject) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          formData.subjects.includes(subject)
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : isDark ? "border-white/20 text-gray-300 hover:bg-white/10" : "hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            subjects: prev.subjects.includes(subject)
                              ? prev.subjects.filter(s => s !== subject)
                              : [...prev.subjects, subject],
                          }));
                        }}
                      >
                        {subject}
                        {formData.subjects.includes(subject) && <Check className="w-3 h-3 ml-1" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 特色优势 */}
              <div className="space-y-2">
                <Label className={isDark ? 'text-gray-300' : ''}>特色优势</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="例如：小班教学、名师授课"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addFeature()}
                    className={isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : ''}
                  />
                  <Button variant="outline" onClick={addFeature} className={isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : ''}>添加</Button>
                </div>
                {formData.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={`cursor-pointer ${isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'hover:bg-gray-200'}`}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            features: prev.features.filter((_, i) => i !== index),
                          }));
                        }}
                      >
                        {feature} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 品牌信息 */}
          <Card className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-pink-500" />
                <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>品牌信息</CardTitle>
                <Badge variant="outline" className={isDark ? 'border-white/20 text-gray-400' : ''}>选填</Badge>
              </div>
              <CardDescription className={isDark ? 'text-gray-400' : ''}>打造独特的品牌形象</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className={`flex items-center gap-1 ${isDark ? 'text-gray-300' : ''}`}>
                  <MessageSquare className="w-3 h-3" />
                  企业标语
                </Label>
                <Input
                  placeholder="例如：让每个孩子都能发光"
                  value={formData.slogan}
                  onChange={(e) => setFormData(prev => ({ ...prev, slogan: e.target.value }))}
                  className={isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label className={`flex items-center gap-1 ${isDark ? 'text-gray-300' : ''}`}>
                  <Star className="w-3 h-3" />
                  教育理念
                </Label>
                <Input
                  placeholder="例如：寓教于乐，快乐成长"
                  value={formData.philosophy}
                  onChange={(e) => setFormData(prev => ({ ...prev, philosophy: e.target.value }))}
                  className={isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={isDark ? 'text-gray-300' : ''}>品牌调性</Label>
                  <Select
                    value={formData.brandStyle}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, brandStyle: value }))}
                  >
                    <SelectTrigger className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}>
                      <SelectValue placeholder="选择调性" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? 'bg-[#1a1f2e] border-white/10' : ''}>
                      <SelectItem value="专业权威" className={isDark ? 'text-gray-300 focus:bg-white/5' : ''}>专业权威</SelectItem>
                      <SelectItem value="温馨亲和" className={isDark ? 'text-gray-300 focus:bg-white/5' : ''}>温馨亲和</SelectItem>
                      <SelectItem value="活泼有趣" className={isDark ? 'text-gray-300 focus:bg-white/5' : ''}>活泼有趣</SelectItem>
                      <SelectItem value="高端精品" className={isDark ? 'text-gray-300 focus:bg-white/5' : ''}>高端精品</SelectItem>
                      <SelectItem value="现代简约" className={isDark ? 'text-gray-300 focus:bg-white/5' : ''}>现代简约</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={isDark ? 'text-gray-300' : ''}>品牌色</Label>
                  <div className="flex gap-2">
                    {["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899"].map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          formData.brandColor === color ? "border-gray-900 scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, brandColor: color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI智能提示 */}
          <Card className={`${isDark ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                  <p className="font-medium mb-1">💡 智能提示</p>
                  <p>填写完整信息后，系统将自动根据您的行业、科目、品牌调性，智能生成专业的营销内容提示词。您无需了解AI技术，只需选择场景即可。</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 保存按钮 */}
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full h-12 text-base font-medium gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                保存机构信息
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
