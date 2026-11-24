import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/data";
import { IndicatorDirectoryClient } from "@/components/indicator/IndicatorDirectoryClient";
import type { CategoryId } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const catalog = getCatalog();
  return catalog.categories.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = getCatalog();
  const cat = catalog.categories.find((c) => c.id === slug);
  if (!cat) return { title: "分类未找到" };
  return {
    title: `${cat.name_zh}（${cat.name_en}）分省统计数据专题`,
    description: cat.description_zh,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const catalog = getCatalog();
  const cat = catalog.categories.find((c) => c.id === slug);
  if (!cat) notFound();

  return <IndicatorDirectoryClient catalog={catalog} initialCategory={cat.id as CategoryId} />;
}
