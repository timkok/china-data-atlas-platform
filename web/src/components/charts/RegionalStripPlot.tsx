"use client";

import React, { useMemo } from "react";
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

export function RegionalStripPlot({
  dataset,
  regions,
  selectedYear,
  selectedProvinces,
  onToggleProvince,
  compact = false,
}: Props) {
  const { locale, t } = useLocale();
  const accent = getAccentHex(dataset.color_scheme);
  const unitLabel = locale === "zh" ? dataset.unit_zh : dataset.unit_en;

  const provinceMap = useMemo(
    () => new Map(regions.provinces.map((p) => [p.code, p])),
    [regions.provinces]
  );

  const { groupStats, scatterPoints, medianPoints, nationalVal } = useMemo(() => {
    let natVal: number | null = null;
    const byGroup = new Map<string, Array<{ code: string; name: string; value: number; rank: number | null }>>();
    for (const g of regions.region_groups) byGroup.set(g.id, []);

    for (const o of dataset.observations) {
      if (o.year !== selectedYear) continue;
      if (o.is_national) {
        natVal = o.value;
        continue;
      }
      if (o.value === null) continue;
      const pm = provinceMap.get(o.region_code);
      if (!pm) continue;
      byGroup.get(pm.region_group)?.push({
        code: o.region_code,
        name: locale === "zh" ? pm.short_zh : pm.name_en,
        value: o.value,
        rank: o.rank,
      });
    }

    const stats = regions.region_groups.map((g) => {
      const arr = [...(byGroup.get(g.id) ?? [])].sort((a, b) => a.value - b.value);
      const vals = arr.map((x) => x.value);
      const mid = vals.length
        ? vals.length % 2 === 1
          ? vals[Math.floor(vals.length / 2)]
          : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2
        : null;
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      return {
        group: g,
        items: arr,
        count: vals.length,
        median: mid,
        mean: avg,
        min: vals.length ? vals[0] : null,
        max: vals.length ? vals[vals.length - 1] : null,
      };
    });

    // Sort groups by median descending for readability
    const ordered = [...stats].sort((a, b) => (b.median ?? -1e12) - (a.median ?? -1e12));

    const pts: Array<{ value: [number, string]; name: string; code: string; rank: number | null; itemStyle: object }> = [];
    const meds: Array<{ value: [number, string]; name: string }> = [];

    for (const s of ordered) {
      const gLabel = locale === "zh" ? s.group.name_zh : s.group.name_en;
      for (const item of s.items) {
        const isSel = selectedProvinces.includes(item.code);
        pts.push({
          value: [item.value, gLabel],
          name: item.name,
          code: item.code,
          rank: item.rank,
          itemStyle: {
            color: isSel ? "#0f172a" : accent,
            borderColor: "#ffffff",
            borderWidth: 1.5,
            opacity: isSel ? 1 : 0.85,
          },
        });
      }
      if (s.median !== null) {
        meds.push({
          value: [s.median, gLabel],
          name: `${gLabel} ${locale === "zh" ? "中位数" : "Median"}`,
        });
      }
    }

    return { groupStats: ordered, scatterPoints: pts, medianPoints: meds, nationalVal: natVal };
  }, [dataset.observations, selectedYear, regions.region_groups, provinceMap, locale, selectedProvinces, accent]);

  const showNatLine =
    nationalVal !== null &&
    !dataset.is_additive &&
    dataset.slug !== "gdp" &&
    dataset.slug !== "population" &&
    dataset.slug !== "retail-sales";

  const option = useMemo<echarts.EChartsOption>(() => {
    const yCategories = groupStats.map((s) => (locale === "zh" ? s.group.name_zh : s.group.name_en)).reverse();

    return {
      animationDuration: 350,
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255,255,255,0.97)",
        borderColor: "#e2e8f0",
        textStyle: { color: "#0f172a", fontSize: 12 },
        formatter: (params: unknown) => {
          const p = params as { seriesName: string; name: string; value: [number, string]; data?: { rank?: number | null } };
          const num = formatNumber(p.value[0], dataset.decimals, locale);
          const formatted = unitLabel === "%" || unitLabel === "‰" ? `${num}${unitLabel}` : `${num} ${unitLabel}`;
          const rk = p.data?.rank ? ` (#${p.data.rank})` : "";
          return `<div><b>${p.name}${rk}</b><br/>${p.value[1]} · <b>${formatted}</b></div>`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: "#475569", fontSize: 11 },
      },
      grid: {
        top: 40,
        left: 12,
        right: 26,
        bottom: 42,
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
        data: yCategories,
        axisLine: { lineStyle: { color: "#e2e8f0" } },
        splitLine: { show: true, lineStyle: { color: "#f1f5f9" } },
        axisLabel: { color: "#1e293b", fontSize: 12, fontWeight: 600 },
      },
      series: [
        {
          name: locale === "zh" ? "各省数值" : "Provincial values",
          type: "scatter",
          symbolSize: 12,
          data: scatterPoints,
          z: 4,
          markLine: showNatLine
            ? {
                symbol: ["none", "none"],
                lineStyle: { color: "#0f172a", type: "dashed", width: 1.5 },
                label: {
                  formatter: `${locale === "zh" ? "全国" : "China"} ${formatNumber(nationalVal!, dataset.decimals, locale)}`,
                  position: "end",
                  distance: 6,
                  color: "#ffffff",
                  backgroundColor: "rgba(15,23,42,0.92)",
                  borderRadius: 4,
                  padding: [3, 7],
                  fontSize: 10.5,
                  fontWeight: 600,
                },
                data: [{ xAxis: nationalVal! }],
              }
            : undefined,
        },
        {
          name: locale === "zh" ? "大区中位数" : "Region median",
          type: "scatter",
          symbol: "rect",
          symbolSize: [4, 22],
          itemStyle: { color: "#0f172a" },
          data: medianPoints,
          z: 6,
        },
      ],
    };
  }, [groupStats, scatterPoints, medianPoints, showNatLine, nationalVal, dataset.decimals, locale, unitLabel]);

  return (
    <div className="space-y-4">
      <EChartBox
        option={option}
        height={compact ? 320 : 350}
        exportFilename={compact ? undefined : `china-data-atlas-${dataset.slug}-regions-${selectedYear}`}
        onPointClick={(params) => {
          const p = params as { data?: { code?: string } };
          if (p?.data?.code) onToggleProvince(p.data.code);
        }}
      />

      {!compact && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2.5 font-semibold">{t("七大地理大区", "Region")}</th>
                <th className="px-3 py-2.5 font-semibold">{t("涵盖省份", "Provinces")}</th>
                <th className="px-3 py-2.5 font-semibold text-right">{t("中位数", "Median")}</th>
                <th className="px-3 py-2.5 font-semibold text-right">{t("算术均值", "Mean")}</th>
                <th className="px-3 py-2.5 font-semibold text-right">{t("区间（最低–最高）", "Range (Min–Max)")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {groupStats.map((s) => (
                <tr key={s.group.id} className="hover:bg-slate-50/70">
                  <td className="px-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                    {locale === "zh" ? s.group.full_zh : s.group.name_en}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">
                    {s.group.provinces
                      .map((c) => {
                        const pm = provinceMap.get(c);
                        return locale === "zh" ? pm?.short_zh : pm?.name_en;
                      })
                      .join(locale === "zh" ? "、" : ", ")}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                    {formatNumber(s.median, dataset.decimals, locale)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums whitespace-nowrap">
                    {formatNumber(s.mean, dataset.decimals, locale)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-500 tabular-nums whitespace-nowrap">
                    {formatNumber(s.min, dataset.decimals, locale)} – {formatNumber(s.max, dataset.decimals, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
