import type { Metadata } from "next";
import { getCatalog, getRegions } from "@/lib/data";
import { MethodologyClient } from "@/components/methodology/MethodologyClient";

export const metadata: Metadata = {
  title: "方法论、数据质量门禁与地图合规说明",
  description:
    "公开 China Data Atlas 中国数据地图的官方数据来源、Python + DuckDB 可复现数据管线、11 项自动化质量门禁结果及中国地图合规核查说明。",
};

export default function MethodologyPage() {
  const catalog = getCatalog();
  const regions = getRegions();
  return <MethodologyClient catalog={catalog} regions={regions} />;
}
