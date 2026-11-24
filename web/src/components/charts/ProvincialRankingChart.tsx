"use client";

import React, { useMemo, useState } from "react";
import type * as echarts from "echarts";
import type { IndicatorDataset, RegionsData } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { formatNumber, getAccentHex } from "@/lib/format";
import { EChartBox } from "./EChartBox";

interface Props {
  dataset: IndicatorDataset;
  regions: RegionsData;
  selectedYear: number;
  selectedProvinces: string[];
  onToggleProvince: (code: string) => void;
  compact?: boolean;
}

export function ProvincialRankingChart({
  dataset,
  regions,
  selectedYear,
  selectedProvinces,
  onToggleProvince,
  compact = false,
}: Props) {
  const { locale, t } = useLocale();
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const provinceMap = useMemo(
    () => new Map(regions.provinces.map((p) => [p.code, p])),
    [regions.provinces]
  );

  const { rankedRows, nationalVal } = useMemo(() => {
    let natVal: number | null = null;
    const rows = [];
    for (const o of dataset.observations) {
      if (o.year !== selectedYear) continue;
      if (o.is_national) {
        natVal = o.value;
        continue;
      }
      if (o.value === null) continue;
      if (regionFilter !== "all" && o.region_group !== regionFilter) continue;
      rows.push(o);
    }
    rows.sort((a, b) => (b.value! - a.value!) || a.region_code.localeCompare(b.region_code));
    return { rankedRows: compact ? rows.slice(0, 12) : rows, nationalVal: natVal };
  }, [dataset.observations, selectedYear, regionFilter, compact]);

  const accent = getAccentHex(dataset.color_scheme);
  const unitLabel = locale === "zh" ? dataset.unit_zh : dataset.unit_en;

  const option = useMemo<echarts.EChartsOption>(() => {
    const reversed = [...rankedRows].reverse();
    const labels = reversed.map((o) => {
      const pm = provinceMap.get(o.region_code);
      const name = locale === "zh" ? pm?.short_zh ?? o.region_name_zh : pm?.name_en ?? o.region_name_en;
      return `#${o.rank ?? "-"} ${name}`;
    });

    const dataPoints = reversed.map((o) => {
      const isSelected = selectedProvinces.includes(o.region_code);
      return {
        value: o.value,
        regionCode: o.region_code,
        rank: o.rank,
        rank1y: o.rank_change_1y,
        rank5y: o.rank_change_5y,
        itemStyle: {
          color: isSelected ? "#0f172a" : accent,
          opacity: selectedProvinces.length > 0 && !isSelected ? 0.55 : 0.9,
          borderRadius: [0, 4, 4, 0],
        },
      };
    });

    return {
      animationDuration: 350,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(255,255,255,0.97)",
        borderColor: "#e2e8f0",
        textStyle: { color: "#0f172a", fontSize: 12 },
        formatter: (params: unknown) => {
          const arr = Array.isArray(params) ? params : [params];
          const p = arr[0] as { name: string; data: { value: number; rank: number | null; rank1y: number | null; rank5y: number | null } };
          if (!p?.data) return "";
          const num = formatNumber(p.data.value, dataset.decimals, locale);
          const formatted = unitLabel === "%" || unitLabel === "‰" ? `${num}${unitLabel}` : `${num} ${unitLabel}`;
          const r5 =
            p.data.rank5y !== null && p.data.rank5y !== undefined
              ? p.data.rank5y > 0
                ? `<span style="color:#059669">↑${p.data.rank5y}</span>`
                : p.data.rank5y < 0
                ? `<span style="color:#dc2626">↓${Math.abs(p.data.rank5y)}</span>`
                : "持平"
              : "—";
          return `<div>
            <div style="font-weight:700;margin-bottom:2px">${p.name} (${selectedYear})</div>
            <div>${locale === "zh" ? "数值" : "Value"}: <b>${formatted}</b></div>
            <div style="color:#64748b;font-size:11px;margin-top:2px">${locale === "zh" ? "较5年前排名变化" : "5-yr rank shift"}: ${r5}</div>
          </div>`;
        },
      },
      grid: {
        top: 40,
        left: 8,
        right: 48,
        bottom: 24,
        containLabel: true,
      },
      xAxis: {
        type: "value",
        name: unitLabel,
        nameTextStyle: { color: "#64748b", fontSize: 11 },
        splitNumber: 4,
        splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
        axisLabel: { color: "#64748b", fontSize: 11, hideOverlap: true },
      },
      yAxis: {
        type: "category",
        data: labels,
        axisLine: { lineStyle: { color: "#e2e8f0" } },
        axisTick: { show: false },
        axisLabel: { color: "#334155", fontSize: 11.5, fontWeight: 500 },
      },
      series: [
        {
          type: "bar",
          data: dataPoints,
          barMaxWidth: 18,
          label: {
            show: true,
            position: "right",
            fontSize: 10.5,
            color: "#475569",
            formatter: (params: unknown) => {
              const p = params as { value: number };
              return formatNumber(p.value, dataset.decimals, locale);
            },
          },
          markLine:
            nationalVal !== null && !dataset.is_additive && dataset.slug !== "gdp" && dataset.slug !== "population" && dataset.slug !== "retail-sales"
              ? {
                  symbol: ["none", "none"],
                  lineStyle: { color: "#0f172a", type: "dashed", width: 1.5 },
                  label: {
                    formatter: `${locale === "zh" ? "全国" : "China"} ${formatNumber(nationalVal, dataset.decimals, locale)}`,
                    position: "end",
                    distance: 6,
                    color: "#ffffff",
                    backgroundColor: "rgba(15,23,42,0.92)",
                    borderRadius: 4,
                    padding: [3, 7],
                    fontSize: 10.5,
                    fontWeight: 600,
                  },
                  data: [{ xAxis: nationalVal }],
                }
              : undefined,
        },
      ],
    };
  }, [rankedRows, provinceMap, selectedProvinces, accent, dataset, locale, unitLabel, nationalVal, selectedYear]);

  const chartHeight = compact ? 360 : Math.max(280, rankedRows.length * 25 + 64);

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("按地理大区筛选", "Filter by geographic region")}>
            <button
              type="button"
              onClick={() => setRegionFilter("all")}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                regionFilter === "all"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {t("全部 31 省", "All 31")}
            </button>
            {regions.region_groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setRegionFilter(g.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  regionFilter === g.id
                    ? "bg-blue-700 text-white border-blue-700"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
                }`}
              >
                {locale === "zh" ? g.name_zh : g.name_en}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400">
            {t("点击任意条形可高亮并同步至趋势图", "Click any bar to highlight across charts")}
          </span>
        </div>
      )}

      {rankedRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-sm text-slate-500">
          {t(`${selectedYear}年当前筛选区域暂无官方发布数据`, `No official data for ${selectedYear} in this region filter`)}
        </div>
      ) : (
        <EChartBox
          option={option}
          height={chartHeight}
          exportFilename={compact ? undefined : `china-data-atlas-${dataset.slug}-ranking-${selectedYear}`}
          onPointClick={(params) => {
            const p = params as { data?: { regionCode?: string } };
            if (p?.data?.regionCode) onToggleProvince(p.data.regionCode);
          }}
        />
      )}
    </div>
  );
}
