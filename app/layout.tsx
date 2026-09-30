import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Math Clash · 亲子数学对决",
  description: "支持中文、英文、日文的节奏数学挑战，含单人模式、双人手机 PK 与排行榜。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
