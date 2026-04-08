"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Crown,
  Check,
  ArrowLeft,
  Sparkles,
  Zap,
  Star,
  Gem,
  Infinity,
  Clock,
  Headphones,
  Shield,
} from "lucide-react";

interface User {
  id: string;
  phone: string;
  name?: string;
}

export default function MembershipPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentPlan, setCurrentPlan] = useState("免费版");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const plans = [
    {
      id: "free",
      name: "免费版",
      price: 0,
      yearlyPrice: 0,
      description: "体验基础功能",
      features: [
        { text: "每日10次文案生成", enabled: true },
        { text: "基础图片生成", enabled: true },
        { text: "基础视频生成", enabled: true },
        { text: "高清图片生成", enabled: false },
        { text: "数字人功能", enabled: false },
        { text: "优先客服支持", enabled: false },
      ],
      icon: Sparkles,
      color: "from-slate-500 to-slate-600",
      popular: false,
    },
    {
      id: "pro",
      name: "专业版",
      price: 99,
      yearlyPrice: 999,
      description: "适合个人和小团队",
      features: [
        { text: "无限文案生成", enabled: true },
        { text: "高清图片生成", enabled: true },
        { text: "4K视频生成", enabled: true },
        { text: "数字人功能", enabled: true },
        { text: "优先客服支持", enabled: true },
        { text: "API接口调用", enabled: false },
      ],
      icon: Crown,
      color: "from-blue-500 to-indigo-600",
      popular: true,
    },
    {
      id: "enterprise",
      name: "企业版",
      price: 299,
      yearlyPrice: 2999,
      description: "适合大型机构",
      features: [
        { text: "所有专业版功能", enabled: true },
        { text: "API接口调用", enabled: true },
        { text: "专属客服支持", enabled: true },
        { text: "定制开发支持", enabled: true },
        { text: "多账号管理", enabled: true },
        { text: "数据报表导出", enabled: true },
      ],
      icon: Gem,
      color: "from-purple-500 to-pink-600",
      popular: false,
    },
  ];

  const handleSubscribe = async (planId: string) => {
    toast.info("会员功能开发中，敬请期待！");
    // TODO: 实现支付流程
  };

  if (!user) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 科技感背景 */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 -z-10">
        <div className="absolute inset-0 opacity-30" 
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-gray-900">会员中心</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            解锁全部功能，提升运营效率
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            选择适合您的会员套餐，获得更多AI生成次数和专属功能
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
              <Star className="w-3 h-3 mr-1" />
              年付享8折优惠
            </Badge>
          </div>
        </div>

        {/* 当前会员状态 */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">当前会员等级</p>
                  <p className="text-xl font-bold text-gray-900">{currentPlan}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">剩余额度</p>
                <p className="text-lg font-semibold text-blue-600">10次/天</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 套餐卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative bg-white/80 backdrop-blur-sm border shadow-lg transition-all duration-300 hover:shadow-xl cursor-pointer ${
                plan.popular 
                  ? "ring-2 ring-blue-500 scale-[1.02]" 
                  : "border-gray-100 hover:border-blue-200"
              } ${selectedPlan === plan.id ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
                    <Star className="w-3 h-3 mr-1" />
                    最受欢迎
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pt-8 pb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <plan.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">{plan.name}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">¥{plan.price}</span>
                    <span className="text-gray-500">/月</span>
                  </div>
                  {plan.yearlyPrice > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      年付 ¥{plan.yearlyPrice} 
                      <span className="text-green-600 ml-1">(省¥{plan.price * 12 - plan.yearlyPrice})</span>
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {feature.enabled ? (
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="w-2 h-0.5 bg-gray-300" />
                        </div>
                      )}
                      <span className={`text-sm ${feature.enabled ? "text-gray-700" : "text-gray-400"}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  {plan.id === "free" ? "当前方案" : "立即订阅"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 功能对比表 */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              功能对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">功能</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">免费版</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-blue-600">专业版</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-purple-600">企业版</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { feature: "文案生成", free: "10次/天", pro: "无限", enterprise: "无限" },
                    { feature: "图片生成", free: "5次/天", pro: "50次/天", enterprise: "无限" },
                    { feature: "视频生成", free: "2次/天", pro: "20次/天", enterprise: "无限" },
                    { feature: "数字人", free: "×", pro: "10次/天", enterprise: "无限" },
                    { feature: "API调用", free: "×", pro: "×", enterprise: "✓" },
                    { feature: "专属客服", free: "×", pro: "✓", enterprise: "✓" },
                    { feature: "定制开发", free: "×", pro: "×", enterprise: "✓" },
                  ].map((row, index) => (
                    <tr key={index}>
                      <td className="py-3 px-4 text-sm text-gray-700">{row.feature}</td>
                      <td className="py-3 px-4 text-sm text-center text-gray-500">{row.free}</td>
                      <td className="py-3 px-4 text-sm text-center text-blue-600 font-medium">{row.pro}</td>
                      <td className="py-3 px-4 text-sm text-center text-purple-600 font-medium">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 常见问题 */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">常见问题</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { q: "如何升级会员？", a: "点击对应套餐的「立即订阅」按钮，完成支付即可升级。" },
              { q: "会员可以退款吗？", a: "支持7天无理由退款，请联系客服处理。" },
              { q: "额度用完了怎么办？", a: "可以升级到更高级的套餐获得更多额度。" },
              { q: "年付有什么优惠？", a: "年付享受8折优惠，比月付更划算。" },
            ].map((item, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border border-gray-100">
                <CardContent className="py-4">
                  <h3 className="font-medium text-gray-900 mb-2">{item.q}</h3>
                  <p className="text-sm text-gray-500">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
