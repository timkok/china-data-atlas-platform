"use client";

import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { Download } from "lucide-react";
import { useLocale } from "@/lib/i18n";

interface Props {
  option: echarts.EChartsOption;
  height?: number;
  className?: string;
  exportFilename?: string;
  onPointClick?: (params: unknown) => void;
}

export function EChartBox({
  option,
  height = 380,
  className = "",
  exportFilename,
  onPointClick,
}: Props) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const clickHandlerRef = useRef(onPointClick);

  useEffect(() => {
    clickHandlerRef.current = onPointClick;
  }, [onPointClick]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const instance = echarts.init(el, undefined, { renderer: "canvas" });
    chartRef.current = instance;

    instance.on("click", (params) => {
      clickHandlerRef.current?.(params);
    });

    const ro = new ResizeObserver(() => {
      instance.resize();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      instance.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = chartRef.current;
    if (!instance) return;
    instance.setOption(option, { notMerge: true });
  }, [option]);

  const handleExportPng = () => {
    const instance = chartRef.current;
    if (!instance) return;
    const url = instance.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename || "china-data-atlas-chart"}.png`;
    a.click();
  };

  return (
    <div className={`relative ${className}`}>
      {exportFilename && (
        <div className="flex justify-end mb-1">
          <button
            type="button"
            onClick={handleExportPng}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-500 bg-white border border-slate-200 rounded-md hover:text-blue-700 hover:border-blue-300 transition-colors"
            title={t("导出高清 PNG 图片", "Export PNG chart")}
          >
            <Download className="w-3 h-3" />
            <span>{t("导出 PNG", "Export PNG")}</span>
          </button>
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: `${height}px` }} />
    </div>
  );
}
