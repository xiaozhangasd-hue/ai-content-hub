import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录 · qywl6.icu",
  description: "qywl6.icu 用户登录入口",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
