"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Share2,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { IndicatorDataset, IndicatorSummary, RegionsData } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import {
  formatDataStatus,
  formatNumber,
  formatSignedDiff,
  formatSignedPct,
  formatValueWithUnit,
} from "@/lib/format";
import { RegionalTileMatrix } from "@/components/charts/RegionalTileMatrix";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { ProvincialRankingChart } from "@/components/charts/ProvincialRankingChart";
import { RegionalStripPlot } from "@/components/charts/RegionalStripPlot";
import { DataExplorer } from "./DataExplorer";
import { CitationBox } from "./CitationBox";

interface Props {
  dataset: IndicatorDataset;
  regions: RegionsData;
  relatedIndicators: IndicatorSummary[];
  categoryNameZh: string;
  categoryNameEn: string;
}

export function IndicatorDetailClient({
  dataset,
  regions,
  relatedIndicators,
  categoryNameZh,
  categoryNameEn,
}: Props) {
  const { locale, t } = useLocale();
  const [selectedYear, setSelectedYear] = useState<number>(dataset.latest_complete_year);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(() => {
    const defaults: string[] = [];
    if (dataset.top_province) defaults.push(dataset.top_province.code);
    for (const c of ["110000", "310000", "330000", "510000"]) {
      if (!defaults.includes(c) && defaults.length < 4) defaults.push(c);
    }
    return defaults;
  });
  const [linkCopied, setLinkCopied] = useState(false);

  // Hydrate year & provinces from URL query params (shareable analytical state!)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raf = window.requestAnimationFrame(() => {
      const sp = new URLSearchParams(window.location.search);
      const yrParam = Number(sp.get("year"));
      if (yrParam && dataset.available_years.includes(yrParam)) {
        setSelectedYear(yrParam);
      }
      const provsParam = sp.get("provinces");
      if (provsParam) {
        const validSet = new Set(regions.provinces.map((p) => p.code));
        const parsed = provsParam.split(",").filter((c) => validSet.has(c));
        if (parsed.length > 0) setSelectedProvinces(parsed.slice(0, 7));
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [dataset.available_years, regions.provinces]);

  const toggleProvince = (code: string) => {
    setSelectedProvinces((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : prev.length >= 7
        ? [...prev.slice(1), code]
        : [...prev, code]
    );
  };

  const handleShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("year", String(selectedYear));
      if (selectedProvinces.length > 0) {
        url.searchParams.set("provinces", selectedProvinces.join(","));
      }
      await navigator.clipboard.writeText(url.toString());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const provinceMap = useMemo(
    () => new Map(regions.provinces.map((p) => [p.code, p])),
    [regions.provinces]
  );

  // Dynamic summary stats for selectedYear
  const yearSummary = useMemo(() => {
    const observations = dataset.observations;
    let nat: IndicatorDataset["observations"][number] | null = null;
    const provs = [];
    for (const o of observations) {
      if (o.year !== selectedYear) continue;
      if (o.is_national) nat = o;
      else if (o.value !== null) provs.push(o);
    }
    provs.sort((a, b) => (b.value! - a.value!) || a.region_code.localeCompare(b.region_code));
    const vals = provs.map((p) => p.value!);
    const median = vals.length
      ? vals.length % 2 === 1
        ? vals[Math.floor(vals.length / 2)]
        : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2
      : null;

    return {
      nat,
      count: provs.length,
      highest: provs[0] ?? null,
      lowest: provs[provs.length - 1] ?? null,
      median,
    };
  }, [dataset.observations, selectedYear]);

  const highestName = yearSummary.highest
    ? locale === "zh"
      ? provinceMap.get(yearSummary.highest.region_code)?.short_zh ?? yearSummary.highest.region_name_zh
      : provinceMap.get(yearSummary.highest.region_code)?.name_en ?? yearSummary.highest.region_name_en
    : "—";
  const lowestName = yearSummary.lowest
    ? locale === "zh"
      ? provinceMap.get(yearSummary.lowest.region_code)?.short_zh ?? yearSummary.lowest.region_name_zh
      : provinceMap.get(yearSummary.lowest.region_code)?.name_en ?? yearSummary.lowest.region_name_en
    : "—";

  const sections = [
    { id: "summary", zh: "概览", en: "Overview" },
    { id: "spatial", zh: "区域格局", en: "Spatial Grid" },
    { id: "trend", zh: "历史趋势", en: "Trend" },
    { id: "rankings", zh: "省级排名", en: "Rankings" },
    { id: "regions", zh: "大区对比", en: "Regions" },
    { id: "explorer", zh: "数据表", en: "Explorer" },
    { id: "methodology", zh: "方法与出处", en: "Methodology" },
  ];

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* Header / Breadcrumb / Title / Action Bar */}
      <header className="space-y-4 pb-6 border-b border-slate-200">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-700">{t("首页", "Home")}</Link>
          <span>/</span>
          <Link href={`/categories/${dataset.category}`} className="hover:text-blue-700">
            {locale === "zh" ? categoryNameZh : categoryNameEn}
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-400">{dataset.id}</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2.5 max-w-3xl">
            <h1 className="font-editorial text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              {locale === "zh" ? dataset.name_zh : dataset.name_en}
              <span className="ml-2.5 text-base sm:text-lg font-sans font-normal text-slate-400">
                ({locale === "zh" ? dataset.unit_zh : dataset.unit_en})
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {locale === "zh" ? dataset.definition_zh : dataset.definition_en}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t(`质量评分 ${dataset.quality_score.toFixed(1)} / 10`, `Quality ${dataset.quality_score.toFixed(1)} / 10`)}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium tabular-nums">
                {dataset.year_min}–{dataset.year_max}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium tabular-nums">
                {t(`${dataset.latest_complete_year}年覆盖 ${dataset.latest_reporting_provinces}/31 省`, `${dataset.latest_reporting_provinces}/31 provinces (${dataset.latest_complete_year})`)}
              </span>
              <span className="text-slate-400">
                {t("数据来源：国家统计局", "Source: NBS China")}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-400 transition-colors"
            >
              {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{linkCopied ? t("链接已复制", "Link copied") : t("分享视图", "Share")}</span>
            </button>
            <a
              href="#cite"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-400 transition-colors"
            >
              {t("引用数据", "Cite")}
            </a>
            <a
              href={`/data/csv/${dataset.slug}.csv`}
              download={`china-data-atlas-${dataset.slug}.csv`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 shadow-xs transition-colors"
              data-testid="hero-csv-download"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t("下载 CSV", "Download CSV")}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Sticky Section Nav with right-edge scroll fade affordance on mobile */}
      <div className="sticky top-14 sm:top-15 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 bg-white/95 backdrop-blur-xs border-b border-slate-200 py-2 relative">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pr-8 sm:pr-0">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 whitespace-nowrap transition-colors shrink-0"
            >
              {locale === "zh" ? s.zh : s.en}
            </a>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white via-white/80 to-transparent sm:hidden"
        />
      </div>

      {/* SECTION A: SUMMARY */}
      <section id="summary" className="scroll-mt-28 space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
              {t("01 · 核心概览", "01 · SUMMARY")}
            </div>
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 mt-0.5" data-testid="summary-headline">
              {selectedYear === dataset.latest_complete_year
                ? locale === "zh"
                  ? dataset.headline_insight_zh
                  : dataset.headline_insight_en
                : t(
                    `${selectedYear}年，${highestName}${dataset.short_zh}居全国首位（${formatValueWithUnit(yearSummary.highest?.value, dataset.unit_zh, dataset.unit_en, dataset.decimals, "zh")}）`,
                    `In ${selectedYear}, ${highestName} led ${dataset.short_en} at ${formatValueWithUnit(yearSummary.highest?.value, dataset.unit_zh, dataset.unit_en, dataset.decimals, "en")}`
                  )}
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400 shrink-0">
            {t(`当前视角：${selectedYear}年`, `Viewing: ${selectedYear}`)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* National Benchmark Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{t(`全国数值 (${yearSummary.nat ? selectedYear : dataset.latest_national_year ?? "—"}年)`, `China National (${yearSummary.nat ? selectedYear : dataset.latest_national_year ?? "—"})`)}</span>
              {yearSummary.nat && (
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600">
                  {formatDataStatus(yearSummary.nat.data_status, locale)}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums" data-testid="kpi-national-value">
              {formatValueWithUnit(
                yearSummary.nat?.value ?? dataset.latest_national_value,
                dataset.unit_zh,
                dataset.unit_en,
                dataset.decimals,
                locale
              )}
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              {yearSummary.nat?.yoy_comparable ? (
                yearSummary.nat.yoy_pct !== null ? (
                  <span>
                    {t("较上年", "vs prior year")}{" "}
                    <b className={yearSummary.nat.yoy_pct >= 0 ? "text-emerald-700" : "text-red-700"}>
                      {formatSignedPct(yearSummary.nat.yoy_pct)}
                    </b>
                  </span>
                ) : (
                  <span>
                    {t("较上年变动", "YoY diff")}{" "}
                    <b className="text-slate-800">
                      {formatSignedDiff(yearSummary.nat.yoy_diff, dataset.unit_zh, dataset.decimals)}
                    </b>
                  </span>
                )
              ) : (
                <span>{t("该年份不适用跨期同比", "YoY N/A for this year")}</span>
              )}
            </div>
          </div>

          {/* Highest Province Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
            <div className="text-xs text-slate-500">
              {t(`${selectedYear}年 省级最高`, `Highest Province (${selectedYear})`)}
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatValueWithUnit(
                yearSummary.highest?.value,
                dataset.unit_zh,
                dataset.unit_en,
                dataset.decimals,
                locale
              )}
            </div>
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span className="font-semibold text-blue-700">{highestName}</span>
              {yearSummary.highest && (
                <Link href={`/provinces/${yearSummary.highest.region_code}`} className="text-slate-400 hover:text-blue-700">
                  {t("省份档案 →", "Profile →")}
                </Link>
              )}
            </div>
          </div>

          {/* Lowest Province Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
            <div className="text-xs text-slate-500">
              {t(`${selectedYear}年 省级最低`, `Lowest Province (${selectedYear})`)}
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatValueWithUnit(
                yearSummary.lowest?.value,
                dataset.unit_zh,
                dataset.unit_en,
                dataset.decimals,
                locale
              )}
            </div>
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span className="font-semibold text-slate-800">{lowestName}</span>
              {yearSummary.lowest && (
                <Link href={`/provinces/${yearSummary.lowest.region_code}`} className="text-slate-400 hover:text-blue-700">
                  {t("省份档案 →", "Profile →")}
                </Link>
              )}
            </div>
          </div>

          {/* Provincial Median & Coverage Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
            <div className="text-xs text-slate-500">
              {t(`${selectedYear}年 省级中位数`, `Provincial Median (${selectedYear})`)}
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatValueWithUnit(
                yearSummary.median,
                dataset.unit_zh,
                dataset.unit_en,
                dataset.decimals,
                locale
              )}
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              {t(`有效披露 ${yearSummary.count} / 31 个省级行政区`, `${yearSummary.count} / 31 provinces reporting`)}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: INTERACTIVE SPATIAL VIEW (COMPLIANT 7-REGION PROVINCIAL MATRIX) */}
      <section id="spatial" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
            {t("02 · 区域格局与省际空间矩阵", "02 · SPATIAL DISTRIBUTION")}
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            {t(
              `${selectedYear}年，${highestName}位居全国首位（${formatValueWithUnit(yearSummary.highest?.value, dataset.unit_zh, dataset.unit_en, dataset.decimals, "zh")}）`,
              `In ${selectedYear}, ${highestName} leads at ${formatValueWithUnit(yearSummary.highest?.value, dataset.unit_zh, dataset.unit_en, dataset.decimals, "en")}`
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t(
              "按中国七大地理大区组织的等面积省级热力矩阵：每个省区市同等面积呈现，支持年份切换、演变播放与跨图表联动。",
              "Equal-area 7-region provincial heatmap: every division is legible and tappable, synced with year scrubber and historical trends."
            )}
          </p>
        </div>

        <RegionalTileMatrix
          dataset={dataset}
          regions={regions}
          selectedYear={selectedYear}
          selectedProvinces={selectedProvinces}
          onToggleProvince={toggleProvince}
          onYearChange={setSelectedYear}
        />
      </section>

      {/* SECTION C: HISTORICAL TREND */}
      <section id="trend" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
            {t("03 · 历史趋势与多省对比", "03 · HISTORICAL TRAJECTORY")}
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            {t(
              `${dataset.year_min}–${dataset.year_max}年 ${dataset.short_zh}长期演变轨迹`,
              `Long-Term ${dataset.short_en} Trajectory (${dataset.year_min}–${dataset.year_max})`
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t(
              "同时追踪全国基准与多省历史走势；官方未公布年份保持断线，统计口径变更年份以虚线标注。",
              "Compare the national benchmark against multiple provinces simultaneously, with explicit breaks and un-interpolated gaps."
            )}
          </p>
        </div>

        <TrendLineChart
          dataset={dataset}
          regions={regions}
          selectedProvinces={selectedProvinces}
          onToggleProvince={toggleProvince}
          onSetProvinces={setSelectedProvinces}
        />
      </section>

      {/* SECTION D: PROVINCIAL RANKINGS & LONG-TERM MOVERS */}
      <section id="rankings" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
            {t("04 · 省级排名与长期位次变化", "04 · PROVINCIAL RANKINGS & MOVERS")}
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            {t(`${selectedYear}年 31省区市${dataset.short_zh}完整排名`, `${selectedYear} Full Provincial Ranking — ${dataset.short_en}`)}
          </h2>
        </div>

        <ProvincialRankingChart
          dataset={dataset}
          regions={regions}
          selectedYear={selectedYear}
          selectedProvinces={selectedProvinces}
          onToggleProvince={toggleProvince}
        />

        {dataset.movers_window && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              {t(
                `中长期变动：${dataset.movers_window.start_year} → ${dataset.movers_window.end_year}年 变化最显著省份`,
                `Biggest Movers: ${dataset.movers_window.start_year} → ${dataset.movers_window.end_year}`
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <TrendingUp className="w-4 h-4" />
                  <span>{t("增幅 / 上升最显著 Top 5", "Largest Gains (Top 5)")}</span>
                </div>
                <ul className="divide-y divide-emerald-100">
                  {dataset.movers_window.biggest_rises.map((m) => (
                    <li key={m.region_code} className="py-1.5 flex items-center justify-between gap-2 text-xs">
                      <Link href={`/provinces/${m.region_code}`} className="font-semibold text-slate-800 hover:text-blue-700">
                        {locale === "zh" ? m.name_zh : m.name_en}
                        <span className="ml-1.5 text-[11px] font-normal text-slate-500 tabular-nums">
                          ({formatNumber(m.start_value, dataset.decimals, locale)} → {formatNumber(m.end_value, dataset.decimals, locale)})
                        </span>
                      </Link>
                      <span className="font-bold text-emerald-700 tabular-nums shrink-0">
                        {dataset.unit_zh === "%" || dataset.unit_zh === "‰" || m.pct_change === null
                          ? formatSignedDiff(m.abs_change, dataset.unit_zh, dataset.decimals)
                          : formatSignedPct(m.pct_change)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <TrendingDown className="w-4 h-4 text-slate-500" />
                  <span>{t("增速最缓 / 降幅最显著 Top 5", "Slowest Growth / Largest Declines (Top 5)")}</span>
                </div>
                <ul className="divide-y divide-slate-200/70">
                  {dataset.movers_window.biggest_falls.map((m) => (
                    <li key={m.region_code} className="py-1.5 flex items-center justify-between gap-2 text-xs">
                      <Link href={`/provinces/${m.region_code}`} className="font-semibold text-slate-800 hover:text-blue-700">
                        {locale === "zh" ? m.name_zh : m.name_en}
                        <span className="ml-1.5 text-[11px] font-normal text-slate-500 tabular-nums">
                          ({formatNumber(m.start_value, dataset.decimals, locale)} → {formatNumber(m.end_value, dataset.decimals, locale)})
                        </span>
                      </Link>
                      <span className="font-bold text-slate-700 tabular-nums shrink-0">
                        {dataset.unit_zh === "%" || dataset.unit_zh === "‰" || m.pct_change === null
                          ? formatSignedDiff(m.abs_change, dataset.unit_zh, dataset.decimals)
                          : formatSignedPct(m.pct_change)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION E: REGIONAL COMPARISON */}
      <section id="regions" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
            {t("05 · 七大地理大区对比", "05 · REGIONAL COMPARISON")}
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            {t(`${selectedYear}年 七大地理大区内部离散度与中位数对比`, `7-Region Distribution & Medians (${selectedYear})`)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t(
              "依据中国传统七大地理大区（华北、东北、华东、华中、华南、西南、西北）分组，每个圆点代表一个省区市，黑色竖线为大区中位数。",
              "Grouped by China's 7 standard geographic regions. Each dot represents a province; vertical dark bars mark each region's median."
            )}
          </p>
        </div>

        <RegionalStripPlot
          dataset={dataset}
          regions={regions}
          selectedYear={selectedYear}
          selectedProvinces={selectedProvinces}
          onToggleProvince={toggleProvince}
        />
      </section>

      {/* SECTION F: DATA EXPLORER */}
      <section id="explorer" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
            {t("06 · 完整数据浏览器与 CSV 下载", "06 · DATA EXPLORER & EXPORT")}
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            {t("查询任意省区市历年原始与标准化记录", "Browse, Filter, and Download Complete Official Records")}
          </h2>
        </div>

        <DataExplorer dataset={dataset} regions={regions} defaultYear={dataset.latest_complete_year} />
      </section>

      {/* SECTION G: METHODOLOGY, SOURCE & CITATION */}
      <section id="methodology" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
              {t("07 · 指标口径、方法论与权威溯源", "07 · METHODOLOGY, PROVENANCE & CITATION")}
            </div>
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              {t("每一项数字皆可核验", "Every Number Is Traceable to Its Official Source")}
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
            <ShieldCheck className="w-4 h-4" />
            {t(`可信度评分 ${dataset.quality_score.toFixed(1)} / 10`, `Data Quality ${dataset.quality_score.toFixed(1)} / 10`)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4 text-sm text-slate-700 leading-relaxed">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t("统计口径说明", "Statistical Scope & Caliber")}
              </h3>
              <p>{locale === "zh" ? dataset.caliber_note_zh : dataset.caliber_note_en}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t("数据处理与转换方法", "Data Processing & Transformation")}
              </h3>
              <p>{locale === "zh" ? dataset.transformation_zh : dataset.transformation_en}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t("国家统计局历史修订说明", "Official Revisions & Census Notes")}
              </h3>
              <p>{locale === "zh" ? dataset.revision_note_zh : dataset.revision_note_en}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t("已知局限性与解读提示", "Known Limitations")}
              </h3>
              <p>{locale === "zh" ? dataset.limitations_zh : dataset.limitations_en}</p>
            </div>
            {(dataset.nbs_annotation_zh || dataset.nbs_mark_zh) && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">
                  {t("国家统计局接口原始注释（原文摘录）", "Verbatim Official NBS Metadata Remarks")}
                </div>
                {dataset.nbs_annotation_zh && <p>{dataset.nbs_annotation_zh}</p>}
                {dataset.nbs_mark_zh && <p className="text-slate-500">{dataset.nbs_mark_zh}</p>}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-4">
            {/* Source Provenance Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5 text-xs">
              <div className="font-bold uppercase tracking-wider text-slate-700">
                {t("官方来源元数据", "Official Provenance Metadata")}
              </div>
              <dl className="space-y-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">{t("指标编码", "Indicator ID")}</dt>
                  <dd className="font-mono font-semibold text-slate-800">{dataset.id}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">{t("发布机构", "Agency")}</dt>
                  <dd className="font-medium text-slate-800 text-right">
                    {locale === "zh" ? dataset.source.agency_zh : dataset.source.agency_en}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500 shrink-0">{t("来源表名", "Source Table")}</dt>
                  <dd className="text-slate-700 text-right">
                    {locale === "zh" ? dataset.source.table_name_zh : dataset.source.table_name_en}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">{t("采集日期 (UTC)", "Fetched At")}</dt>
                  <dd className="font-mono text-slate-700">{dataset.source.fetched_at.slice(0, 10)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">{t("最新状态", "Latest Status")}</dt>
                  <dd className="font-medium text-slate-800">
                    {formatDataStatus(dataset.source.data_status, locale)}
                  </dd>
                </div>
                <div className="pt-1 border-t border-slate-200">
                  <a
                    href={dataset.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-700 hover:underline font-medium"
                  >
                    <span>{t("访问国家统计局原始数据入口", "Open Official NBS Data Portal")}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </dl>
            </div>

            {/* Quality Gate Rubric Checklist */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs">
              <div className="font-bold uppercase tracking-wider text-slate-700">
                {t("自动化质量门禁校验结果", "Automated Quality Checks")}
              </div>
              <ul className="space-y-1.5">
                {dataset.quality_checks.map((qc) => (
                  <li key={qc.check} className="flex items-start gap-2 text-slate-600">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${qc.passed ? "text-emerald-600" : "text-amber-500"}`} />
                    <span>{locale === "zh" ? qc.detail_zh : qc.detail_en}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <CitationBox dataset={dataset} />
      </section>

      {/* RELATED INDICATORS */}
      {relatedIndicators.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-xl font-bold text-slate-900">
              {t("相关统计指标推荐", "Related Indicators")}
            </h2>
            <Link
              href={`/compare?x=${dataset.slug}&y=${relatedIndicators[0].slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
            >
              <span>{t("在跨指标实验室中对比 →", "Compare in Scatter Lab →")}</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedIndicators.map((rel) => (
              <Link
                key={rel.slug}
                href={`/indicators/${rel.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-sm transition-all flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-slate-400">
                    {rel.year_min}–{rel.year_max} · {rel.latest_reporting_provinces}/31
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-700">
                    {locale === "zh" ? rel.name_zh : rel.name_en}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {locale === "zh" ? rel.headline_insight_zh : rel.headline_insight_en}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {formatValueWithUnit(rel.latest_national_value, rel.unit_zh, rel.unit_en, rel.decimals, locale)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
