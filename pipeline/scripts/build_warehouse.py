"""
Step 2: Validation, Standardization, Transformation & DuckDB/Parquet Warehouse Builder.

Reads raw immutable NBS JSON snapshots from pipeline/raw/, validates region codes,
years, and values, applies strictly documented transformations (direct, ratio_pct,
scale_div_10), computes comparability-safe YoY metrics and provincial rankings,
and loads normalized tables into DuckDB + Parquet + CSV.
"""

import json
import re
import sys
from pathlib import Path
import duckdb
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
REGIONS_PATH = ROOT / "config" / "regions.json"
INDICATORS_PATH = ROOT / "config" / "indicators.json"
RAW_DIR = ROOT / "raw"
WAREHOUSE_DIR = ROOT / "warehouse"
EXPORTS_DIR = ROOT / "exports"


def parse_year(block: dict) -> int | None:
    code = str(block.get("code") or "")
    m = re.match(r"^(\d{4})YY$", code)
    if m:
        return int(m.group(1))
    name = str(block.get("name") or "")
    m2 = re.search(r"(\d{4})", name)
    return int(m2.group(1)) if m2 else None


def parse_float(val) -> float | None:
    if val is None:
        return None
    s = str(val).strip().replace(",", "")
    if s in ("", "-", "--", "—", "...", "null", "None", "N/A"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def extract_provincial_map(raw_resp: dict, valid_codes: set[str]) -> tuple[dict[tuple[str, int], float | None], set[str]]:
    """Returns {(code6, year): value_or_none}, set_of_raw_units."""
    out: dict[tuple[str, int], float | None] = {}
    units: set[str] = set()
    for block in (raw_resp or {}).get("data") or []:
        yr = parse_year(block)
        if yr is None or yr < 2000 or yr > 2026:
            continue
        for item in block.get("values") or []:
            ac = str(item.get("areaCode") or item.get("da") or "")
            code6 = ac[:6]
            if code6 not in valid_codes:
                continue
            u = str(item.get("du_name") or "").strip()
            if u:
                units.add(u)
            out[(code6, yr)] = parse_float(item.get("value"))
    return out, units


def extract_national_map(raw_resp: dict) -> tuple[dict[int, float | None], set[str]]:
    """Returns {year: value_or_none}, set_of_raw_units."""
    out: dict[int, float | None] = {}
    units: set[str] = set()
    for block in (raw_resp or {}).get("data") or []:
        yr = parse_year(block)
        if yr is None or yr < 2000 or yr > 2026:
            continue
        vals = block.get("values") or []
        if not vals:
            continue
        item = vals[0]
        u = str(item.get("du_name") or "").strip()
        if u:
            units.add(u)
        out[yr] = parse_float(item.get("value"))
    return out, units


def apply_transform(transform: dict, vals: list[float | None]) -> float | None:
    ttype = transform["type"]
    if ttype == "direct":
        return vals[0]
    if ttype == "scale_div_10":
        return round(vals[0] / 10.0, 2) if vals[0] is not None else None
    if ttype == "ratio_pct":
        num = vals[transform["numerator_idx"]]
        den = vals[transform["denominator_idx"]]
        if num is None or den is None or den <= 0:
            return None
        return round((num / den) * 100.0, 2)
    raise ValueError(f"Unsupported transform type: {ttype}")


def main():
    WAREHOUSE_DIR.mkdir(parents=True, exist_ok=True)
    EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
    (EXPORTS_DIR / "csv").mkdir(parents=True, exist_ok=True)

    regions_cfg = json.loads(REGIONS_PATH.read_text(encoding="utf-8"))
    indicators_cfg = json.loads(INDICATORS_PATH.read_text(encoding="utf-8"))
    manifest = json.loads((RAW_DIR / "manifest.json").read_text(encoding="utf-8"))

    # Build dim_region
    region_rows = [
        {
            "region_code": regions_cfg["national"]["code"],
            "name_zh": regions_cfg["national"]["name_zh"],
            "short_zh": regions_cfg["national"]["short_zh"],
            "name_en": regions_cfg["national"]["name_en"],
            "region_group": "national",
            "economic_zone": "national",
            "is_national": True,
        }
    ]
    prov_lookup = {}
    for p in regions_cfg["provinces"]:
        prov_lookup[p["code"]] = p
        region_rows.append(
            {
                "region_code": p["code"],
                "name_zh": p["name_zh"],
                "short_zh": p["short_zh"],
                "name_en": p["name_en"],
                "region_group": p["region_group"],
                "economic_zone": p["economic_zone"],
                "is_national": False,
            }
        )
    valid_prov_codes = set(prov_lookup.keys())
    assert len(valid_prov_codes) == 31, f"Expected 31 provinces, got {len(valid_prov_codes)}"

    dim_region_df = pd.DataFrame(region_rows)

    dim_indicator_rows = []
    fact_rows = []

    for ind in indicators_cfg["indicators"]:
        slug = ind["slug"]
        raw_path = RAW_DIR / f"{slug}.json"
        if not raw_path.exists():
            raise FileNotFoundError(f"Missing raw snapshot: {raw_path}")
        snap = json.loads(raw_path.read_text(encoding="utf-8"))
        nbs = ind["nbs"]
        transform = ind["transform"]
        break_years_no_yoy = {b["year"] for b in ind.get("statistical_breaks", []) if b.get("breaks_yoy")}

        # Extract provincial component maps
        prov_maps = []
        raw_units_found = set()
        for iid in nbs["provincial_indicator_ids"]:
            pmap, punits = extract_provincial_map(snap["provincial_raw"][iid], valid_prov_codes)
            prov_maps.append(pmap)
            raw_units_found.update(punits)

        # Extract national component maps
        nat_maps = []
        if nbs["national_cid"]:
            for iid in nbs["national_indicator_ids"]:
                nmap, nunits = extract_national_map(snap["national_raw"][iid])
                nat_maps.append(nmap)
                raw_units_found.update(nunits)

        # Collect all years that have at least one non-null value (provincial OR national)
        all_years_candidates = set()
        for pm in prov_maps:
            all_years_candidates.update(yr for (_, yr) in pm.keys())
        for nm in nat_maps:
            all_years_candidates.update(nm.keys())

        # Compute transformed values per (region_code, year)
        series_by_region: dict[str, dict[int, float | None]] = {"000000": {}}
        for code in sorted(valid_prov_codes):
            series_by_region[code] = {}

        active_years = set()
        for yr in sorted(all_years_candidates):
            # National
            if nat_maps:
                n_vals = [nm.get(yr) for nm in nat_maps]
                n_out = apply_transform(transform, n_vals)
                if n_out is not None:
                    series_by_region["000000"][yr] = n_out
                    active_years.add(yr)
            # Provinces
            for code in sorted(valid_prov_codes):
                p_vals = [pm.get((code, yr)) for pm in prov_maps]
                p_out = apply_transform(transform, p_vals)
                if p_out is not None:
                    series_by_region[code][yr] = p_out
                    active_years.add(yr)

        if not active_years:
            raise RuntimeError(f"Indicator {slug} has ZERO valid observations!")

        year_min, year_max = min(active_years), max(active_years)

        # Compute ranks per year across provinces (1 = highest, ties receive min rank)
        ranks_by_year: dict[int, dict[str, int]] = {}
        for yr in range(year_min, year_max + 1):
            yr_vals = [
                (code, series_by_region[code].get(yr))
                for code in valid_prov_codes
                if series_by_region[code].get(yr) is not None
            ]
            yr_vals.sort(key=lambda x: (-x[1], x[0]))
            ranks_by_year[yr] = {}
            prev_val = None
            prev_rank = 0
            for idx, (code, val) in enumerate(yr_vals, start=1):
                if prev_val is not None and val == prev_val:
                    ranks_by_year[yr][code] = prev_rank
                else:
                    ranks_by_year[yr][code] = idx
                    prev_rank = idx
                    prev_val = val

        # Build normalized fact rows (only store observed years or explicit nulls within [year_min..year_max] for complete missingness visibility)
        allows_pct_yoy = ind["slug"] != "natural-growth-rate"
        for region_code in ["000000"] + sorted(valid_prov_codes):
            is_nat = region_code == "000000"
            rmeta = regions_cfg["national"] if is_nat else prov_lookup[region_code]
            rgroup = "national" if is_nat else rmeta["region_group"]

            for yr in range(year_min, year_max + 1):
                val = series_by_region[region_code].get(yr)
                prev_val = series_by_region[region_code].get(yr - 1)
                yoy_comparable = (yr not in break_years_no_yoy) and (val is not None) and (prev_val is not None)
                yoy_diff = round(val - prev_val, 4) if yoy_comparable else None
                yoy_pct = (
                    round(((val - prev_val) / prev_val) * 100.0, 2)
                    if (yoy_comparable and allows_pct_yoy and prev_val > 0)
                    else None
                )
                rank = None if is_nat else ranks_by_year.get(yr, {}).get(region_code)
                rank_1y = None
                rank_5y = None
                if not is_nat and rank is not None:
                    prev_r1 = ranks_by_year.get(yr - 1, {}).get(region_code)
                    if prev_r1 is not None:
                        rank_1y = prev_r1 - rank
                    prev_r5 = ranks_by_year.get(yr - 5, {}).get(region_code)
                    if prev_r5 is not None:
                        rank_5y = prev_r5 - rank

                # Status: 2025 values from NBS data.stats.gov.cn prior to 2026 Yearbook finalization are marked preliminary; <=2024 are official
                if val is None:
                    status = "unknown"
                elif yr >= 2025:
                    status = "preliminary"
                else:
                    status = "official"

                fact_rows.append(
                    {
                        "indicator_id": ind["id"],
                        "slug": slug,
                        "region_code": region_code,
                        "region_name_zh": rmeta["name_zh"],
                        "region_name_en": rmeta["name_en"],
                        "region_group": rgroup,
                        "is_national": is_nat,
                        "year": yr,
                        "value": val,
                        "unit_zh": ind["unit_zh"],
                        "unit_en": ind["unit_en"],
                        "data_status": status,
                        "yoy_pct": yoy_pct,
                        "yoy_diff": yoy_diff,
                        "yoy_comparable": yoy_comparable,
                        "rank": rank,
                        "rank_change_1y": rank_1y,
                        "rank_change_5y": rank_5y,
                        "source_agency": "国家统计局",
                        "source_table": nbs["table_name_zh"],
                        "source_url": indicators_cfg["api"]["public_portal_url"],
                        "fetched_at": snap["fetched_at"],
                    }
                )

        # Pull verbatim NBS annotation/mark from first provincial indicator metadata
        pmeta0 = (snap.get("provincial_metadata") or [{}])[0] or {}
        dim_indicator_rows.append(
            {
                "indicator_id": ind["id"],
                "slug": slug,
                "category": ind["category"],
                "name_zh": ind["name_zh"],
                "name_en": ind["name_en"],
                "unit_zh": ind["unit_zh"],
                "unit_en": ind["unit_en"],
                "expected_raw_unit": nbs["expected_raw_unit"],
                "observed_raw_units": ",".join(sorted(raw_units_found)),
                "decimals": ind["decimals"],
                "is_additive": ind["is_additive"],
                "year_min": year_min,
                "year_max": year_max,
                "provincial_cid": nbs["provincial_cid"],
                "national_cid": nbs["national_cid"],
                "nbs_annotation_zh": pmeta0.get("i_annotation"),
                "nbs_mark_zh": pmeta0.get("i_mark"),
                "fetched_at": snap["fetched_at"],
                "raw_sha256": manifest["indicators"][slug]["sha256"],
            }
        )
        non_null_cnt = sum(1 for r in fact_rows if r["slug"] == slug and r["value"] is not None)
        print(f"  [OK] {slug:24s} | years={year_min}-{year_max} | non_null_obs={non_null_cnt:4d} | raw_units={sorted(raw_units_found)}")

    dim_indicator_df = pd.DataFrame(dim_indicator_rows)
    fact_df = pd.DataFrame(fact_rows)

    # Save DuckDB warehouse
    db_path = WAREHOUSE_DIR / "china_data_atlas.duckdb"
    if db_path.exists():
        db_path.unlink()
    con = duckdb.connect(str(db_path))
    con.execute("CREATE TABLE dim_region AS SELECT * FROM dim_region_df")
    con.execute("CREATE TABLE dim_indicator AS SELECT * FROM dim_indicator_df")
    con.execute("CREATE TABLE fact_observation AS SELECT * FROM fact_df")
    con.execute(
        """
        CREATE VIEW v_latest_provincial AS
        SELECT f.*
        FROM fact_observation f
        JOIN (
            SELECT slug, MAX(year) AS max_year
            FROM fact_observation
            WHERE NOT is_national AND value IS NOT NULL
            GROUP BY slug
        ) m ON f.slug = m.slug AND f.year = m.max_year
        WHERE NOT f.is_national
        """
    )
    con.close()

    # Save Parquet
    parquet_path = EXPORTS_DIR / "observations.parquet"
    fact_df.to_parquet(parquet_path, index=False)

    # Save tidy CSV per indicator (only non-null or full with explicit empty string for missing values; include rich provenance columns!)
    csv_cols = [
        "indicator_id",
        "region_code",
        "region_name_zh",
        "region_name_en",
        "region_group",
        "is_national",
        "year",
        "value",
        "unit_zh",
        "data_status",
        "yoy_pct",
        "yoy_diff",
        "yoy_comparable",
        "rank",
        "source_agency",
        "source_table",
        "source_url",
        "fetched_at",
    ]
    for ind in indicators_cfg["indicators"]:
        slug = ind["slug"]
        sub = fact_df[fact_df["slug"] == slug][csv_cols].sort_values(["year", "is_national", "region_code"], ascending=[False, False, True])
        # UTF-8 with BOM so Excel on Windows/macOS displays Chinese characters cleanly!
        sub.to_csv(EXPORTS_DIR / "csv" / f"{slug}.csv", index=False, encoding="utf-8-sig")

    fact_df[csv_cols].to_csv(EXPORTS_DIR / "china_data_atlas_all.csv", index=False, encoding="utf-8-sig")

    total_non_null = int(fact_df["value"].notna().sum())
    print(f"\n=== WAREHOUSE BUILT SUCCESSFULLY ===")
    print(f"  DuckDB:  {db_path}")
    print(f"  Parquet: {parquet_path}")
    print(f"  Rows:    {len(fact_df)} grid rows ({total_non_null} non-null official observations across {len(dim_indicator_df)} indicators)")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
