"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  FolderOpen,
  Plus,
  Calendar,
  Image,
  Video,
  FileText,
  Award,
  TrendingUp,
  Share2,
  Star,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  BookOpen,
  Music,
  Palette,
  Trophy,
  Target,
  Heart,
  Camera,
} from "lucide-react";

interface GrowthRecord {
  id: string;
  type: string;
  title: string;
  content?: string;
  media?: string;
  recordDate: string;
  tags?: string;
  student: { id: string; name: string; avatar?: string };
  class?: { id: string; name: string; teacher?: { id: string; name: string } };
}

interface Student {
  id: string;
  name: string;
  avatar?: string;
  _count?: { growthRecords: number };
}

interface ClassInfo {
  id: string;
  name: string;
  teacher?: { id: string; name: string };
}

const recordTypes = [
  { value: "work", label: "作品展示", icon: Palette, color: "from-blue-500 to-cyan-500", description: "记录学员创作的作品" },
  { value: "milestone", label: "学习里程碑", icon: Trophy, color: "from-yellow-500 to-orange-500", description: "记录学习过程中的重要成就" },
  { value: "feedback", label: "课堂点评", icon: FileText, color: "from-purple-500 to-pink-500", description: "教师对课堂表现的点评" },
  { value: "report", label: "学习报告", icon: TrendingUp, color: "from-green-500 to-emerald-500", description: "阶段性学习总结报告" },
  { value: "performance", label: "演出/比赛", icon: Star, color: "from-red-500 to-rose-500", description: "参加演出或比赛记录" },
  { value: "certificate", label: "考级证书", icon: Award, color: "from-amber-500 to-yellow-500", description: "获得的证书和荣誉" },
];

