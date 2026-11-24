"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Search, X } from "lucide-react";
import type { CatalogData, RegionsData } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { formatValueWithUnit } from "@/lib/format";

interface Props {
  open: boolean;
  onClose: () => void;
  catalog: CatalogData;
  regions: RegionsData;
  initialQuery?: string;
}

const CAT_DOT: Record<string, string> = {
  demographics: "bg-teal-600",
  economy: "bg-amber-600",
  education: "bg-indigo-600",
  healthcare: "bg-red-700",
};

export function GlobalSearchModal({ open, onClose, catalog, regions, initialQuery = "" }: Props) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      if (initialQuery) setQuery(initialQuery);
      inputRef.current?.focus();
    }, 20);
    return () => window.clearTimeout(timer);
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const { matchedIndicators, matchedProvinces } = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        matchedIndicators: catalog.indicators.slice(0, 6),
        matchedProvinces: regions.provinces.slice(0, 6),
      };
    }
    const inds = catalog.indicators.filter((ind) => {
      const hay = [
        ind.id,
        ind.slug,
        ind.name_zh,
        ind.name_en,
        ind.short_zh,
        ind.short_en,
        ind.definition_zh,
        ind.definition_en,
        ...ind.aliases,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    const provs = regions.provinces.filter((p) => {
      const hay = [p.code, p.name_zh, p.short_zh, p.name_en, p.pinyin].join(" ").toLowerCase();
      return hay.includes(q);
    });
    return { matchedIndicators: inds, matchedProvinces: provs };
  }, [query, catalog.indicators, regions.provinces]);

  if (!open) return null;

  const quickTags = locale === "zh"
    ? ["GDP", "常住人口", "老龄化", "城镇化率", "可支配收入", "广东", "上海", "医师"]
    : ["GDP", "Population", "Aging", "Urbanization", "Income", "Guangdong", "Shanghai", "Physicians"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/45 backdrop-blur-xs px-4 pt-16 sm:pt-24"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("全站数据搜索", "Search datasets and provinces")}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              "搜索指标、缩写或省份，如 GDP、出生率、老龄化、浙江、广东…",
              "Search indicators, acronyms, or provinces, e.g. GDP, birth rate, Guangdong…"
            )}
            className="w-full text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
            data-testid="global-search-input"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              aria-label={t("清空搜索", "Clear search")}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-mono text-slate-500 border border-slate-200 rounded-md hover:bg-slate-50"
          >
            ESC
          </button>
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 mr-1">
            {t("快捷检索", "Try")}:
          </span>
          {quickTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setQuery(tag)}
              className="px-2 py-0.5 text-xs rounded-full bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-700 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
          {/* Indicators section */}
          <div className="p-3">
            <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {t(`统计指标 (${matchedIndicators.length})`, `Indicators (${matchedIndicators.length})`)}
            </div>
            {matchedIndicators.length === 0 ? (
              <p className="px-2 py-3 text-sm text-slate-500">
                {t(`未找到匹配「${query}」的统计指标`, `No indicators matched "${query}"`)}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {matchedIndicators.map((ind) => (
                  <li key={ind.slug}>
                    <Link
                      href={`/indicators/${ind.slug}`}
                      onClick={onClose}
                      className="flex items-start justify-between gap-3 px-2.5 py-2.5 rounded-lg hover:bg-blue-50/70 group transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${CAT_DOT[ind.category] ?? "bg-slate-400"}`} />
                          <span className="font-medium text-sm text-slate-900 group-hover:text-blue-700 truncate">
                            {locale === "zh" ? ind.name_zh : ind.name_en}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                            {ind.year_min}–{ind.year_max}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 pl-4 line-clamp-1">
                          {locale === "zh" ? ind.headline_insight_zh : ind.headline_insight_en}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {ind.latest_national_value !== null && (
                          <div className="text-xs font-semibold text-slate-700 tabular-nums">
                            {formatValueWithUnit(
                              ind.latest_national_value,
                              ind.unit_zh,
                              ind.unit_en,
                              ind.decimals,
                              locale
                            )}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400">{ind.latest_complete_year}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Provinces section */}
          {matchedProvinces.length > 0 && (
            <div className="p-3">
              <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {t(`省级档案 (${matchedProvinces.length})`, `Province Dossiers (${matchedProvinces.length})`)}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 px-1">
                {matchedProvinces.slice(0, 9).map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/provinces/${p.code}`);
                    }}
                    className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {locale === "zh" ? p.name_zh : p.name_en}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
