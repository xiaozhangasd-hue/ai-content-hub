"use client";

import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { PosterTemplate } from "@/lib/poster-templates";

interface PosterCanvasProps {
  template: PosterTemplate | null;
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onObjectSelected: (obj: fabric.FabricObject | null) => void;
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
}

// 解析渐变色为Fabric格式
function parseGradient(value: string, width: number, height: number): fabric.Gradient<"linear"> | null {
  // 解析 linear-gradient 格式
  const gradientMatch = value.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
  if (!gradientMatch) return null;

  const angle = parseInt(gradientMatch[1]);
  const colorStops = gradientMatch[2].split(',').map(stop => {
    const parts = stop.trim().split(/\s+/);
    const color = parts[0];
    const position = parts[1] ? parseFloat(parts[1]) / 100 : null;
    return { color, position };
  });

  // 根据角度计算渐变方向
  const rad = (angle - 90) * (Math.PI / 180);
  const coords = {
    x1: width / 2 - Math.cos(rad) * width / 2,
    y1: height / 2 - Math.sin(rad) * height / 2,
    x2: width / 2 + Math.cos(rad) * width / 2,
    y2: height / 2 + Math.sin(rad) * height / 2,
  };

  return new fabric.Gradient({
    type: 'linear',
    coords,
    colorStops: colorStops.map((stop, index) => ({
      offset: stop.position ?? index / (colorStops.length - 1),
      color: stop.color,
    })),
  });
}

export default function PosterCanvas({
  template,
  onCanvasReady,
  onObjectSelected,
  canvasRef,
}: PosterCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 750, height: 1334 });
  const [scale, setScale] = useState(1);

  // 初始化画布
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建Fabric画布
    const canvas = new fabric.Canvas('poster-canvas', {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    canvasRef.current = canvas;

    // 监听选中事件
    canvas.on('selection:created', (e: { selected?: fabric.FabricObject[] }) => {
      onObjectSelected(e.selected?.[0] || null);
    });
    canvas.on('selection:updated', (e: { selected?: fabric.FabricObject[] }) => {
      onObjectSelected(e.selected?.[0] || null);
    });
    canvas.on('selection:cleared', () => {
      onObjectSelected(null);
    });

    // 监听对象修改
    canvas.on('object:modified', () => {
      canvas.renderAll();
    });

    onCanvasReady(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // 应用模板
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;

    // 清空画布
    canvas.clear();

    // 设置背景
    if (template.background.type === 'color') {
      canvas.backgroundColor = template.background.value;
    } else if (template.background.type === 'gradient') {
      const gradient = parseGradient(template.background.value, template.width, template.height);
      if (gradient) {
        // Fabric.js 7.x 使用 backgroundImage 或创建背景矩形
        const bgRect = new fabric.Rect({
          left: 0,
          top: 0,
          width: template.width,
          height: template.height,
          fill: gradient,
          selectable: false,
          evented: false,
        });
        canvas.backgroundImage = bgRect as unknown as fabric.FabricImage;
      }
    }

    // 设置画布尺寸
    canvas.setDimensions({ width: template.width, height: template.height });
    setCanvasSize({ width: template.width, height: template.height });

    // 添加元素
    template.elements.forEach(async (element) => {
      let obj: fabric.FabricObject | null = null;

      if (element.type === 'text') {
        obj = new fabric.IText(element.props.text || '', {
          left: element.props.left,
          top: element.props.top,
          fontSize: element.props.fontSize || 24,
          fontFamily: element.props.fontFamily || 'Microsoft YaHei, PingFang SC, sans-serif',
          fontWeight: element.props.fontWeight || 'normal',
          fill: element.props.fill || '#000000',
          originX: element.props.originX || 'left',
          originY: element.props.originY || 'top',
        });
      } else if (element.type === 'rect') {
        obj = new fabric.Rect({
          left: element.props.left,
          top: element.props.top,
          width: element.props.width,
          height: element.props.height,
          fill: element.props.fill || '#000000',
          rx: element.props.rx || 0,
          ry: element.props.ry || 0,
        });
      } else if (element.type === 'circle') {
        obj = new fabric.Circle({
          left: element.props.left,
          top: element.props.top,
          radius: element.props.radius || 50,
          fill: element.props.fill || '#000000',
        });
      }

      if (obj) {
        canvas.add(obj);
      }
    });

    canvas.renderAll();

    // 计算缩放比例以适应容器
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 40;
      const containerHeight = containerRef.current.clientHeight - 40;
      const scaleX = containerWidth / template.width;
      const scaleY = containerHeight / template.height;
      const newScale = Math.min(scaleX, scaleY, 1);
      setScale(newScale);
    }
  }, [template]);

  // 计算缩放后的画布尺寸
  const scaledWidth = canvasSize.width * scale;
  const scaledHeight = canvasSize.height * scale;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden"
      style={{ minHeight: '500px' }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <canvas id="poster-canvas" />
      </div>
      
      {/* 缩放控制 */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white rounded-lg shadow-lg px-3 py-2">
        <button
          onClick={() => setScale(Math.max(0.25, scale - 0.1))}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
        >
          -
        </button>
        <span className="text-sm text-gray-600 w-16 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale(Math.min(2, scale + 0.1))}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
        >
          +
        </button>
      </div>
    </div>
  );
}
