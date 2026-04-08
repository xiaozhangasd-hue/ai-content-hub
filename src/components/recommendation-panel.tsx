"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  Zap,
  AlertTriangle,
  Sparkles,
  FileText,
  Clock,
  Users,
  Gamepad2,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Bot,
} from "lucide-react";

// 推荐类型
export type RecommendationType = "followup" | "potentialissue" | "optimization" | "exploration";

// 推荐优先级
export type RecommendationPriority = "high" | "medium" | "low";

// 推荐动作类型
export type RecommendationActionType = "question" | "quickaction" | "toolcall";

// 推荐数据结构
export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: RecommendationPriority;
  actionType: RecommendationActionType;
  actionData: {
    text?: string;
    buttonText?: string;
    toolName?: string;
    params?: Record<string, unknown>;
  };
  applied?: boolean;
}

// 推荐面板属性
interface RecommendationPanelProps {
  recommendations: Recommendation[];
  onAction: (recommendation: Recommendation) => void;
  onDismiss?: (id: string) => void;
  isProcessing?: boolean;
  processingId?: string;
}

// 获取优先级图标
const getPriorityIcon = (priority: RecommendationPriority) => {
  switch (priority) {
    case "high":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case "medium":
      return <Zap className="w-4 h-4 text-amber-500" />;
    case "low":
      return <Lightbulb className="w-4 h-4 text-blue-500" />;
  }
};

// 获取优先级样式
const getPriorityStyle = (priority: RecommendationPriority, applied?: boolean) => {
  if (applied) {
    return "bg-green-50 border-green-200";
  }
  switch (priority) {
    case "high":
      return "bg-red-50 border-red-200";
    case "medium":
      return "bg-amber-50 border-amber-200";
    case "low":
      return "bg-blue-50 border-blue-200";
  }
};

// 获取类型标签
const getTypeLabel = (type: RecommendationType) => {
  switch (type) {
    case "followup":
      return "后续任务";
    case "potentialissue":
      return "潜在问题";
    case "optimization":
      return "优化建议";
    case "exploration":
      return "关联探索";
  }
};

// 获取动作图标
const getActionIcon = (actionType: RecommendationActionType) => {
  switch (actionType) {
    case "question":
      return <ArrowRight className="w-4 h-4" />;
    case "quickaction":
      return <Zap className="w-4 h-4" />;
    case "toolcall":
      return <Sparkles className="w-4 h-4" />;
  }
};

