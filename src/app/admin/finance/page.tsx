"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, Receipt, CircleDollarSign, Percent } from "lucide-react";

interface OrderItem {
  id: string;
  orderNo: string;
  merchantName: string;
  merchantPhone: string;
  planName: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string;
  channel: string;
}

const statusTextMap: Record<string, string> = {
  paid: "已支付",
  pending: "待支付",
  failed: "支付失败",
  cancelled: "已取消",
  refunded: "已退款",
  closed: "已关闭",
};

const statusClassMap: Record<string, string> = {
  paid: "bg-green-500/20 text-green-300",
  pending: "bg-yellow-500/20 text-yellow-300",
  failed: "bg-red-500/20 text-red-300",
  cancelled: "bg-slate-500/20 text-slate-300",
  refunded: "bg-blue-500/20 text-blue-300",
  closed: "bg-slate-500/20 text-slate-300",
};

export default function AdminFinancePage() {
  const [status, setStatus] = useState("all");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    successRate: 0,
    avgOrderValue: 0,
    orderCount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/finance?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders || []);
        setOverview(data.overview || overview);
      }
    };
    fetchData();
  }, [status]);

  const cards = useMemo(
    () => [
      { label: "累计营收", value: `¥${overview.totalRevenue.toLocaleString()}`, icon: Wallet, color: "text-green-400" },
      { label: "本月营收", value: `¥${overview.monthlyRevenue.toLocaleString()}`, icon: CircleDollarSign, color: "text-blue-400" },
      { label: "支付成功率", value: `${overview.successRate}%`, icon: Percent, color: "text-purple-400" },
      { label: "客单价", value: `¥${overview.avgOrderValue.toLocaleString()}`, icon: Receipt, color: "text-orange-400" },
    ],
    [overview]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label} className="bg-slate-900/50 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className="text-2xl font-bold text-white mt-2">{card.value}</p>
                </div>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-base">订单中心</CardTitle>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px] bg-slate-800 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="paid">已支付</SelectItem>
              <SelectItem value="pending">待支付</SelectItem>
              <SelectItem value="failed">支付失败</SelectItem>
              <SelectItem value="refunded">已退款</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-400">订单号</TableHead>
                <TableHead className="text-slate-400">商家</TableHead>
                <TableHead className="text-slate-400">套餐</TableHead>
                <TableHead className="text-slate-400">金额</TableHead>
                <TableHead className="text-slate-400">状态</TableHead>
                <TableHead className="text-slate-400">支付渠道</TableHead>
                <TableHead className="text-slate-400">创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                    暂无订单数据
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-slate-300">{order.orderNo}</TableCell>
                    <TableCell className="text-white">
                      <div>{order.merchantName}</div>
                      <div className="text-xs text-slate-400">{order.merchantPhone}</div>
                    </TableCell>
                    <TableCell className="text-slate-300">{order.planName}</TableCell>
                    <TableCell className="text-slate-300">¥{order.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        className={statusClassMap[order.status] || "bg-slate-500/20 text-slate-300"}
                      >
                        {statusTextMap[order.status] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{order.channel}</TableCell>
                    <TableCell className="text-slate-400">{new Date(order.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

