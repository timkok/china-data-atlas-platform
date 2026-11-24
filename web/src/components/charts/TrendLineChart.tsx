"use client";

import React, { useMemo, useState } from "react";
import type * as echarts from "echarts";
import { Plus, X } from "lucide-react";
import type { IndicatorDataset, RegionsData } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { EChartBox } from "./EChartBox";

interface Props {
  dataset: IndicatorDataset;
  regions: RegionsData;
  selectedProvinces: string[];
  onToggleProvince: (code: string) => void;
  onSetProvinces: (codes: string[]) => void;
  height?: number;
  compact?: boolean;
}

const SERIES_COLORS = [
  "#1d4ed8", // cobalt
  "#d97706", // amber
  "#0f766e", // teal
  "#b91c1c", // crimson
  "#6d28d9", // violet
  "#059669", // emerald
  "#db2777", // rose
];

export function TrendLineChart({
  dataset,
  regions,
  selectedProvinces,
  onToggleProvince,
  onSetProvinces,
  height = 380,
  compact = false,
}: Props) {
  const { locale, t } = useLocale();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showNational, setShowNational] = useState(true);

  const provinceMap = useMemo(
    () => new Map(regions.provinces.map((p) => [p.code, p])),
    [regions.provinces]
  );

  const allYears = useMemo(() => {
    const arr: number[] = [];
    for (let y = dataset.year_min; y <= dataset.year_max; y++) arr.push(y);
    return arr;
  }, [dataset.year_min, dataset.year_max]);

  const obsIndex = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const o of dataset.observations) {
      map.set(`${o.region_code}_${o.year}`, o.value);
    }
    return map;
  }, [dataset.observations]);

  const option = useMemo<echarts.EChartsOption>(() => {
    const series: echarts.SeriesOption[] = [];

    const breakMarkLines = dataset.statistical_breaks.map((b, idx) => ({
      xAxis: String(b.year),
      name: locale === "zh" ? b.label_zh : b.label_en,
      lineStyle: {
        color: b.breaks_yoy ? "#dc2626" : "#94a3b8",
        type: "dashed" as const,
        width: b.breaks_yoy ? 1.5 : 1,
      },
      label: {
        formatter: `${b.year}`,
        fontSize: 10,
        fontWeight: 600,
        color: b.breaks_yoy ? "#b91c1c" : "#475569",
        backgroundColor: b.breaks_yoy ? "rgba(254,242,242,0.95)" : "rgba(248,250,252,0.95)",
        borderColor: b.breaks_yoy ? "#fca5a5" : "#cbd5e1",
        borderWidth: 1,
        borderRadius: 4,
        padding: [2, 5],
        distance: idx % 2 === 0 ? 4 : 20,
        position: "end" as const,
      },
    }));

    if (showNational) {
      const natData = allYears.map((y) => obsIndex.get(`000000_${y}`) ?? null);
      if (natData.some((v) => v !== null)) {
        series.push({
          name: locale === "zh" ? "全国基准" : "China (National)",
          type: "line",
          data: natData,
          connectNulls: false,
          symbol: "circle",
          symbolSize: 5,
          lineStyle: { width: 2.5, type: "dashed", color: "#0f172a" },
          itemStyle: { color: "#0f172a" },
          z: 5,
          markLine: breakMarkLines.length
            ? {
                symbol: ["none", "none"],
                silent: false,
                data: breakMarkLines,
              }
            : undefined,
        });
      }
    }

    selectedProvinces.forEach((code, idx) => {
      const pm = provinceMap.get(code);
      if (!pm) return;
      const color = SERIES_COLORS[idx % SERIES_COLORS.length];
      series.push({
        name: locale === "zh" ? pm.short_zh : pm.name_en,
        type: "line",
        data: allYears.map((y) => obsIndex.get(`${code}_${y}`) ?? null),
        connectNulls: false, // STRICT: never interpolate missing official observations!
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2.4, color },
        itemStyle: { color },
        emphasis: { focus: "series" },
        markLine:
          !showNational && idx === 0 && breakMarkLines.length
            ? { symbol: ["none", "none"], data: breakMarkLines }
            : undefined,
      });
    });

    const unitLabel = locale === "zh" ? dataset.unit_zh : dataset.unit_en;

    return {
      animationDuration: 450,
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255,255,255,0.97)",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        textStyle: { color: "#0f172a", fontSize: 12 },
        valueFormatter: (val) => {
          if (val === null || val === undefined || val === "-") {
            return locale === "zh" ? "官方未公布" : "No data";
          }
          const num = Number(val).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
            minimumFractionDigits: dataset.decimals,
            maximumFractionDigits: dataset.decimals,
          });
          return unitLabel === "%" || unitLabel === "‰" ? `${num}${unitLabel}` : `${num} ${unitLabel}`;
        },
      },
      legend: {
        bottom: 0,
        type: "scroll",
        textStyle: { color: "#334155", fontSize: 12 },
      },
      grid: {
        top: 52,
        left: 16,
        right: 20,
        bottom: 42,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: allYears.map(String),
        axisLine: { lineStyle: { color: "#cbd5e1" } },
        axisLabel: { color: "#64748b", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        name: unitLabel,
        nameTextStyle: { color: "#64748b", fontSize: 11, padding: [0, 0, 0, 8] },
        splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
        axisLabel: { color: "#64748b", fontSize: 11 },
      },
      series,
    };
  }, [allYears, obsIndex, selectedProvinces, provinceMap, showNational, dataset, locale]);

  const filteredProvinces = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return regions.provinces;
    return regions.provinces.filter((p) =>
      `${p.name_zh} ${p.short_zh} ${p.name_en} ${p.pinyin}`.toLowerCase().includes(q)
    );
  }, [regions.provinces, search]);

  const presets = [
    { label_zh: "粤苏鲁浙", label_en: "GD/JS/SD/ZJ", codes: ["440000", "320000", "370000", "330000"] },
    { label_zh: "京沪津渝", label_en: "Municipalities", codes: ["110000", "310000", "120000", "500000"] },
    { label_zh: "东北三省", label_en: "Northeast", codes: ["210000", "220000", "230000"] },
    { label_zh: "中西部代表", label_en: "Central & West", codes: ["410000", "420000", "510000", "610000"] },
  ];

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Selected chips + Add Province button */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowNational((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                showNational
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              }`}
            >
              <span className="w-2 h-0.5 bg-current inline-block" />
              <span>{t("全国基准", "National")}</span>
            </button>

            {selectedProvinces.map((code, idx) => {
              const pm = provinceMap.get(code);
              if (!pm) return null;
              const color = SERIES_COLORS[idx % SERIES_COLORS.length];
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-800"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span>{locale === "zh" ? pm.short_zh : pm.name_en}</span>
                  <button
                    type="button"
                    onClick={() => onToggleProvince(code)}
                    className="text-slate-400 hover:text-slate-700"
                    aria-label={t(`移除 ${pm.short_zh}`, `Remove ${pm.name_en}`)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            <div className="relative">
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-blue-400 text-blue-700 bg-blue-50/50 hover:bg-blue-50 transition-colors"
                data-testid="add-province-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("添加对比省份", "Compare provinces")}</span>
              </button>

              {pickerOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setPickerOpen(false)} />
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-xl bg-white border border-slate-200 shadow-xl p-3 z-30">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("筛选省份…", "Filter provinces…")}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setPickerOpen(false)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white shrink-0 hover:bg-blue-700"
                      >
                        {t("完成", "Done")}
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto grid grid-cols-2 gap-1">
                      {filteredProvinces.map((p) => {
                        const checked = selectedProvinces.includes(p.code);
                        return (
                          <button
                            key={p.code}
                            type="button"
                            onClick={() => onToggleProvince(p.code)}
                            className={`px-2 py-1.5 rounded-md text-xs text-left transition-colors ${
                              checked
                                ? "bg-blue-700 text-white font-semibold"
                                : "hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            {locale === "zh" ? p.short_zh : p.name_en}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-1">
            {presets.map((pr) => (
              <button
                key={pr.label_zh}
                type="button"
                onClick={() => onSetProvinces(pr.codes)}
                className="px-2 py-1 text-[11px] rounded-md border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-700 bg-slate-50/70 transition-colors"
              >
                {locale === "zh" ? pr.label_zh : pr.label_en}
              </button>
            ))}
          </div>
        </div>
      )}

      <EChartBox
        option={option}
        height={height}
        exportFilename={compact ? undefined : `china-data-atlas-${dataset.slug}-trend`}
      />

      {/* Explicit Break & Gap Disclosures */}
      {!compact && (dataset.statistical_breaks.length > 0 || dataset.missing_provincial_cells > 0) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {dataset.statistical_breaks.map((b) => (
            <div
              key={`${b.year}-${b.label_zh}`}
              className={`inline-flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                b.breaks_yoy
                  ? "bg-red-50/70 border-red-200 text-red-900"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <span className="font-mono font-semibold shrink-0">{b.year}:</span>
              <span>{locale === "zh" ? b.description_zh : b.description_en}</span>
            </div>
          ))}
          {dataset.missing_provincial_cells > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-200/80 bg-amber-50/60 text-amber-900">
              {t(
                "注：折线中断处代表国家统计局未发布该年份分省数据，本平台严格保持断线而不插值连线。",
                "Note: Gaps in lines represent unreleased NBS province-year figures; curves are never interpolated across missing years."
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
