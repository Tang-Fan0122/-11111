import type { Metadata } from "next";
import "./globals.css";
import "./workflow.css";
import "./branches.css";
import "./flow-layout.css";

export const metadata: Metadata = {
  title: "幕间 · AI 剧本与分镜工作台",
  description: "从创意和参考画面生成剧情向、氛围向或混合型视频剧本、分镜及 AI 提示词。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
