"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Database, ExternalLink, GitBranch, ShieldCheck } from "lucide-react";
import type { CatalogData, RegionsData } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

interface Props {
  catalog: CatalogData;
  regions: RegionsData;
}

export function MethodologyClient({ catalog, regions }: Props) {
  const { locale, t } = useLocale();
  const qg = catalog.quality_gate;

  const pipelineStages = [
    { step: "01", zh: "官方源头采集", en: "Official Ingestion", desc_zh: "直连国家统计局数据发布库公开接口，保存不可变原始 JSON 快照与 SHA-256 校验值。", desc_en: "Fetch public NBS API endpoints, archiving immutable raw JSON snapshots with SHA-256 digests." },
    { step: "02", zh: "标准化与入库", en: "Standardization", desc_zh: "按 GB/T 2260 6位区划代码规范31省+全国基准，写入 DuckDB 与 Parquet；仅执行经文档披露的确定性换算（如 ÷10）。", desc_en: "Normalize against GB/T 2260 codes into DuckDB & Parquet using deterministic documented formulas only." },
    { step: "03", zh: "11项质量门禁", en: "Quality Gate", desc_zh: "自动校验来源链接、值域、主键唯一性、口径断点保护、异常波动与原始快照逐值一致性。", desc_en: "Run 11 automated checks across URLs, domain ranges, primary keys, break guards, spikes, and raw-vs-warehouse spot checks." },
    { step: "04", zh: "静态预计算发布", en: "Static Precomputation", desc_zh: "导出预计算 JSON 与 UTF-8 BOM CSV，零运行时抓取，支持全站 SSR/SSG 搜索引擎抓取与秒级响应。", desc_en: "Export static JSON and UTF-8 BOM CSV bundles for fast SSG/SSR delivery with zero runtime scraping." },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <header className="space-y-3 pb-6 border-b border-slate-200">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-700">{t("首页", "Home")}</Link>
          <span>/</span>
          <span>{t("方法论与数据治理", "Methodology")}</span>
        </nav>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-slate-900">
          {t("方法论、数据质量门禁与地图合规说明", "Methodology, Data Quality Gate & Map Compliance")}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {t(
            "This must be a real data product, not a beautiful demo. 本页完整公开中国数据地图（China Data Atlas）的官方数据来源、可复现 ETL 流程、统计口径处理规则、自动化质量门禁结果及中国地图合规策略。",
            "Every figure published on China Data Atlas is backed by an auditable, reproducible Python + DuckDB pipeline sourced exclusively from official Chinese statistics."
          )}
        </p>
      </header>

      {/* 1. Reproducible Pipeline */}
      <section className="space-y-4">
        <h2 className="font-editorial text-2xl font-bold text-slate-900 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-700" />
          <span>{t("一、可复现的数据处理管线", "1. Reproducible Data Pipeline")}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineStages.map((st) => (
            <div key={st.step} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <div className="text-xs font-mono font-bold text-blue-700">{st.step}</div>
              <h3 className="font-bold text-sm text-slate-900">{locale === "zh" ? st.zh : st.en}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{locale === "zh" ? st.desc_zh : st.desc_en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Live Automated Quality Gate Results */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-editorial text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>{t("二、自动化数据质量门禁实测结果", "2. Automated Data Quality Gate Results")}</span>
          </h2>
          <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tabular-nums">
            {qg.passed_checks}/{qg.total_checks} PASS · {qg.warnings} WARN · {qg.failures} FAIL
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
          {qg.checks.map((chk) => (
            <div key={chk.id} className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-2.5">
                {chk.status === "PASS" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-slate-900">
                    {locale === "zh" ? chk.name_zh : chk.name_en}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {locale === "zh" ? chk.summary_zh : chk.summary_en}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold shrink-0 ${
                  chk.status === "PASS"
                    ? "bg-emerald-50 text-emerald-700"
                    : chk.status === "WARN"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {chk.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Map Compliance */}
      <section id="map-compliance" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 space-y-3">
        <h2 className="font-editorial text-2xl font-bold text-slate-900">
          {t("三、中国地图合规核查与暂缓说明", "3. China Map Compliance Determination")}
        </h2>
        <div className="space-y-2.5 text-sm text-slate-700 leading-relaxed">
          <p>
            {t(
              "根据《中华人民共和国测绘法》《地图管理条例》（第十五条）及《地图审核管理规定》（第六条），向社会公众公开登载的中国行政区划地图原则上实行地图审核制度；即便采用自然资源部标准地图服务系统下载的公益性标准地图，一旦在其上进行统计数据叠加、交互着色、要素增减或二次矢量渲染，即不再属于“原样直接使用”的免审情形，须依法送自然资源部审核并取得专用审图号（GS 编号）。",
              "Under China's Surveying and Mapping Law, Map Management Regulations (Article 15), and Map Review Measures (Article 6), publicly published interactive thematic choropleth maps overlaid onto China's borders require dedicated Ministry of Natural Resources (MNR) review and an official GS approval number."
            )}
          </p>
          <p>
            {t(
              "因此，本平台在 V0.1 阶段做出严格合规决策：绝不使用来源不明、边界未核验或无合法再分发许可的第三方开源 GeoJSON 充当中国地图；在尚未取得本平台独立审图号前，正式采用「七大地理大区等面积省级矩阵图」+「31省完整排名条形图」+「大区离散分布点图」作为空间分析正式视图，并在代码层预留标准 `ChoroplethMapAdapter` 接口，待取得正式审图号后无缝启用。",
              "Accordingly, V0.1 intentionally defers geographic boundary choropleth maps rather than shipping unreviewed third-party GeoJSON borders. Instead, it provides an equal-area 7-region provincial heatmap matrix, full 31-province ranking bars, and regional distribution strip plots, while preserving a clean ChoroplethMapAdapter interface for future approved base maps."
            )}
          </p>
        </div>
      </section>

      {/* 4. Geographic Scope & Statistical Caliber Policy */}
      <section className="space-y-4">
        <h2 className="font-editorial text-2xl font-bold text-slate-900">
          {t("四、地理覆盖范围、七大区定义与口径原则", "4. Geographic Scope, 7-Region Definitions & Caliber Rules")}
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-sm text-slate-700 leading-relaxed">
          <p className="font-medium text-slate-900">
            {locale === "zh" ? regions.coverage_disclaimer.zh : regions.coverage_disclaimer.en}
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li>{t("零虚构与零插值原则：官方未发布年份（如2010/2020年普查年分省抽样空缺、2001–2004年分省人均可支配收入空缺）一律留空并呈现断线。", "Zero imputation: unreleased province-year cells remain null with explicit breaks in trend lines.")}</li>
            <li>{t("口径断点同比保护：例如2012年医疗资源密度分母由户籍人口切换为常住人口（以及2013年国家统计局原始表短暂口径波动），系统自动禁用跨断点同比增速。", "Caliber break protection: YoY growth is automatically suppressed across non-comparable methodological transitions (e.g., 2012–2014 healthcare denominator shifts).")}</li>
            <li>{t("非可加性审慎处理：地区生产总值（GDP）、社会消费品零售总额等按统一核算制度存在中央未分摊项，系统不强行要求31省之和等于全国总计。", "Conditional additivity: only strictly additive metrics (such as higher education institution counts and enrollments) are checked for exact provincial-to-national sum equality.")}</li>
          </ul>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{t("七大地理大区", "Geographic Region")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("省份数", "Count")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("明确涵盖范围", "Explicit Definition")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regions.region_groups.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                    {locale === "zh" ? g.full_zh : g.name_en}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{g.provinces.length}</td>
                  <td className="px-4 py-2.5 text-slate-600">{g.definition_zh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Official Sources */}
      <section className="space-y-3">
        <h2 className="font-editorial text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-700" />
          <span>{t("五、官方权威数据来源清单", "5. Official Primary Sources")}</span>
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 text-sm">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900">{t("国家统计局 · 国家数据（分省年度 / 全国年度）", "National Bureau of Statistics · National Data Portal")}</div>
              <div className="text-xs text-slate-500">{t("V0.1 全部14项指标的直接程序化官方采集源（含教育部与国家卫健委经国家统计局发布的年度统计序列）", "Direct programmatic primary source for all 14 V0.1 indicators (including MOE & NHC series published via NBS)")}</div>
            </div>
            <a href="https://data.stats.gov.cn/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline shrink-0">
              <span>data.stats.gov.cn</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900">{t("《中国统计年鉴》（2005–2025年各卷）与国民经济和社会发展统计公报", "China Statistical Yearbook (2005–2025) & Annual Statistical Communiqués")}</div>
              <div className="text-xs text-slate-500">{t("用于交叉核验统计口径、普查修订说明及最新年度初步数据状态", "Cross-referenced for statistical definitions, census revision notes, and preliminary/official status verification")}</div>
            </div>
            <a href="https://www.stats.gov.cn/sj/ndsj/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline shrink-0">
              <span>stats.gov.cn/sj/ndsj</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
