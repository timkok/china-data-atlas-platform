import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_SC, Noto_Serif_SC, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";
import { getCatalog, getRegions } from "@/lib/data";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  weight: ["500", "600", "700"],
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "China Data Atlas · 中国数据地图 — 权威、可溯源的中国公开统计数据平台",
    template: "%s | China Data Atlas · 中国数据地图",
  },
  description:
    "Make China's Data Accessible, Understandable, Traceable and Explorable. 将国家统计局等官方公开统计数据转化为可查询、可比较、可引用、可下载的高质量可视化数据产品。",
  keywords: [
    "中国统计数据",
    "中国数据地图",
    "China Data Atlas",
    "国家统计局",
    "分省GDP",
    "常住人口",
    "城镇化率",
    "老龄化",
    "人均可支配收入",
    "中国经济数据",
  ],
  openGraph: {
    title: "China Data Atlas · 中国数据地图",
    description:
      "覆盖中国大陆31个省级行政区与全国基准（2000–2025），全部数据源自国家统计局官方发布，支持交互探索、历史对比、口径溯源与 CSV 免费下载。",
    type: "website",
    locale: "zh_CN",
    siteName: "China Data Atlas · 中国数据地图",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalog = getCatalog();
  const regions = getRegions();

  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${sourceSerif.variable} ${notoSansSC.variable} ${notoSerifSC.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 antialiased">
        <LocaleProvider>
          <Navbar catalog={catalog} regions={regions} />
          <main className="flex-1">{children}</main>
          <Footer catalog={catalog} regions={regions} />
        </LocaleProvider>
      </body>
    </html>
  );
}
