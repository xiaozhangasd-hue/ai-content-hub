"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Users, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

interface Schedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  className: string;
  classroom: string;
  students: number;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
}

export default function TeacherSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    fetchSchedules();
  }, [currentWeek]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/teacher/schedule", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
      // Mock data for demo
      setSchedules([
        {
          id: "1",
          date: new Date().toISOString().split("T")[0],
          startTime: "09:00",
          endTime: "10:30",
          className: "少儿美术基础班",
          classroom: "A教室",
          students: 12,
          status: "scheduled",
        },
        {
          id: "2",
          date: new Date().toISOString().split("T")[0],
          startTime: "14:00",
          endTime: "15:30",
          className: "素描进阶班",
          classroom: "B教室",
          students: 8,
          status: "scheduled",
        },
        {
          id: "3",
          date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          startTime: "10:00",
          endTime: "11:30",
          className: "油画班",
          classroom: "C教室",
          students: 6,
          status: "scheduled",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      scheduled: { label: "待上课", className: "bg-blue-500/20 text-blue-400" },
      ongoing: { label: "进行中", className: "bg-green-500/20 text-green-400" },
      completed: { label: "已完成", className: "bg-slate-500/20 text-slate-400" },
      cancelled: { label: "已取消", className: "bg-red-500/20 text-red-400" },
    };
    const config = statusConfig[status] || statusConfig.scheduled;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* 周视图头部 */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              我的排课
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const prevWeek = new Date(currentWeek);
                  prevWeek.setDate(prevWeek.getDate() - 7);
                  setCurrentWeek(prevWeek);
                }}
                className="text-slate-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-slate-300 text-sm min-w-[140px] text-center">
                {weekDays[0].toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
                {" - "}
                {weekDays[6].toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const nextWeek = new Date(currentWeek);
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setCurrentWeek(nextWeek);
                }}
                className="text-slate-400 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 周视图 */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day, index) => {
          const dateStr = day.toISOString().split("T")[0];
          const daySchedules = schedules.filter((s) => s.date === dateStr);
          const isToday = dateStr === today;

          return (
            <Card
              key={index}
              className={`bg-slate-900/50 border-white/10 ${
                isToday ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="p-3 border-b border-white/10">
                <div className="text-center">
                  <p className="text-xs text-slate-400">
                    {day.toLocaleDateString("zh-CN", { weekday: "short" })}
                  </p>
                  <p
                    className={`text-lg font-semibold mt-1 ${
                      isToday ? "text-blue-400" : "text-white"
                    }`}
                  >
                    {day.getDate()}
                  </p>
                </div>
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {daySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-2 rounded-lg bg-slate-800/50 border border-white/5 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <p className="text-xs font-medium text-blue-400">
                      {schedule.startTime}-{schedule.endTime}
                    </p>
                    <p className="text-sm text-white truncate mt-1">
                      {schedule.className}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {schedule.classroom} · {schedule.students}人
                    </p>
                  </div>
                ))}
                {daySchedules.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">暂无课程</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 详细列表 */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-base">课程详情</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">加载中...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-slate-400">本周暂无排课</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-400">日期</TableHead>
                  <TableHead className="text-slate-400">时间</TableHead>
                  <TableHead className="text-slate-400">课程</TableHead>
                  <TableHead className="text-slate-400">教室</TableHead>
                  <TableHead className="text-slate-400">学员数</TableHead>
                  <TableHead className="text-slate-400">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow
                    key={schedule.id}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell className="text-slate-300">
                      {new Date(schedule.date).toLocaleDateString("zh-CN", {
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {schedule.startTime}-{schedule.endTime}
                    </TableCell>
                    <TableCell className="text-white">{schedule.className}</TableCell>
                    <TableCell className="text-slate-300">{schedule.classroom}</TableCell>
                    <TableCell className="text-slate-300">{schedule.students}人</TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
