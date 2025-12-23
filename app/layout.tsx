import type { Metadata } from "next";
import { Inter, Noto_Serif_SC } from "next/font/google"; // 引入谷歌字体
import "./globals.css";
import GlobalEffects from "@/components/GlobalEffects";

// 英文字体
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// 中文宋体 (思源宋体)
const notoSerif = Noto_Serif_SC({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  variable: "--font-serif", // 定义 CSS 变量
  preload: false, // 某些环境下防止加载错误
});

export const metadata: Metadata = {
  title: "Flower Daily | 每日一花",
  description: "送自己一朵花，治愈每一个当下。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} ${notoSerif.variable} font-sans antialiased bg-stone-50`}>
        {/* 全局特效挂载点 */}
        <GlobalEffects />
        {children}
      </body>
    </html>
  );
}