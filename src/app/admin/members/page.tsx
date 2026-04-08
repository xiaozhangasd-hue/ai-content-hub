"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminMembersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/merchants");
  }, [router]);

  return null;
}

