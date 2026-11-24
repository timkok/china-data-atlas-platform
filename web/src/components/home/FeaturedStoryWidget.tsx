"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Grid2x2, Layers, TrendingUp } from "lucide-react";
import type { IndicatorDataset, RegionsData } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { RegionalTileMatrix } from "@/components/charts/RegionalTileMatrix";
import { ProvincialRankingChart } from "@/components/charts/ProvincialRankingChart";
import { RegionalStripPlot } from "@/components/charts/RegionalStripPlot";

interface Props {
  featuredDatasets: IndicatorDataset[];
  regions: RegionsData;
}

export function FeaturedStoryWidget({ featuredDatasets, regions }: Props) {
  const { locale, t } = useLocale();
  const [activeDatasetIdx, setActiveDatasetIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"trend" | "spatial" | "ranking" | "regions">("spatial");

  const dataset = featuredDatasets[activeDatasetIdx] ?? featuredDatasets[0];
  const [selectedYear, setSelectedYear] = useState<number>(dataset.latest_complete_year);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(["440000", "320000", "110000", "510000"]);

  const handleSelectDataset = (idx: number) => {
    setActiveDatasetIdx(idx);
    const next = featuredDatasets[idx];
    if (next) setSelectedYear(next.latest_complete_year);
  };

  const toggleProvince = (code: string) => {
    setSelectedProvinces((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev.slice(-4), code]
    );
  };

  const tabs = [
    { id: "spatial" as const, zh: "区域格局", en: "Spatial Grid", icon: Grid2x2 },
    { id: "trend" as const, zh: "历史趋势", en: "Trend", icon: TrendingUp },
    { id: "ranking" as const, zh: "省级排名", en: "Top 12", icon: BarChart3 },
    { id: "regions" as const, zh: "七大区对比", en: "By Region", icon: Layers },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Top Bar: Indicator Switcher + Full Detail CTA */}
      <div className="px-4 sm:px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            {t("重点交互透视", "LIVE PREVIEW")}
          </span>
          {featuredDatasets.map((ds, i) => (
            <button
              key={ds.slug}
              type="button"
              onClick={() => handleSelectDataset(i)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                i === activeDatasetIdx
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-700"
              }`}
            >
              {locale === "zh" ? ds.short_zh : ds.short_en}
            </button>
          ))}
        </div>

        <Link
          href={`/indicators/${dataset.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline shrink-0"
        >
          <span>{t("打开完整专题页与 CSV 下载", "Open full dataset & CSV")}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Story Title & View Tabs (4 crisp non-truncated tabs!) */}
      <div className="px-4 sm:px-6 pt-5 pb-3 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h3 className="font-editorial text-lg sm:text-xl font-bold text-slate-900">
            {locale === "zh" ? dataset.headline_insight_zh : dataset.headline_insight_en}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {locale === "zh" ? dataset.name_zh : dataset.name_en} ({locale === "zh" ? dataset.unit_zh : dataset.unit_en}) ·{" "}
            {t("来源：国家统计局", "Source: NBS China")} · {dataset.year_min}–{dataset.year_max}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{locale === "zh" ? tab.zh : tab.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Chart Body */}
      <div className="px-4 sm:px-6 pb-6 pt-2">
        {activeTab === "spatial" && (
          <RegionalTileMatrix
            dataset={dataset}
            regions={regions}
            selectedYear={selectedYear}
            selectedProvinces={selectedProvinces}
            onToggleProvince={toggleProvince}
            onYearChange={setSelectedYear}
            compact
          />
        )}
        {activeTab === "trend" && (
          <TrendLineChart
            dataset={dataset}
            regions={regions}
            selectedProvinces={selectedProvinces}
            onToggleProvince={toggleProvince}
            onSetProvinces={setSelectedProvinces}
            height={340}
          />
        )}
        {activeTab === "ranking" && (
          <ProvincialRankingChart
            dataset={dataset}
            regions={regions}
            selectedYear={selectedYear}
            selectedProvinces={selectedProvinces}
            onToggleProvince={toggleProvince}
            compact
          />
        )}
        {activeTab === "regions" && (
          <RegionalStripPlot
            dataset={dataset}
            regions={regions}
            selectedYear={selectedYear}
            selectedProvinces={selectedProvinces}
            onToggleProvince={toggleProvince}
            compact
          />
        )}
      </div>
    </div>
  );
}
