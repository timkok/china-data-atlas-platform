export type Locale = "zh" | "en";

export type CategoryId = "demographics" | "economy" | "education" | "healthcare";

export type DataStatus = "official" | "preliminary" | "revised" | "unknown";

export type HigherIsBetter = "higher" | "lower" | "neutral";

export interface RegionGroup {
  id: string;
  name_zh: string;
  full_zh: string;
  name_en: string;
  order: number;
  provinces: string[];
  definition_zh: string;
}

export interface ProvinceMeta {
  code: string;
  name_zh: string;
  short_zh: string;
  name_en: string;
  pinyin: string;
  region_group: string;
  economic_zone: string;
  type: "province" | "municipality" | "autonomous_region";
}

export interface RegionsData {
  national: {
    code: string;
    nbs_code: string;
    name_zh: string;
    short_zh: string;
    name_en: string;
    short_en: string;
  };
  region_groups: RegionGroup[];
  provinces: ProvinceMeta[];
  coverage_disclaimer: {
    zh: string;
    en: string;
  };
}

export interface StatisticalBreak {
  year: number;
  label_zh: string;
  label_en: string;
  description_zh: string;
  description_en: string;
  breaks_yoy: boolean;
}

export interface IndicatorSource {
  agency_zh: string;
  agency_en: string;
  database_zh: string;
  database_en: string;
  table_name_zh: string;
  table_name_en: string;
  url: string;
  provincial_cid: string;
  national_cid: string | null;
  release_date: string | null;
  fetched_at: string;
  data_status: DataStatus;
}

export interface IndicatorSummary {
  id: string;
  slug: string;
  category: CategoryId;
  name_zh: string;
  name_en: string;
  short_zh: string;
  short_en: string;
  aliases: string[];
  unit_zh: string;
  unit_en: string;
  decimals: number;
  is_additive: boolean;
  higher_is_better: HigherIsBetter;
  color_scheme: "blue" | "amber" | "teal" | "crimson" | "indigo" | "emerald";
  definition_zh: string;
  definition_en: string;
  headline_insight_zh: string;
  headline_insight_en: string;
  year_min: number;
  year_max: number;
  latest_complete_year: number;
  latest_national_year: number | null;
  latest_national_value: number | null;
  latest_national_yoy: number | null;
  latest_national_yoy_comparable: boolean;
  latest_reporting_provinces: number;
  total_provinces: number;
  total_observations: number;
  missing_provincial_cells: number;
  quality_score: number;
  top_province: {
    code: string;
    name_zh: string;
    name_en: string;
    value: number;
    year: number;
  } | null;
  bottom_province: {
    code: string;
    name_zh: string;
    name_en: string;
    value: number;
    year: number;
  } | null;
  source: IndicatorSource;
}

export interface ObservationRow {
  region_code: string;
  region_name_zh: string;
  region_name_en: string;
  region_group: string;
  is_national: boolean;
  year: number;
  value: number | null;
  data_status: DataStatus;
  yoy_pct: number | null;
  yoy_diff: number | null;
  yoy_comparable: boolean;
  rank: number | null;
  rank_change_1y: number | null;
  rank_change_5y: number | null;
}

export interface ColumnProfile {
  column: string;
  label_zh: string;
  label_en: string;
  type: "string" | "integer" | "number" | "boolean";
  non_null_count: number;
  missing_count: number;
  unique_count: number;
  min?: number | string | null;
  median?: number | null;
  max?: number | string | null;
}

export interface MoverEntry {
  region_code: string;
  name_zh: string;
  name_en: string;
  start_year: number;
  end_year: number;
  start_value: number;
  end_value: number;
  abs_change: number;
  pct_change: number | null;
  start_rank: number | null;
  end_rank: number | null;
  rank_delta: number | null;
}

export interface IndicatorDataset extends IndicatorSummary {
  caliber_note_zh: string;
  caliber_note_en: string;
  transformation_zh: string;
  transformation_en: string;
  revision_note_zh: string;
  revision_note_en: string;
  limitations_zh: string;
  limitations_en: string;
  nbs_annotation_zh: string | null;
  nbs_mark_zh: string | null;
  statistical_breaks: StatisticalBreak[];
  related_slugs: string[];
  available_years: number[];
  observations: ObservationRow[];
  movers_window: {
    start_year: number;
    end_year: number;
    biggest_rises: MoverEntry[];
    biggest_falls: MoverEntry[];
  } | null;
  missingness_summary: {
    expected_provincial_cells: number;
    observed_provincial_cells: number;
    completeness_pct: number;
    years_with_partial_coverage: Array<{ year: number; count: number; missing_provinces: string[] }>;
    reason_zh: string;
    reason_en: string;
  };
  column_profiles: ColumnProfile[];
  quality_checks: Array<{
    check: string;
    passed: boolean;
    detail_zh: string;
    detail_en: string;
  }>;
}

export interface CategoryMeta {
  id: CategoryId;
  name_zh: string;
  name_en: string;
  description_zh: string;
  description_en: string;
  accent: string;
  indicator_count: number;
}

export interface KeyFinding {
  id: string;
  indicator_slug: string;
  category: CategoryId;
  tag_zh: string;
  tag_en: string;
  headline_zh: string;
  headline_en: string;
  detail_zh: string;
  detail_en: string;
  metric_display: string;
  year: number;
}

export interface QualityGateReport {
  generated_at: string;
  overall_status: "PASS" | "WARN" | "FAIL";
  total_checks: number;
  passed_checks: number;
  warnings: number;
  failures: number;
  checks: Array<{
    id: string;
    name_zh: string;
    name_en: string;
    status: "PASS" | "WARN" | "FAIL";
    summary_zh: string;
    summary_en: string;
  }>;
}

export interface CatalogData {
  generated_at: string;
  data_fetched_at: string;
  platform_stats: {
    indicator_count: number;
    category_count: number;
    province_count: number;
    total_observations: number;
    year_span: string;
    official_sources_count: number;
  };
  categories: CategoryMeta[];
  indicators: IndicatorSummary[];
  key_findings: KeyFinding[];
  quality_gate: QualityGateReport;
}
