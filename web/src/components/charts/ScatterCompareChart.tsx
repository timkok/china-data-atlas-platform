"use client";

import React, { useMemo } from "react";
import type * as echarts from "echarts";
import type { IndicatorDataset, RegionsData } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { EChartBox } from "./EChartBox";

interface Props {
  xDataset: IndicatorDataset;
  yDataset: IndicatorDataset;
  regions: RegionsData;
  year: number;
}

const GROUP_COLORS: Record<string, string> = {
  north: "#2563eb",
  northeast: "#0891b2",
  east: "#d97706",
  central: "#059669",
  south: "#dc2626",
  southwest: "#7c3aed",
  northwest: "#64748b",
};

export function ScatterCompareChart({ xDataset, yDataset, regions, year }: Props) {
  const { locale, t } = useLocale();

  const { points, pearsonR, xMed, yMed } = useMemo(() => {
    const xMap = new Map<string, number>();
    const yMap = new Map<string, number>();
    for (const o of xDataset.observations) {
      if (!o.is_national && o.year === year && o.value !== null) xMap.set(o.region_code, o.value);
    }
    for (const o of yDataset.observations) {
      if (!o.is_national && o.year === year && o.value !== null) yMap.set(o.region_code, o.value);
    }

    const pts = regions.provinces
      .map((p) => {
        const xv = xMap.get(p.code);
        const yv = yMap.get(p.code);
        if (xv === undefined || yv === undefined) return null;
        return { province: p, x: xv, y: yv };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);

    // Pearson correlation
    let r: number | null = null;
    if (pts.length >= 5) {
      const mx = pts.reduce((a, b) => a + b.x, 0) / pts.length;
      const my = pts.reduce((a, b) => a + b.y, 0) / pts.length;
      let num = 0;
      let dx = 0;
      let dy = 0;
      for (const p of pts) {
        num += (p.x - mx) * (p.y - my);
        dx += (p.x - mx) ** 2;
        dy += (p.y - my) ** 2;
      }
      if (dx > 0 && dy > 0) r = num / Math.sqrt(dx * dy);
    }

    const xs = pts.map((p) => p.x).sort((a, b) => a - b);
    const ys = pts.map((p) => p.y).sort((a, b) => a - b);
    const xm = xs.length ? xs[Math.floor(xs.length / 2)] : 0;
    const ym = ys.length ? ys[Math.floor(ys.length / 2)] : 0;

    return { points: pts, pearsonR: r, xMed: xm, yMed: ym };
  }, [xDataset, yDataset, regions.provinces, year]);

  const option = useMemo<echarts.EChartsOption>(() => {
    const xLabel = `${locale === "zh" ? xDataset.short_zh : xDataset.short_en} (${locale === "zh" ? xDataset.unit_zh : xDataset.unit_en})`;
    const yLabel = `${locale === "zh" ? yDataset.short_zh : yDataset.short_en} (${locale === "zh" ? yDataset.unit_zh : yDataset.unit_en})`;

    const series: echarts.SeriesOption[] = regions.region_groups.map((g, idx) => ({
      name: locale === "zh" ? g.name_zh : g.name_en,
      type: "scatter",
      symbolSize: 13,
      itemStyle: {
        color: GROUP_COLORS[g.id] ?? "#1d4ed8",
        borderColor: "#ffffff",
        borderWidth: 1.5,
      },
      label: {
        show: true,
        position: "top",
        fontSize: 10.5,
        color: "#334155",
        formatter: (params: unknown) => {
          const p = params as { data: { shortName: string } };
          return p.data.shortName;
        },
      },
      labelLayout: {
        hideOverlap: true,
        moveOverlap: "shiftY",
      },
      data: points
        .filter((pt) => pt.province.region_group === g.id)
        .map((pt) => ({
          value: [pt.x, pt.y],
          shortName: locale === "zh" ? pt.province.short_zh : pt.province.name_en,
          fullName: locale === "zh" ? pt.province.name_zh : pt.province.name_en,
        })),
      markLine:
        idx === 0 && points.length > 0
          ? {
              silent: true,
              symbol: ["none", "none"],
              lineStyle: { color: "#cbd5e1", type: "dashed", width: 1 },
              label: { show: false },
              data: [{ xAxis: xMed }, { yAxis: yMed }],
            }
          : undefined,
    }));

    return {
      animationDuration: 400,
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255,255,255,0.97)",
        borderColor: "#e2e8f0",
        textStyle: { color: "#0f172a", fontSize: 12 },
        formatter: (params: unknown) => {
          const p = params as { data: { fullName: string; value: [number, number] }; seriesName: string };
          return `<div>
            <b>${p.data.fullName}</b> <span style="color:#64748b">(${p.seriesName}, ${year})</span><br/>
            ${xLabel}: <b>${formatNumber(p.data.value[0], xDataset.decimals, locale)}</b><br/>
            ${yLabel}: <b>${formatNumber(p.data.value[1], yDataset.decimals, locale)}</b>
          </div>`;
        },
      },
      legend: { bottom: 0, textStyle: { color: "#475569", fontSize: 11 } },
      grid: { top: 32, left: 18, right: 24, bottom: 54, containLabel: true },
      xAxis: {
        type: "value",
        name: xLabel,
        nameLocation: "middle",
        nameGap: 28,
        scale: true,
        splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
      },
      yAxis: {
        type: "value",
        name: yLabel,
        scale: true,
        splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
      },
      series,
    };
  }, [points, regions.region_groups, xDataset, yDataset, locale, year, xMed, yMed]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            {t("有效配对省份", "Matched provinces")}: <b className="tabular-nums">{points.length} / 31</b>
          </span>
          {pearsonR !== null && (
            <span>
              {t("省际横截面 Pearson 相关系数 r", "Cross-sectional Pearson r")}:{" "}
              <b className="font-mono text-blue-700">{pearsonR.toFixed(3)}</b>
            </span>
          )}
        </div>
        <span className="text-slate-500">
          {t("统计提示：横截面相关性不等于因果关系；虚线为省级中位数参考线。", "Statistical note: Cross-sectional correlation does not imply causation; dashed lines mark provincial medians.")}
        </span>
      </div>

      {points.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-14 text-center text-sm text-slate-500">
          {t(`${year}年所选两个指标无共同有效分省数据，请切换其他年份。`, `No overlapping provincial observations in ${year}. Please choose another year.`)}
        </div>
      ) : (
        <EChartBox
          option={option}
          height={440}
          exportFilename={`china-data-atlas-compare-${xDataset.slug}-vs-${yDataset.slug}-${year}`}
        />
      )}
    </div>
  );
}
