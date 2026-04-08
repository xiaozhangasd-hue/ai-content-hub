"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Copy,
  Trash2,
  Plus,
  Clock,
  Users,
  MapPin,
  AlertCircle,
} from "lucide-react";

interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    classId: string;
    teacherId: string;
    teacherName: string;
    topic: string;
    classroom: string;
    status: string;
    studentCount: number;
    attendedCount: number;
  };
}

interface ClassInfo {
  id: string;
  name: string;
  teacher: { id: string; name: string } | null;
  campus: { id: string; name: string } | null;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const HOURS = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

const SUBJECT_COLORS: Record<string, string> = {
  美术: "bg-pink-100 text-pink-700 border-pink-300",
  舞蹈: "bg-purple-100 text-purple-700 border-purple-300",
  音乐: "bg-blue-100 text-blue-700 border-blue-300",
  体育: "bg-green-100 text-green-700 border-green-300",
  英语: "bg-yellow-100 text-yellow-700 border-yellow-300",
  default: "bg-gray-100 text-gray-700 border-gray-300",
};

export default function SchedulePage() {
  const router = useRouter();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    classId: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    topic: "",
    classroom: "",
  });

  // 复制课表表单
  const [duplicateForm, setDuplicateForm] = useState({
    sourceStartDate: "",
    targetStartDate: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchSchedule();
  }, [router, currentDate]);

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // 计算周开始和结束日期
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const response = await fetch(
        `/api/teacher/schedule?startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setEvents(data.data.events);
        setClasses(data.data.classes);
      }
    } catch (error) {
      console.error("获取课表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const getEventsForDateAndTime = (date: Date, hour: number): ScheduleEvent[] => {
    const dateStr = formatDate(date);
    return events.filter((event) => {
      const eventDate = event.start.split("T")[0];
      const eventHour = parseInt(event.start.split("T")[1].split(":")[0]);
      return eventDate === dateStr && eventHour === hour;
    });
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateLesson = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/teacher/schedule", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setIsNewDialogOpen(false);
        fetchSchedule();
        resetForm();
      } else if (data.error?.includes("冲突")) {
        alert(data.error);
      }
    } catch (error) {
      console.error("创建课程失败:", error);
    }
  };

  const handleUpdateLesson = async () => {
    if (!selectedEvent) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/teacher/schedule", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedEvent.id,
          ...formData,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsEditDialogOpen(false);
        fetchSchedule();
      } else if (data.error?.includes("冲突")) {
        alert(data.error);
      }
    } catch (error) {
      console.error("更新课程失败:", error);
    }
  };

  const handleDeleteLesson = async () => {
    if (!selectedEvent || !confirm("确定要删除这节课吗？")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/teacher/schedule?id=${selectedEvent.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setIsEditDialogOpen(false);
        fetchSchedule();
      }
    } catch (error) {
      console.error("删除课程失败:", error);
    }
  };

  const handleDuplicateSchedule = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/teacher/schedule/duplicate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(duplicateForm),
      });

      const data = await response.json();
      if (data.success) {
        alert(`成功复制 ${data.data.copiedCount} 节课程`);
        setIsDuplicateDialogOpen(false);
        fetchSchedule();
      }
    } catch (error) {
      console.error("复制课表失败:", error);
    }
  };

  const handleExport = async (format: "excel" | "ical") => {
    const weekStart = getWeekStart(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const token = localStorage.getItem("token");
    const url = `/api/teacher/schedule/export?startDate=${formatDate(weekStart)}&endDate=${formatDate(weekEnd)}&format=${format}`;

    window.open(url, "_blank");
  };

  const resetForm = () => {
    setFormData({
      classId: "",
      date: formatDate(currentDate),
      startTime: "09:00",
      endTime: "10:00",
      topic: "",
      classroom: "",
    });
  };

  const weekStart = getWeekStart(currentDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">课表管理</h1>
          <p className="text-muted-foreground">可视化排课，轻松管理教学计划</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsDuplicateDialogOpen(true)}>
            <Copy className="w-4 h-4 mr-1" />
            复制周课表
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
            <Download className="w-4 h-4 mr-1" />
            导出Excel
          </Button>
          <Button onClick={() => { resetForm(); setIsNewDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" />
            添加课程
          </Button>
        </div>
      </div>

      {/* 日历导航 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>
                今天
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-lg font-medium text-gray-900">
              {weekDates[0].toLocaleDateString("zh-CN", { month: "long", day: "numeric" })} -{" "}
              {weekDates[6].toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
              >
                周视图
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                月视图
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 周视图 */}
      {viewMode === "week" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b">
                    <th className="w-20 p-2 text-center text-sm font-medium text-muted-foreground">
                      时间
                    </th>
                    {weekDates.map((date, idx) => (
                      <th key={idx} className="p-2 text-center border-l">
                        <div className="text-sm font-medium">
                          周{WEEKDAYS[date.getDay()]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {date.getDate()}日
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((hour, hourIdx) => (
                    <tr key={hourIdx} className="border-b h-16">
                      <td className="p-2 text-center text-xs text-muted-foreground border-r">
                        {hour}
                      </td>
                      {weekDates.map((date, dateIdx) => {
                        const dayEvents = getEventsForDateAndTime(date, parseInt(hour.split(":")[0]));
                        return (
                          <td
                            key={dateIdx}
                            className="p-1 border-l align-top cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                date: formatDate(date),
                                startTime: hour,
                                endTime: `${String(parseInt(hour.split(":")[0]) + 1).padStart(2, "0")}:00`,
                              });
                              setIsNewDialogOpen(true);
                            }}
                          >
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                className={`p-1 rounded text-xs cursor-pointer mb-1 ${
                                  SUBJECT_COLORS[event.title.includes("美术")
                                    ? "美术"
                                    : event.title.includes("舞蹈")
                                    ? "舞蹈"
                                    : event.title.includes("音乐")
                                    ? "音乐"
                                    : event.title.includes("体育")
                                    ? "体育"
                                    : "default"]
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                  setFormData({
                                    classId: event.extendedProps.classId,
                                    date: event.start.split("T")[0],
                                    startTime: event.start.split("T")[1],
                                    endTime: event.end.split("T")[1],
                                    topic: event.extendedProps.topic || "",
                                    classroom: event.extendedProps.classroom || "",
                                  });
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <div className="font-medium truncate">{event.title}</div>
                                <div className="flex items-center gap-1 text-[10px] opacity-80">
                                  <Clock className="w-3 h-3" />
                                  {event.start.split("T")[1]}-{event.end.split("T")[1]}
                                </div>
                                {event.extendedProps.classroom && (
                                  <div className="flex items-center gap-1 text-[10px] opacity-80">
                                    <MapPin className="w-3 h-3" />
                                    {event.extendedProps.classroom}
                                  </div>
                                )}
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 新建课程对话框 */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加课程</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">班级</label>
              <Select
                value={formData.classId}
                onValueChange={(value) => setFormData({ ...formData, classId: value })}
              >
                <SelectTrigger className="text-gray-900">
                  <SelectValue placeholder="选择班级" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">日期</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">开始时间</label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">结束时间</label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">课程主题</label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="可选"
              />
            </div>
            <div>
              <label className="text-sm font-medium">教室</label>
              <Input
                value={formData.classroom}
                onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                placeholder="可选"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateLesson}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑课程对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑课程</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">日期</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">开始时间</label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">结束时间</label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">课程主题</label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">教室</label>
              <Input
                value={formData.classroom}
                onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={handleDeleteLesson}>
              <Trash2 className="w-4 h-4 mr-1" />
              删除
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleUpdateLesson}>保存</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 复制课表对话框 */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>复制周课表</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">源周开始日期</label>
              <Input
                type="date"
                value={duplicateForm.sourceStartDate}
                onChange={(e) => setDuplicateForm({ ...duplicateForm, sourceStartDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">目标周开始日期</label>
              <Input
                type="date"
                value={duplicateForm.targetStartDate}
                onChange={(e) => setDuplicateForm({ ...duplicateForm, targetStartDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleDuplicateSchedule}>复制</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
