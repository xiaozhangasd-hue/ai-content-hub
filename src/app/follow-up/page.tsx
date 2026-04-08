"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CampusSelector } from "@/components/campus-selector";
import { toast } from "sonner";
import {
  Bell,
  Clock,
  Phone,
  MessageCircle,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  RefreshCw,
  User,
  History,
  Zap,
  Target,
  Building2,
} from "lucide-react";

interface FollowUpTask {
  id: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    childName?: string;
    level: string;
    status: string;
    intentCourse?: string;
    campus?: {
      id: string;
      name: string;
    } | null;
  };
  nextFollowUp: string;
  nextAction?: string;
  lastContact?: string;
  daysOverdue: number;
  isToday: boolean;
  isOverdue: boolean;
}

interface FollowUpRecord {
  id: string;
  type: string;
  content: string;
  result?: string;
  nextAction?: string;
  nextTime?: string;
  createdAt: string;
}

const levelConfig: Record<string, { label: string; color: string }> = {
  hot: { label: "高意向", color: "bg-red-500/20 text-red-300" },
  warm: { label: "中意向", color: "bg-amber-500/20 text-amber-300" },
  cold: { label: "低意向", color: "bg-blue-500/20 text-blue-300" },
};

const followTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  phone: { label: "电话", icon: Phone, color: "text-green-400" },
  wechat: { label: "微信", icon: MessageCircle, color: "text-blue-400" },
  visit: { label: "上门", icon: User, color: "text-purple-400" },
  trial: { label: "体验课", icon: Calendar, color: "text-orange-400" },
};

