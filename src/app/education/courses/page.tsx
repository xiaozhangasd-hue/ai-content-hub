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
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Search,
  Clock,
  Edit,
  Trash2,
  ChevronLeft,
} from "lucide-react";

interface CourseTemplate {
  id: string;
  name: string;
  category?: string;
  totalHours: number;
  duration: number;
  description?: string;
  status: string;
  _count?: { classes: number };
}

interface MerchantInfo {
  category?: string;
  subjects?: string[];
}

export default function CourseTemplatesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseTemplate | null>(null);
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    totalHours: 10,
    duration: 45,
    description: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchMerchantInfo();
    fetchCourses();
  }, [router]);

  const fetchMerchantInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/merchant/info", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.merchantInfo) {
        setMerchantInfo(data.merchantInfo);
      } else {
        // 尝试从本地存储获取
        const storedMerchantInfo = localStorage.getItem("merchantInfo");
        if (storedMerchantInfo) {
          setMerchantInfo(JSON.parse(storedMerchantInfo));
        }
      }
    } catch (error) {
      // 尝试从本地存储获取
      const storedMerchantInfo = localStorage.getItem("merchantInfo");
      if (storedMerchantInfo) {
        setMerchantInfo(JSON.parse(storedMerchantInfo));
      }
    }
  };

  const fetchCourses = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      const response = await fetch(`/api/education/course-templates?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.courses || []);
      }
    } catch (error) {
      toast.error("获取课程列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("请输入课程名称");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const url = editingCourse
        ? `/api/education/course-templates/${editingCourse.id}`
        : "/api/education/course-templates";
      const method = editingCourse ? "PUT" : "POST";

      // 课程类型自动使用商家行业
      const category = merchantInfo?.category || merchantInfo?.subjects?.[0] || "";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          category,
          totalHours: formData.totalHours,
          duration: formData.duration,
          description: formData.description,
        }),
      });

      const data = await response.json();
      if (data.success || data.course) {
        toast.success(editingCourse ? "更新成功" : "添加成功");
        setIsDialogOpen(false);
        resetForm();
        // 强制刷新数据，确保获取最新列表
        await fetchCourses();
      } else {
        toast.error(data.error || "操作失败");
      }
    } catch (error) {
      console.error("操作失败:", error);
      toast.error("操作失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该课程模板吗？")) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/education/course-templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("删除成功");
        fetchCourses();
      }
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      totalHours: 10,
      duration: 45,
      description: "",
    });
    setEditingCourse(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  const openEditDialog = (course: CourseTemplate) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      totalHours: course.totalHours,
      duration: course.duration,
      description: course.description || "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <h1 className="text-2xl font-bold text-gray-900">课程模板</h1>
              <p className="text-gray-500 mt-1">管理课程类型和课时设置</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Plus className="w-4 h-4 mr-2" />
                添加课程
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-gray-900">{editingCourse ? "编辑课程" : "添加课程"}</DialogTitle>
                <DialogDescription className="text-gray-500">
                  {merchantInfo?.category 
                    ? `课程类型将自动设置为：${merchantInfo.category}` 
                    : "填写课程基本信息"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">课程名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：少儿美术基础班"
                    required
                    className="border-gray-200"
                  />
                </div>

                {/* 显示自动获取的课程类型 */}
                {merchantInfo?.category && (
                  <div className="space-y-2">
                    <Label className="text-gray-700">课程类型</Label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Badge variant="secondary">{merchantInfo.category}</Badge>
                      <span className="text-sm text-gray-500">（根据机构行业自动设置）</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalHours" className="text-gray-700">总课时</Label>
                    <Input
                      id="totalHours"
                      type="number"
                      value={formData.totalHours}
                      onChange={(e) => setFormData({ ...formData, totalHours: parseInt(e.target.value) || 0 })}
                      className="border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-gray-700">单节时长(分钟)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 45 })}
                      className="border-gray-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-700">课程描述</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="课程简介"
                    className="border-gray-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit">{editingCourse ? "更新" : "添加"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索课程名称..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && fetchCourses()}
                />
              </div>
              <Button onClick={fetchCourses}>搜索</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-gray-500">加载中...</div>
          ) : courses.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无课程数据</p>
            </div>
          ) : (
            courses.map((course) => (
              <Card key={course.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{course.name}</h3>
                      {course.category && (
                        <Badge variant="outline" className="mt-1">{course.category}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(course)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(course.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                        <Clock className="w-3 h-3" />
                        <span>总课时</span>
                      </div>
                      <p className="font-bold text-gray-900">{course.totalHours}节</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                        <Clock className="w-3 h-3" />
                        <span>单节时长</span>
                      </div>
                      <p className="font-bold text-gray-900">{course.duration}分钟</p>
                    </div>
                  </div>

                  {course.description && (
                    <p className="mt-4 text-sm text-gray-500">{course.description}</p>
                  )}

                  <div className="mt-4 text-sm text-gray-500">
                    已创建 {course._count?.classes || 0} 个班级
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
