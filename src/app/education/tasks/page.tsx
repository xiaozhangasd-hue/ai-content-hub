"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import {
  ClipboardList,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Users,
  Phone,
  Calendar,
  Play,
  Pause,
  X,
  Trash2,
  Zap,
} from "lucide-react";

interface Task {
  id: string;
  type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  student?: { id: string; name: string; phone: string } | null;
  customer?: { id: string; name: string; phone: string; childName: string } | null;
  metadata?: string | null;
}

interface TaskStats {
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

const taskTypeLabels: Record<string, { label: string; color: string }> = {
  hours_warning: { label: "课时预警", color: "bg-orange-100 text-orange-700" },
  customer_high_intent: { label: "高意向客户", color: "bg-purple-100 text-purple-700" },
  student_followup: { label: "学员跟进", color: "bg-blue-100 text-blue-700" },
  manual: { label: "自定义任务", color: "bg-gray-100 text-gray-700" },
};

const priorityLabels: Record<string, { label: string; color: string }> = {
  high: { label: "高优先", color: "bg-red-100 text-red-700" },
  medium: { label: "中优先", color: "bg-yellow-100 text-yellow-700" },
  low: { label: "低优先", color: "bg-green-100 text-green-700" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "待处理", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "进行中", color: "bg-blue-100 text-blue-700" },
  completed: { label: "已完成", color: "bg-green-100 text-green-700" },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-500" },
};

export default function TaskCenterPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ pending: 0, in_progress: 0, completed: 0, cancelled: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 筛选
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  
  // 添加任务弹窗
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchTasks();
  }, [router, filterStatus, filterType, filterPriority]);

  const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterType !== "all") params.append("type", filterType);
      if (filterPriority !== "all") params.append("priority", filterPriority);

      const response = await fetch(`/api/tasks?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
        setStats(data.stats);
      }
    } catch (error) {
      toast.error("获取任务失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    const token = localStorage.getItem("token");
    setIsSyncing(true);
    try {
      const response = await fetch("/api/tasks/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hoursThreshold: 15 }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchTasks();
      }
    } catch (error) {
      toast.error("同步失败");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("请输入任务标题");
      return;
    }

    const token = localStorage.getItem("token");
    setIsSaving(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newTask,
          type: "manual",
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("任务创建成功");
        setIsAddDialogOpen(false);
        setNewTask({ title: "", description: "", priority: "medium", dueDate: "" });
        fetchTasks();
      }
    } catch (error) {
      toast.error("创建失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: taskId, status }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("状态已更新");
        fetchTasks();
      }
    } catch (error) {
      toast.error("更新失败");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("确定要删除此任务吗？")) return;
    
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("任务已删除");
        fetchTasks();
      }
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
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
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-7 h-7 text-blue-500" />
                任务中心
              </h1>
              <p className="text-gray-500 mt-1">集中管理教务任务和跟进事项</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              同步任务
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              添加任务
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setFilterStatus("pending")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">待处理</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setFilterStatus("in_progress")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">进行中</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Play className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setFilterStatus("completed")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">已完成</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setFilterStatus("all")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">全部任务</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending + stats.in_progress + stats.completed + stats.cancelled}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选栏 */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-28 bg-white">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="in_progress">进行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32 bg-white">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="hours_warning">课时预警</SelectItem>
                  <SelectItem value="customer_high_intent">高意向客户</SelectItem>
                  <SelectItem value="manual">自定义任务</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-28 bg-white">
                  <SelectValue placeholder="优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部优先</SelectItem>
                  <SelectItem value="high">高优先</SelectItem>
                  <SelectItem value="medium">中优先</SelectItem>
                  <SelectItem value="low">低优先</SelectItem>
                </SelectContent>
              </Select>

              {(filterStatus !== "all" || filterType !== "all" || filterPriority !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => {
                  setFilterStatus("all");
                  setFilterType("all");
                  setFilterPriority("all");
                }}>
                  <X className="w-4 h-4 mr-1" />
                  清除筛选
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 任务列表 */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {filterStatus === "all" ? "全部任务" : statusLabels[filterStatus]?.label || "任务列表"}
              <Badge variant="secondary">{tasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-400" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>暂无任务</p>
                <p className="text-sm mt-1">点击"同步任务"自动生成或手动添加</p>
              </div>
            ) : (
              <div className="divide-y">
                {tasks.map((task) => {
                  const typeInfo = taskTypeLabels[task.type] || taskTypeLabels.manual;
                  const priorityInfo = priorityLabels[task.priority] || priorityLabels.medium;
                  const statusInfo = statusLabels[task.status] || statusLabels.pending;
                  const metadata = task.metadata ? JSON.parse(task.metadata) : null;
                  
                  return (
                    <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* 状态切换 */}
                        <button
                          onClick={() => {
                            if (task.status === "pending") {
                              handleUpdateStatus(task.id, "in_progress");
                            } else if (task.status === "in_progress") {
                              handleUpdateStatus(task.id, "completed");
                            }
                          }}
                          className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            task.status === "completed" 
                              ? "bg-green-500 border-green-500" 
                              : task.status === "in_progress"
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          {task.status === "completed" && <CheckCircle className="w-3 h-3 text-white" />}
                          {task.status === "in_progress" && <Play className="w-3 h-3 text-white" />}
                        </button>

                        {/* 任务内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`font-medium ${task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                              {task.title}
                            </span>
                            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                            <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-500 mb-2">{task.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                            {/* 关联信息 */}
                            {task.student && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{task.student.name}</span>
                              </div>
                            )}
                            {task.customer && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{task.customer.name}</span>
                                {task.customer.childName && <span>（{task.customer.childName}家长）</span>}
                              </div>
                            )}
                            
                            {/* 课时预警详情 */}
                            {task.type === "hours_warning" && metadata && (
                              <div className="flex items-center gap-1 text-orange-500">
                                <AlertTriangle className="w-3 h-3" />
                                <span>剩余 {metadata.totalRemaining} 课时</span>
                              </div>
                            )}

                            {/* 高意向客户详情 */}
                            {task.type === "customer_high_intent" && metadata && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{metadata.phone}</span>
                                {metadata.intentCourse && <span>· {metadata.intentCourse}</span>}
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(task.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-1 shrink-0">
                          {task.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(task.id, "in_progress")}
                              className="text-blue-600"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          {task.status === "in_progress" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(task.id, "completed")}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {task.status !== "completed" && task.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {/* 跳转详情 */}
                          {task.student && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/education/students/${task.student!.id}`)}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 快捷提示 */}
        {pendingTasks.length > 0 && (
          <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">待办提醒</p>
                  <p className="text-sm text-gray-500">
                    您有 <span className="text-blue-600 font-semibold">{pendingTasks.length}</span> 项任务待处理
                    {stats.pending > 0 && stats.in_progress > 0 && (
                      <span>（{stats.pending}项待开始，{stats.in_progress}项进行中）</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 添加任务弹窗 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加任务</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>任务标题 *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="输入任务标题..."
              />
            </div>
            <div className="space-y-2">
              <Label>任务描述</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="输入任务描述..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>优先级</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高优先</SelectItem>
                    <SelectItem value="medium">中优先</SelectItem>
                    <SelectItem value="low">低优先</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>截止日期</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddTask} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              创建任务
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
