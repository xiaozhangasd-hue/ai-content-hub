"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Calendar,
  CheckSquare,
  Star,
  User,
  LogOut,
  Sparkles,
  Menu,
  Users,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const navigation = [
  { name: "AI助手", href: "/teacher", icon: MessageSquare },
  { name: "我的学员", href: "/teacher/students", icon: Users },
  { name: "媒体素材", href: "/teacher/media", icon: Image },
  { name: "我的排课", href: "/teacher/schedule", icon: Calendar },
  { name: "考勤管理", href: "/teacher/attendance", icon: CheckSquare },
  { name: "课堂点评", href: "/teacher/feedback", icon: Star },
  { name: "成长档案", href: "/teacher/growth", icon: Sparkles },
];

interface TeacherUser {
  id: string;
  username: string;
  name: string;
  campus?: string;
  accountRole?: string;
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<TeacherUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 确保组件挂载后再访问 localStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    try {
      const role = localStorage.getItem("role");
      const userStr = localStorage.getItem("user");

      if (role !== "teacher") {
        router.replace("/login");
        return;
      }

      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
      }
    } catch (e) {
      console.error("读取用户信息失败:", e);
      router.replace("/login");
      return;
    }

    setIsLoading(false);
  }, [router, mounted]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    } catch (e) {
      console.error("清除用户信息失败:", e);
    }
    toast.success("已退出登录");
    router.push("/login");
  };

  // 服务端渲染时不显示任何内容
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">验证身份中...</p>
        </div>
      </div>
    );
  }

  // 如果没有用户信息
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">请先登录</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">南都AI</h1>
                <p className="text-xs text-slate-400">老师工作台</p>
              </div>
            </div>
          </div>

          {/* 导航 */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* 用户信息 */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name || user.username}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user.campus || "未分配校区"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-2 text-slate-400 hover:text-white hover:bg-white/5"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 lg:ml-0">
        {/* 顶部栏 */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-semibold text-white">
                {navigation.find((n) => n.href === pathname)?.name || "工作台"}
              </h2>
            </div>
          </div>
        </header>

        {/* 内容区 */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
