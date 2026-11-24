import type { MetadataRoute } from "next";
import { getCatalog, getRegions } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://china-data-atlas.vercel.app";
  const catalog = getCatalog();
  const regions = getRegions();
  const lastModified = new Date(catalog.generated_at);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/indicators`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/compare`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/methodology`, lastModified, changeFrequency: "monthly", priority: 0.7 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = catalog.categories.map((cat) => ({
    url: `${baseUrl}/categories/${cat.id}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const indicatorRoutes: MetadataRoute.Sitemap = catalog.indicators.map((ind) => ({
    url: `${baseUrl}/indicators/${ind.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const provinceRoutes: MetadataRoute.Sitemap = regions.provinces.map((p) => ({
    url: `${baseUrl}/provinces/${p.code}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...staticRoutes, ...categoryRoutes, ...indicatorRoutes, ...provinceRoutes];
}
