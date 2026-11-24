import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog, getIndicatorDataset, getRegions } from "@/lib/data";
import { IndicatorDetailClient } from "@/components/indicator/IndicatorDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const catalog = getCatalog();
  return catalog.indicators.map((ind) => ({ slug: ind.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dataset = getIndicatorDataset(slug);
  if (!dataset) return { title: "指标未找到" };

  return {
    title: `${dataset.name_zh}（${dataset.year_min}–${dataset.year_max}）分省统计数据与趋势`,
    description: `${dataset.headline_insight_zh}。${dataset.definition_zh} 数据源自国家统计局，覆盖中国大陆31个省级行政区，支持交互比较、口径溯源与 CSV 免费下载。`,
    keywords: [dataset.name_zh, dataset.name_en, ...dataset.aliases, "国家统计局", "中国分省数据"],
    openGraph: {
      title: `${dataset.name_zh} | China Data Atlas`,
      description: dataset.headline_insight_zh,
      type: "article",
    },
  };
}

export default async function IndicatorDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const dataset = getIndicatorDataset(slug);
  if (!dataset) notFound();

  const catalog = getCatalog();
  const regions = getRegions();
  const category = catalog.categories.find((c) => c.id === dataset.category);
  const related = dataset.related_slugs
    .map((rs) => catalog.indicators.find((i) => i.slug === rs))
    .filter((i): i is NonNullable<typeof i> => Boolean(i));

  return (
    <IndicatorDetailClient
      dataset={dataset}
      regions={regions}
      relatedIndicators={related}
      categoryNameZh={category?.name_zh ?? dataset.category}
      categoryNameEn={category?.name_en ?? dataset.category}
    />
  );
}
