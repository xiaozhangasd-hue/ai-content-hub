"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Phone,
  Calendar,
  Search,
  Filter,
  Plus,
  X,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  RefreshCw,
  Edit,
  Trash2,
  ChevronRight,
  Send,
  Eye,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  childName?: string;
  childAge?: number;
  intentCourse?: string;
  source?: string;
  status: string;
  level: string;
  tags?: string;
  note?: string;
  lastContact?: string;
  nextFollowUp?: string;
  createdAt: string;
  _count?: { followUps: number };
  followUps?: Array<{
    id: string;
    type: string;
    content: string;
    createdAt: string;
  }>;
}

interface FollowUp {
  id: string;
  type: string;
  content: string;
  result?: string;
  nextAction?: string;
  nextTime?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "新咨询", color: "bg-blue-500/20 text-blue-400", icon: AlertCircle },
  contacted: { label: "已联系", color: "bg-yellow-500/20 text-yellow-400", icon: Phone },
  invited: { label: "已邀约", color: "bg-purple-500/20 text-purple-400", icon: Calendar },
  trial: { label: "已体验", color: "bg-orange-500/20 text-orange-400", icon: CheckCircle },
  signed: { label: "已报名", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle },
  lost: { label: "已流失", color: "bg-gray-500/20 text-gray-400", icon: X },
};

const levelConfig: Record<string, { label: string; color: string }> = {
  hot: { label: "高意向", color: "bg-red-500/20 text-red-400" },
  warm: { label: "中意向", color: "bg-amber-500/20 text-amber-400" },
  cold: { label: "低意向", color: "bg-blue-500/20 text-blue-400" },
};

const sourceOptions = [
  { value: "朋友圈", label: "朋友圈" },
  { value: "转介绍", label: "转介绍" },
  { value: "地推", label: "地推" },
  { value: "线上广告", label: "线上广告" },
  { value: "其他", label: "其他" },
];

