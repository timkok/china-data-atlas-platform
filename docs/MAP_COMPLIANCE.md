# China Map Compliance Determination & Adapter Specification

## 1. Regulatory Verification Summary

Under China's statutory framework governing publicly distributed maps:
- **《中华人民共和国测绘法》** (Surveying and Mapping Law of the PRC)
- **《地图管理条例》第15条** (Regulations on Map Management): Publicly distributed maps are subject to official map review.
- **《地图审核管理规定》第6条** (Measures for the Administration of Map Review): Only unmodified, directly reproduced public-interest standard maps downloaded from the Ministry of Natural Resources (自然资源部标准地图服务系统) are exempt from re-review.

**Critical Compliance Finding for Interactive Statistical Maps**:
- Overlaying statistical choropleth colors, dynamic tooltips, or thematic graphics onto China's national or provincial boundaries constitutes **content modification / creation of a new thematic map (专题地图)** and is **NOT exempt from map review**.
- Re-distributing unverified third-party open-source GeoJSON files also introduces boundary-accuracy risk (e.g., omission or distortion of South China Sea islands inset, Diaoyu Islands, Aksai Chin, or South Tibet) and third-party licensing uncertainty.

## 2. V0.1 Compliant Decision

1. **Formally defer** rendering a geographic-boundary choropleth map of China until the platform obtains a dedicated **审图号 (GS-number)** from the Ministry of Natural Resources (or integrates an explicitly licensed, pre-approved map review service for interactive thematic overlays).
2. **Ship production-grade, fully compliant spatial alternatives**:
   - **7-Region Equal-Area Provincial Tile Matrix (`RegionalTileMatrix.tsx`)**: Organizes China's 31 mainland provincial divisions strictly as a structured statistical table/matrix by China's 7 standard geographic regions (华北、东北、华东、华中、华南、西南、西北) — zero geographic border geometry, superior mobile touch legibility for municipalities (Beijing, Tianjin, Shanghai, Chongqing) and smaller provinces (Hainan, Ningxia), synchronized year scrubber + play animation, hover legend pointer, and click-to-compare interactivity.
   - **31-Province Ranking Bar Chart (`ProvincialRankingChart.tsx`)** with national benchmark line and 7-region filtering.
   - **7-Region Distribution Strip Plot (`RegionalStripPlot.tsx`)** showing every province, regional medians, and national reference.
3. **Explicit Geographic & Statistical Scope Disclaimer**: Displayed in the spatial module, footer, and methodology page clarifying that NBS provincial annual series cover Mainland China's 31 provincial-level divisions, and that Hong Kong SAR, Macao SAR, and Taiwan operate independent statistical systems — missing values reflect statistical coverage only and never geographic attribution.

## 3. Future Upgrade Path (`ChoroplethMapAdapter`)

`web/src/components/charts/RegionalTileMatrix.tsx` exports the `ChoroplethMapAdapterProps` interface (`dataset`, `regions`, `selectedYear`, `selectedProvinces`, `onToggleProvince`). Once an officially reviewed MNR vector map and GS approval number are secured:
1. Place the verified base map asset and GS-number metadata in `web/public/maps/` (with mandatory attribution footer `"审图号：GS(20XX)XXXX号"`).
2. Implement `ApprovedChoroplethMap.tsx` conforming to `ChoroplethMapAdapterProps`.
3. Add a view toggle (`空间矩阵 | 地理地图`) inside Section 02 without changing any data schema or parent page logic.
