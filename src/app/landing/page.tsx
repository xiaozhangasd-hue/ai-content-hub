"use client";

import { useRouter } from "next/navigation";
import LiquidEther from "../liquid-ether/LiquidEther";
import GlassIcons from "@/components/GlassIcons";
import { FileText, BookOpen, Heart, Cloud, Edit3, BarChart3 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const glassItems = [
    { icon: <FileText size={20} />, color: "blue", label: "文案" },
    { icon: <BookOpen size={20} />, color: "purple", label: "课程" },
    { icon: <Heart size={20} />, color: "red", label: "口碑" },
    { icon: <Cloud size={20} />, color: "indigo", label: "素材" },
    { icon: <Edit3 size={20} />, color: "orange", label: "编辑" },
    { icon: <BarChart3 size={20} />, color: "green", label: "数据" },
  ];

  return (
    <main className="min-h-screen bg-[#070511] text-white px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">承泽AI</h1>

        <section className="rounded-2xl border border-white/10 bg-[#0d0a1c]/70 p-3">
          <div className="relative h-[520px] rounded-xl overflow-hidden border border-white/10">
            <LiquidEther
              colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
              mouseForce={20}
              cursorSize={100}
              isViscous
              viscous={30}
              iterationsViscous={32}
              iterationsPoisson={32}
              resolution={0.5}
              isBounce={false}
              autoDemo
              autoSpeed={0.5}
              autoIntensity={2.2}
              takeoverDuration={0.25}
              autoResumeDelay={3000}
              autoRampDuration={0.6}
            />

            <div className="absolute inset-0 bg-black/35" />

            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[72%] h-14 rounded-full border border-white/15 bg-black/25 backdrop-blur-xl flex items-center justify-between px-6">
              <span className="text-sm text-white/85">React Bits</span>
              <div className="text-sm text-white/80 space-x-6">
                <span>首页</span>
                <span>文档</span>
              </div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs px-3 py-1 rounded-full border border-white/20 bg-white/10 mb-5">新背景</span>
              <h2 className="text-5xl font-bold mb-6">那张网，在你指尖动。</h2>
              <div className="flex gap-4">
                <button
                  className="px-8 py-3 rounded-full bg-white text-black font-medium hover:opacity-90"
                  onClick={() => router.push("/login")}
                >
                  开始
                </button>
                <button className="px-8 py-3 rounded-full border border-white/25 bg-black/30 hover:bg-black/45">
                  了解更多
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0d0a1c]/70 p-6">
          <div className="flex justify-center mb-3">
            <GlassIcons items={glassItems} className="custom-class" colorful={true} />
          </div>
          <h3 className="text-2xl font-semibold mb-5">核心能力</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ["AI文案生成", "多风格招生文案一键生成，支持课程推广与活动预热"],
              ["AI图片视频", "海报、短视频、数字人内容批量生产，缩短创作周期"],
              ["教务与增长", "线索、跟进、教务、数据统一管理，提升转化效率"],
            ].map((item) => (
              <div key={item[0]} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h4 className="text-lg font-medium mb-2">{item[0]}</h4>
                <p className="text-sm text-white/70">{item[1]}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0d0a1c]/70 p-6">
          <h3 className="text-2xl font-semibold mb-5">为什么选择承泽AI</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">一句话描述需求，自动生成可直接发布的营销内容。</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">从招生素材到教务管理，全链路数据打通，不再来回切系统。</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">支持机构品牌定制，保持内容统一风格与专业度。</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">上线即用，后续可扩展到私有化部署与团队协作。</div>
          </div>
        </section>

        <section className="text-center py-8">
          <h3 className="text-3xl font-bold mb-3">让增长更轻，转化更快</h3>
          <p className="text-white/70 mb-6">保留你原有业务流程，用更强的UI与AI能力完成升级。</p>
          <button
            className="px-8 py-3 rounded-full bg-white text-black font-medium hover:opacity-90"
            onClick={() => router.push("/login")}
          >
            立即体验
          </button>
        </section>
      </div>
    </main>
  );
}
