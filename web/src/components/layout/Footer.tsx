"use client";

import React from "react";
import Link from "next/link";
import { Compass, ExternalLink, ShieldCheck } from "lucide-react";
import type { CatalogData, RegionsData } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

interface Props {
  catalog: CatalogData;
  regions: RegionsData;
}

export function Footer({ catalog, regions }: Props) {
  const { locale, t } = useLocale();
  const fetchedDate = catalog.data_fetched_at.slice(0, 10);

  return (
    <footer className="border-t border-slate-200 bg-slate-50/70 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-200">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </span>
              <span className="font-bold text-slate-900">
                {locale === "zh" ? "中国数据地图 · China Data Atlas" : "China Data Atlas · 中国数据地图"}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md">
              {t(
                "Make China's Data Accessible, Understandable, Traceable and Explorable. 独立、免费、可溯源的中国公开统计数据可视化平台，所有数值严格源自官方统计机构。",
                "Make China's Data Accessible, Understandable, Traceable and Explorable. An independent, free, traceable statistical platform built directly from official Chinese government data."
              )}
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {t(
                  `数据质量门禁通过 · 最近采集 ${fetchedDate}`,
                  `Quality Gate Verified · Last fetched ${fetchedDate}`
                )}
              </span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("主题数据", "Topics")}
            </h3>
            <ul className="space-y-1.5 text-sm">
              {catalog.categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/categories/${cat.id}`} className="text-slate-600 hover:text-blue-700 transition-colors">
                    {locale === "zh" ? cat.name_zh : cat.name_en} ({cat.indicator_count})
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/indicators" className="text-slate-600 hover:text-blue-700 transition-colors">
                  {t("全部指标目录 →", "All Indicators →")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("数据治理与官方来源", "Governance & Official Sources")}
            </h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/methodology" className="text-slate-600 hover:text-blue-700 transition-colors">
                  {t("方法论、统计口径与地图合规说明", "Methodology, Calibers & Map Compliance")}
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-slate-600 hover:text-blue-700 transition-colors">
                  {t("跨指标对比探索（V0.5 预览）", "Cross-Indicator Explorer (V0.5 Preview)")}
                </Link>
              </li>
              <li>
                <a
                  href="https://data.stats.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-700 transition-colors"
                >
                  <span>{t("国家统计局 · 国家数据发布库", "National Bureau of Statistics (data.stats.gov.cn)")}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.stats.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-700 transition-colors"
                >
                  <span>{t("国家统计局官网（统计年鉴与公报）", "NBS Portal (Statistical Yearbooks)")}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 space-y-2 text-xs text-slate-500 leading-relaxed">
          <p>{locale === "zh" ? regions.coverage_disclaimer.zh : regions.coverage_disclaimer.en}</p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-slate-400">
            <span>© {new Date().getFullYear()} China Data Atlas · 中国数据地图 (V0.1 MVP)</span>
            <span>
              {t(
                "零虚构数据 · 原始数值归属国家统计局等官方发布机构 · 平台整理代码与CSV开放引用",
                "Zero synthetic data · Official figures belong to NBS China · Open citation supported"
              )}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