export default function GrowthPage() {
  const router = useRouter();
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<GrowthRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");
  const [formData, setFormData] = useState({
    studentId: "",
    type: "work",
    title: "",
    content: "",
    media: "",
    recordDate: new Date().toISOString().split("T")[0],
    tags: "",
    classId: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchRecords();
    }
  }, [selectedStudentId]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      const [recordsRes, studentsRes, classesRes] = await Promise.all([
        fetch("/api/education/growth-records", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/education/students", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/education/classes", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [recordsData, studentsData, classesData] = await Promise.all([
        recordsRes.json(),
        studentsRes.json(),
        classesRes.json(),
      ]);

      if (recordsData.success) setRecords(recordsData.records);
      if (studentsData.success) setStudents(studentsData.students);
      if (classesData.success) setClasses(classesData.classes);
    } catch (error) {
      toast.error("获取数据失败");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecords = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `/api/education/growth-records?studentId=${selectedStudentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setRecords(data.records);
      }
    } catch (error) {
      console.error("获取档案失败:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const url = isEditMode && selectedRecord 
        ? `/api/education/growth-records/${selectedRecord.id}`
        : "/api/education/growth-records";
      const method = isEditMode ? "PUT" : "POST";

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
        toast.success(isEditMode ? "修改成功" : "添加成功");
        setIsDialogOpen(false);
        setIsEditMode(false);
        setSelectedRecord(null);
        resetForm();
        fetchData();
      } else {
        toast.error(data.error || "操作失败");
      }
    } catch (error) {
      toast.error("操作失败");
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm("确定要删除这条记录吗？")) return;
    
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/education/growth-records/${recordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        toast.success("删除成功");
        setIsDetailOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "删除失败");
      }
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const handleEdit = (record: GrowthRecord) => {
    setSelectedRecord(record);
    setIsEditMode(true);
    setFormData({
      studentId: record.student.id,
      type: record.type,
      title: record.title,
      content: record.content || "",
      media: record.media || "",
      recordDate: record.recordDate.split("T")[0],
      tags: record.tags || "",
      classId: record.class?.id || "",
    });
    setIsDetailOpen(false);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      studentId: "",
      type: "work",
      title: "",
      content: "",
      media: "",
      recordDate: new Date().toISOString().split("T")[0],
      tags: "",
      classId: "",
    });
    setIsEditMode(false);
    setSelectedRecord(null);
  };

  const getRecordTypeInfo = (type: string) => {
    return recordTypes.find((t) => t.value === type) || recordTypes[0];
  };

  // 按日期分组
  const groupedRecords = records.reduce((groups, record) => {
    const date = record.recordDate.split("T")[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
    return groups;
  }, {} as Record<string, GrowthRecord[]>);

  // 统计数据
  const stats = {
    total: records.length,
    byType: recordTypes.map(type => ({
      ...type,
      count: records.filter(r => r.type === type.value).length
    })),
    recentCount: records.filter(r => {
      const recordDate = new Date(r.recordDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return recordDate >= weekAgo;
    }).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/education")}
              className="gap-1 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">成长档案</h1>
              <p className="text-gray-500 mt-1">记录学员成长轨迹，见证每一次进步</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-sm">
              <Button
                variant={viewMode === "timeline" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("timeline")}
                className={viewMode === "timeline" ? "bg-indigo-500" : ""}
              >
                <Clock className="w-4 h-4 mr-1" />
                时间线
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-indigo-500" : ""}
              >
                <FolderOpen className="w-4 h-4 mr-1" />
                卡片
              </Button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-500 to-violet-500" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加记录
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "编辑记录" : "添加成长记录"}</DialogTitle>
                  <DialogDescription>记录学员的成长瞬间</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>选择学员 *</Label>
                      <Select
                        value={formData.studentId}
                        onValueChange={(v) => setFormData({ ...formData, studentId: v })}
                      >
                        <SelectTrigger className="border-gray-200 text-gray-900">
                          <SelectValue placeholder="选择学员" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>关联班级</Label>
                      <Select
                        value={formData.classId}
                        onValueChange={(v) => setFormData({ ...formData, classId: v })}
                      >
                        <SelectTrigger className="border-gray-200 text-gray-900">
                          <SelectValue placeholder="选择班级（可选）" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>记录类型</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {recordTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: type.value })}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                            formData.type === type.value
                              ? "border-indigo-300 bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <type.icon className="w-4 h-4" />
                          <span className="text-sm">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>标题 *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="记录标题"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>详细描述</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="描述这次成长..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>图片/视频链接</Label>
                    <Input
                      value={formData.media}
                      onChange={(e) => setFormData({ ...formData, media: e.target.value })}
                      placeholder="输入图片或视频URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>记录日期</Label>
                    <Input
                      type="date"
                      value={formData.recordDate}
                      onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>标签（逗号分隔）</Label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="如：进步,优秀,考级"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}>
                      取消
                    </Button>
                    <Button type="submit">{isEditMode ? "保存修改" : "添加记录"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-gray-500">总记录数</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.recentCount}</div>
                  <div className="text-sm text-gray-500">本周新增</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stats.byType.find(t => t.value === "milestone")?.count || 0}
                  </div>
                  <div className="text-sm text-gray-500">里程碑</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{students.length}</div>
                  <div className="text-sm text-gray-500">有档案学员</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 学员列表 */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">学员列表</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedStudentId("");
                    fetchData();
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    !selectedStudentId
                      ? "bg-indigo-50 border border-indigo-300"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="font-medium">全部记录</div>
                  <div className="text-sm text-gray-500">{records.length} 条记录</div>
                </button>
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedStudentId === student.id
                        ? "bg-indigo-50 border border-indigo-300"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-medium">
                        {student.name[0]}
                      </div>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-gray-500">
                          {student._count?.growthRecords || 0} 条记录
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 成长展示区 */}
          <div className="lg:col-span-3 space-y-6">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">加载中...</div>
            ) : Object.keys(groupedRecords).length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="py-12 text-center text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无成长记录</p>
                  <p className="text-sm mt-2">点击右上角"添加记录"开始记录</p>
                </CardContent>
              </Card>
            ) : viewMode === "timeline" ? (
              // 时间线视图
              Object.entries(groupedRecords)
                .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                .map(([date, dayRecords]) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">
                          {new Date(date).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {dayRecords.length} 条记录
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4 pl-5 border-l-2 border-indigo-100 ml-5">
                      {dayRecords.map((record, index) => {
                        const typeInfo = getRecordTypeInfo(record.type);
                        return (
                          <div key={record.id} className="relative">
                            <div className="absolute -left-[26px] top-4 w-4 h-4 rounded-full bg-white border-2 border-indigo-300" />
                            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                              onClick={() => {
                                setSelectedRecord(record);
                                setIsDetailOpen(true);
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeInfo.color} flex items-center justify-center shadow-lg`}
                                    >
                                      <typeInfo.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-gray-900">{record.title}</h3>
                                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <User className="w-3 h-3" />
                                        <span>{record.student.name}</span>
                                        <span>·</span>
                                        <span>{typeInfo.label}</span>
                                        {record.class && (
                                          <>
                                            <span>·</span>
                                            <BookOpen className="w-3 h-3" />
                                            <span>{record.class.name}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(record);
                                      }}
                                    >
                                      <Edit className="w-4 h-4 text-gray-400" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(record.id);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 text-gray-400" />
                                    </Button>
                                  </div>
                                </div>
                                {record.content && (
                                  <p className="text-gray-600 text-sm line-clamp-2">{record.content}</p>
                                )}
                                {record.media && (
                                  <div className="mt-3 rounded-lg overflow-hidden">
                                    {record.media.includes("video") ? (
                                      <video src={record.media} className="w-full h-40 object-cover" />
                                    ) : (
                                      <img src={record.media} alt="" className="w-full h-40 object-cover" />
                                    )}
                                  </div>
                                )}
                                {record.tags && (
                                  <div className="flex flex-wrap gap-1 mt-3">
                                    {JSON.parse(record.tags).map((tag: string) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
            ) : (
              // 卡片网格视图
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {records
                  .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())
                  .map((record) => {
                    const typeInfo = getRecordTypeInfo(record.type);
                    return (
                      <Card 
                        key={record.id} 
                        className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                        onClick={() => {
                          setSelectedRecord(record);
                          setIsDetailOpen(true);
                        }}
                      >
                        {record.media && (
                          <div className="h-40 overflow-hidden">
                            {record.media.includes("video") ? (
                              <video src={record.media} className="w-full h-full object-cover" />
                            ) : (
                              <img src={record.media} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeInfo.color} flex items-center justify-center`}
                            >
                              <typeInfo.icon className="w-4 h-4 text-white" />
                            </div>
                            <Badge variant="secondary" className="text-xs">{typeInfo.label}</Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 line-clamp-1">{record.title}</h3>
                          {record.content && (
                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{record.content}</p>
                          )}
                          <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                            <span>{record.student.name}</span>
                            <span>{new Date(record.recordDate).toLocaleDateString("zh-CN")}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 详情弹窗 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const typeInfo = getRecordTypeInfo(selectedRecord.type);
                    return (
                      <>
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeInfo.color} flex items-center justify-center`}>
                          <typeInfo.icon className="w-4 h-4 text-white" />
                        </div>
                        {selectedRecord.title}
                      </>
                    );
                  })()}
                </DialogTitle>
                <DialogDescription>
                  {selectedRecord.student.name} · {new Date(selectedRecord.recordDate).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </DialogDescription>
              </DialogHeader>
              
              {selectedRecord.media && (
                <div className="rounded-lg overflow-hidden my-4">
                  {selectedRecord.media.includes("video") ? (
                    <video src={selectedRecord.media} className="w-full" controls />
                  ) : (
                    <img src={selectedRecord.media} alt="" className="w-full" />
                  )}
                </div>
              )}
              
              {selectedRecord.content && (
                <div className="bg-gray-50 rounded-lg p-4 my-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.content}</p>
                </div>
              )}
              
              {selectedRecord.tags && (
                <div className="flex flex-wrap gap-2 my-4">
                  {JSON.parse(selectedRecord.tags).map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {selectedRecord.class && (
                <div className="text-sm text-gray-500 mb-4">
                  关联班级：{selectedRecord.class.name}
                  {selectedRecord.class.teacher && ` · 授课老师：${selectedRecord.class.teacher.name}`}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => handleDelete(selectedRecord.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </Button>
                <Button onClick={() => handleEdit(selectedRecord)}>
                  <Edit className="w-4 h-4 mr-2" />
                  编辑
                </Button>
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  分享给家长
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
