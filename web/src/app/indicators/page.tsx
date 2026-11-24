import type { Metadata } from "next";
import { getCatalog } from "@/lib/data";
import { IndicatorDirectoryClient } from "@/components/indicator/IndicatorDirectoryClient";

export const metadata: Metadata = {
  title: "全部官方统计指标目录",
  description:
    "浏览中国数据地图全部 14 项经质量门禁核验的官方统计指标，覆盖人口与社会、经济与收入、高等教育和医疗卫生四大领域（2000–2025）。",
};

export default function IndicatorsIndexPage() {
  const catalog = getCatalog();
  return <IndicatorDirectoryClient catalog={catalog} />;
}
