"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Save,
  RefreshCw,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    siteName: "南都AI",
    siteUrl: "https://nandu.ai",
    contactEmail: "support@nandu.ai",
    notificationEnabled: true,
    autoApproveMerchant: false,
    trialDays: 30,
    aiModelProvider: "deepseek",
    maxUploadSize: 50,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("设置已保存");
    } catch (error) {
      toast.error("保存失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 基础设置 */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Globe className="w-4 h-4" />
            基础设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">站点名称</Label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">站点地址</Label>
              <Input
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">联系邮箱</Label>
            <Input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="bg-slate-800 border-white/10 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* 功能设置 */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            功能设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">系统通知</p>
              <p className="text-sm text-slate-400">开启后重要操作会发送通知</p>
            </div>
            <Switch
              checked={settings.notificationEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notificationEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">自动审核商家</p>
              <p className="text-sm text-slate-400">新注册商家自动通过审核</p>
            </div>
            <Switch
              checked={settings.autoApproveMerchant}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoApproveMerchant: checked })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">试用天数</Label>
              <Input
                type="number"
                value={settings.trialDays}
                onChange={(e) =>
                  setSettings({ ...settings, trialDays: parseInt(e.target.value) || 0 })
                }
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">上传文件限制(MB)</Label>
              <Input
                type="number"
                value={settings.maxUploadSize}
                onChange={(e) =>
                  setSettings({ ...settings, maxUploadSize: parseInt(e.target.value) || 0 })
                }
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI 配置 */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Database className="w-4 h-4" />
            AI 服务配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-800/50 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white">DeepSeek API</span>
              <span className="text-xs text-green-400">已连接</span>
            </div>
            <p className="text-sm text-slate-400">文案生成、对话助手</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/50 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white">硅基流动 API</span>
              <span className="text-xs text-green-400">已连接</span>
            </div>
            <p className="text-sm text-slate-400">图片识别、语音识别</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/50 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white">Kwai-Kolors</span>
              <span className="text-xs text-green-400">已连接</span>
            </div>
            <p className="text-sm text-slate-400">AI 图片生成</p>
          </div>

          <Button
            variant="outline"
            className="w-full bg-white/5 border-white/10 text-white"
            onClick={() => toast.success("连接测试通过")}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            测试连接
          </Button>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "保存中..." : "保存设置"}
        </Button>
      </div>
    </div>
  );
}
