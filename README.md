# China Data Atlas · 中国数据地图

> **Make China's Data Accessible, Understandable, Traceable and Explorable.**

🌐 **Live Production Site (GitHub Pages)**: https://timkok.github.io/china-data-atlas-platform/

An independent, free, open-access statistical data visualization platform transforming official public data from China's National Bureau of Statistics (`data.stats.gov.cn`) into interactive charts, province dossiers, caliber-aware timelines, and clean downloadable CSVs.

## Key Capabilities (V0.1 MVP)

- **14 Verified Official Indicators** across 4 domains (**Demographics & Society**, **Economy & Income**, **Higher Education**, **Healthcare Resources**) covering all **31 Mainland provincial divisions + National benchmark** (`2000–2025`, **10,461 non-null official observations**).
- **Zero Synthetic / Fabricated Data**: Every raw snapshot is fetched directly from official NBS endpoints with SHA-256 digests and UTC fetch timestamps. Unreleased official years (e.g., 2010/2020 decennial census gaps in provincial sample tables, 2001–2004 disposable income provincial gaps) remain transparently null with un-interpolated line breaks.
- **Forensic Statistical Caliber Protection**: Major methodological breaks (e.g., 2012 hukou → resident population denominator shift in healthcare density and the 2013 NBS table anomaly; 2010/2020 censuses; 2019/2023 Economic Censuses) are explicitly marked on charts and automatically suppress non-comparable YoY calculations.
- **Compliant Spatial Visualization**: Respects 《地图管理条例》 by deferring unreviewed geographic border choropleths until a dedicated MNR review number (审图号) is obtained, shipping an equal-area **7-Region Provincial Matrix** (`华北、东北、华东、华中、华南、西南、西北`) with a pluggable `ChoroplethMapAdapter` ready for future approved base maps.
- **Bilingual Architecture & Semantic Search**: Chinese-first (`zh`) with live English (`en`) switch, instant search (`⌘K`) supporting acronyms (`GDP`, `老龄化`, `医师`) and direct jumps to **31 Province Dossiers** (`/provinces/[code]`).
- **Open Exports & Citations**: Tidy UTF-8 BOM CSV downloads, high-DPI PNG chart exports, URL-shareable chart state (`?year=&provinces=`), and copyable **GB/T 7714 / APA / BibTeX** citations.
- **V0.5 Preview Included**: Cross-indicator provincial scatter lab (`/compare`) with Pearson *r* and explicit correlation-vs-causation disclaimers.

## Architecture

```
Official NBS API (data.stats.gov.cn)
  → pipeline/raw/*.json (+ SHA-256 manifest)
  → pipeline/scripts/build_warehouse.py (DuckDB + Parquet + CSV)
  → pipeline/scripts/quality_gate.py (11 automated quality checks)
  → pipeline/scripts/export_web_data.py (precomputed static JSON + CSV)
  → web/ (Next.js 16 + TypeScript + Tailwind CSS + Apache ECharts)
```

## Reproducing the Data Pipeline

```bash
cd pipeline
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# 1. Fetch fresh official snapshots from NBS (optional; raw snapshots already audited)
.venv/bin/python scripts/ingest_nbs.py

# 2. Build normalized DuckDB warehouse, Parquet, and tidy CSVs
.venv/bin/python scripts/build_warehouse.py

# 3. Run the 11-check automated Data Quality Gate
.venv/bin/python scripts/quality_gate.py

# 4. Export static web JSON & CSV bundles + auto-generate docs/DATA_DICTIONARY.md
.venv/bin/python scripts/export_web_data.py

# 5. Run automated pipeline test suite
.venv/bin/pytest -v tests/test_quality_gate.py
```

## Running the Web Application Locally

```bash
cd web
npm install
npm run dev     # http://localhost:3000
npm run build   # Static SSG/SSR production build (55+ pages)
```

## Documentation

- [Phase 1 Research & Competitive Analysis](docs/PHASE1_RESEARCH.md)
- [Data Dictionary & Official Source Manifest](docs/DATA_DICTIONARY.md)
- [China Map Compliance & Adapter Specification](docs/MAP_COMPLIANCE.md)
