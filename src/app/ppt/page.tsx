"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Presentation,
  Upload,
  FileText,
  Download,
  ArrowLeft,
  Sparkles,
  Loader2,
  CheckCircle2,
  FileUp,
  File,
  Settings,
  Eye,
  Wand2,
  Palette,
  Layout,
} from "lucide-react";
import { getThemeList, type SlideData, type ContentAnalysis } from "@/lib/ppt-templates";

// 主题列表
const THEMES = getThemeList();

// 按类别分组的主题
const THEMES_BY_CATEGORY = {
  education: { name: '教育培训', themes: THEMES.filter(t => t.category === 'education') },
  business: { name: '商务汇报', themes: THEMES.filter(t => t.category === 'business') },
  creative: { name: '创意设计', themes: THEMES.filter(t => t.category === 'creative') },
  minimal: { name: '极简风格', themes: THEMES.filter(t => t.category === 'minimal') },
  tech: { name: '科技感', themes: THEMES.filter(t => t.category === 'tech') },
};

export default function PPTGeneratorPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 状态
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [selectedTheme, setSelectedTheme] = useState("education-blue");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ContentAnalysis | null>(null);
  const [slides, setSlides] = useState<SlideData[]>([]);
  
  // 文件上传处理
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件类型
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
        toast.error("请上传 PDF、Word 或文本文件");
        return;
      }
      
      // 检查文件大小（最大10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast.error("文件大小不能超过10MB");
        return;
      }
      
      setUploadFile(file);
      setAnalysisResult(null);
      setSlides([]);
    }
  }, []);
  
  // 拖拽上传
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(fakeEvent);
    }
  }, [handleFileChange]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);
  
  // 分析内容
  const handleAnalyze = useCallback(async () => {
    if (inputMode === 'file' && !uploadFile) {
      toast.error("请先上传文件");
      return;
    }
    
    if (inputMode === 'text' && !textContent.trim()) {
      toast.error("请输入内容");
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      if (inputMode === 'file' && uploadFile) {
        // 文件上传分析
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('theme', selectedTheme);
        
        // 直接生成PPT
        setIsGenerating(true);
        
        const response = await fetch('/api/ppt', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '生成失败');
        }
        
        // 下载PPT
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${uploadFile.name.replace(/\.[^.]+$/, '')}.pptx`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success("PPT生成成功！");
      } else {
        // 文本内容分析
        const response = await fetch('/api/ppt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze',
            content: textContent,
          }),
        });
        
        if (!response.ok) {
          throw new Error('分析失败');
        }
        
        const data = await response.json();
        setAnalysisResult(data.analysis);
        
        // 生成slides预览
        const previewSlides: SlideData[] = [];
        
        // 封面
        previewSlides.push({
          layout: 'cover',
          title: data.analysis.title,
          subtitle: data.analysis.subtitle,
        });
        
        // 目录
        if (data.analysis.structure.sections.length > 2) {
          previewSlides.push({
            layout: 'toc',
            title: '目录',
            content: {
              sections: data.analysis.structure.sections.map((s: any, i: number) => ({
                number: i + 1,
                title: s.title,
              })),
            },
          });
        }
        
        // 内容页
        data.analysis.structure.sections.forEach((section: any, index: number) => {
          if (section.level === 1) {
            previewSlides.push({
              layout: 'section',
              title: section.title,
              content: { sections: [{ number: index + 1, title: section.title }] },
            });
          }
          
          previewSlides.push({
            layout: section.suggestedLayout,
            title: section.title,
            content: {
              paragraphs: section.content,
              items: section.keyPoints,
            },
          });
        });
        
        // 总结
        const keyPoints = data.analysis.structure.sections
          .flatMap((s: any) => s.keyPoints)
          .slice(0, 5);
        
        if (keyPoints.length > 0) {
          previewSlides.push({
            layout: 'summary',
            title: '总结',
            content: { items: keyPoints },
          });
        }
        
        // 结束
        previewSlides.push({
          layout: 'ending',
          title: '谢谢观看',
        });
        
        setSlides(previewSlides);
        toast.success("内容分析完成！");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setIsAnalyzing(false);
      setIsGenerating(false);
    }
  }, [inputMode, uploadFile, textContent, selectedTheme]);
  
  // 生成PPT
  const handleGeneratePPT = useCallback(async () => {
    if (slides.length === 0) {
      toast.error("请先分析内容");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          title: analysisResult?.title || '演示文稿',
          subtitle: analysisResult?.subtitle,
          theme: selectedTheme,
          slides,
        }),
      });
      
      if (!response.ok) {
        throw new Error('生成失败');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${analysisResult?.title || '演示文稿'}.pptx`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("PPT下载成功！");
    } catch (error) {
      toast.error("生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  }, [slides, analysisResult, selectedTheme]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Presentation className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">AI PPT生成</h1>
              <p className="text-xs text-gray-500">上传文档，智能生成专业PPT</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 功能介绍 */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">智能PPT生成器</h2>
          <p className="text-gray-600">上传Word/PDF文档或输入文字，AI自动分析内容结构，生成专业演示文稿</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：输入区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 输入模式切换 */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <Button
                    variant={inputMode === 'file' ? 'default' : 'ghost'}
                    onClick={() => setInputMode('file')}
                    className={inputMode === 'file' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    上传文件
                  </Button>
                  <Button
                    variant={inputMode === 'text' ? 'default' : 'ghost'}
                    onClick={() => setInputMode('text')}
                    className={inputMode === 'text' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    输入文字
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {inputMode === 'file' ? (
                  // 文件上传区域
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <File className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{uploadFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(uploadFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                    ) : (
                      <>
                        <FileUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">点击或拖拽文件到此处上传</p>
                        <p className="text-sm text-gray-400">支持 PDF、Word、TXT 文件，最大 10MB</p>
                      </>
                    )}
                  </div>
                ) : (
                  // 文本输入区域
                  <Textarea
                    placeholder="请输入或粘贴您的文档内容...&#10;&#10;例如：&#10;一、课程介绍&#10;本课程主要讲解...&#10;&#10;二、核心内容&#10;1. 基础概念...&#10;2. 实践应用..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="min-h-[300px] bg-gray-50 border-gray-200"
                  />
                )}
              </CardContent>
            </Card>
            
            {/* 分析结果预览 */}
            {analysisResult && slides.length > 0 && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-500" />
                    内容预览
                  </CardTitle>
                  <CardDescription>
                    共生成 {slides.length} 页幻灯片
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    {slides.map((slide, index) => (
                      <div
                        key={index}
                        className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-2 flex flex-col"
                      >
                        <div className="text-xs text-gray-500 mb-1">
                          {index + 1} / {slides.length}
                        </div>
                        <div className="text-xs font-medium text-gray-700 truncate">
                          {slide.title}
                        </div>
                        <div className="mt-auto">
                          <Badge variant="outline" className="text-[10px]">
                            {slide.layout}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* 右侧：设置面板 */}
          <div className="space-y-6">
            {/* 主题选择 */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-500" />
                  选择主题风格
                </CardTitle>
                <CardDescription>AI会根据内容推荐合适的主题</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(THEMES_BY_CATEGORY).map(([category, data]) => (
                  <div key={category}>
                    <Label className="text-xs text-gray-500">{data.name}</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {data.themes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => setSelectedTheme(theme.id)}
                          className={`p-2 rounded-lg border-2 text-left transition-all ${
                            selectedTheme === theme.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <span className="text-xs font-medium">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* AI推荐 */}
            {analysisResult && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 mb-1">AI 分析结果</p>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• 内容类型：{analysisResult.category}</p>
                        <p>• 推荐主题：{analysisResult.suggestedTheme}</p>
                        <p>• 预计页数：{analysisResult.estimatedSlides} 页</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* 操作按钮 */}
            <div className="space-y-3">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || isGenerating}
                className="w-full h-12 text-base gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isAnalyzing || isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {inputMode === 'file' ? '正在生成PPT...' : '分析中...'}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    {inputMode === 'file' ? '上传并生成PPT' : '分析内容'}
                  </>
                )}
              </Button>
              
              {slides.length > 0 && (
                <Button
                  onClick={handleGeneratePPT}
                  disabled={isGenerating}
                  variant="outline"
                  className="w-full h-12 text-base gap-2 border-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      下载PPT
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* 功能说明 */}
            <Card className="bg-gray-50 border-0">
              <CardContent className="py-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  支持的布局类型
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['封面页', '目录页', '章节页', '内容页', '双栏布局', '特点展示', '对比页', '总结页', '结束页'].map((layout) => (
                    <Badge key={layout} variant="outline" className="text-xs">
                      {layout}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
