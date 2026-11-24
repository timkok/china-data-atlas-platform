import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllIndicatorDatasets, getCatalog, getRegions } from "@/lib/data";
import { ProvinceDossierClient, type ProvinceMetricCard } from "@/components/province/ProvinceDossierClient";

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateStaticParams() {
  const regions = getRegions();
  return regions.provinces.map((p) => ({ code: p.code }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const regions = getRegions();
  const province = regions.provinces.find((p) => p.code === code);
  if (!province) return { title: "省份未找到" };
  return {
    title: `${province.name_zh}（${province.name_en}）官方统计数据档案`,
    description: `一站式查看${province.name_zh}常住人口、GDP、人均GDP、人均可支配收入、城镇化率、老龄化、高等教育与医疗卫生等14项国家统计局核心指标及全国排名。`,
  };
}

export default async function ProvinceDossierPage({ params }: PageProps) {
  const { code } = await params;
  const regions = getRegions();
  const province = regions.provinces.find((p) => p.code === code);
  if (!province) notFound();

  const regionGroup = regions.region_groups.find((g) => g.id === province.region_group) ?? regions.region_groups[0];
  const catalog = getCatalog();
  const allDatasets = getAllIndicatorDatasets();

  const metrics: ProvinceMetricCard[] = allDatasets.map((ds) => {
    const provObs = ds.observations
      .filter((o) => o.region_code === code && o.value !== null)
      .sort((a, b) => b.year - a.year);
    const latest = provObs[0] ?? null;
    const natSameYear = latest
      ? ds.observations.find((o) => o.is_national && o.year === latest.year) ?? null
      : null;
    return {
      slug: ds.slug,
      category: ds.category,
      name_zh: ds.name_zh,
      name_en: ds.name_en,
      unit_zh: ds.unit_zh,
      unit_en: ds.unit_en,
      decimals: ds.decimals,
      latest_year: latest?.year ?? null,
      value: latest?.value ?? null,
      national_value: natSameYear?.value ?? null,
      rank: latest?.rank ?? null,
      yoy_pct: latest?.yoy_pct ?? null,
      yoy_diff: latest?.yoy_diff ?? null,
      yoy_comparable: latest?.yoy_comparable ?? false,
      data_status: latest?.data_status ?? "unknown",
    };
  });

  return (
    <ProvinceDossierClient
      province={province}
      regionGroup={regionGroup}
      allProvinces={regions.provinces}
      categories={catalog.categories}
      metrics={metrics}
    />
  );
}