export function RecommendationPanel({
  recommendations,
  onAction,
  onDismiss,
  isProcessing = false,
  processingId,
}: RecommendationPanelProps) {
  if (recommendations.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            AI智能推荐
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">生成课件后，AI将自动推荐优化策略</p>
        </CardContent>
      </Card>
    );
  }

  // 按优先级排序
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // 统计
  const highPriority = recommendations.filter((r) => r.priority === "high" && !r.applied).length;
  const appliedCount = recommendations.filter((r) => r.applied).length;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            AI智能推荐
          </CardTitle>
          {appliedCount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              {appliedCount}项已完成
            </Badge>
          )}
        </div>
        {highPriority > 0 && (
          <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
            <AlertTriangle className="w-4 h-4" />
            {highPriority}项需要重点关注
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        {sortedRecommendations.map((rec) => (
          <div
            key={rec.id}
            className={`p-3 rounded-lg border transition-all ${
              rec.applied
                ? "bg-green-50 border-green-200"
                : getPriorityStyle(rec.priority)
            }`}
          >
            <div className="flex items-start gap-2">
              {/* 状态图标 */}
              <div className="mt-0.5 shrink-0">
                {rec.applied ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  getPriorityIcon(rec.priority)
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* 标题行 */}
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium text-sm ${rec.applied ? "text-green-700 line-through" : "text-gray-900"}`}>
                    {rec.title}
                  </span>
                  {!rec.applied && rec.priority === "high" && (
                    <Badge variant="outline" className="text-xs h-5 px-1 border-red-300 text-red-600">
                      重要
                    </Badge>
                  )}
                </div>

                {/* 描述 */}
                <p className={`text-xs mb-2 ${rec.applied ? "text-green-600" : "text-gray-600"}`}>
                  {rec.description}
                </p>

                {/* 操作按钮 */}
                {!rec.applied && (
                  <Button
                    size="sm"
                    variant={rec.priority === "high" ? "default" : "outline"}
                    className={`h-7 text-xs gap-1 ${
                      rec.priority === "high"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : ""
                    }`}
                    onClick={() => onAction(rec)}
                    disabled={isProcessing}
                  >
                    {isProcessing && processingId === rec.id ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        {getActionIcon(rec.actionType)}
                        {rec.actionData.buttonText || "执行"}
                      </>
                    )}
                  </Button>
                )}

                {/* 已完成标记 */}
                {rec.applied && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    已完成
                  </div>
                )}
              </div>

              {/* 忽略按钮 */}
              {!rec.applied && onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => onDismiss(rec.id)}
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ========== 推荐策略生成器 ==========

interface CourseContext {
  courseType: string;
  targetAudience: string;
  totalSlides: number;
  hasInteractive: boolean;
  hasSummary: boolean;
  estimatedDuration: number;
  lessonPlanGenerated: boolean;
}

// 生成PPT后的推荐
export function generatePPTRecommendations(context: CourseContext): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 1. 生成配套教案（高优先级）
  if (!context.lessonPlanGenerated) {
    recommendations.push({
      id: "rec_lesson_plan",
      type: "followup",
      title: "同步生成教案",
      description: "PPT已生成，是否自动生成配套的教学教案？",
      priority: "high",
      actionType: "quickaction",
      actionData: {
        buttonText: "一键生成教案",
        toolName: "generate_lesson_plan",
      },
    });
  }

  // 2. 检查互动环节
  if (!context.hasInteractive && context.targetAudience.includes("幼儿")) {
    recommendations.push({
      id: "rec_interactive",
      type: "optimization",
      title: "添加互动游戏",
      description: "3-5岁幼儿注意力有限，建议增加互动游戏环节提升参与度",
      priority: "high",
      actionType: "quickaction",
      actionData: {
        buttonText: "查看游戏库",
        toolName: "add_interactive",
      },
    });
  }

  // 3. 检查时长
  if (context.estimatedDuration > 40) {
    recommendations.push({
      id: "rec_duration",
      type: "potentialissue",
      title: "课程时长偏长",
      description: `预计需要${context.estimatedDuration}分钟，建议控制在30分钟以内`,
      priority: "medium",
      actionType: "question",
      actionData: {
        buttonText: "查看时长分析",
        text: "帮我分析一下课程时长分配",
      },
    });
  }

  // 4. 添加课程总结
  if (!context.hasSummary) {
    recommendations.push({
      id: "rec_summary",
      type: "optimization",
      title: "添加课程总结",
      description: "建议在课程末尾添加知识回顾，帮助学员巩固记忆",
      priority: "low",
      actionType: "quickaction",
      actionData: {
        buttonText: "添加总结页",
        toolName: "add_summary",
      },
    });
  }

  // 5. 生成家长通知单
  if (context.targetAudience.includes("幼儿") || context.targetAudience.includes("小学")) {
    recommendations.push({
      id: "rec_parent_notice",
      type: "exploration",
      title: "生成家长通知单",
      description: "自动生成课程预告，方便家长了解教学内容",
      priority: "low",
      actionType: "quickaction",
      actionData: {
        buttonText: "生成通知单",
        toolName: "generate_parent_notice",
      },
    });
  }

  return recommendations.slice(0, 4); // 最多返回4个推荐
}

// 修改PPT后的推荐
export function generateModifyRecommendations(
  context: CourseContext,
  changeType: "add" | "delete" | "modify" | "reorder"
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 1. 同步更新教案
  recommendations.push({
    id: "rec_sync_lesson",
    type: "followup",
    title: "同步更新教案",
    description: "PPT内容已修改，配套教案需要同步更新",
    priority: "high",
    actionType: "quickaction",
    actionData: {
      buttonText: "立即同步",
      toolName: "sync_lesson_plan",
    },
  });

  // 2. 时长变化提醒
  if (changeType === "add") {
    recommendations.push({
      id: "rec_duration_change",
      type: "potentialissue",
      title: "课程时长变化",
      description: "新增页面后课程时长增加，请确认是否需要调整",
      priority: "medium",
      actionType: "question",
      actionData: {
        buttonText: "查看时长",
        text: "帮我调整课程时长",
      },
    });
  }

  // 3. 重新生成物料
  recommendations.push({
    id: "rec_regen_materials",
    type: "followup",
    title: "更新配套物料",
    description: "课程内容有更新，建议重新生成讲师卡和家长通知单",
    priority: "low",
    actionType: "quickaction",
    actionData: {
      buttonText: "重新生成",
      toolName: "regenerate_materials",
    },
  });

  return recommendations;
}

// 首次使用推荐
export function generateOnboardingRecommendations(): Recommendation[] {
  return [
    {
      id: "rec_guide",
      type: "exploration",
      title: "快速上手指南",
      description: "3分钟了解如何使用课件生成功能",
      priority: "high",
      actionType: "question",
      actionData: {
        buttonText: "查看指南",
        text: "教我如何使用课件生成功能",
      },
    },
    {
      id: "rec_template",
      type: "exploration",
      title: "浏览模板库",
      description: "查看现成的3-5岁口才课模板，快速开始创作",
      priority: "medium",
      actionType: "quickaction",
      actionData: {
        buttonText: "查看模板",
        toolName: "browse_templates",
      },
    },
  ];
}
