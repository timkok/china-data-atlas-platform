import csv
import io
import json
from pathlib import Path
import pytest
import requests

BASE = "http://127.0.0.1:3100"
REPO_ROOT = Path(__file__).resolve().parents[2]
WEB_DATA = REPO_ROOT / "web" / "public" / "data"


def test_core_routes_ssr_and_seo():
    catalog = json.loads((WEB_DATA / "catalog.json").read_text(encoding="utf-8"))
    core_urls = [
        "/",
        "/indicators",
        "/compare",
        "/methodology",
        "/sitemap.xml",
        "/robots.txt",
        "/categories/demographics",
        "/categories/economy",
        "/categories/education",
        "/categories/healthcare",
        "/provinces/110000",
        "/provinces/310000",
        "/provinces/440000",
        "/provinces/510000",
    ]
    for path in core_urls:
        r = requests.get(f"{BASE}{path}", timeout=10)
        assert r.status_code == 200, f"{path} returned {r.status_code}"
        if not path.endswith((".xml", ".txt")):
            assert "<h1" in r.text.lower(), f"{path} missing H1 in SSR HTML"

    # Verify sitemap lists all indicators and provinces
    sm = requests.get(f"{BASE}/sitemap.xml", timeout=10).text
    for ind in catalog["indicators"]:
        assert f"/indicators/{ind['slug']}" in sm
    assert "/provinces/440000" in sm


def test_all_14_indicator_pages_and_csvs():
    catalog = json.loads((WEB_DATA / "catalog.json").read_text(encoding="utf-8"))
    assert len(catalog["indicators"]) == 14

    for ind in catalog["indicators"]:
        slug = ind["slug"]
        # 1. Indicator SSR page
        r = requests.get(f"{BASE}/indicators/{slug}", timeout=10)
        assert r.status_code == 200, f"/indicators/{slug} failed"
        assert ind["name_zh"] in r.text
        assert "data.stats.gov.cn" in r.text
        assert ind["id"] in r.text

        # 2. CSV download endpoint
        rc = requests.get(f"{BASE}/data/csv/{slug}.csv", timeout=10)
        assert rc.status_code == 200, f"CSV missing for {slug}"
        text = rc.content.decode("utf-8-sig")
        rows = list(csv.DictReader(io.StringIO(text)))
        assert len(rows) > 300
        assert rows[0]["indicator_id"] == ind["id"]
        assert rows[0]["source_agency"] == "国家统计局"


def test_web_rendered_numbers_match_raw_nbs():
    # Spot check Population 2025 National (140,489) & Guangdong (12,859) in SSR HTML
    pop_html = requests.get(f"{BASE}/indicators/population", timeout=10).text
    assert "140,489" in pop_html
    assert "12,859" in pop_html

    # Spot check Disposable Income 2025 National (43,377) & Beijing (89,090) in SSR + Province Dossier
    inc_html = requests.get(f"{BASE}/indicators/disposable-income", timeout=10).text
    assert "43,377" in inc_html
    bj_html = requests.get(f"{BASE}/provinces/110000", timeout=10).text
    assert "89,090" in bj_html
