import csv
import json
from pathlib import Path
import duckdb
import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
PIPELINE = REPO_ROOT / "pipeline"
WEB_DATA = REPO_ROOT / "web" / "public" / "data"


def test_quality_gate_passed():
    report = json.loads((PIPELINE / "exports" / "quality_gate_report.json").read_text(encoding="utf-8"))
    assert report["failures"] == 0, f"Quality gate failed: {report}"
    assert report["total_checks"] >= 10


def test_catalog_and_indicator_files_exist():
    catalog = json.loads((WEB_DATA / "catalog.json").read_text(encoding="utf-8"))
    assert catalog["platform_stats"]["indicator_count"] >= 12
    assert catalog["platform_stats"]["province_count"] == 31
    assert catalog["platform_stats"]["total_observations"] > 5000

    for ind in catalog["indicators"]:
        slug = ind["slug"]
        jpath = WEB_DATA / "indicators" / f"{slug}.json"
        cpath = WEB_DATA / "csv" / f"{slug}.csv"
        assert jpath.exists(), f"Missing JSON for {slug}"
        assert cpath.exists(), f"Missing CSV for {slug}"
        data = json.loads(jpath.read_text(encoding="utf-8"))
        assert data["latest_reporting_provinces"] == 31, f"{slug} latest complete year missing provinces"
        assert len(data["observations"]) > 0


def test_csv_matches_json_values():
    catalog = json.loads((WEB_DATA / "catalog.json").read_text(encoding="utf-8"))
    for ind in catalog["indicators"]:
        slug = ind["slug"]
        jdata = json.loads((WEB_DATA / "indicators" / f"{slug}.json").read_text(encoding="utf-8"))
        j_lookup = {(o["region_code"], o["year"]): o["value"] for o in jdata["observations"]}

        with (WEB_DATA / "csv" / f"{slug}.csv").open("r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        assert len(rows) == len(jdata["observations"]), f"Row count mismatch for {slug}"
        for r in rows[:60]:
            key = (r["region_code"], int(r["year"]))
            csv_val = None if r["value"] == "" else float(r["value"])
            j_val = j_lookup[key]
            if csv_val is None:
                assert j_val is None
            else:
                assert j_val is not None and abs(csv_val - j_val) < 1e-4, f"Mismatch {slug} {key}: csv={csv_val} json={j_val}"


def test_duckdb_no_fabricated_break_yoy():
    con = duckdb.connect(str(PIPELINE / "warehouse" / "china_data_atlas.duckdb"), read_only=True)
    # 2012-2014 physicians & 2012 hospital beds denominator breaks must have yoy_comparable = FALSE
    cnt_phys = con.execute(
        "SELECT COUNT(*) FROM fact_observation WHERE slug='physicians-per-1k' AND year IN (2012, 2013, 2014) AND yoy_comparable=TRUE"
    ).fetchone()[0]
    assert cnt_phys == 0
    cnt_beds = con.execute(
        "SELECT COUNT(*) FROM fact_observation WHERE slug='hospital-beds-per-1k' AND year=2012 AND yoy_comparable=TRUE"
    ).fetchone()[0]
    assert cnt_beds == 0
    # 2020 aging-65-share census year must be NULL for provinces (not interpolated)
    prov_2020 = con.execute(
        "SELECT COUNT(*) FROM fact_observation WHERE slug='aging-65-share' AND year=2020 AND NOT is_national AND value IS NOT NULL"
    ).fetchone()[0]
    assert prov_2020 == 0
    con.close()
