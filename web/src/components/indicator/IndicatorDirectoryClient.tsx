"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, Search } from "lucide-react";
import type { CatalogData, CategoryId } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { formatValueWithUnit } from "@/lib/format";

interface Props {
  catalog: CatalogData;
  initialCategory?: CategoryId | "all";
}

const CAT_DOT: Record<string, string> = {
  demographics: "bg-teal-600",
  economy: "bg-amber-600",
  education: "bg-indigo-600",
  healthcare: "bg-red-700",
};

export function IndicatorDirectoryClient({ catalog, initialCategory = "all" }: Props) {
  const { locale, t } = useLocale();
  const [activeCat, setActiveCat] = useState<string>(initialCategory);
  const [query, setQuery] = useState("");

  const activeCategoryMeta = catalog.categories.find((c) => c.id === activeCat);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.indicators.filter((ind) => {
      if (activeCat !== "all" && ind.category !== activeCat) return false;
      if (!q) return true;
      const hay = [ind.id, ind.slug, ind.name_zh, ind.name_en, ind.definition_zh, ...ind.aliases]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [catalog.indicators, activeCat, query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <header className="space-y-3 pb-6 border-b border-slate-200">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-700">{t("首页", "Home")}</Link>
          <span>/</span>
          <span>
            {activeCategoryMeta
              ? locale === "zh"
                ? activeCategoryMeta.name_zh
                : activeCategoryMeta.name_en
              : t("全部指标", "All Indicators")}
          </span>
        </nav>

        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-slate-900">
          {activeCategoryMeta
            ? locale === "zh"
              ? `${activeCategoryMeta.name_zh}统计专题`
              : `${activeCategoryMeta.name_en} Datasets`
            : t("全部官方统计指标目录", "Complete Official Indicator Directory")}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          {activeCategoryMeta
            ? locale === "zh"
              ? activeCategoryMeta.description_zh
              : activeCategoryMeta.description_en
            : t(
                "全部指标均采自国家统计局分省年度与全国年度官方数据库，附完整统计口径说明、质量门禁核验与免费 CSV 下载。",
                "Every dataset is sourced directly from NBS provincial & national annual databases with full methodology and open CSV downloads."
              )}
        </p>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCat("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeCat === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            {t(`全部 (${catalog.indicators.length})`, `All (${catalog.indicators.length})`)}
          </button>
          {catalog.categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCat(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeCat === cat.id
                  ? "bg-blue-700 text-white border-blue-700"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeCat === cat.id ? "bg-white" : CAT_DOT[cat.id]}`} />
              <span>{locale === "zh" ? cat.name_zh : cat.name_en}</span>
              <span className="opacity-70">{cat.indicator_count}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("筛选指标名称、缩写或编码…", "Filter by name, alias, or ID…")}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Results Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center text-sm text-slate-500">
          {t(`未找到匹配「${query}」的统计指标。`, `No indicators matched "${query}".`)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ind) => (
            <div
              key={ind.slug}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-400 hover:shadow-sm transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">{ind.id}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold tabular-nums text-[11px]">
                    {ind.latest_reporting_provinces}/31 · {ind.year_min}–{ind.year_max}
                  </span>
                </div>

                <Link href={`/indicators/${ind.slug}`} className="block group">
                  <h2 className="font-editorial text-lg font-bold text-slate-900 group-hover:text-blue-700 leading-snug">
                    {locale === "zh" ? ind.name_zh : ind.name_en}
                    <span className="ml-1.5 font-sans text-xs font-normal text-slate-400">
                      ({locale === "zh" ? ind.unit_zh : ind.unit_en})
                    </span>
                  </h2>
                </Link>

                <p className="text-xs font-medium text-blue-800 bg-blue-50/60 border border-blue-100 rounded-lg px-2.5 py-1.5">
                  {locale === "zh" ? ind.headline_insight_zh : ind.headline_insight_en}
                </p>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {locale === "zh" ? ind.definition_zh : ind.definition_en}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="text-slate-400">{t("全国最新：", "National: ")}</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatValueWithUnit(ind.latest_national_value, ind.unit_zh, ind.unit_en, ind.decimals, locale)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/data/csv/${ind.slug}.csv`}
                    download={`china-data-atlas-${ind.slug}.csv`}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-700 hover:border-blue-300 transition-colors"
                    title={t("下载 CSV", "Download CSV")}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <Link
                    href={`/indicators/${ind.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <span>{t("探索", "Explore")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
