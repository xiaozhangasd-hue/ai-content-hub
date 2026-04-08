"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, UserCheck, Filter } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type TrendItem = { date: string; merchants: number; members: number };

export default function AdminReportsPage() {
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [funnel, setFunnel] = useState({
    merchantsRegistered: 0,
    membersOpened: 0,
    membersActive: 0,
    conversionRate: 0,
    activeRate: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTrend(data.trend || []);
        setFunnel(data.funnel || funnel);
      }
    };
    fetchData();
  }, []);

  const summaryCards = useMemo(
    () => [
      { title: "商家注册总数", value: funnel.merchantsRegistered, icon: Users, color: "text-blue-400" },
      { title: "开通会员总数", value: funnel.membersOpened, icon: UserCheck, color: "text-green-400" },
      { title: "当前活跃会员", value: funnel.membersActive, icon: TrendingUp, color: "text-purple-400" },
      { title: "会员转化率", value: `${funnel.conversionRate}%`, icon: Filter, color: "text-orange-400" },
    ],
    [funnel]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="bg-slate-900/50 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">{card.title}</p>
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
          <CardTitle className="text-white text-base">近30天增长趋势</CardTitle>
          <Badge className="bg-blue-500/20 text-blue-300">实时数据</Badge>
        </CardHeader>
        <CardContent className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#fff" }}
                labelStyle={{ color: "#cbd5e1" }}
              />
              <Legend />
              <Line type="monotone" dataKey="merchants" stroke="#60a5fa" strokeWidth={2} name="新增商家" dot={false} />
              <Line type="monotone" dataKey="members" stroke="#34d399" strokeWidth={2} name="新增会员" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

