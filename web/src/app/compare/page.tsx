import type { Metadata } from "next";
import { getAllIndicatorDatasets, getRegions } from "@/lib/data";
import { CompareLabClient } from "@/components/compare/CompareLabClient";

export const metadata: Metadata = {
  title: "跨指标省际散点对比实验室",
  description:
    "在 China Data Atlas 跨指标对比实验室中，自由组合中国31个省级行政区的人口、GDP、人均收入、城镇化、教育与医疗指标，计算省际相关性并导出高清散点图。",
};

export default function ComparePage() {
  const datasets = getAllIndicatorDatasets();
  const regions = getRegions();
  return <CompareLabClient datasets={datasets} regions={regions} />;
}
