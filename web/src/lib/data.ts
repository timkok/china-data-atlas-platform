import fs from "node:fs";
import path from "node:path";
import type { CatalogData, IndicatorDataset, RegionsData } from "./types";

const DATA_ROOT = path.join(process.cwd(), "public", "data");

let catalogCache: CatalogData | null = null;
let regionsCache: RegionsData | null = null;
const indicatorCache = new Map<string, IndicatorDataset>();

export function getCatalog(): CatalogData {
  if (!catalogCache) {
    const raw = fs.readFileSync(path.join(DATA_ROOT, "catalog.json"), "utf-8");
    catalogCache = JSON.parse(raw) as CatalogData;
  }
  return catalogCache;
}

export function getRegions(): RegionsData {
  if (!regionsCache) {
    const raw = fs.readFileSync(path.join(DATA_ROOT, "regions.json"), "utf-8");
    regionsCache = JSON.parse(raw) as RegionsData;
  }
  return regionsCache;
}

export function getIndicatorDataset(slug: string): IndicatorDataset | null {
  if (indicatorCache.has(slug)) {
    return indicatorCache.get(slug)!;
  }
  const filePath = path.join(DATA_ROOT, "indicators", `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as IndicatorDataset;
  indicatorCache.set(slug, parsed);
  return parsed;
}

export function getAllIndicatorDatasets(): IndicatorDataset[] {
  const catalog = getCatalog();
  return catalog.indicators
    .map((ind) => getIndicatorDataset(ind.slug))
    .filter((d): d is IndicatorDataset => d !== null);
}
