# Phase 1: Product Research, Competitive Analysis & MVP Scope

## 1. Reference Analysis: The Maps Daily (`https://themapsdaily.com/`)

Direct desktop (`1440×900`) and mobile (`390×844`) inspection of the homepage, category indexes, and dataset detail pages (`/posts/in-gross-state-domestic-product`, `/posts/in-birth-rate`) surfaced clear lessons:

### What Works Exceptionally Well (Adopt & Adapt)
1. **Editorial, Data-Journalism Aesthetic**: Clean light-mode canvas (`#FFFFFF` / `#F8FAFC`), crisp `1px` borders, editorial serif headlines paired with geometric sans-serif UI and `tabular-nums` alignment, and structured uppercase section eyebrows.
2. **Numbered Narrative Architecture**: Every dataset page tells a coherent quantitative story (Headline KPIs → Spatial Pattern → Historical Trajectory → Provincial Rankings & Movers → Regional Grouping → Interactive Lookup Table → Data Explorer → Sources & Methodology → Citation).
3. **Interactive Homepage Showcase**: A live multi-tab interactive preview above the fold immediately teaches visitors how the platform works before their first click.
4. **Radical Provenance & Completeness Transparency**: Coverage ratios (e.g., `31/31`), year spans, official source table links, transparent data-cleaning/revision disclosures, and copyable citations.
5. **Embedded Table Micro-Charts & Built-in Schema Profiler**: Benchmark bars inside tables and column-level missingness/range statistics inside the Data Explorer.

### Weaknesses to Avoid
1. **Literal-Only Search**: Searching `"GDP"` returned zero matches because titles used `"GSDP"`.
2. **UI Friction & Mobile Clipping**: Duplicate dropdown controls on map cards, truncated mobile tabs (`2 · On the ...`), clipped sticky nav links at `390px`, and unclickable tiny geographies on touchscreens.
3. **Siloed Indicators & Missing Shareable State**: No cross-indicator scatter exploration, no province dossier hub, and selected year/region filters are not persisted in URLs.

### How China Data Atlas Surpasses the Reference
1. **Semantic Bilingual Search (`中文 / English / 缩写 / 省份`)**: Instant matching across indicator aliases (`GDP`, `地区生产总值`, `老龄化`, `城镇化`), official NBS codes, and all 31 provinces.
2. **Statistical Caliber & Census Revision Awareness (口径说明与修订标识)**: Inline chart event markers for major Chinese statistical breaks (2013 城乡一体化住户调查改革, 2020 七普修订, 2023 五经普GDP修订) and strict prevention of misleading YoY comparisons across incompatible breaks.
3. **Province Dossier Pages (`/provinces/[code]`) & Cross-Indicator Explorer (`/compare`)**: Click any province from any chart to inspect its complete multi-domain profile, or compare any two indicators in a live scatter plot (laying the V0.5 foundation cleanly).
4. **Equal-Area 7-Region Provincial Matrix (Legal Map Compliance + Superior Mobile UX)**: Replaces an unapproved boundary choropleth with a compliant, crisp, equal-area interactive 7-region grid where Beijing, Shanghai, Tianjin, Chongqing, and Hainan are as legible and tappable as Xinjiang or Guangdong.
5. **URL-Persisted Interactive State + One-Click Chart Export & Citations**: Permalink sharing (`?year=2024&regions=440000,320000`), PNG export with source attribution, and GB/T 7714 / APA / BibTeX citation generators.

---

## 2. Chinese Map Compliance Determination

Under the **Surveying and Mapping Law of the PRC (《中华人民共和国测绘法》)**, **Regulations on Map Management (《地图管理条例》第15条)**, and **Measures for the Administration of Map Review (《地图审核管理规定》第6条)**:
- Publicly distributed online thematic maps—including overlaying statistical choropleth shading or interactive hover/click layers onto China's national or provincial boundaries—constitute content modification/new thematic map production and **are NOT exempt from official review (不能免审)**.
- Publishing an unreviewed third-party GeoJSON boundary map carries legal compliance risk and violates our product principles.

**V0.1 Decision**:
- **Formally defer** geographic boundary choropleth rendering until an officially reviewed base map with a valid Ministry of Natural Resources **审图号 (GS-number)** for interactive thematic display is obtained.
- **Ship a production-grade compliant spatial visualization**: an **Interactive 7-Region Provincial Grid Heatmap (分区域省级等面积矩阵图)** structured strictly by China's 7 standard geographic regions (华北、东北、华东、华中、华南、西南、西北) — depicting statistical data matrices with zero national/provincial geographic boundary geometry, paired with a pluggable `ChoroplethMapAdapter` architecture slot for future approved-map activation.
- **Transparent Coverage Scope Note**: Every indicator explicitly clarifies that NBS provincial annual datasets cover the 31 provincial-level administrative divisions of Mainland China; Hong Kong, Macao, and Taiwan operate independent statistical systems and their absence reflects statistical scope rather than geographic attribution.

---

## 3. Competitive Landscape (China Statistical Data)

| Platform | Authority | Modern UX | Free & Open | Provincial Depth | Core Gap Filled by China Data Atlas |
|---|---|---|---|---|---|
| 国家数据 (`data.stats.gov.cn`) | Official NBS | Low (legacy table UI) | Yes | High | Modern charts, storytelling, instant CSV, revision clarity |
| EPS 数据平台 | High | Low | No (institutional paywall) | Very High | Free public access & modern web UX |
| 财经M平方 (MacroMicro) | High | Very High | Freemium (Pro paywall) | Low (macro focus) | Deep 31-province social/economic coverage, free open CSV |
| Our World in Data | High | Very High | Yes | National only | China subnational (31 provinces) granularity from NBS |

---

## 4. MVP (V0.1) Product Scope

- **12 Core Official Indicators** across 4 domains (Demographics & Society, Economy & Income, Education, Healthcare) sourced directly from the National Bureau of Statistics of China (`data.stats.gov.cn` public release API), covering **31 Mainland provincial divisions + National benchmark**, **2000–latest available official year** (no fabricated or interpolated observations).
- **Pages**:
  - `/` — Editorial Homepage (Hero + Global Semantic Search + Featured 4-Tab Live Story + Category Directory + Key Data Findings + Latest Datasets + Source Trust Strip)
  - `/indicators` & `/categories/[category]` — Filterable Indicator Directory
  - `/indicators/[slug]` — Unified Data Story Page (Summary KPIs, 7-Region Interactive Matrix, Historical Trend + Multi-Province Comparison + Caliber Break Markers, Provincial Rankings + National Benchmark + Rank Movers, 7-Region Distribution Strip Plot, Data Explorer + Schema Profiler + CSV Download, Methodology & Citations)
  - `/provinces/[code]` — Provincial Data Dossier across all 12 indicators
  - `/compare` — Cross-Indicator Scatter & Province Comparison Lab (V0.5 foundation)
  - `/methodology` — Sources, Data Pipeline, Quality Gate, Map Compliance & Licensing
- **Bilingual Architecture**: Chinese-first (`zh`) with working English (`en`) UI & indicator metadata toggle.
