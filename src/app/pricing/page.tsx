'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  Building2, 
  Crown,
  FileText,
  Image,
  Video,
  UserCircle,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: '免费体验',
    price: 0,
    yearlyPrice: 0,
    description: '适合初次体验的用户',
    icon: Sparkles,
    color: 'bg-gray-50 border-gray-200',
    buttonStyle: 'bg-gray-800 hover:bg-gray-900',
    features: [
      { name: '文案生成（每日）', value: '3次', included: true },
      { name: '图片生成（每月）', value: '5张', included: true },
      { name: '视频生成（每月）', value: '1个', included: true },
      { name: '文案风格选择', value: '3种', included: true },
      { name: '基础模板库', value: '', included: true },
      { name: '营销日历提醒', value: '', included: true },
      { name: '数字人生成', value: '', included: false },
      { name: 'AI对口型', value: '', included: false },
      { name: '数据统计分析', value: '', included: false },
      { name: '优先处理队列', value: '', included: false },
      { name: '专属客服支持', value: '', included: false },
    ],
  },
  {
    id: 'basic',
    name: '标准版',
    price: 199,
    yearlyPrice: 1990,
    description: '适合中小型教培机构',
    icon: Zap,
    color: 'bg-blue-50 border-blue-200',
    buttonStyle: 'bg-blue-600 hover:bg-blue-700',
    popular: true,
    features: [
      { name: '文案生成（每日）', value: '20次', included: true },
      { name: '图片生成（每月）', value: '50张', included: true },
      { name: '视频生成（每月）', value: '15个', included: true },
      { name: '文案风格选择', value: '5种', included: true },
      { name: '完整模板库', value: '', included: true },
      { name: '营销日历提醒', value: '', included: true },
      { name: '数字人生成（每月）', value: '5个', included: true },
      { name: 'AI对口型（每月）', value: '5个', included: true },
      { name: '数据统计分析', value: '', included: true },
      { name: '优先处理队列', value: '', included: false },
      { name: '专属客服支持', value: '', included: false },
    ],
  },
  {
    id: 'pro',
    name: '专业版',
    price: 499,
    yearlyPrice: 4990,
    description: '适合大型教培机构',
    icon: Crown,
    color: 'bg-purple-50 border-purple-200',
    buttonStyle: 'bg-purple-600 hover:bg-purple-700',
    features: [
      { name: '文案生成（每日）', value: '100次', included: true },
      { name: '图片生成（每月）', value: '200张', included: true },
      { name: '视频生成（每月）', value: '50个', included: true },
      { name: '文案风格选择', value: '5种+自定义', included: true },
      { name: '完整模板库', value: '', included: true },
      { name: '营销日历提醒', value: '+智能推荐', included: true },
      { name: '数字人生成（每月）', value: '20个', included: true },
      { name: 'AI对口型（每月）', value: '20个', included: true },
      { name: '数据统计分析', value: '+数据导出', included: true },
      { name: '优先处理队列', value: '', included: true },
      { name: '专属客服支持', value: '', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: null,
    yearlyPrice: null,
    description: '适合连锁机构/教育集团',
    icon: Building2,
    color: 'bg-amber-50 border-amber-200',
    buttonStyle: 'bg-amber-600 hover:bg-amber-700',
    features: [
      { name: '文案生成', value: '无限次', included: true },
      { name: '图片生成', value: '无限张', included: true },
      { name: '视频生成', value: '无限个', included: true },
      { name: '数字人生成', value: '无限个', included: true },
      { name: 'AI对口型', value: '无限个', included: true },
      { name: '私有化部署', value: '', included: true },
      { name: 'API接口对接', value: '', included: true },
      { name: '多账号管理', value: '', included: true },
      { name: '定制功能开发', value: '', included: true },
      { name: '专属客户经理', value: '', included: true },
      { name: '培训与技术支持', value: '', included: true },
    ],
  },
];

const faqs = [
  {
    question: '如何选择适合的套餐？',
    answer: '建议根据您的日常内容需求量选择。如果您是初次体验，可以从免费版开始；如果您每天需要发布多条朋友圈内容，推荐标准版；大型机构或内容需求量大，建议选择专业版；连锁机构可以选择企业版享受定制服务。',
  },
  {
    question: '视频生成时长有限制吗？',
    answer: '目前支持生成5秒和10秒两种时长的视频，分辨率支持720P和1080P。专业版用户可享受更快的处理速度和更高的优先级。',
  },
  {
    question: '数字人生成是什么功能？',
    answer: '数字人生成功能可以让您上传一张人物照片，AI会生成一个会说话的数字人视频。支持文字转语音和上传音频两种模式，非常适合制作课程讲解、招生宣传等视频内容。',
  },
  {
    question: 'AI对口型功能怎么用？',
    answer: '您只需要上传一段包含人物的视频和一段音频，AI会自动分析视频中人物的口型，并生成与音频同步的新视频，让人物"开口说话"。',
  },
  {
    question: '未使用的次数可以累积吗？',
    answer: '月度套餐的生成次数在当月有效，未使用的次数不会累积到下月。建议根据实际需求选择合适的套餐。',
  },
  {
    question: '可以中途升级套餐吗？',
    answer: '可以随时升级套餐，升级后立即生效，已支付的费用会按剩余天数折算抵扣。降级套餐会在当前周期结束后生效。',
  },
  {
    question: '企业版有什么特殊权益？',
    answer: '企业版用户享有无限次数使用、私有化部署、API对接、多账号管理、定制开发、专属客户经理等高级权益，适合有特殊需求的大型机构。',
  },
  {
    question: '支持哪些支付方式？',
    answer: '我们支持支付宝、微信支付、银行转账等多种支付方式。年付用户可享受额外优惠。',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* 导航栏 */}
      <header className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/landing" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">南都AI</span>
                <p className="text-xs text-gray-500">教培智能内容创作平台</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/landing#features" className="text-gray-600 hover:text-gray-900 text-sm">
                功能介绍
              </Link>
              <Link href="/pricing" className="text-blue-600 font-medium text-sm">
                套餐价格
              </Link>
              <Link href="/landing#cases" className="text-gray-600 hover:text-gray-900 text-sm">
                成功案例
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => router.push("/login")} className="hidden sm:flex">
                登录
              </Button>
              <Button onClick={() => router.push("/login")} className="bg-blue-600 hover:bg-blue-700">
                免费体验
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero区域 */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700">透明定价</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            选择适合您的套餐 💎
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            从免费体验到企业定制，总有一款适合您的机构
          </p>

          {/* 计费周期切换 */}
          <div className="inline-flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              月付
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              年付
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 text-xs">
                省17%
              </Badge>
            </button>
          </div>
        </div>
      </section>

      {/* 定价卡片 */}
      <section className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isYearly = billingCycle === 'yearly';
              const displayPrice = plan.price === null 
                ? '定制' 
                : isYearly 
                  ? Math.round((plan.yearlyPrice || plan.price * 12) / 12)
                  : plan.price;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${plan.color} border-2 ${
                    plan.popular ? 'ring-2 ring-blue-500 scale-[1.02] shadow-xl' : 'shadow-sm'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-4 py-1 shadow-lg">
                        最受欢迎
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                      <Icon className={`w-7 h-7 ${plan.popular ? 'text-blue-600' : 'text-gray-700'}`} />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-4">
                    <div className="mb-6">
                      {plan.price === null ? (
                        <span className="text-4xl font-bold text-gray-900">联系我们</span>
                      ) : (
                        <>
                          <span className="text-4xl font-bold text-gray-900">¥{displayPrice}</span>
                          <span className="text-gray-500">/月</span>
                          {isYearly && plan.yearlyPrice && (
                            <div className="text-sm text-gray-500 mt-1">
                              年付 ¥{plan.yearlyPrice}（省¥{plan.price! * 12 - plan.yearlyPrice!}）
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <ul className="space-y-2.5 text-left">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          {feature.included ? (
                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 shrink-0" />
                          )}
                          <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                            {feature.name}
                            {feature.value && (
                              <span className={`ml-1 font-medium ${feature.included ? 'text-blue-600' : 'text-gray-400'}`}>
                                {feature.value}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      className={`w-full ${plan.buttonStyle}`}
                      onClick={() => plan.price === null ? router.push('/landing') : router.push('/login')}
                    >
                      {plan.price === null ? '联系咨询' : plan.id === 'free' ? '开始使用' : '立即订阅'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 功能对比表 */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">详细功能对比</h2>
          
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-4 px-6 font-medium text-gray-600">功能</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-600">免费体验</th>
                  <th className="text-center py-4 px-6 font-medium text-blue-600 bg-blue-50">标准版</th>
                  <th className="text-center py-4 px-6 font-medium text-purple-600">专业版</th>
                  <th className="text-center py-4 px-6 font-medium text-amber-600">企业版</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      文案生成（每日）
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">3次</td>
                  <td className="text-center py-4 px-6 bg-blue-50/50 font-medium">20次</td>
                  <td className="text-center py-4 px-6">100次</td>
                  <td className="text-center py-4 px-6 text-green-600 font-medium">无限</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-pink-500" />
                      图片生成（每月）
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">5张</td>
                  <td className="text-center py-4 px-6 bg-blue-50/50 font-medium">50张</td>
                  <td className="text-center py-4 px-6">200张</td>
                  <td className="text-center py-4 px-6 text-green-600 font-medium">无限</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-500" />
                      视频生成（每月）
                    </div>
                  </td>
                  <td className="text-center py-4 px-6">1个</td>
                  <td className="text-center py-4 px-6 bg-blue-50/50 font-medium">15个</td>
                  <td className="text-center py-4 px-6">50个</td>
                  <td className="text-center py-4 px-6 text-green-600 font-medium">无限</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-cyan-500" />
                      数字人生成（每月）
                    </div>
                  </td>
                  <td className="text-center py-4 px-6"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center py-4 px-6 bg-blue-50/50 font-medium">5个</td>
                  <td className="text-center py-4 px-6">20个</td>
                  <td className="text-center py-4 px-6 text-green-600 font-medium">无限</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-orange-500" />
                      AI对口型（每月）
                    </div>
                  </td>
                  <td className="text-center py-4 px-6"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center py-4 px-6 bg-blue-50/50 font-medium">5个</td>
                  <td className="text-center py-4 px-6">20个</td>
                  <td className="text-center py-4 px-6 text-green-600 font-medium">无限</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">文案风格选择</td>
                  <td className="text-center py-4 px-6">3种</td>
                  <td className="text-center py-4 px-6 bg-blue-50/50 font-medium">5种</td>
                  <td className="text-center py-4 px-6">5种+自定义</td>
                  <td className="text-center py-4 px-6">全部+定制</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">模板库</td>
                  <td className="text-center py-4 px-6">基础</td>
                  <td className="text-center py-4 px-6 bg-blue-50/50">完整</td>
                  <td className="text-center py-4 px-6">完整+专属</td>
                  <td className="text-center py-4 px-6">全部+定制</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">数据统计分析</td>
                  <td className="text-center py-4 px-6"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center py-4 px-6 bg-blue-50/50"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6">含数据导出</td>
                  <td className="text-center py-4 px-6">高级分析</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">优先处理</td>
                  <td className="text-center py-4 px-6"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center py-4 px-6 bg-blue-50/50"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">专属客服支持</td>
                  <td className="text-center py-4 px-6"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center py-4 px-6 bg-blue-50/50"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6">专属经理</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ区域 */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-700">常见问题</Badge>
            <h2 className="text-2xl font-bold text-gray-900">您可能想了解</h2>
          </div>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <span className="font-medium text-gray-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                    {faq.question}
                  </span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 底部CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            准备好提升招生效果了吗？
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            加入10,000+教培机构的选择，让AI助力您的营销
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => router.push('/login')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 h-14"
            >
              立即免费体验
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white/30 hover:bg-white/10 px-8 h-14"
            >
              联系客服咨询
            </Button>
          </div>
        </div>
      </section>

      {/* 底部 */}
      <footer className="py-8 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">南都AI</span>
            <span className="text-gray-400 text-sm">· 帝都科技出品</span>
          </div>
          <div className="text-gray-400 text-sm">
            © 2026 南都AI · 帝都科技 版权所有
          </div>
        </div>
      </footer>
    </div>
  );
}
