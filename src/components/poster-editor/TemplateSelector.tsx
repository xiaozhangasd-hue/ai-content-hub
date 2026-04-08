"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  POSTER_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  type PosterTemplate,
} from "@/lib/poster-templates";

interface TemplateSelectorProps {
  onSelectTemplate: (template: PosterTemplate) => void;
  currentTemplateId: string | null;
}

export default function TemplateSelector({
  onSelectTemplate,
  currentTemplateId,
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const templates = getTemplatesByCategory(selectedCategory);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-medium text-sm">模板库</h3>
        <p className="text-xs text-gray-500 mt-1">选择模板快速开始</p>
      </div>

      {/* 分类标签 */}
      <div className="p-2 border-b border-gray-100">
        <div className="flex flex-wrap gap-1">
          {TEMPLATE_CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={`h-7 text-xs ${
                selectedCategory === category.id
                  ? "bg-pink-600 hover:bg-pink-700"
                  : ""
              }`}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* 模板列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 grid grid-cols-2 gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all hover:shadow-md ${
                currentTemplateId === template.id
                  ? "border-pink-500 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* 模板预览 - 使用CSS渐变 */}
              <div
                className="aspect-[9/16] w-full"
                style={{
                  background: template.thumbnail,
                }}
              >
                {/* 模板信息覆盖层 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-xs font-medium truncate">
                      {template.name}
                    </p>
                    <p className="text-white/70 text-[10px] truncate">
                      {template.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* 选中标记 */}
              {currentTemplateId === template.id && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
