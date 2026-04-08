"use client";

import React, { useState, useRef, useCallback } from "react";
import * as fabric from "fabric";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PosterTemplate, POSTER_TEMPLATES } from "@/lib/poster-templates";

import PosterCanvas from "./PosterCanvas";
import Toolbar from "./Toolbar";
import PropertyPanel from "./PropertyPanel";
import TemplateSelector from "./TemplateSelector";
import LayerPanel from "./LayerPanel";

export default function PosterEditor() {
  const router = useRouter();
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 状态
  const [currentTemplate, setCurrentTemplate] = useState<PosterTemplate | null>(
    POSTER_TEMPLATES[0]
  );
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 画布准备就绪
  const handleCanvasReady = useCallback((canvas: fabric.Canvas) => {
    canvasRef.current = canvas;
    // 保存初始状态
    saveHistory(canvas);
  }, []);

  // 对象选中
  const handleObjectSelected = useCallback((obj: fabric.FabricObject | null) => {
    setSelectedObject(obj);
  }, []);

  // 保存历史记录
  const saveHistory = useCallback((canvas: fabric.Canvas) => {
    const json = JSON.stringify(canvas.toJSON());
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), json]);
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // 选择模板
  const handleSelectTemplate = useCallback((template: PosterTemplate) => {
    setCurrentTemplate(template);
    setSelectedObject(null);
    // 重置历史
    setTimeout(() => {
      if (canvasRef.current) {
        saveHistory(canvasRef.current);
      }
    }, 100);
  }, [saveHistory]);

  // 添加文字
  const handleAddText = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const text = new fabric.IText("双击编辑文字", {
      left: 100,
      top: 100,
      fontSize: 32,
      fontFamily: "Microsoft YaHei, PingFang SC, sans-serif",
      fill: "#000000",
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveHistory(canvas);
    setRefreshKey((k) => k + 1);
  }, [saveHistory]);

  // 添加矩形
  const handleAddRect = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 100,
      fill: "#3b82f6",
      rx: 8,
      ry: 8,
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    saveHistory(canvas);
    setRefreshKey((k) => k + 1);
  }, [saveHistory]);

  // 添加圆形
  const handleAddCircle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: "#ec4899",
    });

    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
    saveHistory(canvas);
    setRefreshKey((k) => k + 1);
  }, [saveHistory]);

  // 上传图片
  const handleAddImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 处理图片上传
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const canvas = canvasRef.current;
        if (!canvas || !event.target?.result) return;

        fabric.FabricImage.fromURL(event.target.result as string).then((img: fabric.FabricImage) => {
          // 缩放图片到合适大小
          const maxWidth = 500;
          const maxHeight = 500;
          const scale = Math.min(
            maxWidth / (img.width || maxWidth),
            maxHeight / (img.height || maxHeight),
            1
          );

          img.scale(scale);
          img.set({
            left: 100,
            top: 100,
          });

          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
          saveHistory(canvas);
          setRefreshKey((k) => k + 1);
        });
      };

      reader.readAsDataURL(file);
      // 清空input，允许重复上传同一文件
      e.target.value = "";
    },
    [saveHistory]
  );

  // 删除选中对象
  const handleDelete = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
      saveHistory(canvas);
      setSelectedObject(null);
      setRefreshKey((k) => k + 1);
    }
  }, [saveHistory]);

  // 复制选中对象
  const handleCopy = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    activeObject.clone().then((cloned: fabric.FabricObject) => {
      cloned.set({
        left: (activeObject.left || 0) + 20,
        top: (activeObject.top || 0) + 20,
      });

      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      saveHistory(canvas);
      setRefreshKey((k) => k + 1);
    });
  }, [saveHistory]);

  // 撤销
  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const json = history[newIndex];

    canvas.loadFromJSON(json).then(() => {
      canvas.renderAll();
      setHistoryIndex(newIndex);
      setSelectedObject(null);
      setRefreshKey((k) => k + 1);
    });
  }, [history, historyIndex]);

  // 重做
  const handleRedo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const json = history[newIndex];

    canvas.loadFromJSON(json).then(() => {
      canvas.renderAll();
      setHistoryIndex(newIndex);
      setSelectedObject(null);
      setRefreshKey((k) => k + 1);
    });
  }, [history, historyIndex]);

  // 更新对象属性
  const handleUpdateObject = useCallback(
    (property: string, value: unknown) => {
      const canvas = canvasRef.current;
      if (!canvas || !selectedObject) return;

      selectedObject.set(property as keyof fabric.FabricObject, value);
      canvas.renderAll();
      saveHistory(canvas);
    },
    [selectedObject, saveHistory]
  );

  // 选择图层对象
  const handleSelectLayerObject = useCallback((obj: fabric.FabricObject) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setActiveObject(obj);
    canvas.renderAll();
    setSelectedObject(obj);
  }, []);

  // 刷新图层列表
  const handleRefreshLayers = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // 导出图片
  const handleExport = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);

    try {
      // 取消选中状态
      canvas.discardActiveObject();
      canvas.renderAll();

      // 导出为PNG
      const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 2, // 2倍分辨率
      });

      // 下载图片
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = `poster-${Date.now()}.png`;
      link.click();

      toast.success("海报已导出！");
    } catch (error) {
      console.error("导出失败:", error);
      toast.error("导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 隐藏的文件上传input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/image")}
          className="gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>

        <div className="ml-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">海报编辑器</h1>
            <p className="text-xs text-gray-500">自由编辑，多模板选择</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="default"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                导出中...
              </>
            ) : (
              "导出海报"
            )}
          </Button>
        </div>
      </header>

      {/* 工具栏 */}
      <Toolbar
        onAddText={handleAddText}
        onAddRect={handleAddRect}
        onAddCircle={handleAddCircle}
        onAddImage={handleAddImage}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        hasSelection={!!selectedObject}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：模板和图层面板 */}
        <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
          <TemplateSelector
            onSelectTemplate={handleSelectTemplate}
            currentTemplateId={currentTemplate?.id || null}
          />
        </div>

        {/* 中间：画布 */}
        <div className="flex-1 p-4 overflow-hidden">
          <PosterCanvas
            template={currentTemplate}
            onCanvasReady={handleCanvasReady}
            onObjectSelected={handleObjectSelected}
            canvasRef={canvasRef as React.MutableRefObject<fabric.Canvas | null>}
          />
        </div>

        {/* 右侧：属性面板和图层面板 */}
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
          <div className="flex-1 overflow-hidden">
            <PropertyPanel
              selectedObject={selectedObject}
              onUpdateObject={handleUpdateObject}
            />
          </div>
          <div className="h-64 border-t border-gray-200">
            <LayerPanel
              canvas={canvasRef.current}
              selectedObject={selectedObject}
              onSelectObject={handleSelectLayerObject}
              onRefresh={handleRefreshLayers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
