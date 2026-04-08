"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Sparkles,
} from "lucide-react";

interface Lesson {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  topic?: string;
  status: string;
  classroom?: string;
  class: {
    id: string;
    name: string;
    teacher?: { id: string; name: string };
  };
  attendances: {
    id: string;
    status: string;
    student: { id: string; name: string };
  }[];
  feedbacks: { id: string; studentId: string }[];
}

interface ClassItem {
  id: string;
  name: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  scheduled: { label: "已排课", color: "bg-blue-500/20 text-blue-300" },
  ongoing: { label: "进行中", color: "bg-green-500/20 text-green-300" },
  completed: { label: "已完成", color: "bg-gray-500/20 text-gray-300" },
  cancelled: { label: "已取消", color: "bg-red-500/20 text-red-300" },
};

const attendanceMap: Record<string, { label: string; color: string }> = {
  pending: { label: "待签到", color: "text-gray-400" },
  present: { label: "出勤", color: "text-green-400" },
  absent: { label: "缺勤", color: "text-red-400" },
  leave: { label: "请假", color: "text-yellow-400" },
  late: { label: "迟到", color: "text-orange-400" },
  early_leave: { label: "早退", color: "text-purple-400" },
};

export default function SchedulePage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchClasses();
  }, [router]);

  useEffect(() => {
    fetchLessons();
  }, [currentDate, selectedClass]);

  const fetchClasses = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/education/classes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error("获取班级列表失败:", error);
    }
  };

  const fetchLessons = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    try {
      const params = new URLSearchParams({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
        ...(selectedClass !== "all" && { classId: selectedClass }),
      });

      const response = await fetch(`/api/education/lessons?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setLessons(data.lessons);
      }
    } catch (error) {
      toast.error("获取课程列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getLessonsForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return lessons.filter((l) => l.date.split("T")[0] === dateStr);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = getDaysInMonth(currentDate);
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* 动态背景 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1425] to-[#0a0f1a]" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[120px]" />
      </div>

      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/education")}
                className="gap-2 text-gray-400 hover:text-white hover:bg-white/5"
              >
                <ChevronLeft className="w-4 h-4" />
                返回教务
              </Button>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white">排课日历</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="全部班级" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1425] border-white/10">
                  <SelectItem value="all" className="text-gray-300 focus:bg-white/5">全部班级</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-gray-300 focus:bg-white/5">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => router.push("/education/classes")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                新增排课
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 日历卡片 */}
        <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={prevMonth}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-xl text-white min-w-[140px] text-center">
                  {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={nextMonth}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                今天
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* 星期标题 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* 日期网格 */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="min-h-[100px]" />;
                }

                const dayLessons = getLessonsForDay(day);
                const isToday = day.toDateString() === today.toDateString();
                const isPast = day < today;

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 rounded-lg border transition-colors ${
                      isToday
                        ? "bg-blue-500/10 border-blue-500/30"
                        : isPast
                        ? "bg-white/[0.02] border-white/5"
                        : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-400" : "text-gray-400"}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayLessons.slice(0, 2).map((lesson) => (
                        <div
                          key={lesson.id}
                          onClick={() => {
                            setSelectedLesson(lesson);
                            setIsDetailOpen(true);
                          }}
                          className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 ${statusMap[lesson.status]?.color || "bg-gray-500/20 text-gray-300"}`}
                        >
                          <div className="font-medium truncate">{lesson.class.name}</div>
                          <div className="flex items-center gap-1 opacity-70">
                            <Clock className="w-3 h-3" />
                            {lesson.startTime}
                          </div>
                        </div>
                      ))}
                      {dayLessons.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayLessons.length - 2} 更多
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 图例说明 */}
        <div className="flex items-center justify-center gap-6 mt-4">
          {Object.entries(statusMap).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${value.color.split(' ')[0]}`} />
              <span className="text-sm text-gray-400">{value.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* 课程详情弹窗 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md bg-[#0d1425] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">课程详情</DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-white">{selectedLesson.class.name}</h3>
                <Badge className={statusMap[selectedLesson.status]?.color}>
                  {statusMap[selectedLesson.status]?.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <span className="text-gray-500 block mb-1">时间</span>
                  <span className="text-white">{selectedLesson.startTime} - {selectedLesson.endTime}</span>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <span className="text-gray-500 block mb-1">教师</span>
                  <span className="text-white">{selectedLesson.class.teacher?.name || "未指定"}</span>
                </div>
              </div>

              {selectedLesson.topic && (
                <div className="bg-white/5 rounded-lg p-3 text-sm">
                  <span className="text-gray-500 block mb-1">课程主题</span>
                  <span className="text-white">{selectedLesson.topic}</span>
                </div>
              )}

              <div className="border-t border-white/10 pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2 text-white">
                  <Users className="w-4 h-4" />
                  考勤情况 ({selectedLesson.attendances.length}人)
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedLesson.attendances.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm bg-white/5 rounded-lg p-2">
                      <span className="text-gray-300">{a.student.name}</span>
                      <span className={attendanceMap[a.status]?.color}>
                        {attendanceMap[a.status]?.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailOpen(false)}
                  className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  关闭
                </Button>
                <Button 
                  onClick={() => router.push(`/education/attendance?lessonId=${selectedLesson.id}`)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                >
                  考勤管理
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
