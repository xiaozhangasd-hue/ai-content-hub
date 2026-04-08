"use client";

import MagicBento from "@/components/MagicBento";

export default function MagicBentoPage() {
  return (
    <main className="min-h-screen bg-[#070511] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Magic Bento</h1>
        <MagicBento
          textAutoHide={true}
          enableStars
          enableSpotlight
          enableBorderGlow={true}
          enableTilt={false}
          enableMagnetism
          clickEffect
          spotlightRadius={220}
          particleCount={12}
          glowColor="132, 0, 255"
          disableAnimations={false}
        />
      </div>
    </main>
  );
}

