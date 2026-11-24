"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronDown, ChevronUp, Database, Download, ExternalLink, Search, Table2 } from "lucide-react";
import type { IndicatorDataset, RegionsData } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { formatDataStatus, formatNumber, formatSignedPct, getAccentHex } from "@/lib/format";

interface Props {
  dataset: IndicatorDataset;
  regions: RegionsData;
  defaultYear: number;
}

type SortField = "region_code" | "year" | "value" | "yoy_pct" | "rank";

export function DataExplorer({ dataset, regions, defaultYear }: Props) {
  const { locale, t } = useLocale();
  const [yearFilter, setYearFilter] = useState<string>(String(defaultYear));
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [showMissingOnly, setShowMissingOnly] = useState<boolean>(false);
  const [schemaOpen, setSchemaOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 32;

  const groupLabelMap = useMemo(() => {
    const m = new Map<string, { zh: string; en: string }>();
    m.set("national", { zh: "全国", en: "National" });
    for (const g of regions.region_groups) m.set(g.id, { zh: g.name_zh, en: g.name_en });
    return m;
  }, [regions.region_groups]);

  const allYearsDesc = useMemo(() => {
    const yrs: number[] = [];
    for (let y = dataset.year_max; y >= dataset.year_min; y--) yrs.push(y);
    return yrs;
  }, [dataset.year_min, dataset.year_max]);

  const maxAbsInView = useMemo(() => {
    const vals = dataset.observations
      .filter((o) => !o.is_national && o.value !== null && (yearFilter === "all" || o.year === Number(yearFilter)))
      .map((o) => Math.abs(o.value!));
    return vals.length ? Math.max(...vals) : 1;
  }, [dataset.observations, yearFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = dataset.observations.filter((o) => {
      if (yearFilter !== "all" && o.year !== Number(yearFilter)) return false;
      if (groupFilter !== "all" && o.region_group !== groupFilter) return false;
      if (showMissingOnly && o.value !== null) return false;
      if (q) {
        const hay = `${o.region_code} ${o.region_name_zh} ${o.region_name_en} ${o.year}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      // Keep national pinned at top if filtering single year and sorting by rank
      if (sortField === "rank" && yearFilter !== "all") {
        if (a.is_national && !b.is_national) return -1;
        if (!a.is_national && b.is_national) return 1;
      }
      let cmp = 0;
      if (sortField === "region_code") cmp = a.region_code.localeCompare(b.region_code);
      else if (sortField === "year") cmp = a.year - b.year;
      else if (sortField === "value") cmp = (a.value ?? -1e18) - (b.value ?? -1e18);
      else if (sortField === "yoy_pct") cmp = (a.yoy_pct ?? -1e18) - (b.yoy_pct ?? -1e18);
      else if (sortField === "rank") cmp = (a.rank ?? 999) - (b.rank ?? 999);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [dataset.observations, yearFilter, groupFilter, search, sortField, sortAsc, showMissingOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const accent = getAccentHex(dataset.color_scheme);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((v) => !v);
    } else {
      setSortField(field);
      setSortAsc(field === "rank" || field === "region_code");
    }
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("搜索省份或代码…", "Filter province or code…")}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white w-44 sm:w-52 focus:outline-none focus:border-blue-500"
              data-testid="explorer-search-input"
            />
          </div>

          <select
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-blue-500"
            aria-label={t("筛选年份", "Filter by year")}
            data-testid="explorer-year-filter"
          >
            <option value="all">{t(`全部年份 (${dataset.year_min}–${dataset.year_max})`, `All Years (${dataset.year_min}–${dataset.year_max})`)}</option>
            {allYearsDesc.map((y) => (
              <option key={y} value={String(y)}>
                {y}{locale === "zh" ? "年" : ""}
              </option>
            ))}
          </select>

          <select
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-blue-500"
            aria-label={t("筛选地理大区", "Filter by region")}
          >
            <option value="all">{t("全部地区", "All Regions")}</option>
            <option value="national">{t("仅全国基准", "National Only")}</option>
            {regions.region_groups.map((g) => (
              <option key={g.id} value={g.id}>
                {locale === "zh" ? g.full_zh : g.name_en}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none px-2 py-1">
            <input
              type="checkbox"
              checked={showMissingOnly}
              onChange={(e) => {
                setShowMissingOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded border-slate-300 accent-blue-700"
            />
            <span>{t("仅看缺失值", "Missing only")}</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/data/csv/${dataset.slug}.csv`}
            download={`china-data-atlas-${dataset.slug}.csv`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors"
            data-testid="explorer-csv-download"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t("下载完整 CSV", "Download CSV")}</span>
          </a>
          <a
            href={dataset.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-colors"
          >
            <span>{t("官方原始库", "Official NBS")}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs text-left" data-testid="explorer-table">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-3 py-2.5 font-semibold">
                <button type="button" onClick={() => toggleSort("region_code")} className="inline-flex items-center gap-1 hover:text-slate-900">
                  <span>{t("地区（代码）", "Region (Code)")}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-3 py-2.5 font-semibold hidden sm:table-cell">{t("地理大区", "Zone")}</th>
              <th className="px-3 py-2.5 font-semibold">
                <button type="button" onClick={() => toggleSort("year")} className="inline-flex items-center gap-1 hover:text-slate-900">
                  <span>{t("年度", "Year")}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-3 py-2.5 font-semibold text-right">
                <button type="button" onClick={() => toggleSort("value")} className="inline-flex items-center gap-1 hover:text-slate-900">
                  <span>{t(`数值 (${dataset.unit_zh})`, `Value (${dataset.unit_en})`)}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-3 py-2.5 font-semibold hidden md:table-cell w-32">{t("相对分布", "Scale")}</th>
              <th className="px-3 py-2.5 font-semibold text-right">
                <button type="button" onClick={() => toggleSort("yoy_pct")} className="inline-flex items-center gap-1 hover:text-slate-900">
                  <span>{t("同比", "YoY")}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-3 py-2.5 font-semibold text-right">
                <button type="button" onClick={() => toggleSort("rank")} className="inline-flex items-center gap-1 hover:text-slate-900">
                  <span>{t("排名", "Rank")}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-3 py-2.5 font-semibold hidden lg:table-cell text-right">{t("状态", "Status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500" data-testid="explorer-empty-state">
                  {t(
                    "当前筛选条件下无匹配数据记录（可能因搜索关键词不匹配，或该年度国家统计局未发布对应分省数据）。",
                    "No matching rows for the current filter (either no match or unreleased official province-year data)."
                  )}
                </td>
              </tr>
            ) : (
              pageRows.map((o) => {
                const gl = groupLabelMap.get(o.region_group);
                const widthPct = o.value !== null && maxAbsInView > 0 ? Math.min(100, (Math.abs(o.value) / maxAbsInView) * 100) : 0;
                return (
                  <tr
                    key={`${o.region_code}-${o.year}`}
                    className={`${o.is_national ? "bg-blue-50/40 font-semibold" : "hover:bg-slate-50/70"}`}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {o.is_national ? (
                        <span className="text-slate-900 font-bold">
                          {locale === "zh" ? o.region_name_zh : o.region_name_en}
                        </span>
                      ) : (
                        <Link
                          href={`/provinces/${o.region_code}`}
                          className="text-slate-800 hover:text-blue-700 font-medium"
                        >
                          {locale === "zh" ? o.region_name_zh : o.region_name_en}
                        </Link>
                      )}
                      <span className="ml-1.5 font-mono text-[10px] text-slate-400">{o.region_code}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 hidden sm:table-cell whitespace-nowrap">
                      {gl ? (locale === "zh" ? gl.zh : gl.en) : o.region_group}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-700">{o.year}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {o.value === null ? (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-normal text-[11px]">
                          {t("官方未公布", "Missing")}
                        </span>
                      ) : (
                        formatNumber(o.value, dataset.decimals, locale)
                      )}
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      {o.value !== null && !o.is_national ? (
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${widthPct}%`, backgroundColor: accent, opacity: 0.85 }}
                          />
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                      {o.yoy_comparable ? (
                        o.yoy_pct !== null ? (
                          <span className={o.yoy_pct > 0 ? "text-emerald-700" : o.yoy_pct < 0 ? "text-red-700" : "text-slate-500"}>
                            {formatSignedPct(o.yoy_pct)}
                          </span>
                        ) : o.yoy_diff !== null ? (
                          <span className="text-slate-600">
                            {o.yoy_diff > 0 ? `+${o.yoy_diff.toFixed(2)}` : o.yoy_diff.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )
                      ) : (
                        <span className="text-slate-400" title={t("跨统计口径或上年缺失，不计算同比", "Incomparable or prior year missing")}>
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 font-mono">
                      {o.rank !== null ? `#${o.rank}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right hidden lg:table-cell whitespace-nowrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          o.data_status === "official"
                            ? "bg-emerald-50 text-emerald-700"
                            : o.data_status === "preliminary"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {formatDataStatus(o.data_status, locale)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {t(
            `共 ${filtered.length} 条记录（第 ${safePage} / ${totalPages} 页）`,
            `Showing ${filtered.length} rows (Page ${safePage} of ${totalPages})`
          )}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              {t("上一页", "Prev")}
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              {t("下一页", "Next")}
            </button>
          </div>
        )}
      </div>

      {/* Missingness Overview + Expandable Data Dictionary & Column Schema Profiler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>{t("缺失值概况与完整度", "Missingness & Coverage Summary")}</span>
            </h4>
            <span className="text-xs font-bold text-emerald-700 tabular-nums">
              {dataset.missingness_summary.completeness_pct}%
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {locale === "zh" ? dataset.missingness_summary.reason_zh : dataset.missingness_summary.reason_en}
          </p>
          {dataset.missingness_summary.years_with_partial_coverage.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {dataset.missingness_summary.years_with_partial_coverage.slice(0, 8).map((y) => (
                <span
                  key={y.year}
                  className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] text-slate-600 tabular-nums"
                >
                  {y.year}: {y.count}/31
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
          <button
            type="button"
            onClick={() => setSchemaOpen((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Table2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{t(`数据字典与字段统计 (${dataset.column_profiles.length} 字段)`, `Data Dictionary & Schema Profiler (${dataset.column_profiles.length} cols)`)}</span>
            </span>
            {schemaOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          <p className="text-xs text-slate-500">
            {t(
              "下载的 CSV 采用标准长表格式（UTF-8 BOM，Excel 直接兼容中文），包含来源表名与采集时间戳。",
              "CSV exports use tidy long format (UTF-8 BOM) with full NBS provenance and fetch timestamps."
            )}
          </p>
          {schemaOpen && (
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-[11px] bg-white rounded-lg border border-slate-200">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-2 py-1.5 text-left">{t("字段", "Column")}</th>
                    <th className="px-2 py-1.5 text-right">{t("有效", "Non-null")}</th>
                    <th className="px-2 py-1.5 text-right">{t("缺失", "Missing")}</th>
                    <th className="px-2 py-1.5 text-right">{t("唯一值", "Unique")}</th>
                    <th className="px-2 py-1.5 text-right">{t("范围", "Range")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dataset.column_profiles.map((cp) => (
                    <tr key={cp.column}>
                      <td className="px-2 py-1.5 font-mono text-slate-800">{cp.column}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-700">{cp.non_null_count}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-500">{cp.missing_count}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-500">{cp.unique_count}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-500">
                        {cp.min !== undefined && cp.max !== undefined ? `${cp.min} – ${cp.max}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