export default function CustomersPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterLevel, setFilterLevel] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // 新增客户表单
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    childName: "",
    childAge: "",
    intentCourse: "",
    source: "",
    level: "warm",
    tags: "",
    note: "",
  });

  // 跟进表单
  const [followUpForm, setFollowUpForm] = useState({
    type: "wechat",
    content: "",
    result: "",
    nextAction: "",
    nextTime: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, [filterStatus, filterLevel]);

  const fetchCustomers = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterLevel) params.append("level", filterLevel);

      const response = await fetch(`/api/customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error("获取客户列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowUps = async (customerId: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/followups?customerId=${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setFollowUps(data.followUps);
      }
    } catch (error) {
      console.error("获取跟进记录失败:", error);
    }
  };

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.phone) {
      toast.error("请填写家长姓名和手机号");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("添加成功");
        setShowAddModal(false);
        setFormData({
          name: "",
          phone: "",
          childName: "",
          childAge: "",
          intentCourse: "",
          source: "",
          level: "warm",
          tags: "",
          note: "",
        });
        fetchCustomers();
      } else {
        toast.error(data.error || "添加失败");
      }
    } catch (error) {
      toast.error("添加失败");
    }
  };

  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
    fetchFollowUps(customer.id);
  };

  const handleAddFollowUp = async () => {
    if (!followUpForm.content) {
      toast.error("请填写跟进内容");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/followups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomer?.id,
          ...followUpForm,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("跟进记录已添加");
        setFollowUpForm({
          type: "wechat",
          content: "",
          result: "",
          nextAction: "",
          nextTime: "",
        });
        fetchFollowUps(selectedCustomer?.id || "");
        fetchCustomers();
      } else {
        toast.error(data.error || "添加失败");
      }
    } catch (error) {
      toast.error("添加失败");
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("确定要删除该客户吗？")) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/customers?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        toast.success("删除成功");
        fetchCustomers();
      }
    } catch (error) {
      toast.error("删除失败");
    }
  };

  // 统计数据
  const stats = {
    total: customers.length,
    new: customers.filter((c) => c.status === "new").length,
    invited: customers.filter((c) => c.status === "invited").length,
    trial: customers.filter((c) => c.status === "trial").length,
    signed: customers.filter((c) => c.status === "signed").length,
    hot: customers.filter((c) => c.level === "hot").length,
    todayFollowUp: customers.filter((c) => {
      if (!c.nextFollowUp) return false;
      const nextDate = new Date(c.nextFollowUp);
      const today = new Date();
      return nextDate.toDateString() === today.toDateString();
    }).length,
  };

  // 转化率
  const conversionRate = stats.total > 0 ? Math.round((stats.signed / stats.total) * 100) : 0;

  // 过滤搜索结果
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.childName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-[#0a0e1a] via-[#0d1425] to-[#0a1628]' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30'}`}>
      {/* 背景光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 ${isDark ? 'bg-blue-500/15' : 'bg-blue-400/15'} rounded-full blur-3xl`} />
        <div className={`absolute top-1/2 -left-20 w-60 h-60 ${isDark ? 'bg-purple-500/10' : 'bg-purple-400/10'} rounded-full blur-3xl`} />
        <div className={`absolute bottom-20 right-1/4 w-40 h-40 ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-400/10'} rounded-full blur-2xl`} />
      </div>

      {/* 顶部导航 */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b ${isDark ? 'bg-[#0d1425]/80 border-white/5' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className={`gap-2 ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>家长跟进管理</span>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              添加家长
            </Button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card className={`${isDark ? 'bg-white/[0.03] backdrop-blur-sm border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.total}</div>
              <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>总家长数</div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-white/[0.03] backdrop-blur-sm border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.new}</div>
              <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>新咨询</div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-white/[0.03] backdrop-blur-sm border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-400">{stats.invited}</div>
              <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>已邀约</div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-white/[0.03] backdrop-blur-sm border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-400">{stats.trial}</div>
              <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>已体验</div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-white/[0.03] backdrop-blur-sm border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-emerald-400">{stats.signed}</div>
              <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>已报名</div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-white/[0.03] backdrop-blur-sm border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-400">{stats.todayFollowUp}</div>
              <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>今日待跟进</div>
            </CardContent>
          </Card>
        </div>

        {/* 转化漏斗 */}
        <Card className={`mb-6 ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>转化率</p>
                  <p className="text-2xl font-bold text-blue-600">{conversionRate}%</p>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-end gap-2">
                {["新咨询", "已邀约", "已体验", "已报名"].map((stage, index) => {
                  const count = index === 0 ? stats.new : 
                                index === 1 ? stats.invited : 
                                index === 2 ? stats.trial : stats.signed;
                  const width = stats.total > 0 ? Math.max(20, (count / stats.total) * 100) : 20;
                  return (
                    <div key={stage} className="text-center">
                      <div 
                        className="h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium mb-1"
                        style={{ width: `${width}px`, minWidth: '40px' }}
                      >
                        {count}
                      </div>
                      <div className="text-xs text-gray-500">{stage}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <Input
              placeholder="搜索姓名、手机号、孩子姓名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : ''}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`h-10 px-3 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'border-gray-200 text-gray-900'}`}
            >
              <option value="">全部状态</option>
              <option value="new">新咨询</option>
              <option value="contacted">已联系</option>
              <option value="invited">已邀约</option>
              <option value="trial">已体验</option>
              <option value="signed">已报名</option>
              <option value="lost">已流失</option>
            </select>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className={`h-10 px-3 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'border-gray-200 text-gray-900'}`}
            >
              <option value="">全部意向</option>
              <option value="hot">高意向</option>
              <option value="warm">中意向</option>
              <option value="cold">低意向</option>
            </select>
            <Button variant="outline" size="sm" onClick={fetchCustomers}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 客户列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-2 text-center py-12 text-gray-500">加载中...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className={`text-gray-500`}>暂无客户数据</p>
              <Button
                className={`mt-4 ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                添加第一个家长
              </Button>
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const statusInfo = statusConfig[customer.status] || statusConfig.new;
              const levelInfo = levelConfig[customer.level] || levelConfig.warm;
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card
                  key={customer.id}
                  className={`${isDark ? 'bg-white/[0.03] backdrop-blur-sm border-white/5' : 'bg-white border-gray-200 shadow-sm'} hover:shadow-lg transition-shadow cursor-pointer`}
                  onClick={() => handleViewDetail(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                          {customer.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer.name}</span>
                            <Badge className={levelInfo.color}>{levelInfo.label}</Badge>
                          </div>
                          <div className={`flex items-center gap-2 text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                            {customer.childName && (
                              <>
                                <span>|</span>
                                <span>孩子: {customer.childName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    
                    <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-gray-100' : 'border-gray-100'}`}>
                      <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {customer.intentCourse && (
                          <span>意向: {customer.intentCourse}</span>
                        )}
                        {customer.source && (
                          <span>来源: {customer.source}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {customer.nextFollowUp && new Date(customer.nextFollowUp) > new Date() && (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <Clock className="w-3 h-3" />
                            {new Date(customer.nextFollowUp).toLocaleDateString()}
                          </div>
                        )}
                        <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* 添加家长弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">添加家长</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">家长姓名 *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">手机号 *</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入手机号"
                    maxLength={11}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">孩子姓名</label>
                  <Input
                    value={formData.childName}
                    onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                    placeholder="请输入孩子姓名"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">孩子年龄</label>
                  <Input
                    type="number"
                    value={formData.childAge}
                    onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                    placeholder="年龄"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">意向课程</label>
                  <Input
                    value={formData.intentCourse}
                    onChange={(e) => setFormData({ ...formData, intentCourse: e.target.value })}
                    placeholder="如：钢琴、舞蹈"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">来源</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm"
                  >
                    <option value="">请选择</option>
                    {sourceOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">意向程度</label>
                <div className="flex gap-2">
                  {Object.entries(levelConfig).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setFormData({ ...formData, level: key })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.level === key ? value.color + " ring-2 ring-offset-1" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {value.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">备注</label>
                <Input
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="其他备注信息"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  取消
                </Button>
                <Button className="flex-1" onClick={handleAddCustomer}>
                  添加
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 详情弹窗 */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white border-b">
              <CardTitle className="text-lg">家长详情</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {/* 基本信息 */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl font-medium">
                  {selectedCustomer.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-white">{selectedCustomer.name}</span>
                    <Badge className={levelConfig[selectedCustomer.level]?.color || levelConfig.warm.color}>
                      {levelConfig[selectedCustomer.level]?.label || "中意向"}
                    </Badge>
                    <Badge className={statusConfig[selectedCustomer.status]?.color || statusConfig.new.color}>
                      {statusConfig[selectedCustomer.status]?.label || "新咨询"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <span>{selectedCustomer.phone}</span>
                    {selectedCustomer.childName && <span>孩子: {selectedCustomer.childName}</span>}
                    {selectedCustomer.childAge && <span>{selectedCustomer.childAge}岁</span>}
                  </div>
                </div>
              </div>

              {/* 详细信息 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">意向课程</div>
                  <div className="font-medium">{selectedCustomer.intentCourse || "-"}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">来源</div>
                  <div className="font-medium">{selectedCustomer.source || "-"}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">添加时间</div>
                  <div className="font-medium">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">最后联系</div>
                  <div className="font-medium">
                    {selectedCustomer.lastContact ? new Date(selectedCustomer.lastContact).toLocaleDateString() : "未联系"}
                  </div>
                </div>
              </div>

              {selectedCustomer.note && (
                <div className="mb-6 p-3 bg-amber-50 rounded-lg">
                  <div className="text-sm text-amber-600 mb-1">备注</div>
                  <div className="text-gray-700">{selectedCustomer.note}</div>
                </div>
              )}

              {/* 添加跟进 */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-white mb-3">添加跟进记录</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={followUpForm.type}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, type: e.target.value })}
                      className="h-10 px-3 rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="wechat">微信</option>
                      <option value="phone">电话</option>
                      <option value="visit">到访</option>
                      <option value="trial">体验课</option>
                    </select>
                    <select
                      value={followUpForm.result}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, result: e.target.value })}
                      className="h-10 px-3 rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="">跟进结果</option>
                      <option value="已联系">已联系</option>
                      <option value="已邀约">已邀约</option>
                      <option value="已到访">已到访</option>
                      <option value="已报名">已报名</option>
                      <option value="无意向">无意向</option>
                    </select>
                    <Input
                      type="date"
                      value={followUpForm.nextTime}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, nextTime: e.target.value })}
                      className="h-10"
                      placeholder="下次跟进"
                    />
                  </div>
                  <Input
                    value={followUpForm.content}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, content: e.target.value })}
                    placeholder="跟进内容..."
                    className="h-10"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddFollowUp} className="flex-1">
                      <Send className="w-4 h-4 mr-2" />
                      保存跟进
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push(`/scripts?question=${encodeURIComponent("家长说考虑一下")}`)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      话术助手
                    </Button>
                  </div>
                </div>
              </div>

              {/* 跟进历史 */}
              <div>
                <h4 className="font-medium text-white mb-3">跟进历史</h4>
                {followUps.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">暂无跟进记录</p>
                ) : (
                  <div className="space-y-3">
                    {followUps.map((followUp, index) => (
                      <div key={followUp.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">
                              {followUp.type === "wechat" ? "微信" : 
                               followUp.type === "phone" ? "电话" :
                               followUp.type === "visit" ? "到访" : "体验课"}
                            </span>
                            {followUp.result && (
                              <Badge variant="outline" className="text-xs">{followUp.result}</Badge>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(followUp.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{followUp.content}</p>
                          {followUp.nextAction && (
                            <p className="text-xs text-amber-600 mt-1">下一步: {followUp.nextAction}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </Button>
                <Button className="flex-1" onClick={() => setShowDetailModal(false)}>
                  关闭
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
