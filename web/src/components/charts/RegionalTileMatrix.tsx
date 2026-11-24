"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Info, Pause, Play, ShieldAlert, ExternalLink } from "lucide-react";
import type { IndicatorDataset, RegionsData } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import {
  formatNumber,
  formatSignedPct,
  formatValueWithUnit,
  getColorPalette,
  interpolateColor,
  isDarkHex,
} from "@/lib/format";

/**
 * Pluggable interface reserved for future officially reviewed China choropleth map integration
 * once a dedicated Ministry of Natural Resources (MNR) map review number (审图号 GS-XXXX)
 * is obtained for interactive thematic map publication under 《地图管理条例》.
 */
export interface ChoroplethMapAdapterProps {
  dataset: IndicatorDataset;
  regions: RegionsData;
  selectedYear: number;
  selectedProvinces: string[];
  onToggleProvince: (code: string) => void;
}

interface Props extends ChoroplethMapAdapterProps {
  onYearChange: (year: number) => void;
  compact?: boolean;
}

export function RegionalTileMatrix({
  dataset,
  regions,
  selectedYear,
  selectedProvinces,
  onToggleProvince,
  onYearChange,
  compact = false,
}: Props) {
  const { locale, t } = useLocale();
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const palette = getColorPalette(dataset.color_scheme);
  const years = dataset.available_years;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      const idx = years.indexOf(selectedYear);
      if (idx === -1 || idx >= years.length - 1) {
        onYearChange(years[0]);
      } else {
        onYearChange(years[idx + 1]);
      }
    }, 950);
    return () => clearInterval(timer);
  }, [isPlaying, selectedYear, years, onYearChange]);

  const { yearMap, natObs, minVal, maxVal, reportingCount, top5, bottom5 } = useMemo(() => {
    const observations = dataset.observations;
    const yMap = new Map<string, IndicatorDataset["observations"][number]>();
    let nat: IndicatorDataset["observations"][number] | null = null;
    const vals: number[] = [];

    for (const o of observations) {
      if (o.year !== selectedYear) continue;
      if (o.is_national) {
        nat = o;
      } else {
        yMap.set(o.region_code, o);
        if (o.value !== null) vals.push(o.value);
      }
    }

    const sorted = Array.from(yMap.values())
      .filter((o) => o.value !== null)
      .sort((a, b) => (b.value! - a.value!) || a.region_code.localeCompare(b.region_code));

    return {
      yearMap: yMap,
      natObs: nat,
      minVal: vals.length ? Math.min(...vals) : 0,
      maxVal: vals.length ? Math.max(...vals) : 1,
      reportingCount: vals.length,
      top5: sorted.slice(0, 5),
      bottom5: sorted.slice(-5).reverse(),
    };
  }, [dataset.observations, selectedYear]);

  const provinceMetaMap = useMemo(() => {
    const m = new Map(regions.provinces.map((p) => [p.code, p]));
    return m;
  }, [regions.provinces]);

  const activeHover = hoveredCode ? yearMap.get(hoveredCode) ?? null : null;
  const activeHoverMeta = hoveredCode ? provinceMetaMap.get(hoveredCode) ?? null : null;

  const hoverRatio =
    activeHover && activeHover.value !== null && maxVal > minVal
      ? Math.max(0, Math.min(100, ((activeHover.value - minVal) / (maxVal - minVal)) * 100))
      : null;
  const natRatio =
    natObs && natObs.value !== null && maxVal > minVal
      ? Math.max(0, Math.min(100, ((natObs.value - minVal) / (maxVal - minVal)) * 100))
      : null;

  return (
    <div className="space-y-4">
      {/* Year & Play Controls + Color Scale */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
            aria-label={isPlaying ? t("暂停年份播放", "Pause timeline") : t("播放年份演变", "Play timeline")}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? t("暂停", "Pause") : t("演变播放", "Play")}</span>
          </button>

          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
            <span className="font-medium">{t("统计年度", "Year")}:</span>
            <select
              value={selectedYear}
              onChange={(e) => {
                setIsPlaying(false);
                onYearChange(Number(e.target.value));
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-900 tabular-nums focus:outline-none focus:border-blue-500"
              data-testid="year-selector"
            >
              {[...years].reverse().map((yr) => (
                <option key={yr} value={yr}>
                  {yr}{locale === "zh" ? "年" : ""}
                </option>
              ))}
            </select>
          </label>

          <input
            type="range"
            min={0}
            max={Math.max(0, years.length - 1)}
            value={Math.max(0, years.indexOf(selectedYear))}
            onChange={(e) => {
              setIsPlaying(false);
              onYearChange(years[Number(e.target.value)]);
            }}
            className="w-28 sm:w-40 accent-blue-700 cursor-pointer"
            aria-label={t("年份滑块", "Year scrubber")}
          />

          <span className="text-xs text-slate-500 tabular-nums">
            {t(`覆盖 ${reportingCount}/31 省区市`, `${reportingCount}/31 provinces`)}
          </span>
        </div>

        {/* Continuous/Stepped Legend with National Tick & Live Hover Pointer */}
        <div className="w-full lg:w-72">
          <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums mb-1">
            <span>{formatValueWithUnit(minVal, dataset.unit_zh, dataset.unit_en, dataset.decimals, locale)}</span>
            {natObs?.value !== null && natObs?.value !== undefined && (
              <span className="font-medium text-slate-700">
                {t("全国", "China")}: {formatNumber(natObs.value, dataset.decimals, locale)}
              </span>
            )}
            <span>{formatValueWithUnit(maxVal, dataset.unit_zh, dataset.unit_en, dataset.decimals, locale)}</span>
          </div>
          <div className="relative h-3 rounded-full overflow-visible flex border border-slate-200/80">
            {palette.map((hex, i) => (
              <div
                key={hex}
                style={{ backgroundColor: hex }}
                className={`flex-1 h-full ${i === 0 ? "rounded-l-full" : ""} ${i === palette.length - 1 ? "rounded-r-full" : ""}`}
              />
            ))}
            {natRatio !== null && (
              <div
                style={{ left: `${natRatio}%` }}
                className="absolute -top-1 -bottom-1 w-0.5 bg-slate-900/80 pointer-events-none"
                title={t("全国基准线", "National benchmark")}
              />
            )}
            {hoverRatio !== null && (
              <div
                style={{ left: `${hoverRatio}%` }}
                className="absolute -top-2.5 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-900 pointer-events-none transition-all duration-100"
              />
            )}
          </div>
        </div>
      </div>

      {/* Live Focus Info Strip (always stable height — prevents layout shift on hover!) */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs min-h-[44px]">
        {activeHover && activeHoverMeta ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm text-slate-900">
                {locale === "zh" ? activeHoverMeta.name_zh : activeHoverMeta.name_en}
              </span>
              {activeHover.rank !== null && (
                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[11px] tabular-nums">
                  #{activeHover.rank} / {reportingCount}
                </span>
              )}
              <span className="font-bold text-sm text-blue-700 tabular-nums">
                {formatValueWithUnit(
                  activeHover.value,
                  dataset.unit_zh,
                  dataset.unit_en,
                  dataset.decimals,
                  locale
                )}
              </span>
              {activeHover.yoy_comparable && activeHover.yoy_pct !== null && (
                <span className="text-slate-600 tabular-nums">
                  ({t("同比", "YoY")} {formatSignedPct(activeHover.yoy_pct)})
                </span>
              )}
              {natObs?.value !== null && natObs?.value !== undefined && activeHover.value !== null && natObs.value !== 0 && dataset.slug !== "natural-growth-rate" && (
                <span className="text-slate-500 hidden sm:inline">
                  · {activeHover.value >= natObs.value
                    ? t(`高于全国基准 ${(((activeHover.value - natObs.value) / Math.abs(natObs.value)) * 100).toFixed(1)}%`, `${(((activeHover.value - natObs.value) / Math.abs(natObs.value)) * 100).toFixed(1)}% above national`)
                    : t(`低于全国基准 ${(((natObs.value - activeHover.value) / Math.abs(natObs.value)) * 100).toFixed(1)}%`, `${(((natObs.value - activeHover.value) / Math.abs(natObs.value)) * 100).toFixed(1)}% below national`)}
                </span>
              )}
            </div>
            <span className="text-slate-400">
              {t("点击卡片加入趋势对比", "Click tile to toggle trend comparison")}
            </span>
          </>
        ) : (
          <div className="flex items-center justify-between w-full gap-2 text-slate-500">
            <span>
              {t(
                `悬停或点击任意省份色块查看 ${selectedYear} 年详情并同步加入历史趋势对比；支持键盘与移动端触控选择。`,
                `Hover or tap any provincial tile to inspect ${selectedYear} metrics and toggle it in the historical trend chart.`
              )}
            </span>
            <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
              {t("已选对比", "Selected")}: {selectedProvinces.length}
            </span>
          </div>
        )}
      </div>

      {/* Main Layout: 7-Region Equal-Area Matrix + Companion Top/Bottom Panel */}
      <div className={`grid grid-cols-1 ${compact ? "" : "xl:grid-cols-12"} gap-5`}>
        <div className={compact ? "" : "xl:col-span-9"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {regions.region_groups.map((group) => {
              const groupProvs = group.provinces
                .map((code) => ({
                  meta: provinceMetaMap.get(code)!,
                  obs: yearMap.get(code),
                }))
                .filter((x) => x.meta);

              const validGroupVals = groupProvs
                .map((x) => x.obs?.value)
                .filter((v): v is number => v !== null && v !== undefined);
              const groupAvg = validGroupVals.length
                ? validGroupVals.reduce((a, b) => a + b, 0) / validGroupVals.length
                : null;

              return (
                <div
                  key={group.id}
                  className="rounded-xl border border-slate-200/90 bg-white p-3 flex flex-col justify-between"
                >
                  <div className="flex items-baseline justify-between mb-2.5 pb-1.5 border-b border-slate-100">
                    <h4 className="text-xs font-bold tracking-wide text-slate-800">
                      {locale === "zh" ? group.full_zh : group.name_en}
                    </h4>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {groupAvg !== null
                        ? `${t("均值", "Avg")} ${formatNumber(groupAvg, dataset.decimals, locale)}`
                        : t("暂无", "N/A")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5">
                    {groupProvs.map(({ meta, obs }) => {
                      const val = obs?.value ?? null;
                      const bgHex = interpolateColor(val, minVal, maxVal, palette);
                      const dark = val !== null && isDarkHex(bgHex);
                      const isSelected = selectedProvinces.includes(meta.code);

                      return (
                        <button
                          key={meta.code}
                          type="button"
                          onMouseEnter={() => setHoveredCode(meta.code)}
                          onFocus={() => setHoveredCode(meta.code)}
                          onMouseLeave={() => setHoveredCode(null)}
                          onClick={() => onToggleProvince(meta.code)}
                          style={{ backgroundColor: bgHex }}
                          data-testid={`province-tile-${meta.code}`}
                          className={`group relative rounded-lg px-2.5 py-2 text-left transition-all border ${
                            isSelected
                              ? "ring-2 ring-slate-900 border-slate-900 shadow-xs"
                              : "border-black/5 hover:border-slate-900/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-xs font-semibold truncate ${
                                val === null
                                  ? "text-slate-500"
                                  : dark
                                  ? "text-white"
                                  : "text-slate-900"
                              }`}
                            >
                              {locale === "zh" ? meta.short_zh : meta.name_en}
                            </span>
                            {obs?.rank !== null && obs?.rank !== undefined && (
                              <span
                                className={`text-[10px] font-mono tabular-nums ${
                                  dark ? "text-white/80" : "text-slate-600/80"
                                }`}
                              >
                                #{obs.rank}
                              </span>
                            )}
                          </div>
                          <div
                            className={`mt-0.5 text-xs font-bold tabular-nums truncate ${
                              val === null
                                ? "text-slate-400 font-normal"
                                : dark
                                ? "text-white"
                                : "text-slate-900"
                            }`}
                          >
                            {val === null
                              ? t("缺失", "N/A")
                              : formatNumber(val, dataset.decimals, locale)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Companion Top-5 / Bottom-5 Summary */}
        {!compact && (
          <div className="xl:col-span-3 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {t(`${selectedYear}年 排名前五`, `Top 5 (${selectedYear})`)}
              </div>
              <ul className="space-y-1.5">
                {top5.map((o) => {
                  const pm = provinceMetaMap.get(o.region_code);
                  return (
                    <li key={o.region_code} className="flex items-center justify-between text-xs gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleProvince(o.region_code)}
                        className="flex items-center gap-1.5 text-slate-800 hover:text-blue-700 font-medium truncate"
                      >
                        <span className="w-4 font-mono text-slate-400">#{o.rank}</span>
                        <span>{locale === "zh" ? pm?.short_zh : pm?.name_en}</span>
                      </button>
                      <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                        {formatNumber(o.value, dataset.decimals, locale)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {t(`${selectedYear}年 末尾五省`, `Lowest 5 (${selectedYear})`)}
              </div>
              <ul className="space-y-1.5">
                {bottom5.map((o) => {
                  const pm = provinceMetaMap.get(o.region_code);
                  return (
                    <li key={o.region_code} className="flex items-center justify-between text-xs gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleProvince(o.region_code)}
                        className="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 font-medium truncate"
                      >
                        <span className="w-5 font-mono text-slate-400">#{o.rank}</span>
                        <span>{locale === "zh" ? pm?.short_zh : pm?.name_en}</span>
                      </button>
                      <span className="font-medium text-slate-700 tabular-nums shrink-0">
                        {formatNumber(o.value, dataset.decimals, locale)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {selectedProvinces.length > 0 && (
              <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-3 text-xs space-y-1.5">
                <div className="font-semibold text-blue-900">
                  {t("查看已选省份全维度档案", "Open Province Dossier")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProvinces.slice(0, 4).map((code) => {
                    const pm = provinceMetaMap.get(code);
                    if (!pm) return null;
                    return (
                      <Link
                        key={code}
                        href={`/provinces/${code}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-blue-200 text-blue-700 hover:bg-blue-700 hover:text-white transition-colors font-medium"
                      >
                        <span>{locale === "zh" ? pm.short_zh : pm.name_en}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explicit Map Compliance & Geographic Scope Notice */}
      {!compact && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-600 space-y-1.5 leading-relaxed">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">
                {t("中国地图合规说明：", "Map Compliance Disclosure: ")}
              </span>
              {t(
                "依据《地图管理条例》及《地图审核管理规定》，在互联网公开发布带交互填色的中国行政区划专题地图需履行自然资源部地图审核并取得专用审图号。在取得正式审图号前，本平台不采用未经审核的第三方 GeoJSON 边界底图，而是以「七大地理大区等面积省级矩阵图」作为正式空间对比视图（系统已预留合规地图适配接口）。",
                "Under China's Map Management Regulations, publishing interactive thematic choropleth maps of China's administrative borders requires official review and an MNR approval number (审图号). Rather than deploying unreviewed third-party GeoJSON borders, V0.1 delivers this equal-area 7-region spatial matrix with a pluggable adapter reserved for future approved base maps."
              )}{" "}
              <Link href="/methodology#map-compliance" className="text-blue-700 hover:underline font-medium">
                {t("阅读合规说明 →", "Read compliance notes →")}
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-2 text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>{locale === "zh" ? regions.coverage_disclaimer.zh : regions.coverage_disclaimer.en}</span>
          </div>
        </div>
      )}
    </div>
  );
}
