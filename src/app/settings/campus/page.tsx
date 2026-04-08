"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  Users,
  GraduationCap,
  BookOpen,
  Phone,
  MapPin,
  Sparkles,
} from "lucide-react";

interface Campus {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  status: string;
  sortOrder: number;
  _count?: {
    customers: number;
    students: number;
    teachers: number;
    classes: number;
  };
  createdAt: string;
}

export default function CampusManagementPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/campus", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.campuses) {
        setCampuses(data.campuses);
      }
    } catch (error) {
      console.error("获取校区列表失败:", error);
      toast.error("获取校区列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (campus?: Campus) => {
    if (campus) {
      setEditingCampus(campus);
      setFormData({
        name: campus.name,
        address: campus.address || "",
        phone: campus.phone || "",
      });
    } else {
      setEditingCampus(null);
      setFormData({ name: "", address: "", phone: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("请输入校区名称");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const url = editingCampus ? `/api/campus/${editingCampus.id}` : "/api/campus";
      const method = editingCampus ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.campus) {
        toast.success(editingCampus ? "校区已更新" : "校区已创建");
        setIsDialogOpen(false);
        fetchCampuses();
      } else {
        toast.error(data.error || "操作失败");
      }
    } catch (error) {
      toast.error("操作失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (campus: Campus) => {
    // 检查是否有数据
    const hasData = campus._count && (
      campus._count.customers > 0 ||
      campus._count.students > 0 ||
      campus._count.teachers > 0 ||
      campus._count.classes > 0
    );

    if (hasData) {
      toast.error("该校区下有数据，无法删除");
      return;
    }

    if (!confirm(`确定要删除校区「${campus.name}」吗？`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/campus/${campus.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        toast.success("校区已删除");
        fetchCampuses();
      } else {
        toast.error(data.error || "删除失败");
      }
    } catch (error) {
      toast.error("删除失败");
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0f1a] text-white' : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 text-gray-900'}`}>
      {/* 动态背景 */}
      <div className="fixed inset-0 -z-10">
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-[#0a0f1a] via-[#0d1425] to-[#0a0f1a]' : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50/30'}`} />
        {isDark && (
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.2) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(16, 185, 129, 0.2) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        )}
        <div className={`absolute top-0 right-1/4 w-[500px] h-[500px] ${isDark ? 'bg-emerald-600/15' : 'bg-emerald-400/10'} rounded-full blur-[150px]`} />
        <div className={`absolute bottom-0 left-1/4 w-[400px] h-[400px] ${isDark ? 'bg-blue-600/15' : 'bg-blue-400/10'} rounded-full blur-[120px]`} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/settings")}
              className={`gap-1 ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <ChevronLeft className="w-4 h-4" />
              返回
            </Button>
            <div className={`h-4 w-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>校区管理</h1>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>管理连锁机构的各个校区</p>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增校区
          </Button>
        </div>

        {/* 说明卡片 */}
        <Card className={`mb-6 ${isDark ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                <Sparkles className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <div>
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>多校区数据隔离</h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  为您的机构创建多个校区，每个校区有独立的客户、学员、教师和班级数据。
                  在跟进任务、学员管理等页面可以按校区筛选数据。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 校区列表 */}
        {isLoading ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>加载中...</div>
        ) : campuses.length === 0 ? (
          <Card className={`${isDark ? 'bg-white/[0.03] backdrop-blur-sm border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <CardContent className="py-12 text-center">
              <Building2 className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>暂无校区</p>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>请先创建第一个校区</p>
              <Button 
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                创建校区
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campuses.map((campus) => (
              <Card 
                key={campus.id} 
                className={`${isDark ? 'bg-white/[0.03] backdrop-blur-sm border-white/5 hover:bg-white/[0.06]' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'} transition-all`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <Building2 className="w-5 h-5 text-emerald-400" />
                      {campus.name}
                    </CardTitle>
                    <Badge className={campus.status === "active" ? "bg-emerald-500/20 text-emerald-300 border-0" : "bg-gray-500/20 text-gray-400 border-0"}>
                      {campus.status === "active" ? "正常" : "停用"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {campus.address && (
                      <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <MapPin className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className="truncate">{campus.address}</span>
                      </div>
                    )}
                    {campus.phone && (
                      <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Phone className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span>{campus.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* 统计数据 */}
                  <div className={`grid grid-cols-4 gap-2 py-3 border-t border-b mb-4 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {campus._count?.customers || 0}
                      </div>
                      <div className={`text-xs flex items-center justify-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        <Users className="w-3 h-3" />
                        客户
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {campus._count?.students || 0}
                      </div>
                      <div className={`text-xs flex items-center justify-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        <GraduationCap className="w-3 h-3" />
                        学员
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {campus._count?.teachers || 0}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>教师</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {campus._count?.classes || 0}
                      </div>
                      <div className={`text-xs flex items-center justify-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        <BookOpen className="w-3 h-3" />
                        班级
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`flex-1 ${isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => handleOpenDialog(campus)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      编辑
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                      onClick={() => handleDelete(campus)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 新增/编辑校区弹窗 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`max-w-md ${isDark ? 'bg-[#0d1425] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Building2 className="w-5 h-5 text-emerald-400" />
              {editingCampus ? "编辑校区" : "新增校区"}
            </DialogTitle>
            <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              {editingCampus ? "修改校区信息" : "为您的机构添加新校区"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className={`text-sm font-medium mb-1 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                校区名称 <span className="text-red-400">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：北京朝阳校区"
                className={`${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : ''} focus:border-emerald-500`}
              />
            </div>

            <div>
              <label className={`text-sm font-medium mb-1 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                校区地址
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="详细地址"
                className={`${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : ''} focus:border-emerald-500`}
              />
            </div>

            <div>
              <label className={`text-sm font-medium mb-1 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                联系电话
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="校区电话"
                className={`${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : ''} focus:border-emerald-500`}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className={`${isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
            >
              取消
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !formData.name.trim()}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
            >
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
