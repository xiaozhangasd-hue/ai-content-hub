"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MapPin,
  Phone,
  Users,
  BookOpen,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Download,
} from "lucide-react";

interface Campus {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  status: string;
  studentCount: number;
  teacherCount: number;
  classCount: number;
  revenue: number;
  createdAt: string;
}

export default function CampusesPage() {
  const router = useRouter();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchCampuses();
  }, [router]);

  const fetchCampuses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/campuses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCampuses(data.data);
      }
    } catch (error) {
      console.error("获取校区列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCampus(null);
    setFormData({ name: "", address: "", phone: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (campus: Campus) => {
    setEditingCampus(campus);
    setFormData({
      name: campus.name,
      address: campus.address || "",
      phone: campus.phone || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该校区吗？")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/principal/campuses?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        fetchCampuses();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("删除校区失败:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = "/api/principal/campuses";
      const method = editingCampus ? "PUT" : "POST";
      const body = editingCampus
        ? { id: editingCampus.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        setIsDialogOpen(false);
        fetchCampuses();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("保存校区失败:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString()}`;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">校区管理</h1>
          <p className="text-muted-foreground">管理所有校区信息</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-1" />
            导出
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-1" />
            添加校区
          </Button>
        </div>
      </div>

      {/* 校区网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campuses.map((campus) => (
          <Card key={campus.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{campus.name}</CardTitle>
                <Badge variant={campus.status === "active" ? "default" : "secondary"}>
                  {campus.status === "active" ? "运营中" : "已停用"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                {campus.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{campus.address}</span>
                  </div>
                )}
                {campus.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{campus.phone}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <Users className="w-3 h-3" />
                    <span>学员</span>
                  </div>
                  <div className="text-xl font-bold">{campus.studentCount}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <BookOpen className="w-3 h-3" />
                    <span>老师</span>
                  </div>
                  <div className="text-xl font-bold">{campus.teacherCount}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <BookOpen className="w-3 h-3" />
                    <span>班级</span>
                  </div>
                  <div className="text-xl font-bold">{campus.classCount}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <DollarSign className="w-3 h-3" />
                    <span>本月业绩</span>
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(campus.revenue)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => handleEdit(campus)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(campus.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 添加/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCampus ? "编辑校区" : "添加校区"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">校区名称 *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入校区名称"
              />
            </div>
            <div>
              <label className="text-sm font-medium">地址</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="请输入校区地址"
              />
            </div>
            <div>
              <label className="text-sm font-medium">联系电话</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入联系电话"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
