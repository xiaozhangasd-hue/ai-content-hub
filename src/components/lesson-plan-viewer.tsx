"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText,
  Download,
  RefreshCw,
  Clock,
  Target,
  MessageCircle,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit3,
  Trash2,
} from "lucide-react";

// 教案章节类型
interface LessonSection {
  id: string;
  title: string;
  duration: string;
  linkedPageId: string;
  status?: "new" | "modified" | "deleted";
  objectives: string;
  script: string;
  interaction: string;
  teachingTips?: string;
  materials?: string[];
}

// 教案类型
interface LessonPlan {
  title: string;
  courseType: string;
  targetAudience: string;
  totalDuration: string;
  sections: LessonSection[];
  summary?: {
    addedSections: number;
    modifiedSections: number;
    deletedSections: number;
  };
}

interface LessonPlanViewerProps {
  slides: Array<{
    id: number;
    title: string;
    type: string;
    content: string[];
  }>;
  courseType: string;
  targetAudience: string;
  onLessonPlanGenerated?: (plan: LessonPlan) => void;
}

export function LessonPlanViewer({
  slides,
  courseType,
  targetAudience,
  onLessonPlanGenerated,
}: LessonPlanViewerProps) {
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // 生成教案
  const generateLessonPlan = async () => {
    if (slides.length === 0) {
      toast.error("请先生成PPT");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/course/lesson-plan-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          slides,
          courseContext: {
            courseType,
            targetAudience,
            totalDuration: `${Math.ceil(slides.length * 2)}分钟`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("生成失败");
      }

      const data = await response.json();
      setLessonPlan(data.lessonPlan);
      
      if (onLessonPlanGenerated) {
        onLessonPlanGenerated(data.lessonPlan);
      }

      toast.success(`已生成${data.lessonPlan.sections.length}个教案章节！`);
    } catch (error) {
      console.error("生成教案错误:", error);
      toast.error("生成教案失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // 导出教案
  const exportLessonPlan = async (format: "json" | "markdown") => {
    if (!lessonPlan) return;

    try {
      const response = await fetch("/api/course/lesson-plan-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "export",
          format,
          lessonPlan,
        }),
      });

      if (format === "markdown") {
        const text = await response.text();
        const blob = new Blob([text], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${lessonPlan.title}.md`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(lessonPlan, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${lessonPlan.title}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }

      toast.success("教案已导出！");
    } catch (error) {
      console.error("导出错误:", error);
      toast.error("导出失败");
    }
  };

  // 切换章节展开状态
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // 获取状态图标
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "new":
        return <Plus className="w-4 h-4 text-green-500" />;
      case "modified":
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      case "deleted":
        return <Trash2 className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // 获取状态徽章
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "new":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            新增
          </Badge>
        );
      case "modified":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            已修改
          </Badge>
        );
      case "deleted":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            已删除
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-purple-500" />
            教学教案
          </CardTitle>
          <div className="flex gap-2">
            {lessonPlan && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportLessonPlan("markdown")}
                >
                  <Download className="w-4 h-4 mr-1" />
                  导出
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateLessonPlan}
                  disabled={isGenerating}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
                  重新生成
                </Button>
              </>
            )}
            {!lessonPlan && (
              <Button
                size="sm"
                onClick={generateLessonPlan}
                disabled={isGenerating || slides.length === 0}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-1" />
                    生成教案
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!lessonPlan ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>点击"生成教案"按钮</p>
            <p className="text-sm">系统将根据PPT内容自动生成配套教案</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 教案概览 */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <div>
                <h3 className="font-semibold">{lessonPlan.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {lessonPlan.targetAudience}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {lessonPlan.totalDuration}
                  </span>
                </div>
              </div>
              {lessonPlan.summary && (
                <div className="flex gap-2 text-sm">
                  {lessonPlan.summary.addedSections > 0 && (
                    <span className="text-green-600">+{lessonPlan.summary.addedSections}</span>
                  )}
                  {lessonPlan.summary.modifiedSections > 0 && (
                    <span className="text-blue-600">~{lessonPlan.summary.modifiedSections}</span>
                  )}
                </div>
              )}
            </div>

            {/* 教案章节列表 */}
            <div className="space-y-2">
              {lessonPlan.sections.map((section) => (
                <div
                  key={section.id}
                  className={`border rounded-lg overflow-hidden ${
                    section.status === "deleted" ? "opacity-50 bg-gray-50" : ""
                  }`}
                >
                  {/* 章节标题 */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(section.status)}
                      <span className="font-medium">{section.title}</span>
                      {getStatusBadge(section.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {section.duration}
                      {expandedSections.has(section.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* 章节详情 */}
                  {expandedSections.has(section.id) && (
                    <div className="p-4 border-t bg-gray-50 space-y-3">
                      {/* 教学目标 */}
                      <div>
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                          <Target className="w-4 h-4 text-purple-500" />
                          教学目标
                        </div>
                        <p className="text-sm text-gray-600">{section.objectives}</p>
                      </div>

                      {/* 教师话术 */}
                      <div>
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                          <MessageCircle className="w-4 h-4 text-blue-500" />
                          教师话术
                        </div>
                        <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-white p-2 rounded border">
                          {section.script}
                        </pre>
                      </div>

                      {/* 互动设计 */}
                      <div>
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                          <Users className="w-4 h-4 text-green-500" />
                          互动设计
                        </div>
                        <div className="text-sm text-gray-600">
                          {Array.isArray(section.interaction) ? (
                            <ul className="list-disc list-inside space-y-1">
                              {section.interaction.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>{section.interaction}</p>
                          )}
                        </div>
                      </div>

                      {/* 教学提示 */}
                      {section.teachingTips && (
                        <div>
                          <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            教学提示
                          </div>
                          <p className="text-sm text-gray-600">{section.teachingTips}</p>
                        </div>
                      )}

                      {/* 所需材料 */}
                      {section.materials && section.materials.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">所需材料</div>
                          <div className="flex flex-wrap gap-1">
                            {section.materials.map((material, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {material}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
