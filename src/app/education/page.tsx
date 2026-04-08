"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampusSelector } from "@/components/campus-selector";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Calendar,
  Users,
  Clock,
  FileText,
  BookOpen,
  GraduationCap,
  UserCheck,
  DollarSign,
  MessageSquare,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  Sparkles,
  Bell,
  UserPlus,
  ClipboardList,
} from "lucide-react";

const SCROLL_POSITION_KEY = "education-scroll-position";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  todayLessons: number;
  pendingAttendance: number;
  lowHoursCount: number;
}

export default function EducationPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState<string>("all");

  // 保存滚动位置
  const saveScrollPosition = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SCROLL_POSITION_KEY, String(window.scrollY));
    }
  }, []);

  // 恢复滚动位置
  const restoreScrollPosition = useCallback(() => {
    if (typeof window !== 'undefined') {
      const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedPosition) {
        // 使用 requestAnimationFrame 确保 DOM 渲染完成后再滚动
        requestAnimationFrame(() => {
          window.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: 'instant' as ScrollBehavior
          });
        });
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchStats();
  }, [router]);

  // 页面加载时恢复滚动位置
  useEffect(() => {
    restoreScrollPosition();
  }, [restoreScrollPosition]);

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    try {
      const campusParam = selectedCampus !== "all" ? `?campusId=${selectedCampus}` : "";
      const response = await fetch(`/api/education/dashboard${campusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("获取统计数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    {
      title: "排课管理",
      description: "课程、班级、排课日历",
      icon: Calendar,
      href: "/education/schedule",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "考勤管理",
      description: "签到、考勤记录、请假审批",
      icon: UserCheck,
      href: "/education/attendance",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "课消管理",
      description: "消课记录、课时充值、预警",
      icon: DollarSign,
      href: "/education/hours",
      color: "from-orange-500 to-amber-500",
    },
    {
      title: "任务中心",
      description: "任务管理、课时预警、客户跟进",
      icon: ClipboardList,
      href: "/education/tasks",
      color: "from-blue-500 to-indigo-500",
    },
    {
      title: "课堂点评",
      description: "发起点评、点评模板",
      icon: MessageSquare,
      href: "/education/feedback",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "成长档案",
      description: "档案列表、学习报告",
      icon: FolderOpen,
      href: "/education/growth",
      color: "from-indigo-500 to-violet-500",
    },
  ];

  const quickActions = [
    {
      title: "学生管理",
      icon: Users,
      href: "/education/students",
      color: "from-blue-500 to-indigo-500",
    },
    {
      title: "老师账号",
      icon: UserPlus,
      href: "/education/teachers",
      color: "from-green-500 to-emerald-500",
      description: "给老师开设子账号",
    },
    {
      title: "课程模板",
      icon: BookOpen,
      href: "/education/courses",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "班级管理",
      icon: Clock,
      href: "/education/classes",
      color: "from-orange-500 to-amber-500",
    },
  ];

  const aiTools = [
    {
      title: "PPT课件生成",
      icon: FileText,
      href: "/course",
      color: "from-violet-500 to-purple-500",
      description: "AI智能生成专业课件",
      badge: "核心功能",
    },
    {
      title: "AI智能助手",
      icon: Sparkles,
      href: "/assistant",
      color: "from-cyan-500 to-blue-500",
      description: "文案生成、海报设计",
    },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0f1a] text-white' : 'bg-slate-50 text-gray-900'}`}>
      {/* 动态背景 */}
      <div className="fixed inset-0 -z-10">
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-[#0a0f1a] via-[#0d1425] to-[#0a0f1a]' : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50/30'}`} />
        <div 
          className={`absolute inset-0 ${isDark ? 'opacity-20' : 'opacity-30'}`}
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)'} 1px, transparent 1px),
                             linear-gradient(90deg, ${isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)'} 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className={`absolute top-0 right-1/4 w-[500px] h-[500px] ${isDark ? 'bg-emerald-600/15' : 'bg-emerald-400/20'} rounded-full blur-[150px]`} />
        <div className={`absolute bottom-0 left-1/4 w-[400px] h-[400px] ${isDark ? 'bg-blue-600/15' : 'bg-blue-400/20'} rounded-full blur-[120px]`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-400/15'} rounded-full blur-[100px]`} />
      </div>

      {/* 顶部导航 */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${isDark ? 'bg-[#0a0f1a]/80 border-white/5' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className={`gap-2 ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <ChevronLeft className="w-4 h-4" />
                返回工作台
              </Button>
              <div className={`h-4 w-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>教务管理</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CampusSelector value={selectedCampus} onChange={setSelectedCampus} />
              <div className={`h-4 w-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
              <Button
                variant="ghost"
                size="sm"
                className={`${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero 区域 */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>一站式教务管理</span>
              </div>
              <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                教务管理系统
              </h1>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                排课、考勤、课消、点评、档案 · 全流程数字化管理
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => { saveScrollPosition(); router.push("/education/schedule"); }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25"
              >
                <Calendar className="w-4 h-4 mr-2" />
                排课日历
              </Button>
              <Button 
                variant="outline"
                onClick={() => { saveScrollPosition(); router.push("/education/attendance"); }}
                className={`${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                快速考勤
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: "在籍学员", value: stats?.totalStudents || 0, color: "blue" },
            { icon: GraduationCap, label: "教师数量", value: stats?.totalTeachers || 0, color: "green" },
            { icon: Calendar, label: "今日课程", value: stats?.todayLessons || 0, color: "purple" },
            { icon: Clock, label: "待考勤", value: stats?.pendingAttendance || 0, color: "orange", highlight: true },
          ].map((item, index) => (
            <Card 
              key={index}
              className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-gray-200 shadow-sm'} ${
                item.highlight ? (isDark ? "ring-1 ring-orange-500/30" : "ring-1 ring-orange-300") : ""
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    item.color === "blue" ? "bg-blue-500/20 text-blue-500" :
                    item.color === "green" ? "bg-green-500/20 text-green-500" :
                    item.color === "purple" ? "bg-purple-500/20 text-purple-500" :
                    "bg-orange-500/20 text-orange-500"
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  {item.highlight && (item.value || 0) > 0 && (
                    <Badge className={`text-xs ${isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                      待处理
                    </Badge>
                  )}
                </div>
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</div>
                <div className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{item.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 预警提醒 */}
        {stats?.lowHoursCount && stats.lowHoursCount > 0 && (
          <Card className={`mb-6 ${isDark ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30' : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>课时预警</span>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      有 <span className="text-orange-500 font-semibold">{stats.lowHoursCount}</span> 名学员课时不足，请及时提醒续费
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { saveScrollPosition(); router.push("/education/hours?alert=low"); }}
                  className={`${isDark ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20' : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'}`}
                >
                  查看详情
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 快捷入口 */}
        <Card className={`mb-8 ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <TrendingUp className="w-5 h-5 text-cyan-500" />
              快捷入口
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((item) => (
                <Link key={item.href} href={item.href} onClick={saveScrollPosition}>
                  <Card className={`${isDark ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'} cursor-pointer group transition-all`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-2`}>
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI工具入口 */}
        <Card className={`mb-8 ${isDark ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20' : 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200'}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Sparkles className="w-5 h-5 text-violet-500" />
              AI智能工具
              <Badge className="ml-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs">NEW</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {aiTools.map((item) => (
                <Link key={item.href} href={item.href} onClick={saveScrollPosition}>
                  <Card className={`${isDark ? 'bg-white/[0.05] border-white/10 hover:bg-white/[0.08]' : 'bg-white border-violet-100 hover:border-violet-300'} cursor-pointer group transition-all`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0`}>
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</span>
                            {item.badge && (
                              <Badge className="text-xs bg-violet-500/20 text-violet-400 border-0">{item.badge}</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</p>
                          )}
                        </div>
                        <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-all shrink-0 ${isDark ? 'text-gray-600 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 功能模块 */}
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Sparkles className="w-5 h-5 text-emerald-500" />
          功能模块
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={saveScrollPosition}>
              <Card className={`group ${isDark ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'} cursor-pointer transition-all overflow-hidden`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                      </div>
                      <p className={`text-sm truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{item.description}</p>
                    </div>
                    <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-all shrink-0 ${isDark ? 'text-gray-600 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 底部提示 */}
        <div className={`mt-8 p-4 rounded-xl border ${isDark ? 'bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-emerald-500/10' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>需要帮助？</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>点击右下角智能助手，随时解答使用问题</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
