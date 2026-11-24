"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Check, Share2, Sparkles } from "lucide-react";
import type { IndicatorDataset, RegionsData } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { ScatterCompareChart } from "@/components/charts/ScatterCompareChart";

interface Props {
  datasets: IndicatorDataset[];
  regions: RegionsData;
}

export function CompareLabClient({ datasets, regions }: Props) {
  const { locale, t } = useLocale();
  const [xSlug, setXSlug] = useState("gdp-per-capita");
  const [ySlug, setYSlug] = useState("disposable-income");
  const [year, setYear] = useState(2024);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raf = window.requestAnimationFrame(() => {
      const sp = new URLSearchParams(window.location.search);
      const sx = sp.get("x");
      const sy = sp.get("y");
      const yr = Number(sp.get("year"));
      if (sx && datasets.some((d) => d.slug === sx)) setXSlug(sx);
      if (sy && datasets.some((d) => d.slug === sy)) setYSlug(sy);
      if (yr >= 2000 && yr <= 2025) setYear(yr);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [datasets]);

  const xDataset = datasets.find((d) => d.slug === xSlug) ?? datasets[0];
  const yDataset = datasets.find((d) => d.slug === ySlug) ?? datasets[1];

  const commonYears = useMemo(() => {
    const setY = new Set(yDataset.available_years);
    return xDataset.available_years.filter((y) => setY.has(y)).sort((a, b) => b - a);
  }, [xDataset, yDataset]);

  const effectiveYear = commonYears.includes(year) ? year : commonYears[0] ?? 2024;

  const presets = [
    {
      label_zh: "人均 GDP vs 人均可支配收入",
      label_en: "GDP per Capita vs Disposable Income",
      x: "gdp-per-capita",
      y: "disposable-income",
    },
    {
      label_zh: "城镇化率 vs 出生率",
      label_en: "Urbanization vs Birth Rate",
      x: "urbanization-rate",
      y: "birth-rate",
    },
    {
      label_zh: "人均 GDP vs 65岁+老龄化",
      label_en: "GDP per Capita vs Age 65+ Share",
      x: "gdp-per-capita",
      y: "aging-65-share",
    },
    {
      label_zh: "常住人口 vs 高校在校生",
      label_en: "Population vs College Enrollment",
      x: "population",
      y: "higher-ed-enrollment",
    },
    {
      label_zh: "每千人医师数 vs 每千人床位数",
      label_en: "Physicians vs Beds per 1,000",
      x: "physicians-per-1k",
      y: "hospital-beds-per-1k",
    },
  ];

  const handleShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("x", xDataset.slug);
      url.searchParams.set("y", yDataset.slug);
      url.searchParams.set("year", String(effectiveYear));
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <header className="space-y-3 pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t("V0.5 跨指标探索预览模块", "V0.5 Cross-Indicator Explorer Preview")}</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-slate-900">
          {t("跨指标省际散点对比实验室", "Cross-Indicator Provincial Scatter Lab")}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          {t(
            "任选两项经质量门禁核验的官方指标，探索中国31个省级行政区在不同年份的横截面分布、地理大区聚类与统计相关性。",
            "Select any two official verified indicators to compare all 31 mainland provinces across years, geographic clusters, and cross-sectional correlation."
          )}
        </p>
      </header>

      {/* Preset Combinations */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 mr-1">{t("推荐研究组合：", "Suggested pairs:")}</span>
        {presets.map((p) => (
          <button
            key={`${p.x}-${p.y}`}
            type="button"
            onClick={() => {
              setXSlug(p.x);
              setYSlug(p.y);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              xSlug === p.x && ySlug === p.y
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-700"
            }`}
          >
            {locale === "zh" ? p.label_zh : p.label_en}
          </button>
        ))}
      </div>

      {/* Controls + Chart Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4 space-y-1">
            <label className="block text-xs font-semibold text-slate-600">{t("X 轴指标（横轴）", "X-Axis Indicator")}</label>
            <select
              value={xDataset.slug}
              onChange={(e) => setXSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-900"
            >
              {datasets.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {locale === "zh" ? `${d.name_zh} (${d.unit_zh})` : `${d.name_en} (${d.unit_en})`}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setXSlug(yDataset.slug);
                setYSlug(xDataset.slug);
              }}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-700"
              title={t("交换 X / Y 轴", "Swap axes")}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="block text-xs font-semibold text-slate-600">{t("Y 轴指标（纵轴）", "Y-Axis Indicator")}</label>
            <select
              value={yDataset.slug}
              onChange={(e) => setYSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-900"
            >
              {datasets.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {locale === "zh" ? `${d.name_zh} (${d.unit_zh})` : `${d.name_en} (${d.unit_en})`}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-semibold text-slate-600">{t("共同年度", "Common Year")}</label>
            <select
              value={effectiveYear}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold tabular-nums text-slate-900"
            >
              {commonYears.map((y) => (
                <option key={y} value={y}>
                  {y}{locale === "zh" ? "年" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex justify-end">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-xs font-semibold text-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? t("已复制", "Copied") : t("分享", "Share")}</span>
            </button>
          </div>
        </div>

        <ScatterCompareChart xDataset={xDataset} yDataset={yDataset} regions={regions} year={effectiveYear} />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/indicators/${xDataset.slug}`} className="text-blue-700 hover:underline">
              {t(`查看 ${xDataset.short_zh} 完整数据 →`, `Open ${xDataset.short_en} →`)}
            </Link>
            <Link href={`/indicators/${yDataset.slug}`} className="text-blue-700 hover:underline">
              {t(`查看 ${yDataset.short_zh} 完整数据 →`, `Open ${yDataset.short_en} →`)}
            </Link>
          </div>
          <span>{t("所有点位均来自国家统计局真实观测值", "All points derived strictly from verified NBS observations")}</span>
        </div>
      </section>

      {/* V1.0 Architecture Roadmap Note (Honest: Planned Module, No Paid Key Enabled) */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {t("V1.0 规划模块（尚未启用外部付费 AI API）", "V1.0 ROADMAP MODULE (NOT YET ENABLED)")}
        </div>
        <h2 className="font-editorial text-xl font-bold text-slate-900">
          {t("AI 研究助手（基于 DuckDB 校验数据层的可溯源问答）", "Grounded AI Research Assistant (Architecture Reserved)")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          {t(
            "底层数据管线已同步输出规范化 DuckDB 仓库（fact_observation / dim_indicator / dim_region）与 Parquet 文件。未来 V1.0 接入受控大模型接口后，AI 助手将严格通过结构化 SQL 查询校验数据层返回数值、计算公式、出处年份与图表，杜绝模型幻觉编造数字，并严格区分事实、派生计算、相关性与解释性推论。",
            "Our ETL pipeline already outputs normalized DuckDB and Parquet tables. In V1.0, an optional Research Assistant module will query only the verified warehouse via structured SQL, citing exact years, formulas, and NBS provenance while separating facts from correlation."
          )}
        </p>
      </section>
    </div>
  );
}
