"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Calendar,
  Users,
  Clock,
  CheckSquare,
  MessageSquare,
  BookOpen,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface DashboardData {
  teacher: {
    id: string;
    name: string;
    avatar: string | null;
    phone: string | null;
  };
  todaySchedule: {
    total: number;
    completed: number;
    lessons: Array<{
      id: string;
      className: string;
      courseName: string | null;
      startTime: string;
      endTime: string;
      topic: string | null;
      status: string;
      studentCount: number;
      attendedCount: number;
      feedbackCount: number;
    }>;
  };
  weekStats: {
    lessonCount: number;
    studentCount: number;
    consumedHours: number;
  };
  todos: {
    unattended: {
      count: number;
      items: Array<{
        id: string;
        className: string;
        date: string;
        startTime: string;
      }>;
    };
    uncommented: {
      count: number;
      items: Array<{
        id: string;
        className: string;
        date: string;
        startTime: string;
        studentCount: number;
      }>;
    };
  };
  recentFeedbacks: Array<{
    id: string;
    studentName: string;
    studentAvatar: string | null;
    className: string;
    date: string;
    content: string;
    liked: boolean;
    createdAt: string;
  }>;
  dailyStats: Array<{
    day: string;
    lessons: number;
    feedbacks: number;
  }>;
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
      return;
    }

    if (role !== "teacher") {
      router.push("/login");
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/teacher/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("获取数据失败");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      scheduled: { label: "待上课", variant: "secondary" },
      ongoing: { label: "进行中", variant: "default" },
      completed: { label: "已完成", variant: "outline" },
      cancelled: { label: "已取消", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchDashboardData}>重试</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部欢迎 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={data.teacher.avatar || undefined} />
            <AvatarFallback>{data.teacher.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{data.teacher.name} 老师</h1>
            <p className="text-muted-foreground">今天是{new Date().toLocaleDateString("zh-CN", { weekday: "long" })}</p>
          </div>
        </div>
      </div>

      {/* 本周统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">授课节数</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data.weekStats.lessonCount}</div>
            <p className="text-xs text-muted-foreground mt-1">本周已授课</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">学员人数</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data.weekStats.studentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">在册学员</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">课消数量</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data.weekStats.consumedHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">本周课时消耗</p>
          </CardContent>
        </Card>
      </div>

      {/* 今日课程和待办事项 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 今日课程 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                今日课程
              </span>
              <Badge variant="secondary">
                {data.todaySchedule.completed}/{data.todaySchedule.total} 已完成
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.todaySchedule.lessons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                今日暂无课程安排
              </div>
            ) : (
              <div className="space-y-3">
                {data.todaySchedule.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/teacher/schedule?lessonId=${lesson.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-sm font-medium">{lesson.startTime}</div>
                        <div className="text-xs text-muted-foreground">{lesson.endTime}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{lesson.className}</div>
                        <div className="text-sm text-muted-foreground">
                          {lesson.topic || lesson.courseName || "课程"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm">{lesson.attendedCount}/{lesson.studentCount} 人</div>
                        <div className="text-xs text-muted-foreground">出勤</div>
                      </div>
                      {getStatusBadge(lesson.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 待办事项 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              待办事项
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 未点名 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">未点名课程</span>
                </div>
                {data.todos.unattended.count > 0 && (
                  <Badge variant="destructive">{data.todos.unattended.count}</Badge>
                )}
              </div>
              {data.todos.unattended.items.length > 0 ? (
                <div className="space-y-2 pl-6">
                  {data.todos.unattended.items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm p-2 rounded bg-muted/50 cursor-pointer hover:bg-muted"
                      onClick={() => router.push(`/teacher/attendance?lessonId=${item.id}`)}
                    >
                      <span>{item.className}</span>
                      <span className="text-muted-foreground">{item.date} {item.startTime}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground pl-6">暂无待处理</p>
              )}
            </div>

            {/* 未点评 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">未点评课程</span>
                </div>
                {data.todos.uncommented.count > 0 && (
                  <Badge variant="secondary">{data.todos.uncommented.count}</Badge>
                )}
              </div>
              {data.todos.uncommented.items.length > 0 ? (
                <div className="space-y-2 pl-6">
                  {data.todos.uncommented.items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm p-2 rounded bg-muted/50 cursor-pointer hover:bg-muted"
                      onClick={() => router.push(`/teacher/review?lessonId=${item.id}`)}
                    >
                      <span>{item.className}</span>
                      <span className="text-muted-foreground">{item.studentCount} 名学员待点评</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground pl-6">暂无待处理</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表和快捷入口 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 本周授课统计图表 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>本周授课统计</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="lessons" name="授课节数" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="feedbacks" name="点评数量" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 快捷入口 */}
        <Card>
          <CardHeader>
            <CardTitle>快捷入口</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => router.push("/teacher/schedule")}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-xs">课表管理</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => router.push("/teacher/students")}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">学员管理</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => router.push("/teacher/review")}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs">课堂点评</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => router.push("/teacher/attendance")}
            >
              <CheckSquare className="w-5 h-5" />
              <span className="text-xs">点名签到</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 最近课堂点评 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>最近课堂点评</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.push("/teacher/review")}>
            查看全部 <ChevronRight className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {data.recentFeedbacks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无点评记录
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentFeedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/teacher/students`)}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={feedback.studentAvatar || undefined} />
                    <AvatarFallback>{feedback.studentName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{feedback.studentName}</span>
                      <span className="text-xs text-muted-foreground">{feedback.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{feedback.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{feedback.className}</Badge>
                      {feedback.liked && (
                        <Badge variant="secondary" className="text-xs">已点赞</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
