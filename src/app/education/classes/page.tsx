"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Clock,
  Plus,
  Search,
  Users,
  Calendar,
  Edit,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CalendarPlus,
} from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  teacherId?: string;
  teacher?: { id: string; name: string };
  capacity: number;
  status: string;
  startDate?: string;
  endDate?: string;
  courseTemplate?: { id: string; name: string; category?: string };
  schedules: { weekday: number; startTime: string; endTime: string }[];
  _count?: { enrollments: number; lessons: number };
}

interface Teacher {
  id: string;
  name: string;
}

interface CourseTemplate {
  id: string;
  name: string;
  category?: string;
}

const weekdays = [
  { value: 1, label: "周一" },
  { value: 2, label: "周二" },
  { value: 3, label: "周三" },
  { value: 4, label: "周四" },
  { value: 5, label: "周五" },
  { value: 6, label: "周六" },
  { value: 7, label: "周日" },
];

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<CourseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [scheduleRange, setScheduleRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    courseTemplateId: "",
    teacherId: "",
    capacity: 10,
    note: "",
    schedules: [] as { weekday: number; startTime: string; endTime: string }[],
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      const [classesRes, teachersRes, coursesRes] = await Promise.all([
        fetch(`/api/education/classes?search=${search}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/education/teachers", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/education/course-templates", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [classesData, teachersData, coursesData] = await Promise.all([
        classesRes.json(),
        teachersRes.json(),
        coursesRes.json(),
      ]);

      if (classesData.success) setClasses(classesData.classes);
      if (teachersData.success) setTeachers(teachersData.teachers);
      if (coursesData.success) setCourses(coursesData.courses || []);
    } catch (error) {
      toast.error("获取数据失败");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/education/course-templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error("获取课程模板失败:", error);
    }
  };

  // 打开创建/编辑班级弹窗时刷新课程模板数据
  const handleOpenDialog = (open: boolean) => {
    if (open) {
      // 每次打开弹窗时刷新课程模板列表，确保获取最新数据
      fetchCourses();
      if (!editingClass) {
        resetForm();
      }
    }
    setIsDialogOpen(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const url = editingClass
        ? `/api/education/classes/${editingClass.id}`
        : "/api/education/classes";
      const method = editingClass ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingClass ? "更新成功" : "创建成功");
        setIsDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error(data.error || "操作失败");
      }
    } catch (error) {
      toast.error("操作失败");
    }
  };

  // 批量排课
  const handleBatchSchedule = async () => {
    if (!selectedClass) return;
    if (!scheduleRange.startDate || !scheduleRange.endDate) {
      toast.error("请选择排课日期范围");
      return;
    }
    if (selectedClass.schedules.length === 0) {
      toast.error("该班级还未设置上课时间，请先编辑班级添加上课时间");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/education/lessons", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classId: selectedClass.id,
          startDate: scheduleRange.startDate,
          endDate: scheduleRange.endDate,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`成功排课 ${data.count} 节`);
        setIsScheduleDialogOpen(false);
        setSelectedClass(null);
        fetchData();
      } else {
        toast.error(data.error || "排课失败");
      }
    } catch (error) {
      toast.error("排课失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该班级吗？")) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/education/classes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("删除成功");
        fetchData();
      }
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      courseTemplateId: "",
      teacherId: "",
      capacity: 10,
      note: "",
      schedules: [],
    });
    setEditingClass(null);
  };

  const openEditDialog = (classItem: ClassItem) => {
    // 刷新课程模板数据，确保获取最新列表
    fetchCourses();
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      courseTemplateId: classItem.courseTemplate?.id || "",
      teacherId: classItem.teacherId || "",
      capacity: classItem.capacity,
      note: "",
      schedules: classItem.schedules || [],
    });
    setIsDialogOpen(true);
  };

  const openScheduleDialog = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    // 默认排课范围为今天到一个月后
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setScheduleRange({
      startDate: today.toISOString().split("T")[0],
      endDate: nextMonth.toISOString().split("T")[0],
    });
    setIsScheduleDialogOpen(true);
  };

  const addSchedule = () => {
    setFormData({
      ...formData,
      schedules: [...formData.schedules, { weekday: 1, startTime: "09:00", endTime: "10:00" }],
    });
  };

  const updateSchedule = (index: number, field: string, value: any) => {
    const newSchedules = [...formData.schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setFormData({ ...formData, schedules: newSchedules });
  };

  const removeSchedule = (index: number) => {
    setFormData({
      ...formData,
      schedules: formData.schedules.filter((_, i) => i !== index),
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: "开课中", className: "bg-green-500/20 text-green-300" },
      paused: { label: "已暂停", className: "bg-yellow-500/20 text-yellow-300" },
      ended: { label: "已结课", className: "bg-gray-500/20 text-gray-300" },
    };
    const s = statusMap[status] || statusMap.active;
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* 动态背景 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1425] to-[#0a0f1a]" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[120px]" />
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white">班级管理</span>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleOpenDialog}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetForm}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  创建班级
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#0d1425] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">{editingClass ? "编辑班级" : "创建班级"}</DialogTitle>
                  <DialogDescription className="text-gray-400">设置班级基本信息和上课时间</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-300">班级名称 *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="如：周六美术1班"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity" className="text-gray-300">班级容量</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 10 })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">关联课程</Label>
                      <Select value={formData.courseTemplateId} onValueChange={(v) => setFormData({ ...formData, courseTemplateId: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="选择课程模板" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d1425] border-white/10">
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-gray-300 focus:bg-white/5">{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">授课教师</Label>
                      <Select value={formData.teacherId} onValueChange={(v) => setFormData({ ...formData, teacherId: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="选择教师" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d1425] border-white/10">
                          {teachers.map((t) => (
                            <SelectItem key={t.id} value={t.id} className="text-gray-300 focus:bg-white/5">{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">上课时间（排课模板）</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addSchedule}
                        className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">
                        <Plus className="w-3 h-3 mr-1" />
                        添加时间
                      </Button>
                    </div>
                    {formData.schedules.map((schedule, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                        <Select value={schedule.weekday.toString()} onValueChange={(v) => updateSchedule(index, "weekday", parseInt(v))}>
                          <SelectTrigger className="w-20 bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1425] border-white/10">
                            {weekdays.map((d) => (
                              <SelectItem key={d.value} value={d.value.toString()} className="text-gray-300 focus:bg-white/5">{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) => updateSchedule(index, "startTime", e.target.value)}
                          className="w-28 bg-white/5 border-white/10 text-white"
                        />
                        <span className="text-gray-500">-</span>
                        <Input
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) => updateSchedule(index, "endTime", e.target.value)}
                          className="w-28 bg-white/5 border-white/10 text-white"
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeSchedule(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {formData.schedules.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">点击"添加时间"设置上课时间模板</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}
                      className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">
                      取消
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
                      {editingClass ? "更新" : "创建"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 搜索 */}
        <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="搜索班级名称..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  onKeyDown={(e) => e.key === "Enter" && fetchData()}
                />
              </div>
              <Button onClick={fetchData} className="bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10">
                搜索
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 提示信息 */}
        <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="text-white font-medium">排课流程说明</span>
                <p className="text-sm text-gray-400">1. 创建班级并设置上课时间模板 → 2. 点击班级卡片上的"排课"按钮 → 3. 选择日期范围生成课程 → 4. 在排课日历查看</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 班级列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-gray-500">加载中...</div>
          ) : classes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>暂无班级数据</p>
              <p className="text-sm mt-2">点击右上角"创建班级"开始</p>
            </div>
          ) : (
            classes.map((classItem) => (
              <Card key={classItem.id} className="bg-white/[0.03] backdrop-blur-sm border-white/5 hover:bg-white/[0.05] transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-white">{classItem.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {classItem.courseTemplate && (
                          <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">{classItem.courseTemplate.name}</Badge>
                        )}
                        {getStatusBadge(classItem.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openScheduleDialog(classItem)}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                        <CalendarPlus className="w-4 h-4 mr-1" />
                        排课
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(classItem)}
                        className="text-gray-400 hover:text-white hover:bg-white/5">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(classItem.id)}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{classItem._count?.enrollments || 0}/{classItem.capacity}人</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{classItem._count?.lessons || 0}节课</span>
                    </div>
                    <div className="text-gray-400">
                      教师：{classItem.teacher?.name || "未指定"}
                    </div>
                  </div>

                  {classItem.schedules.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {classItem.schedules.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-white/5 text-gray-300">
                          {weekdays.find((d) => d.value === s.weekday)?.label} {s.startTime}-{s.endTime}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">未设置上课时间，请编辑班级添加</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* 批量排课弹窗 */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-md bg-[#0d1425] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">批量排课</DialogTitle>
            <DialogDescription className="text-gray-400">
              为 <span className="text-cyan-400">{selectedClass?.name}</span> 生成课程
            </DialogDescription>
          </DialogHeader>
          
          {selectedClass && selectedClass.schedules.length === 0 ? (
            <div className="py-6 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">该班级未设置上课时间模板</p>
              <p className="text-sm text-gray-500 mt-2">请先编辑班级添加上课时间</p>
              <Button 
                className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600"
                onClick={() => {
                  setIsScheduleDialogOpen(false);
                  openEditDialog(selectedClass);
                }}
              >
                去编辑班级
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">上课时间模板：</p>
                <div className="flex flex-wrap gap-2">
                  {selectedClass?.schedules.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs bg-cyan-500/20 text-cyan-300">
                      {weekdays.find((d) => d.value === s.weekday)?.label} {s.startTime}-{s.endTime}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">开始日期</Label>
                  <Input
                    type="date"
                    value={scheduleRange.startDate}
                    onChange={(e) => setScheduleRange({ ...scheduleRange, startDate: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">结束日期</Label>
                  <Input
                    type="date"
                    value={scheduleRange.endDate}
                    onChange={(e) => setScheduleRange({ ...scheduleRange, endDate: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}
                  className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">
                  取消
                </Button>
                <Button onClick={handleBatchSchedule} className="bg-gradient-to-r from-cyan-600 to-blue-600">
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  开始排课
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
