"use client";

import React from "react";
import * as fabric from "fabric";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  MoveUp,
  MoveDown,
} from "lucide-react";

interface LayerPanelProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.FabricObject | null;
  onSelectObject: (obj: fabric.FabricObject) => void;
  onRefresh: () => void;
}

export default function LayerPanel({
  canvas,
  selectedObject,
  onSelectObject,
  onRefresh,
}: LayerPanelProps) {
  if (!canvas) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-500">
        画布未初始化
      </div>
    );
  }

  const objects = canvas.getObjects();

  const getIcon = (type: string) => {
    switch (type) {
      case "i-text":
      case "text":
        return <Type className="w-3 h-3" />;
      case "rect":
        return <Square className="w-3 h-3" />;
      case "circle":
        return <Circle className="w-3 h-3" />;
      case "image":
        return <ImageIcon className="w-3 h-3" />;
      default:
        return <Square className="w-3 h-3" />;
    }
  };

  const getName = (obj: fabric.FabricObject) => {
    const type = obj.type;
    if (type === "i-text" || type === "text") {
      const text = (obj as fabric.IText).text || "";
      return text.length > 10 ? text.slice(0, 10) + "..." : text || "文本";
    }
    switch (type) {
      case "rect":
        return "矩形";
      case "circle":
        return "圆形";
      case "image":
        return "图片";
      default:
        return type || "元素";
    }
  };

  const handleToggleVisible = (obj: fabric.FabricObject) => {
    obj.visible = !obj.visible;
    canvas.renderAll();
    onRefresh();
  };

  const handleToggleLock = (obj: fabric.FabricObject) => {
    obj.selectable = !obj.selectable;
    obj.evented = !obj.evented;
    canvas.renderAll();
    onRefresh();
  };

  const handleDelete = (obj: fabric.FabricObject) => {
    canvas.remove(obj);
    canvas.renderAll();
    onRefresh();
  };

  const handleMoveUp = (obj: fabric.FabricObject) => {
    canvas.bringObjectForward(obj);
    canvas.renderAll();
    onRefresh();
  };

  const handleMoveDown = (obj: fabric.FabricObject) => {
    canvas.sendObjectBackwards(obj);
    canvas.renderAll();
    onRefresh();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-medium text-sm">图层</h3>
        <p className="text-xs text-gray-500 mt-1">共 {objects.length} 个元素</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {objects.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              暂无图层
            </p>
          ) : (
            <div className="space-y-1">
              {/* 从上到下显示，所以反向渲染 */}
              {[...objects].reverse().map((obj, index) => {
                const isSelected = selectedObject === obj;
                const isLocked = !obj.selectable;
                const isHidden = !obj.visible;

                return (
                  <div
                    key={index}
                    onClick={() => onSelectObject(obj)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-pink-50 border border-pink-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    {/* 图标 */}
                    <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {getIcon(obj.type || "")}
                    </div>

                    {/* 名称 */}
                    <span
                      className={`flex-1 text-xs truncate ${
                        isHidden ? "text-gray-400" : "text-gray-700"
                      }`}
                    >
                      {getName(obj)}
                    </span>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisible(obj);
                        }}
                      >
                        {isHidden ? (
                          <EyeOff className="w-3 h-3 text-gray-400" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLock(obj);
                        }}
                      >
                        {isLocked ? (
                          <Lock className="w-3 h-3 text-gray-400" />
                        ) : (
                          <Unlock className="w-3 h-3" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(obj);
                        }}
                      >
                        <MoveUp className="w-3 h-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(obj);
                        }}
                      >
                        <MoveDown className="w-3 h-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(obj);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
