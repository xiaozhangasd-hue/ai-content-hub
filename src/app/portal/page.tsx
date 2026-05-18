"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PortalPage() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!account.trim()) {
      toast.error("请输入账号");
      return;
    }
    if (!password) {
      toast.error("请输入密码");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("登录成功", {
        description: `欢迎回来，${account}`,
      });
    }, 700);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 彩色渐变背景 */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 35%, #ec4899 70%, #f59e0b 100%)",
        }}
      />
      {/* 装饰光斑 */}
      <div className="absolute -top-32 -left-32 -z-10 h-96 w-96 rounded-full bg-white/30 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="absolute top-1/3 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-300/20 blur-3xl" />

      {/* 内容 */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* 顶部 Logo / 标题 */}
          <div className="mb-6 text-center text-white">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md ring-1 ring-white/30">
              <span className="text-2xl font-bold">Q</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-wide">qywl6.icu</h1>
            <p className="mt-1 text-sm text-white/80">欢迎访问，请登录以继续</p>
          </div>

          {/* 登录卡片 */}
          <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-black/20">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">账号登录</h2>
              <p className="mt-1 text-sm text-gray-500">使用您的账号和密码登录</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="account" className="text-gray-700">
                  账号
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="account"
                    type="text"
                    autoComplete="username"
                    placeholder="请输入账号 / 手机号"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="h-11 pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  密码
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    tabIndex={-1}
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer select-none items-center gap-2 text-gray-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  记住我
                </label>
                <button
                  type="button"
                  onClick={() => toast("请联系管理员重置密码")}
                  className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  忘记密码？
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-base font-medium text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:brightness-110"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  "登 录"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              还没有账号？
              <button
                type="button"
                onClick={() => toast("请联系管理员开通账号")}
                className="ml-1 font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                申请注册
              </button>
            </div>
          </div>

          {/* 底部版权 */}
          <p className="mt-6 text-center text-xs text-white/70">
            © {new Date().getFullYear()} qywl6.icu · All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
}
