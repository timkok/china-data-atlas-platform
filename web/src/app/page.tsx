import React from "react";
import { getCatalog, getIndicatorDataset, getRegions } from "@/lib/data";
import { HomeClient } from "@/components/home/HomeClient";
import type { IndicatorDataset } from "@/lib/types";

export default function HomePage() {
  const catalog = getCatalog();
  const regions = getRegions();

  const featuredSlugs = ["gdp-per-capita", "birth-rate", "disposable-income", "aging-65-share"];
  const featuredDatasets = featuredSlugs
    .map((s) => getIndicatorDataset(s))
    .filter((d): d is IndicatorDataset => d !== null);

  return <HomeClient catalog={catalog} regions={regions} featuredDatasets={featuredDatasets} />;
}
