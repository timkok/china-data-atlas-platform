"use client";

import React, { useState } from "react";
import { Check, Copy, Quote } from "lucide-react";
import type { IndicatorDataset } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

interface Props {
  dataset: IndicatorDataset;
}

export function CitationBox({ dataset }: Props) {
  const { t } = useLocale();
  const [format, setFormat] = useState<"gbt" | "apa" | "bibtex">("gbt");
  const [copied, setCopied] = useState(false);

  const fetchedDate = dataset.source.fetched_at.slice(0, 10);
  const yearNow = fetchedDate.slice(0, 4);

  const citations = {
    gbt: `中华人民共和国国家统计局. ${dataset.name_zh}（${dataset.year_min}–${dataset.year_max}年）[DS/OL]. 中国数据地图（China Data Atlas）整理自${dataset.source.table_name_zh}. 数据获取日期：${fetchedDate}. ${dataset.source.url}.`,
    apa: `National Bureau of Statistics of China. (${yearNow}). ${dataset.name_en} (${dataset.year_min}–${dataset.year_max}) [Dataset]. Compiled by China Data Atlas from ${dataset.source.table_name_en}. Retrieved ${fetchedDate}, from ${dataset.source.url}`,
    bibtex: `@misc{chinadataatlas_${dataset.slug.replace(/-/g, "_")}_${yearNow},
  author = {{National Bureau of Statistics of China}},
  title = {{${dataset.name_en} (${dataset.name_zh}), ${dataset.year_min}--${dataset.year_max}}},
  howpublished = {China Data Atlas (compiled from NBS National Data)},
  year = {${yearNow}},
  note = {Indicator ID: ${dataset.id}; Retrieved ${fetchedDate}},
  url = {${dataset.source.url}}
}`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(citations[format]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3" id="cite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Quote className="w-3.5 h-3.5 text-blue-700" />
          <span>{t("推荐引用格式", "Recommended Citation")}</span>
        </div>
        <div className="flex items-center gap-1">
          {(["gbt", "apa", "bibtex"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormat(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                format === key
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {key === "gbt" ? "GB/T 7714" : key === "apa" ? "APA" : "BibTeX"}
            </button>
          ))}
        </div>
      </div>

      <pre className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed select-all">
        {citations[format]}
      </pre>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">
          {t("引用时请同时注明原始官方发布机构「中华人民共和国国家统计局」。", "Always attribute the primary publisher: National Bureau of Statistics of China.")}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-700 transition-colors shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? t("已复制", "Copied") : t("复制引用", "Copy citation")}</span>
        </button>
      </div>
    </div>
  );
}
