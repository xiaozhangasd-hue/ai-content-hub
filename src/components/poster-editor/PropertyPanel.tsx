"use client";

import React from "react";
import * as fabric from "fabric";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

interface PropertyPanelProps {
  selectedObject: fabric.FabricObject | null;
  onUpdateObject: (property: string, value: unknown) => void;
}

// 预设字体
const FONTS = [
  { value: "Microsoft YaHei, PingFang SC, sans-serif", label: "微软雅黑" },
  { value: "SimHei, sans-serif", label: "黑体" },
  { value: "SimSun, serif", label: "宋体" },
  { value: "KaiTi, serif", label: "楷体" },
  { value: "Arial, sans-serif", label: "Arial" },
];

// 预设颜色
const COLORS = [
  { value: "#000000", label: "黑色" },
  { value: "#ffffff", label: "白色" },
  { value: "#ef4444", label: "红色" },
  { value: "#f97316", label: "橙色" },
  { value: "#eab308", label: "黄色" },
  { value: "#22c55e", label: "绿色" },
  { value: "#06b6d4", label: "青色" },
  { value: "#3b82f6", label: "蓝色" },
  { value: "#8b5cf6", label: "紫色" },
  { value: "#ec4899", label: "粉色" },
];

export default function PropertyPanel({
  selectedObject,
  onUpdateObject,
}: PropertyPanelProps) {
  if (!selectedObject) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">属性面板</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
            点击画布中的元素进行编辑
          </p>
        </CardContent>
      </Card>
    );
  }

  const isText = selectedObject.type === "i-text" || selectedObject.type === "text";
  const isRect = selectedObject.type === "rect";
  const isCircle = selectedObject.type === "circle";
  const isShape = isRect || isCircle;

  // 获取文本属性
  const textObj = selectedObject as fabric.IText;
  const fontSize = textObj.fontSize || 24;
  const fontFamily = textObj.fontFamily || "Microsoft YaHei, PingFang SC, sans-serif";
  const fill = (selectedObject.fill as string) || "#000000";
  const opacity = selectedObject.opacity || 1;
  const fontWeight = textObj.fontWeight || "normal";
  const fontStyle = textObj.fontStyle || "normal";

  return (
    <Card className="h-full overflow-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">
          {isText ? "文字属性" : isRect ? "矩形属性" : isCircle ? "圆形属性" : "图片属性"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 文本内容 - 仅文本元素 */}
        {isText && (
          <div className="space-y-2">
            <Label className="text-xs">文本内容</Label>
            <textarea
              value={textObj.text || ""}
              onChange={(e) => onUpdateObject("text", e.target.value)}
              className="w-full min-h-[80px] p-2 text-sm border rounded-lg focus:ring-2 focus:ring-pink-500"
              placeholder="输入文字内容"
            />
          </div>
        )}

        {/* 字体设置 - 仅文本元素 */}
        {isText && (
          <>
            <div className="space-y-2">
              <Label className="text-xs">字体</Label>
              <Select
                value={fontFamily}
                onValueChange={(value) => onUpdateObject("fontFamily", value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">字号</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={fontSize}
                  onChange={(e) => onUpdateObject("fontSize", parseInt(e.target.value) || 24)}
                  className="h-8 w-20"
                  min={8}
                  max={200}
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>

            {/* 文字样式 */}
            <div className="space-y-2">
              <Label className="text-xs">样式</Label>
              <div className="flex items-center gap-1">
                <Toggle
                  pressed={fontWeight === "bold"}
                  onPressedChange={(pressed) =>
                    onUpdateObject("fontWeight", pressed ? "bold" : "normal")
                  }
                  size="sm"
                  aria-label="粗体"
                >
                  <Bold className="w-4 h-4" />
                </Toggle>
                <Toggle
                  pressed={fontStyle === "italic"}
                  onPressedChange={(pressed) =>
                    onUpdateObject("fontStyle", pressed ? "italic" : "normal")
                  }
                  size="sm"
                  aria-label="斜体"
                >
                  <Italic className="w-4 h-4" />
                </Toggle>
              </div>
            </div>

            {/* 对齐方式 */}
            <div className="space-y-2">
              <Label className="text-xs">对齐</Label>
              <div className="flex items-center gap-1">
                <Toggle
                  pressed={textObj.textAlign === "left"}
                  onPressedChange={() => onUpdateObject("textAlign", "left")}
                  size="sm"
                  aria-label="左对齐"
                >
                  <AlignLeft className="w-4 h-4" />
                </Toggle>
                <Toggle
                  pressed={textObj.textAlign === "center"}
                  onPressedChange={() => onUpdateObject("textAlign", "center")}
                  size="sm"
                  aria-label="居中"
                >
                  <AlignCenter className="w-4 h-4" />
                </Toggle>
                <Toggle
                  pressed={textObj.textAlign === "right"}
                  onPressedChange={() => onUpdateObject("textAlign", "right")}
                  size="sm"
                  aria-label="右对齐"
                >
                  <AlignRight className="w-4 h-4" />
                </Toggle>
              </div>
            </div>
          </>
        )}

        {/* 颜色设置 */}
        <div className="space-y-2">
          <Label className="text-xs">{isText ? "文字颜色" : "填充颜色"}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={fill.startsWith("#") ? fill : "#000000"}
              onChange={(e) => onUpdateObject("fill", e.target.value)}
              className="w-10 h-8 p-1 cursor-pointer"
            />
            <Select
              value={fill}
              onValueChange={(value) => onUpdateObject("fill", value)}
            >
              <SelectTrigger className="h-8 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-200"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 透明度 */}
        <div className="space-y-2">
          <Label className="text-xs">透明度</Label>
          <div className="flex items-center gap-2">
            <Input
              type="range"
              value={opacity * 100}
              onChange={(e) => onUpdateObject("opacity", parseInt(e.target.value) / 100)}
              min={0}
              max={100}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 w-10">
              {Math.round(opacity * 100)}%
            </span>
          </div>
        </div>

        {/* 形状属性 */}
        {isRect && (
          <div className="space-y-2">
            <Label className="text-xs">圆角</Label>
            <Input
              type="number"
              value={(selectedObject as fabric.Rect).rx || 0}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                onUpdateObject("rx", value);
                onUpdateObject("ry", value);
              }}
              className="h-8"
              min={0}
            />
          </div>
        )}

        {isCircle && (
          <div className="space-y-2">
            <Label className="text-xs">半径</Label>
            <Input
              type="number"
              value={(selectedObject as fabric.Circle).radius || 50}
              onChange={(e) => onUpdateObject("radius", parseInt(e.target.value) || 50)}
              className="h-8"
              min={1}
            />
          </div>
        )}

        {/* 位置和大小 */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <Label className="text-xs">位置</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">X</Label>
              <Input
                type="number"
                value={Math.round(selectedObject.left || 0)}
                onChange={(e) => onUpdateObject("left", parseInt(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Y</Label>
              <Input
                type="number"
                value={Math.round(selectedObject.top || 0)}
                onChange={(e) => onUpdateObject("top", parseInt(e.target.value) || 0)}
                className="h-8"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">大小</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">宽度</Label>
              <Input
                type="number"
                value={Math.round((selectedObject.width || 100) * (selectedObject.scaleX || 1))}
                onChange={(e) => {
                  const newWidth = parseInt(e.target.value) || 100;
                  const scaleX = newWidth / (selectedObject.width || 100);
                  onUpdateObject("scaleX", scaleX);
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">高度</Label>
              <Input
                type="number"
                value={Math.round((selectedObject.height || 100) * (selectedObject.scaleY || 1))}
                onChange={(e) => {
                  const newHeight = parseInt(e.target.value) || 100;
                  const scaleY = newHeight / (selectedObject.height || 100);
                  onUpdateObject("scaleY", scaleY);
                }}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* 旋转角度 */}
        <div className="space-y-2">
          <Label className="text-xs">旋转角度</Label>
          <div className="flex items-center gap-2">
            <Input
              type="range"
              value={selectedObject.angle || 0}
              onChange={(e) => onUpdateObject("angle", parseInt(e.target.value))}
              min={0}
              max={360}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 w-12">
              {Math.round(selectedObject.angle || 0)}°
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
