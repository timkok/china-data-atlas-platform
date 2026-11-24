# China Data Atlas | 数据字典与官方来源清单 (Data Dictionary)

> 自动生成时间 (UTC): `2026-11-24 02:47:03Z`  
> 官方数据来源：中华人民共和国国家统计局国家数据发布库 (`https://data.stats.gov.cn/`)  
> 覆盖地理范围：中国大陆31个省级行政区 + 全国基准（港澳台地区采用独立统计制度，未纳入分省口径，不构成地理归属判断）

## 一、核心指标清单与覆盖范围

| Indicator ID | 中文名称 | 英文名称 | 分类 | 单位 | 覆盖年份 | 最新完整分省年份 | 有效观测数 | 转换规则 |
|---|---|---|---|---|---|---|---|---|
| `CHN_POP_RESIDENT` | 年末常住人口 | Resident Population (Year-End) | demographics | 万人 | 2000–2025 | 2025 (31/31) | 832 | `direct` |
| `CHN_POP_BIRTH_RATE` | 人口出生率 | Crude Birth Rate | demographics | ‰ | 2000–2025 | 2024 (31/31) | 799 | `direct` |
| `CHN_POP_NATURAL_GROWTH` | 人口自然增长率 | Natural Population Growth Rate | demographics | ‰ | 2000–2025 | 2024 (31/31) | 799 | `direct` |
| `CHN_POP_URBANIZATION` | 常住人口城镇化率 | Urbanization Rate | demographics | % | 2000–2025 | 2024 (31/31) | 646 | `ratio_pct` |
| `CHN_POP_AGING_65` | 65岁及以上人口占比 | Population Share Aged 65+ | demographics | % | 2000–2025 | 2024 (31/31) | 677 | `ratio_pct` |
| `CHN_ECON_GDP` | 地区生产总值 (GDP) | Gross Regional Product (GDP) | economy | 亿元 | 2000–2025 | 2025 (31/31) | 832 | `direct` |
| `CHN_ECON_GDP_PER_CAPITA` | 人均地区生产总值 (人均 GDP) | GDP per Capita | economy | 元/人 | 2000–2025 | 2025 (31/31) | 832 | `direct` |
| `CHN_ECON_INCOME` | 全体居民人均可支配收入 | Per Capita Disposable Income | economy | 元 | 2000–2025 | 2025 (31/31) | 708 | `direct` |
| `CHN_ECON_CONSUMPTION` | 全体居民人均消费支出 | Per Capita Consumption Expenditure | economy | 元 | 2000–2025 | 2025 (31/31) | 708 | `direct` |
| `CHN_ECON_RETAIL` | 社会消费品零售总额 | Total Retail Sales of Consumer Goods | economy | 亿元 | 2000–2025 | 2025 (31/31) | 832 | `direct` |
| `CHN_EDU_HIGHER_ENROLLMENT` | 普通、职业本专科在校学生数 | Higher Education Enrollment (Undergrad & Vocational) | education | 万人 | 2000–2025 | 2024 (31/31) | 801 | `direct` |
| `CHN_EDU_HIGHER_SCHOOLS` | 普通、职业高等学校数量 | Regular & Vocational Higher Education Institutions | education | 所 | 2000–2024 | 2024 (31/31) | 800 | `direct` |
| `CHN_HLTH_PHYSICIANS_1K` | 每千人口执业（助理）医师数 | Licensed (Assistant) Physicians per 1,000 Population | healthcare | 人/千人 | 2000–2024 | 2024 (31/31) | 676 | `scale_div_10` |
| `CHN_HLTH_BEDS_1K` | 每千人口医疗卫生机构床位数 | Health Institution Beds per 1,000 Population | healthcare | 张/千人 | 2002–2024 | 2024 (31/31) | 519 | `scale_div_10` |

## 二、CSV 下载文件字段定义

| 字段名 | 类型 | 说明 |
|---|---|---|
| `indicator_id` | string | 平台唯一指标编码（如 `CHN_ECON_GDP`） |
| `region_code` | string | GB/T 2260 6位省级行政区划代码；`000000` 表示全国基准 |
| `region_name_zh` | string | 官方中文地区名称 |
| `region_name_en` | string | 英文地区名称 |
| `region_group` | string | 中国七大地理大区代码（north/northeast/east/central/south/southwest/northwest/national） |
| `is_national` | boolean | 是否为全国基准记录 |
| `year` | integer | 统计年度（公历年） |
| `value` | number/null | 官方统计数值或经文档披露的精确衍生值；缺失严格留空 |
| `unit_zh` | string | 统计单位 |
| `data_status` | string | 数据状态：`official`（正式）、`preliminary`（2025年初步/快报）、`revised`（修订）、`unknown`（缺失） |
| `yoy_pct` | number/null | 同比变化率（%），仅在口径可比且非负基数时计算 |
| `yoy_diff` | number/null | 同比绝对变化量，仅在口径可比时计算 |
| `yoy_comparable` | boolean | 当年与上年是否处于同一可比统计口径 |
| `rank` | integer/null | 当年31省区市内排名（1为最高；全国基准留空） |
| `source_agency` | string | 数据发布机构（国家统计局） |
| `source_table` | string | 国家数据对应目录与数据表名称 |
| `source_url` | string | 官方来源入口链接 |
| `fetched_at` | string | 数据抓取 UTC 时间戳 |
