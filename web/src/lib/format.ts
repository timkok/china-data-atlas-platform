import type { DataStatus, Locale } from "./types";

export function formatNumber(
  value: number | null | undefined,
  decimals = 1,
  locale: Locale = "zh"
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return locale === "zh" ? "暂无数据" : "No data";
  }
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatValueWithUnit(
  value: number | null | undefined,
  unitZh: string,
  unitEn: string,
  decimals = 1,
  locale: Locale = "zh"
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return locale === "zh" ? "暂无数据" : "No data";
  }
  const num = formatNumber(value, decimals, locale);
  const unit = locale === "zh" ? unitZh : unitEn;
  if (unit === "%" || unit === "‰") {
    return `${num}${unit}`;
  }
  return `${num} ${unit}`;
}

export function formatSignedPct(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatSignedDiff(
  value: number | null | undefined,
  unit = "",
  decimals = 2
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  const suffix = unit === "%" || unit === "‰" ? unit : unit ? ` ${unit}` : "";
  return `${sign}${value.toFixed(decimals)}${suffix}`;
}

export function formatDataStatus(status: DataStatus, locale: Locale): string {
  const map: Record<DataStatus, { zh: string; en: string }> = {
    official: { zh: "正式数据", en: "Official" },
    preliminary: { zh: "初步数据", en: "Preliminary" },
    revised: { zh: "修订数据", en: "Revised" },
    unknown: { zh: "状态未注明", en: "Unspecified" },
  };
  return map[status]?.[locale] ?? status;
}

export function getColorPalette(
  scheme: "blue" | "amber" | "teal" | "crimson" | "indigo" | "emerald"
): string[] {
  const palettes: Record<typeof scheme, string[]> = {
    blue: ["#eff6ff", "#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e3a8a"],
    amber: ["#fffbeb", "#fef3c7", "#fcd34d", "#f59e0b", "#d97706", "#92400e"],
    teal: ["#f0fdfa", "#ccfbf1", "#5eead4", "#14b8a6", "#0f766e", "#115e59"],
    crimson: ["#fef2f2", "#fee2e2", "#fca5a5", "#ef4444", "#b91c1c", "#7f1d1d"],
    indigo: ["#eef2ff", "#e0e7ff", "#a5b4fc", "#6366f1", "#4338ca", "#312e81"],
    emerald: ["#ecfdf5", "#d1fae5", "#6ee7b7", "#10b981", "#047857", "#064e3b"],
  };
  return palettes[scheme] ?? palettes.blue;
}

export function getAccentHex(
  scheme: "blue" | "amber" | "teal" | "crimson" | "indigo" | "emerald"
): string {
  const accents: Record<typeof scheme, string> = {
    blue: "#1d4ed8",
    amber: "#d97706",
    teal: "#0f766e",
    crimson: "#b91c1c",
    indigo: "#4338ca",
    emerald: "#047857",
  };
  return accents[scheme] ?? "#1d4ed8";
}

export function interpolateColor(
  value: number | null,
  min: number,
  max: number,
  palette: string[]
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "#f1f5f9";
  }
  if (max <= min) return palette[3];
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const idx = Math.min(palette.length - 1, Math.floor(ratio * palette.length));
  return palette[idx];
}

export function isDarkHex(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55;
}
