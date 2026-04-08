"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import PosterEditor from "@/components/poster-editor/PosterEditor";

export default function PosterEditorPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return <PosterEditor />;
}
