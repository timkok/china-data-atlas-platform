"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Database,
  Download,
  FileSpreadsheet,
  GraduationCap,
  HeartPulse,
  Landmark,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { CatalogData, IndicatorDataset, RegionsData } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { formatValueWithUnit, withBasePath } from "@/lib/format";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { FeaturedStoryWidget } from "./FeaturedStoryWidget";

interface Props {
  catalog: CatalogData;
  regions: RegionsData;
  featuredDatasets: IndicatorDataset[];
}

const CAT_ICON = {
  demographics: Users,
  economy: Landmark,
  education: GraduationCap,
  healthcare: HeartPulse,
};

const CAT_ACCENT: Record<string, string> = {
  demographics: "text-teal-700 bg-teal-50 border-teal-200/80",
  economy: "text-amber-800 bg-amber-50 border-amber-200/80",
  education: "text-indigo-700 bg-indigo-50 border-indigo-200/80",
  healthcare: "text-red-700 bg-red-50 border-red-200/80",
};

const CAT_DOT: Record<string, string> = {
  demographics: "bg-teal-600",
  economy: "bg-amber-600",
  education: "bg-indigo-600",
  healthcare: "bg-red-700",
};

export function HomeClient({ catalog, regions, featuredDatasets }: Props) {
  const { locale, t } = useLocale();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSeed, setSearchSeed] = useState("");

  const openSearchWith = (seed = "") => {
    setSearchSeed(seed);
    setSearchOpen(true);
  };

  const fetchedDate = catalog.data_fetched_at.slice(0, 10);

  return (
    <div>
      {/* HERO SECTION */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50/90 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-600 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>
                {locale === "zh" ? (
                  <>
                    直采国家统计局官方库 · 同步{" "}
                    <span className="whitespace-nowrap font-mono">{fetchedDate}</span>
                  </>
                ) : (
                  <>
                    100% Official NBS Data · Verified{" "}
                    <span className="whitespace-nowrap font-mono">{fetchedDate}</span>
                  </>
                )}
              </span>
            </div>

            <h1 className="text-[26px] sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.2] text-balance">
              {locale === "zh" ? (
                <>
                  让中国公开统计数据
                  <br />
                  <span className="font-editorial text-blue-700 font-semibold">
                    可查、可比、可溯源、可下载
                  </span>
                </>
              ) : (
                <>
                  Make China&apos;s Data{" "}
                  <span className="font-editorial text-blue-700 font-semibold italic">
                    Accessible &amp; Traceable
                  </span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {t(
                "将分散于国家统计局年度数据库、统计年鉴与公报中的中国31个省级行政区历史数据，转化为严谨、透明、免费开放的交互式图表与标准化 CSV 数据集。",
                "Turning official National Bureau of Statistics provincial & national series into clean interactive visuals, caliber-aware timelines, and citation-ready CSVs."
              )}
            </p>

            {/* Hero Semantic Search Trigger */}
            <div className="max-w-xl mx-auto pt-1">
              <button
                type="button"
                onClick={() => openSearchWith("")}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-white border border-slate-300 shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left group"
                data-testid="hero-search-trigger"
              >
                <span className="flex items-center gap-2.5 text-sm text-slate-400 group-hover:text-slate-600 truncate">
                  <Search className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="truncate">
                    {t(
                      "搜索指标或省份（如 GDP、人口、老龄化、广东）",
                      "Search indicators or provinces (GDP, birth rate, Guangdong)…"
                    )}
                  </span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold shrink-0 group-hover:bg-blue-700 transition-colors">
                  {t("检索", "Search")}
                </span>
              </button>

              {/* Quick Topic & Term Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
                {catalog.categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full ${CAT_DOT[cat.id]}`} />
                    <span>{locale === "zh" ? cat.name_zh : cat.name_en}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{cat.indicator_count}</span>
                  </Link>
                ))}
                <Link
                  href="/compare"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{t("跨指标散点对比", "Scatter Compare")}</span>
                </Link>
              </div>
            </div>

            {/* Platform Trust Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-2xl mx-auto">
              <div className="rounded-xl bg-white border border-slate-200/80 py-2.5 px-3">
                <div className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                  {catalog.platform_stats.indicator_count}
                </div>
                <div className="text-[11px] text-slate-500">{t("核心官方指标", "Core Indicators")}</div>
              </div>
              <div className="rounded-xl bg-white border border-slate-200/80 py-2.5 px-3">
                <div className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                  {catalog.platform_stats.province_count} + 1
                </div>
                <div className="text-[11px] text-slate-500">{t("省级行政区+全国", "Provinces + Nat.")}</div>
              </div>
              <div className="rounded-xl bg-white border border-slate-200/80 py-2.5 px-3">
                <div className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                  {catalog.platform_stats.total_observations.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500">{t("经核验官方观测点", "Verified Data Points")}</div>
              </div>
              <div className="rounded-xl bg-white border border-slate-200/80 py-2.5 px-3">
                <div className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                  {catalog.platform_stats.year_span}
                </div>
                <div className="text-[11px] text-slate-500">{t("历史跨度", "Historical Span")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED INTERACTIVE STORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <FeaturedStoryWidget featuredDatasets={featuredDatasets} regions={regions} />
      </section>

      {/* KEY DATA FINDINGS (JOURNALISTIC INSIGHT CARDS) */}
      <section className="border-y border-slate-200 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
                {t("值得关注的数据发现", "KEY DATA FINDINGS")}
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                {t("从官方最新数据看中国省际结构变迁", "Structural Shifts Across China's 31 Provinces")}
              </h2>
            </div>
            <Link
              href="/indicators"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
            >
              <span>{t("浏览全部 14 项指标", "Browse all 14 indicators")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {catalog.key_findings.map((kf) => (
              <Link
                key={kf.id}
                href={`/indicators/${kf.indicator_slug}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        CAT_ACCENT[kf.category] ?? "text-slate-700 bg-slate-100 border-slate-200"
                      }`}
                    >
                      {locale === "zh" ? kf.tag_zh : kf.tag_en}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{kf.year}</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 tabular-nums">{kf.metric_display}</div>
                  <h3 className="font-editorial text-base font-bold text-slate-900 group-hover:text-blue-700 leading-snug">
                    {locale === "zh" ? kf.headline_zh : kf.headline_en}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {locale === "zh" ? kf.detail_zh : kf.detail_en}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 group-hover:text-blue-700 pt-2 border-t border-slate-100">
                  <span>{t("进入专题核查数据", "Inspect dataset")}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EXPLORE BY TOPIC (4 CORE DOMAINS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
            {t("数据分类体系", "EXPLORE BY TOPIC")}
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {t("四大核心领域 · 首批上线专题", "Four Core Statistical Domains")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {catalog.categories.map((cat) => {
            const Icon = CAT_ICON[cat.id];
            const catInds = catalog.indicators.filter((i) => i.category === cat.id);
            return (
              <div
                key={cat.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center ${CAT_ACCENT[cat.id]}`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {cat.indicator_count} {t("项指标", "datasets")}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {locale === "zh" ? cat.name_zh : cat.name_en}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {locale === "zh" ? cat.description_zh : cat.description_en}
                    </p>
                  </div>
                  <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                    {catInds.map((ind) => (
                      <li key={ind.slug}>
                        <Link
                          href={`/indicators/${ind.slug}`}
                          className="flex items-center justify-between text-xs text-slate-700 hover:text-blue-700 py-0.5 group"
                        >
                          <span className="truncate">{locale === "zh" ? ind.short_zh : ind.short_en}</span>
                          <span className="text-[11px] font-mono text-slate-400 group-hover:text-blue-700 shrink-0 ml-2">
                            {ind.latest_complete_year}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/categories/${cat.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline pt-2 border-t border-slate-100"
                >
                  <span>{t(`进入${cat.name_zh}专题`, `Explore ${cat.name_en}`)}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ALL LATEST UPDATED DATASETS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
              {t("最新更新的数据集", "ALL AVAILABLE DATASETS")}
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              {t("全部 14 项已核验官方数据集", "All 14 Verified Official Datasets")}
            </h2>
          </div>
          <Link
            href="/indicators"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
          >
            <span>{t("进入完整检索目录", "Open full directory")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {catalog.indicators.map((ind) => (
            <Link
              key={ind.slug}
              href={`/indicators/${ind.slug}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-sm transition-all flex flex-col justify-between gap-3"
              data-testid={`indicator-card-${ind.slug}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${CAT_DOT[ind.category]}`} />
                    <span>
                      {locale === "zh"
                        ? catalog.categories.find((c) => c.id === ind.category)?.name_zh
                        : catalog.categories.find((c) => c.id === ind.category)?.name_en}
                    </span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {ind.year_min}–{ind.year_max}
                  </span>
                </div>

                <h3 className="font-editorial text-[15px] font-bold text-slate-900 group-hover:text-blue-700 leading-snug line-clamp-2">
                  {locale === "zh" ? ind.headline_insight_zh : ind.headline_insight_en}
                </h3>

                <div className="text-xs text-slate-500 font-medium">
                  {locale === "zh" ? ind.name_zh : ind.name_en} ({locale === "zh" ? ind.unit_zh : ind.unit_en})
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{t("全国最新", "National")}</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatValueWithUnit(ind.latest_national_value, ind.unit_zh, ind.unit_en, ind.decimals, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium tabular-nums">
                    <span className="w-12 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    {ind.latest_reporting_provinces}/31 {t("省", "prov.")}
                  </span>
                  <span className="text-slate-400 font-mono">{ind.quality_score.toFixed(1)}/10</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW WE WORK — RADICAL PROVENANCE BENTO */}
      <section className="border-t border-slate-200 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
          <div className="max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
              {t("数据治理与可信承诺", "HOW WE WORK")}
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              {t("你可以核验页面上的每一个数字", "You Can Verify Every Single Number")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                {t("01 · 官方直采溯源", "01 · OFFICIAL PROVENANCE")}
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {t("直连国家统计局官方发布库，零编造零插值", "Direct NBS Snapshots, Zero Fabrication")}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(
                  "每一条原始快照均保存 SHA-256 哈希与采集时间戳；对2012年医疗人口分母切换、2020年七普抽样空缺等口径变化严格标注并禁用误导性跨口径同比。",
                  "Every raw NBS JSON snapshot is hashed with SHA-256. Methodological breaks (e.g., 2012 healthcare denominator switch, 2020 census gaps) are explicitly marked with zero interpolation."
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                {t("02 · 开放标准导出", "02 · OPEN STANDARD CSV")}
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {t("一键下载标准化长表 CSV 与高清图表", "One-Click Tidy CSV & PNG Exports")}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(
                  "每个指标提供 UTF-8 BOM 编码的标准长表 CSV（Excel 打开无中文乱码），完整附带 GB/T 2260 区划代码、数据状态、官方来源表名与链接。",
                  "Download tidy UTF-8 BOM CSV tables ready for Excel, Python, R, or Stata—complete with GB/T 2260 codes, status flags, and official source links."
                )}
              </p>
              <a
                href={withBasePath("/data/csv/gdp.csv")}
                download="china-data-atlas-gdp.csv"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t("试下载分省 GDP 示例 CSV", "Try sample GDP CSV")}</span>
              </a>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                {t("03 · 学术级引用与质量门禁", "03 · CITABLE & TESTED")}
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {t("11项自动化数据质量门禁 + 一键规范引用", "11 Automated Quality Checks + Citations")}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(
                  `当前质量门禁状态：${catalog.quality_gate.passed_checks}/${catalog.quality_gate.total_checks} 通过（${catalog.quality_gate.failures} 失败），支持 GB/T 7714、APA 与 BibTeX 一键复制引用。`,
                  `Quality gate: ${catalog.quality_gate.passed_checks}/${catalog.quality_gate.total_checks} passed (${catalog.quality_gate.failures} failures). Copy ready-to-use GB/T 7714, APA, and BibTeX citations.`
                )}
              </p>
              <Link
                href="/methodology"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{t("查看完整质量门禁报告 →", "Inspect full Quality Gate report →")}</span>
              </Link>
            </div>
          </div>

          {/* Quick Province Dossier Strip */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {t("按省份直达全维度数据档案（31个省级行政区）", "Jump Directly to Any Province Dossier (31 Mainland Divisions)")}
              </h3>
              <span className="text-xs text-slate-400">
                {t("任选一省，一站式查看其全部 14 项核心指标排名与走势", "All 14 official metrics in one provincial profile")}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {regions.provinces.map((p) => (
                <Link
                  key={p.code}
                  href={`/provinces/${p.code}`}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {locale === "zh" ? p.short_zh : p.name_en}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        catalog={catalog}
        regions={regions}
        initialQuery={searchSeed}
      />
    </div>
  );
}
