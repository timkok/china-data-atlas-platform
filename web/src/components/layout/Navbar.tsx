"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Compass, Globe, Menu, Search, X } from "lucide-react";
import type { CatalogData, RegionsData } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";

interface Props {
  catalog: CatalogData;
  regions: RegionsData;
}

export function Navbar({ catalog, regions }: Props) {
  const { locale, toggleLocale, t } = useLocale();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [catOpenPath, setCatOpenPath] = useState<string | null>(null);
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);

  const catOpen = catOpenPath === pathname;
  const mobileOpen = mobileOpenPath === pathname;
  const setCatOpen = (next: boolean | ((v: boolean) => boolean)) => {
    const resolved = typeof next === "function" ? next(catOpen) : next;
    setCatOpenPath(resolved ? pathname : null);
  };
  const setMobileOpen = (next: boolean | ((v: boolean) => boolean)) => {
    const resolved = typeof next === "function" ? next(mobileOpen) : next;
    setMobileOpenPath(resolved ? pathname : null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navLinkClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? "text-blue-700 bg-blue-50"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-15 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors relative">
              <Compass className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute -top-0.5 -right-0.5 ring-2 ring-white" />
            </span>
            <div className="leading-tight">
              <div className="text-sm sm:text-[15px] font-bold tracking-tight text-slate-900">
                {locale === "zh" ? (
                  <>
                    中国<span className="text-blue-700">数据地图</span>
                  </>
                ) : (
                  <>
                    China <span className="text-blue-700">Data Atlas</span>
                  </>
                )}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-medium hidden sm:block">
                {locale === "zh" ? "CHINA DATA ATLAS" : "中国数据地图"}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label={t("主导航", "Main navigation")}>
            <Link href="/indicators" className={navLinkClass(pathname === "/indicators")}>
              {t("全部指标", "Indicators")}
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setCatOpen((v) => !v)}
                className={`${navLinkClass(pathname.startsWith("/categories"))} inline-flex items-center gap-1`}
                aria-expanded={catOpen}
              >
                {t("主题分类", "Topics")}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${catOpen ? "rotate-180" : ""}`} />
              </button>
              {catOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCatOpen(false)} />
                  <div className="absolute left-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-lg p-2 z-20">
                    {catalog.categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/categories/${cat.id}`}
                        className="flex items-start justify-between gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {locale === "zh" ? cat.name_zh : cat.name_en}
                          </div>
                          <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {locale === "zh" ? cat.description_zh : cat.description_en}
                          </div>
                        </div>
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {cat.indicator_count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Link href="/compare" className={navLinkClass(pathname === "/compare")}>
              {t("跨指标对比", "Compare")}
            </Link>
            <Link href="/methodology" className={navLinkClass(pathname === "/methodology")}>
              {t("方法与来源", "Methodology")}
            </Link>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-slate-500 text-sm transition-colors"
              aria-label={t("搜索数据", "Search data")}
              data-testid="nav-search-btn"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden lg:inline text-xs text-slate-500">
                {t("搜索指标或省份…", "Search indicators…")}
              </span>
              <kbd className="hidden lg:inline-flex text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={toggleLocale}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label={t("切换语言", "Switch language")}
              data-testid="locale-toggle"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{locale === "zh" ? "EN" : "中文"}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              aria-label={t("打开菜单", "Toggle menu")}
              aria-expanded={mobileOpen}
              data-testid="mobile-menu-btn"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            <Link href="/indicators" className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50">
              {t("全部统计指标", "All Indicators")}
            </Link>
            <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {t("主题分类", "Topics")}
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-1 pb-2">
              {catalog.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.id}`}
                  className="px-2.5 py-2 rounded-lg bg-slate-50 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  {locale === "zh" ? cat.name_zh : cat.name_en} ({cat.indicator_count})
                </Link>
              ))}
            </div>
            <Link href="/compare" className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50">
              {t("跨指标对比实验室", "Cross-Indicator Compare")}
            </Link>
            <Link href="/methodology" className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50">
              {t("方法论、口径与地图合规", "Methodology & Sources")}
            </Link>
          </div>
        )}
      </header>

      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        catalog={catalog}
        regions={regions}
      />
    </>
  );
}
