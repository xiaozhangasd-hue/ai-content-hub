"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Undo,
  Redo,
  Trash2,
  Copy,
  Download,
} from "lucide-react";

interface ToolbarProps {
  onAddText: () => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddImage: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

// 简单的工具提示组件，无动画
function SimpleTooltip({ 
  children, 
  title 
}: { 
  children: React.ReactNode; 
  title: string 
}) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity pointer-events-none z-50">
        {title}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

export default function Toolbar({
  onAddText,
  onAddRect,
  onAddCircle,
  onAddImage,
  onDelete,
  onCopy,
  onUndo,
  onRedo,
  onExport,
  hasSelection,
  canUndo,
  canRedo,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-1 p-2 bg-white border-b border-gray-200">
      {/* 添加元素 */}
      <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
        <SimpleTooltip title="添加文字">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddText}
            className="gap-1"
          >
            <Type className="w-4 h-4" />
            文字
          </Button>
        </SimpleTooltip>

        <SimpleTooltip title="上传图片">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddImage}
            className="gap-1"
          >
            <ImageIcon className="w-4 h-4" />
            图片
          </Button>
        </SimpleTooltip>

        <SimpleTooltip title="添加矩形">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddRect}
            className="gap-1"
          >
            <Square className="w-4 h-4" />
            矩形
          </Button>
        </SimpleTooltip>

        <SimpleTooltip title="添加圆形">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddCircle}
            className="gap-1"
          >
            <Circle className="w-4 h-4" />
            圆形
          </Button>
        </SimpleTooltip>
      </div>

      {/* 编辑操作 */}
      <div className="flex items-center gap-1 px-3 border-r border-gray-200">
        <SimpleTooltip title="撤销">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo className="w-4 h-4" />
          </Button>
        </SimpleTooltip>

        <SimpleTooltip title="重做">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </SimpleTooltip>

        <SimpleTooltip title="复制">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            disabled={!hasSelection}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </SimpleTooltip>

        <SimpleTooltip title="删除">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={!hasSelection}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </SimpleTooltip>
      </div>

      {/* 导出 */}
      <div className="flex items-center gap-1 ml-auto">
        <SimpleTooltip title="导出为PNG图片">
          <Button
            variant="default"
            size="sm"
            onClick={onExport}
            className="gap-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
          >
            <Download className="w-4 h-4" />
            导出图片
          </Button>
        </SimpleTooltip>
      </div>
    </div>
  );
}
