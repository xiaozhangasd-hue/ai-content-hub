"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CampusSelector } from "@/components/campus-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Sparkles,
  Bot,
  LogOut,
  Settings,
  ChevronRight,
  ChevronDown,
  Store,
  MessageCircle,
  Zap,
  Scissors,
  Users,
  GraduationCap,
  Rocket,
  Star,
  Calendar,
  Share2,
  Crown,
  TrendingUp,
  UserPlus,
  Target,
  Clock,
  FileText,
  BarChart3,
  FolderOpen,
  Home,
} from "lucide-react";

interface User {
  id: string;
  phone: string;
  name?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [hasMerchantInfo, setHasMerchantInfo] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<string>("all");
  const [activeNav, setActiveNav] = useState<string>("home");

  const isDark = theme === 'dark';

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const merchantInfo = localStorage.getItem("merchantInfo");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));
    setHasMerchantInfo(!!merchantInfo && JSON.parse(merchantInfo).name);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("已退出登录");
    router.push("/login");
  };

  // 导航配置
  const navItems = [
    {
      key: "home",
      label: "工作台",
      icon: Home,
      href: "/dashboard",
    },
    {
      key: "sales",
      label: "招生管理",
      icon: Users,
      items: [
        { icon: Zap, label: "跟进任务", href: "/follow-up", highlight: true },
        { icon: Users, label: "家长管理", href: "/customers" },
        { icon: MessageCircle, label: "话术库", href: "/scripts" },
        { icon: Calendar, label: "活动策划", href: "/activities" },
      ],
    },
    {
      key: "ai",
      label: "AI工具",
      icon: Bot,
      items: [
        { icon: Bot, label: "智能助手", href: "/assistant", highlight: true },
        { icon: FileText, label: "PPT课件", href: "/course", highlight: true },
        { icon: Star, label: "AI图片", href: "/image" },
        { icon: Rocket, label: "AI视频", href: "/video" },
        { icon: Scissors, label: "视频剪辑", href: "/video/edit" },
      ],
    },
    {
      key: "education",
      label: "教务系统",
      icon: GraduationCap,
      href: "/education",
      highlight: true,
    },
    {
      key: "analytics",
      label: "数据中心",
      icon: BarChart3,
      items: [
        { icon: BarChart3, label: "数据看板", href: "/analytics" },
        { icon: TrendingUp, label: "转化分析", href: "/analytics" },
        { icon: Share2, label: "朋友圈素材", href: "/moments" },
      ],
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0e1a] text-white' : 'bg-slate-50 text-gray-900'}`}>
      {/* 动态背景 */}
      <div className="fixed inset-0 -z-10">
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-[#0a0e1a] via-[#0d1425] to-[#0a1628]' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/50'}`} />
        <div 
          className={`absolute inset-0 ${isDark ? 'opacity-15' : 'opacity-20'}`}
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'} 1px, transparent 1px),
                             linear-gradient(90deg, ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'} 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
        <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] ${isDark ? 'bg-blue-500/15' : 'bg-blue-400/20'} rounded-full blur-[150px]`} />
        <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] ${isDark ? 'bg-purple-500/10' : 'bg-purple-400/15'} rounded-full blur-[150px]`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-400/15'} rounded-full blur-[120px]`} />
      </div>

      {/* 顶部导航 */}
      <header className={`sticky top-0 z-50 ${isDark ? 'bg-[#0d1425]/80 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-md border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + 导航 */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">南都AI</h1>
                </div>
              </div>

              {/* 功能导航 */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <div key={item.key}>
                    {item.href ? (
                      <Button
                        variant="ghost"
                        onClick={() => router.push(item.href!)}
                        className={`gap-2 ${
                          activeNav === item.key 
                            ? isDark 
                              ? "text-white bg-white/10" 
                              : "text-gray-900 bg-gray-100"
                            : item.highlight 
                              ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" 
                              : isDark
                                ? "text-gray-400 hover:text-white hover:bg-white/5"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                        {item.highlight && (
                          <Badge className={`text-[10px] px-1.5 py-0 ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>入口</Badge>
                        )}
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className={`gap-2 ${
                              activeNav === item.key 
                                ? isDark 
                                  ? "text-white bg-white/10" 
                                  : "text-gray-900 bg-gray-100"
                                : isDark
                                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className={`w-48 ${isDark ? 'bg-[#0d1425] border-white/10' : 'bg-white border-gray-200'}`}>
                          {item.items?.map((subItem, index) => (
                            <DropdownMenuItem
                              key={index}
                              onClick={() => router.push(subItem.href)}
                              className={`gap-3 ${isDark ? 'focus:bg-white/5' : 'focus:bg-gray-100'} ${subItem.highlight ? "text-blue-500" : isDark ? "text-gray-300" : "text-gray-700"}`}
                            >
                              <subItem.icon className="w-4 h-4" />
                              {subItem.label}
                              {subItem.highlight && (
                                <Badge className={`ml-auto text-[10px] ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>推荐</Badge>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* 右侧操作 */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className={`h-4 w-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
              <CampusSelector value={selectedCampus} onChange={setSelectedCampus} />
              <div className={`h-4 w-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/membership")}
                className="gap-2 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
              >
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">会员</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                onClick={() => router.push("/settings")}
              >
                <Settings className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={`gap-2 ${isDark ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}>
                    <Avatar className="w-7 h-7 ring-2 ring-blue-500/30">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-medium">
                        {user.name?.[0] || user.phone?.slice(-2) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm">
                      {user.name || user.phone}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`w-40 ${isDark ? 'bg-[#0d1425] border-white/10' : 'bg-white border-gray-200'}`}>
                  <DropdownMenuItem onClick={() => router.push("/settings")} className={`${isDark ? 'text-gray-300 focus:bg-white/5' : 'text-gray-700 focus:bg-gray-100'}`}>
                    <Settings className="w-4 h-4 mr-2" />
                    系统设置
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={isDark ? 'bg-white/5' : 'bg-gray-100'} />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-500/10">
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* 移动端导航 */}
        <div className={`md:hidden border-t overflow-x-auto ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
          <div className="flex items-center gap-1 px-4 py-2">
            {navItems.map((item) => (
              <Button
                key={item.key}
                variant="ghost"
                size="sm"
                onClick={() => item.href && router.push(item.href!)}
                className={`shrink-0 ${item.highlight ? "text-emerald-500" : isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                <item.icon className="w-4 h-4 mr-1" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero 区域 */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>AI 驱动的教培增长引擎</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              <span className={isDark ? "text-white" : "text-gray-900"}>智能招生</span>
              <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 bg-clip-text text-transparent"> · 轻松获客</span>
            </h1>
            
            <p className={`text-base sm:text-lg mb-6 max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              一站式AI内容创作 + 客户管理 + 教务系统，让招生转化更简单
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button 
                onClick={() => router.push("/assistant")}
                className="h-11 px-5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/25"
              >
                <Bot className="w-5 h-5 mr-2" />
                开始AI创作
              </Button>
              <Button 
                onClick={() => router.push("/education")}
                className="h-11 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25"
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                进入教务系统
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push("/follow-up")}
                className={`h-11 px-5 ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                <Zap className="w-5 h-5 mr-2 text-orange-500" />
                查看待办
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-10 w-32 h-32 border border-blue-500/20 rounded-full" />
        <div className="absolute bottom-10 right-10 w-48 h-48 border border-purple-500/20 rounded-full" />
      </section>

      {/* 数据概览 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: UserPlus, label: "今日新增客户", value: "12", change: "+3", color: "blue", href: "/customers" },
            { icon: Zap, label: "待跟进任务", value: "28", change: "5个超期", color: "orange", href: "/follow-up" },
            { icon: Target, label: "本周转化率", value: "23%", change: "+5%", color: "green", href: "/analytics" },
            { icon: TrendingUp, label: "月度业绩", value: "¥32,400", change: "+12%", color: "purple", href: "/analytics" },
          ].map((item, index) => (
            <Card 
              key={index} 
              onClick={() => router.push(item.href)}
              className={`${isDark ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'} backdrop-blur-sm transition-all group cursor-pointer`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.color === "blue" ? "bg-blue-500/20 text-blue-500" :
                    item.color === "orange" ? "bg-orange-500/20 text-orange-500" :
                    item.color === "green" ? "bg-green-500/20 text-green-500" :
                    "bg-purple-500/20 text-purple-500"
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.change.startsWith("+") ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                  }`}>
                    {item.change}
                  </span>
                </div>
                <div className="mt-3">
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{item.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 校区信息未填写提示 */}
      {!hasMerchantInfo && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <Card className={`bg-gradient-to-r ${isDark ? 'from-amber-500/10 to-orange-500/10 border-amber-500/20' : 'from-amber-50 to-orange-50 border-amber-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Store className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>完善机构信息</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>填写后AI将生成更精准的营销内容</p>
                  </div>
                </div>
                <Button 
                  onClick={() => router.push("/settings")}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white"
                >
                  立即填写
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* 核心功能 - 招生管理 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>招生管理</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/follow-up")} className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            查看全部 <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Zap, label: "跟进任务", desc: "今日待办", href: "/follow-up", color: "from-orange-500 to-red-500", highlight: true },
            { icon: Users, label: "家长管理", desc: "客户列表", href: "/customers", color: "from-blue-500 to-cyan-500" },
            { icon: MessageCircle, label: "话术库", desc: "异议处理", href: "/scripts", color: "from-purple-500 to-pink-500" },
            { icon: Calendar, label: "活动策划", desc: "模板中心", href: "/activities", color: "from-rose-500 to-orange-500" },
          ].map((item, index) => (
            <Card
              key={index}
              onClick={() => router.push(item.href)}
              className={`${isDark ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'} backdrop-blur-sm border cursor-pointer group transition-all ${
                item.highlight ? (isDark ? "ring-1 ring-orange-500/30" : "ring-1 ring-orange-300") : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-medium block ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{item.desc}</span>
                  </div>
                  {item.highlight && (
                    <Badge className={`text-xs ${isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>待办</Badge>
                  )}
                  <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* AI 智能工具 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI 智能工具</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/assistant")} className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            查看全部 <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { icon: Bot, label: "智能助手", desc: "一站式生成", href: "/assistant", color: "from-violet-600 to-purple-600", highlight: true },
            { icon: FileText, label: "PPT课件", desc: "智能生成", href: "/course", color: "from-emerald-500 to-teal-500", highlight: true },
            { icon: Star, label: "AI图片", desc: "生成海报", href: "/image", color: "from-pink-500 to-rose-500" },
            { icon: Rocket, label: "AI视频", desc: "文生视频", href: "/video", color: "from-cyan-500 to-blue-500" },
            { icon: Scissors, label: "视频剪辑", desc: "拼接配音", href: "/video/edit", color: "from-indigo-500 to-purple-500" },
          ].map((item, index) => (
            <Card
              key={index}
              onClick={() => router.push(item.href)}
              className={`${isDark ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'} backdrop-blur-sm border cursor-pointer group transition-all ${
                item.highlight ? (isDark ? "ring-1 ring-purple-500/30" : "ring-1 ring-purple-300") : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-medium block ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{item.desc}</span>
                  </div>
                  {item.highlight && (
                    <Badge className={`text-xs ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>推荐</Badge>
                  )}
                  <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 教务系统 - 重点突出 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-500" />
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>教务系统</h3>
            <Badge className={`text-xs ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>一站式管理</Badge>
          </div>
          <Button 
            onClick={() => router.push("/education")}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
          >
            进入教务系统
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {/* 教务系统入口卡片 */}
        <Card 
          onClick={() => router.push("/education")}
          className={`${isDark ? 'bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-emerald-500/20 hover:from-emerald-600/15 hover:to-teal-600/15' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:from-emerald-100 hover:to-teal-100'} border cursor-pointer group mb-4`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>教务管理后台</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>排课、考勤、课消、点评、档案一站式管理</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                {[
                  { icon: Calendar, label: "排课" },
                  { icon: Users, label: "考勤" },
                  { icon: Clock, label: "课消" },
                  { icon: FileText, label: "点评" },
                  { icon: FolderOpen, label: "档案" },
                ].map((feature, i) => (
                  <div key={i} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-white/5 text-gray-400' : 'bg-white text-gray-600'}`}>
                    <feature.icon className="w-4 h-4 text-emerald-500" />
                    {feature.label}
                  </div>
                ))}
              </div>
              <ChevronRight className="w-6 h-6 text-emerald-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>

        {/* 快捷功能 */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[
            { icon: Calendar, label: "排课管理", desc: "班级排课", href: "/education/schedule", color: "from-blue-500 to-indigo-500" },
            { icon: Users, label: "考勤管理", desc: "签到签退", href: "/education/attendance", color: "from-emerald-500 to-teal-500" },
            { icon: Clock, label: "课消管理", desc: "课时充值", href: "/education/hours", color: "from-purple-500 to-pink-500" },
            { icon: FileText, label: "课堂点评", desc: "学员反馈", href: "/education/feedback", color: "from-orange-500 to-amber-500" },
            { icon: FolderOpen, label: "成长档案", desc: "学习轨迹", href: "/education/growth", color: "from-cyan-500 to-blue-500" },
          ].map((item, index) => (
            <Card
              key={index}
              onClick={() => router.push(item.href)}
              className={`${isDark ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'} backdrop-blur-sm border cursor-pointer group transition-all`}
            >
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-2`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-sm font-medium block ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{item.desc}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 更多工具 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-amber-500" />
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>更多工具</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "数据看板", desc: "转化分析", href: "/analytics", icon: TrendingUp, bg: "from-emerald-500 to-teal-500" },
            { label: "朋友圈素材", desc: "内容库", href: "/moments", icon: Share2, bg: "from-cyan-500 to-blue-500" },
            { label: "我的内容", desc: "历史记录", href: "/contents", icon: Star, bg: "from-indigo-500 to-purple-500" },
          ].map((item, index) => (
            <Card
              key={index}
              onClick={() => router.push(item.href)}
              className={`${isDark ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'} backdrop-blur-sm border cursor-pointer group transition-all`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.bg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className={`text-sm font-medium block ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{item.desc}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 底部优势 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: "一句话搞定", desc: "直接说需求，AI帮你完成", color: "blue" },
            { icon: Bot, title: "懂教培行业", desc: "专业建议，不是泛泛而谈", color: "purple" },
            { icon: Crown, title: "降本增效", desc: "省下运营成本，提升转化率", color: "amber" },
          ].map((item, index) => (
            <Card key={index} className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-gray-200 shadow-sm'} border`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.color === "blue" ? "bg-blue-500/20" :
                    item.color === "purple" ? "bg-purple-500/20" :
                    "bg-amber-500/20"
                  }`}>
                    <item.icon className={`w-5 h-5 ${
                      item.color === "blue" ? "text-blue-500" :
                      item.color === "purple" ? "text-purple-500" :
                      "text-amber-500"
                    }`} />
                  </div>
                  <div>
                    <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{item.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 底部版权 */}
      <footer className={`border-t ${isDark ? 'border-white/5 bg-[#0a0f1a]/80' : 'border-gray-200 bg-white/80'} backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>南都AI · 帝都科技出品</span>
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              © 2024 南都AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