export default function FollowUpTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today" | "overdue">("all");
  const [selectedCampus, setSelectedCampus] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState<FollowUpRecord[]>([]);
  const [followUpForm, setFollowUpForm] = useState({
    type: "phone",
    content: "",
    result: "",
    nextAction: "",
    nextTime: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [filter, selectedCampus]);

  const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      const campusParam = selectedCampus !== "all" ? `&campusId=${selectedCampus}` : "";
      const response = await fetch(`/api/customers/follow-up-tasks?${campusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error("获取跟进任务失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowUpHistory = async (customerId: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/followups?customerId=${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setFollowUpHistory(data.followUps);
      }
    } catch (error) {
      console.error("获取跟进记录失败:", error);
    }
  };

  const handleOpenFollowUp = (task: FollowUpTask) => {
    setSelectedTask(task);
    setFollowUpForm({
      type: "phone",
      content: "",
      result: "",
      nextAction: "",
      nextTime: "",
    });
    fetchFollowUpHistory(task.customerId);
    setIsFollowUpDialogOpen(true);
  };

  const handleSubmitFollowUp = async () => {
    if (!selectedTask || !followUpForm.content) {
      toast.error("请填写跟进内容");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/followups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedTask.customerId,
          ...followUpForm,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("跟进记录已保存");
        setIsFollowUpDialogOpen(false);
        fetchTasks();
      } else {
        toast.error(data.error || "保存失败");
      }
    } catch (error) {
      toast.error("保存失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayTasks = tasks.filter(t => t.isToday);
  const overdueTasks = tasks.filter(t => t.isOverdue);
  const hotLeads = tasks.filter(t => t.customer.level === "hot");

  const filteredTasks = tasks.filter(task => {
    if (filter === "today") return task.isToday;
    if (filter === "overdue") return task.isOverdue;
    return true;
  }).sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    const levelOrder = { hot: 0, warm: 1, cold: 2 };
    return levelOrder[a.customer.level as keyof typeof levelOrder] - levelOrder[b.customer.level as keyof typeof levelOrder];
  });

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* 动态背景 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1425] to-[#0a0f1a]" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="gap-1 text-gray-400 hover:text-white hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bell className="w-7 h-7 text-orange-400" />
                跟进任务中心
              </h1>
              <p className="text-gray-500 mt-1">高效管理跟进任务，提高转化率</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CampusSelector value={selectedCampus} onChange={setSelectedCampus} />
            <Button variant="outline" size="sm" onClick={fetchTasks} className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">
              <RefreshCw className="w-4 h-4 mr-1" />
              刷新
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className={`bg-white/[0.03] backdrop-blur-sm border ${overdueTasks.length > 0 ? "border-red-500/30 ring-1 ring-red-500/20" : "border-white/5"}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${overdueTasks.length > 0 ? "bg-red-500/20" : "bg-white/5"}`}>
                  <AlertTriangle className={`w-5 h-5 ${overdueTasks.length > 0 ? "text-red-400" : "text-gray-500"}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{overdueTasks.length}</div>
                  <div className="text-sm text-gray-500">超期未跟进</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] backdrop-blur-sm border border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{todayTasks.length}</div>
                  <div className="text-sm text-gray-500">今日待跟进</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] backdrop-blur-sm border border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{hotLeads.length}</div>
                  <div className="text-sm text-gray-500">高意向客户</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] backdrop-blur-sm border border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{tasks.length}</div>
                  <div className="text-sm text-gray-500">总待跟进</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选标签 */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { key: "all", label: "全部任务", count: tasks.length },
            { key: "overdue", label: "超期任务", count: overdueTasks.length },
            { key: "today", label: "今日任务", count: todayTasks.length },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === item.key
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {item.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === item.key ? "bg-white/20" : "bg-white/10"}`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* 任务列表 */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : filteredTasks.length === 0 ? (
          <Card className="bg-white/[0.03] backdrop-blur-sm border border-white/5">
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
              <p className="text-gray-400">暂无待跟进任务</p>
              <p className="text-sm text-gray-600 mt-2">太棒了，所有跟进任务都已完成！</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const levelInfo = levelConfig[task.customer.level] || levelConfig.warm;
              
              return (
                <Card 
                  key={task.id}
                  onClick={() => handleOpenFollowUp(task)}
                  className={`bg-white/[0.03] backdrop-blur-sm border hover:bg-white/[0.05] cursor-pointer transition-all ${
                    task.isOverdue ? "border-l-2 border-l-red-500 border-white/5" : "border-white/5"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                          task.isOverdue ? "bg-gradient-to-br from-red-600 to-rose-600" :
                          task.customer.level === "hot" ? "bg-gradient-to-br from-orange-500 to-red-500" :
                          "bg-gradient-to-br from-blue-500 to-violet-500"
                        }`}>
                          {task.customer.name[0]}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">{task.customer.name}</span>
                            <Badge className={levelInfo.color}>{levelInfo.label}</Badge>
                            {task.isOverdue && (
                              <Badge className="bg-red-500/20 text-red-300 animate-pulse">
                                超期 {task.daysOverdue} 天
                              </Badge>
                            )}
                            {task.customer.campus && (
                              <Badge className="bg-white/10 text-gray-400 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {task.customer.campus.name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {task.customer.phone}
                            </span>
                            {task.customer.childName && (
                              <span>孩子: {task.customer.childName}</span>
                            )}
                            {task.customer.intentCourse && (
                              <span>意向: {task.customer.intentCourse}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {task.nextAction && (
                          <div className="text-sm text-gray-500 max-w-[200px] truncate">
                            下一步: {task.nextAction}
                          </div>
                        )}
                        <div className="text-right">
                          <div className={`text-sm font-medium ${task.isOverdue ? "text-red-400" : "text-blue-400"}`}>
                            {task.isToday ? "今日跟进" : new Date(task.nextFollowUp).toLocaleDateString()}
                          </div>
                          {task.lastContact && (
                            <div className="text-xs text-gray-600">
                              上次: {new Date(task.lastContact).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500">
                          <Phone className="w-4 h-4 mr-1" />
                          立即跟进
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 跟进弹窗 */}
      <Dialog open={isFollowUpDialogOpen} onOpenChange={setIsFollowUpDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1f2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Phone className="w-5 h-5 text-blue-400" />
              跟进记录
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedTask?.customer.name} - {selectedTask?.customer.phone}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* 客户信息 */}
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-medium">
                  {selectedTask?.customer.name[0]}
                </div>
                <div>
                  <div className="font-medium text-white">{selectedTask?.customer.name}</div>
                  <div className="text-sm text-gray-400">
                    {selectedTask?.customer.phone}
                    {selectedTask?.customer.childName && ` · 孩子: ${selectedTask.customer.childName}`}
                  </div>
                </div>
                <Badge className={levelConfig[selectedTask?.customer.level || "warm"]?.color}>
                  {levelConfig[selectedTask?.customer.level || "warm"]?.label}
                </Badge>
              </div>
            </div>

            {/* 历史跟进记录 */}
            {followUpHistory.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-300">
                  <History className="w-4 h-4" />
                  历史跟进
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {followUpHistory.slice(0, 5).map((record) => {
                    const typeInfo = followTypeConfig[record.type] || followTypeConfig.phone;
                    return (
                      <div key={record.id} className="p-3 bg-white/5 rounded-lg text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <typeInfo.icon className={`w-3 h-3 ${typeInfo.color}`} />
                          <span className="font-medium text-white">{typeInfo.label}</span>
                          <span className="text-gray-500">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-400">{record.content}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 新增跟进 */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-300">添加跟进记录</h4>
              
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(followTypeConfig).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setFollowUpForm({ ...followUpForm, type: key })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      followUpForm.type === key
                        ? "border-blue-500/50 bg-blue-500/10 text-white"
                        : "border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    <value.icon className={`w-4 h-4 ${value.color}`} />
                    <span className="text-sm">{value.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">跟进内容 *</label>
                <Textarea
                  value={followUpForm.content}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, content: e.target.value })}
                  placeholder="记录本次跟进的详细内容..."
                  rows={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">跟进结果</label>
                <Input
                  value={followUpForm.result}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, result: e.target.value })}
                  placeholder="如：家长表示有兴趣，需要再联系"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">下一步行动</label>
                  <Input
                    value={followUpForm.nextAction}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, nextAction: e.target.value })}
                    placeholder="如：发送课程介绍"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">下次跟进时间</label>
                  <Input
                    type="date"
                    value={followUpForm.nextTime}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, nextTime: e.target.value })}
                    className="bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFollowUpDialogOpen(false)} className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">
              取消
            </Button>
            <Button 
              onClick={handleSubmitFollowUp} 
              disabled={isSubmitting || !followUpForm.content}
              className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500"
            >
              {isSubmitting ? "保存中..." : "保存跟进记录"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
