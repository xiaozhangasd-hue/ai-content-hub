"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import {
  FolderOpen,
  Plus,
  Calendar,
  Image,
  Video,
  FileText,
  Award,
  Star,
  Eye,
  Trash2,
  Loader2,
  Upload,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  avatar: string | null;
  gender: string | null;
}

interface GrowthRecord {
  id: string;
  type: string;
  title: string;
  content: string | null;
  media: string | null;
  recordDate: string;
  tags: string | null;
  isPublic: boolean;
  createdAt: string;
  student: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

const recordTypes = [
  { value: "work", label: "作品展示", icon: Image, color: "text-blue-500" },
  { value: "milestone", label: "成长里程碑", icon: Award, color: "text-yellow-500" },
  { value: "feedback", label: "课堂反馈", icon: FileText, color: "text-green-500" },
  { value: "report", label: "学习报告", icon: Star, color: "text-purple-500" },
];

export default function TeacherGrowthPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewRecord, setViewRecord] = useState<GrowthRecord | null>(null);

  // 新记录表单
  const [newRecord, setNewRecord] = useState({
    studentId: "",
    type: "work",
    title: "",
    content: "",
    media: "",
    recordDate: new Date().toISOString().split("T")[0],
    tags: "",
    isPublic: true,
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [selectedStudent, selectedType]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      const response = await fetch(
        `/api/teacher/students?teacherId=${user?.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || data.data || []);
      }
    } catch (error) {
      console.error("获取学生列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = "/api/education/growth-records?";
      
      if (selectedStudent) {
        url += `studentId=${selectedStudent}&`;
      }
      if (selectedType) {
        url += `type=${selectedType}&`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || data.data || []);
      }
    } catch (error) {
      console.error("获取成长档案失败:", error);
    }
  };

  const handleAddRecord = async () => {
    if (!newRecord.studentId) {
      toast.error("请选择学生");
      return;
    }
    if (!newRecord.title.trim()) {
      toast.error("请输入标题");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/education/growth-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRecord),
      });

      if (response.ok) {
        toast.success("添加成功");
        setShowAddDialog(false);
        setNewRecord({
          studentId: "",
          type: "work",
          title: "",
          content: "",
          media: "",
          recordDate: new Date().toISOString().split("T")[0],
          tags: "",
          isPublic: true,
        });
        fetchRecords();
      } else {
        const data = await response.json();
        toast.error(data.error || "添加失败");
      }
    } catch (error) {
      console.error("添加失败:", error);
      toast.error("添加失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("确定要删除这条记录吗？")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/education/growth-records/${recordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("删除成功");
        fetchRecords();
      } else {
        toast.error("删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    }
  };

  const getTypeConfig = (type: string) => {
    return recordTypes.find(t => t.value === type) || recordTypes[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">成长档案</h1>
          <p className="text-muted-foreground">记录学生的学习成长历程</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          添加记录
        </Button>
      </div>

      {/* 筛选 */}
      <div className="flex gap-4">
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="全部学生" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部学生</SelectItem>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部类型</SelectItem>
            {recordTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 记录列表 */}
      {records.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">暂无成长记录</p>
          <p className="text-sm text-muted-foreground">点击上方按钮添加记录</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => {
            const typeConfig = getTypeConfig(record.type);
            const TypeIcon = typeConfig.icon;
            
            return (
              <Card key={record.id} className="overflow-hidden">
                <div className="flex">
                  {/* 左侧类型标识 */}
                  <div className={`w-16 flex-shrink-0 flex items-center justify-center ${typeConfig.color} bg-muted/30`}>
                    <TypeIcon className="w-8 h-8" />
                  </div>
                  
                  {/* 右侧内容 */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{typeConfig.label}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {record.student.name}
                          </span>
                          {record.isPublic && (
                            <Badge variant="outline" className="text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              家长可见
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium mb-1">{record.title}</h3>
                        {record.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {record.content}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(record.recordDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewRecord(record)}
                        >
                          查看
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 添加记录对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>添加成长记录</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                选择学生 <span className="text-red-400">*</span>
              </label>
              <Select
                value={newRecord.studentId}
                onValueChange={(value) =>
                  setNewRecord({ ...newRecord, studentId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择学生" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                记录类型
              </label>
              <Select
                value={newRecord.type}
                onValueChange={(value) =>
                  setNewRecord({ ...newRecord, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recordTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                标题 <span className="text-red-400">*</span>
              </label>
              <Input
                value={newRecord.title}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, title: e.target.value })
                }
                placeholder="请输入标题"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                内容描述
              </label>
              <Textarea
                value={newRecord.content}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, content: e.target.value })
                }
                placeholder="详细描述..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                记录日期
              </label>
              <Input
                type="date"
                value={newRecord.recordDate}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, recordDate: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                标签（逗号分隔）
              </label>
              <Input
                value={newRecord.tags}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, tags: e.target.value })
                }
                placeholder="如：优秀作品, 进步明显"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={newRecord.isPublic}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, isPublic: e.target.checked })
                }
                className="rounded"
              />
              <label htmlFor="isPublic" className="text-sm">
                家长可见（小程序展示）
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddDialog(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddRecord}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  "提交"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 查看详情对话框 */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-lg">
          {viewRecord && (
            <>
              <DialogHeader>
                <DialogTitle>{viewRecord.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {getTypeConfig(viewRecord.type).label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {viewRecord.student.name}
                  </span>
                </div>
                
                {viewRecord.content && (
                  <p className="text-sm">{viewRecord.content}</p>
                )}
                
                {viewRecord.media && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={viewRecord.media}
                      alt={viewRecord.title}
                      className="w-full object-cover"
                    />
                  </div>
                )}
                
                {viewRecord.tags && (
                  <div className="flex flex-wrap gap-1">
                    {viewRecord.tags.split(",").map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    记录日期：{new Date(viewRecord.recordDate).toLocaleDateString()}
                  </span>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    分享给家长
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
