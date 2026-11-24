"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { CategoryMeta, ProvinceMeta, RegionGroup } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { formatDataStatus, formatSignedDiff, formatSignedPct, formatValueWithUnit } from "@/lib/format";

export interface ProvinceMetricCard {
  slug: string;
  category: string;
  name_zh: string;
  name_en: string;
  unit_zh: string;
  unit_en: string;
  decimals: number;
  latest_year: number | null;
  value: number | null;
  national_value: number | null;
  rank: number | null;
  yoy_pct: number | null;
  yoy_diff: number | null;
  yoy_comparable: boolean;
  data_status: "official" | "preliminary" | "revised" | "unknown";
}

interface Props {
  province: ProvinceMeta;
  regionGroup: RegionGroup;
  allProvinces: ProvinceMeta[];
  categories: CategoryMeta[];
  metrics: ProvinceMetricCard[];
}

export function ProvinceDossierClient({
  province,
  regionGroup,
  allProvinces,
  categories,
  metrics,
}: Props) {
  const { locale, t } = useLocale();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <header className="space-y-3 pb-6 border-b border-slate-200">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-700">{t("首页", "Home")}</Link>
          <span>/</span>
          <span>{t("省级档案", "Province Dossiers")}</span>
          <span>/</span>
          <span className="font-mono text-slate-400">{province.code}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{locale === "zh" ? regionGroup.full_zh : regionGroup.name_en}</span>
              <span className="font-mono text-blue-500">· {province.code}</span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-slate-900">
              {locale === "zh" ? `${province.name_zh}统计数据档案` : `${province.name_en} Statistical Profile`}
            </h1>
            <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
              {t(
                `汇总国家统计局发布的${province.name_zh}全部 ${metrics.length} 项核心经济社会指标最新观测值、全国基准对比与31省区市排名。`,
                `All ${metrics.length} official NBS demographic, economic, education, and healthcare indicators for ${province.name_en} with national benchmarks and provincial rankings.`
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Metrics Grouped by Category */}
      <div className="space-y-8">
        {categories.map((cat) => {
          const catMetrics = metrics.filter((m) => m.category === cat.id);
          if (catMetrics.length === 0) return null;
          return (
            <section key={cat.id} className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                <h2 className="font-editorial text-xl font-bold text-slate-900">
                  {locale === "zh" ? cat.name_zh : cat.name_en}
                </h2>
                <Link
                  href={`/categories/${cat.id}`}
                  className="text-xs font-medium text-blue-700 hover:underline"
                >
                  {t("查看本领域全部指标 →", "View topic →")}
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catMetrics.map((m) => (
                  <Link
                    key={m.slug}
                    href={`/indicators/${m.slug}?provinces=${province.code}`}
                    className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-sm transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-slate-600 group-hover:text-blue-700">
                          {locale === "zh" ? m.name_zh : m.name_en}
                        </span>
                        {m.rank !== null && (
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[11px] tabular-nums shrink-0">
                            #{m.rank} / 31
                          </span>
                        )}
                      </div>

                      <div className="text-2xl font-bold text-slate-900 tabular-nums">
                        {formatValueWithUnit(m.value, m.unit_zh, m.unit_en, m.decimals, locale)}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                        <span>{m.latest_year}{locale === "zh" ? "年" : ""}</span>
                        <span>·</span>
                        <span>{formatDataStatus(m.data_status, locale)}</span>
                        {m.yoy_comparable && (m.yoy_pct !== null || m.yoy_diff !== null) && (
                          <>
                            <span>·</span>
                            <span className="font-medium text-slate-700">
                              {t("同比", "YoY")}{" "}
                              {m.yoy_pct !== null
                                ? formatSignedPct(m.yoy_pct)
                                : formatSignedDiff(m.yoy_diff, m.unit_zh, m.decimals)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 tabular-nums">
                        {t("同年全国：", "China: ")}
                        <b className="text-slate-700">
                          {formatValueWithUnit(m.national_value, m.unit_zh, m.unit_en, m.decimals, locale)}
                        </b>
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-blue-700 font-medium">
                        {t("趋势", "Trend")}
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Quick Switcher to Other Provinces */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {t("切换其他省级行政区档案", "Switch Province Dossier")}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {allProvinces.map((p) => (
            <Link
              key={p.code}
              href={`/provinces/${p.code}`}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                p.code === province.code
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-700"
              }`}
            >
              {locale === "zh" ? p.short_zh : p.name_en}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
