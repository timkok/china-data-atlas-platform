"""
Step 1: Official Data Ingestion from National Bureau of Statistics of China (data.stats.gov.cn).

Fetches public provincial (31 mainland provinces) and national annual time series (2000-2025)
plus official indicator annotations & remarks via the NBS publicrelease API.
Stores immutable raw JSON snapshots with UTC timestamps and SHA-256 digests in pipeline/raw/.
"""

import hashlib
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "indicators.json"
RAW_DIR = ROOT / "raw"

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Referer": "https://data.stats.gov.cn/dg/website/page.html",
    "Origin": "https://data.stats.gov.cn",
    "Content-Type": "application/json;charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
})


def request_json(method: str, url: str, **kwargs):
    last_err = None
    for attempt in range(4):
        time.sleep(0.35)
        try:
            r = SESSION.request(method, url, timeout=30, **kwargs)
            if r.status_code == 200 and r.text.strip().startswith(("{", "[")):
                return r.json()
            last_err = f"HTTP {r.status_code}: {r.text[:160]}"
        except Exception as exc:
            last_err = str(exc)
        print(f"  [retry {attempt + 1}/4] {method} {url}: {last_err}")
        time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"NBS request failed after 4 retries: {method} {url} -> {last_err}")


def fetch_indicator_metadata(base_url: str, cid: str) -> dict:
    resp = request_json("GET", f"{base_url}/new/queryIndicatorsByCid", params={"cid": cid})
    items = (resp.get("data") or {}).get("list") or []
    return {it["_id"]: it for it in items}


def fetch_provincial_series(base_url: str, root_id: str, da_catalog_id: str, cid: str, indicator_ids: list[str], date_range: str) -> dict:
    payload = {
        "cid": cid,
        "rootId": root_id,
        "indicatorIds": indicator_ids,
        "daCatalogId": da_catalog_id,
        "das": [],
        "showType": 3,
        "dts": [date_range],
    }
    return request_json("POST", f"{base_url}/stream/esData", json=payload)


def fetch_national_series(base_url: str, root_id: str, cid: str, indicator_ids: list[str], date_range: str) -> dict:
    payload = {
        "cid": cid,
        "rootId": root_id,
        "indicatorIds": indicator_ids,
        "daCatalogId": "",
        "das": [{"text": "全国", "value": "000000000000"}],
        "showType": 1,
        "dts": [date_range],
    }
    return request_json("POST", f"{base_url}/stream/esData", json=payload)


def save_json_with_hash(path: Path, payload: dict) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw_bytes = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
    path.write_bytes(raw_bytes)
    return hashlib.sha256(raw_bytes).hexdigest()


def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    api = cfg["api"]
    base_url = api["base_url"]
    date_range = api["date_range"]
    fetched_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Cache metadata per cid to avoid duplicate requests
    meta_cache: dict[str, dict] = {}
    manifest = {
        "fetched_at": fetched_at,
        "date_range": date_range,
        "source_api_base": base_url,
        "indicators": {},
    }

    # Fetch area catalog snapshot for provenance
    area_resp = request_json(
        "GET",
        f"{base_url}/getDasByDaCatalogId",
        params={"daCid": api["all_provinces_da_catalog_id"]},
    )
    area_hash = save_json_with_hash(RAW_DIR / "areas_provincial.json", area_resp)
    manifest["areas_sha256"] = area_hash
    print(f"[OK] Fetched provincial area catalog ({len(area_resp.get('data') or [])} divisions)")

    for ind in cfg["indicators"]:
        slug = ind["slug"]
        nbs = ind["nbs"]
        p_cid = nbs["provincial_cid"]
        n_cid = nbs["national_cid"]

        print(f"\n--> Ingesting [{slug}] {ind['name_zh']}...")
        if p_cid not in meta_cache:
            meta_cache[p_cid] = fetch_indicator_metadata(base_url, p_cid)
        if n_cid and n_cid not in meta_cache:
            meta_cache[n_cid] = fetch_indicator_metadata(base_url, n_cid)

        prov_meta = [meta_cache[p_cid].get(iid, {}) for iid in nbs["provincial_indicator_ids"]]
        nat_meta = [meta_cache[n_cid].get(iid, {}) for iid in nbs["national_indicator_ids"]] if n_cid else []

        # Fetch provincial data (one request per indicator_id when showType=3 to guarantee clean 31-province arrays)
        prov_series_by_id = {}
        for iid in nbs["provincial_indicator_ids"]:
            resp = fetch_provincial_series(
                base_url,
                api["provincial_root_id"],
                api["all_provinces_da_catalog_id"],
                p_cid,
                [iid],
                date_range,
            )
            prov_series_by_id[iid] = resp

        nat_series_by_id = {}
        if n_cid:
            for iid in nbs["national_indicator_ids"]:
                resp = fetch_national_series(
                    base_url,
                    api["national_root_id"],
                    n_cid,
                    [iid],
                    date_range,
                )
                nat_series_by_id[iid] = resp

        snapshot = {
            "indicator_id": ind["id"],
            "slug": slug,
            "fetched_at": fetched_at,
            "date_range": date_range,
            "provincial_cid": p_cid,
            "national_cid": n_cid,
            "provincial_metadata": prov_meta,
            "national_metadata": nat_meta,
            "provincial_raw": prov_series_by_id,
            "national_raw": nat_series_by_id,
        }
        out_path = RAW_DIR / f"{slug}.json"
        digest = save_json_with_hash(out_path, snapshot)

        # Quick summary count
        p_blocks = len((prov_series_by_id[nbs["provincial_indicator_ids"][0]] or {}).get("data") or [])
        n_blocks = len((nat_series_by_id[nbs["national_indicator_ids"][0]] or {}).get("data") or []) if n_cid else 0
        print(f"  [OK] Saved {out_path.name} (prov_year_blocks={p_blocks}, nat_year_blocks={n_blocks}, sha256={digest[:12]})")

        manifest["indicators"][slug] = {
            "indicator_id": ind["id"],
            "file": out_path.name,
            "sha256": digest,
            "fetched_at": fetched_at,
            "prov_year_blocks": p_blocks,
            "nat_year_blocks": n_blocks,
        }

    save_json_with_hash(RAW_DIR / "manifest.json", manifest)
    print(f"\n=== INGESTION COMPLETE: {len(cfg['indicators'])} official NBS indicators saved to {RAW_DIR} ===")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
