# GEOM_V2 Data Update Guide

This guide explains how to update or add project data using the input delivery under `geom_v2/`.

Use this guide together with [`DATA_REFRESH_RUNBOOK.md`](./DATA_REFRESH_RUNBOOK.md).

## 1. What `geom_v2` contains

`geom_v2/` is an input delivery folder. It includes raw/intermediate artifacts, not only frontend-ready files.

| Source folder | Typical contents | Used for |
| --- | --- | --- |
| `geom_v2/estimates/Rdata/` | `obj_exante_tree_*`, `obj_expost_tree_*` | Rebuilding tree JSONs consumed by frontend |
| `geom_v2/estimates/labels/` | `<YEAR>_<CODE>.csv` | Human-readable split labels in rebuilt trees |
| `geom_v2/estimates/pdp_new/`, `pdp_update/` | `pdp_<YEAR>_<CODE>.csv` | PDP files in `react-geom/public/data/pdp/` |
| `geom_v2/estimates/*.xlsx` | consolidated estimates/shapley/index files | Source for processed tables and decomposition updates |
| `geom_v2/plots/trees/*` | tree PDFs + RData | fallback tree sources and PDF updates |
| `geom_v2/plots/alluvial/*` | alluvial PDFs + RData | PDF updates; JSON links/nodes must be generated upstream |
| `geom_v2/plots/ecdf/*` | ECDF PDFs + RData | PDF updates where applicable |
| `geom_v2/documentation/` | replacement PDFs/docs | descriptive PDF replacements |
| `geom_v2/data/` | raw micro/record-level CSVs | input to upstream transforms, not directly consumed by current React assets |

Important: files in `geom_v2/data/` are not in the same schema as frontend bubble/decomposition assets, so they should not be copied directly into `react-geom/public/data/*`.

## 2. Target folders in this repo

| Target | Folder |
| --- | --- |
| Processed global tables | `react-geom/public/data/processed/` |
| Ex-Ante bubble | `react-geom/public/data/ex-ante/bubble-plot/` |
| Ex-Post bubble | `react-geom/public/data/ex-post/bubble-plot/` |
| Ex-Ante tree | `react-geom/public/data/ex-ante/tree/` |
| Ex-Post tree | `react-geom/public/data/ex-post/tree/` |
| Ex-Ante decomposition | `react-geom/public/data/ex-ante/decomposition/` |
| Ex-Post decomposition | `react-geom/public/data/ex-post/decomposition/` |
| Alluvial links/nodes | `react-geom/public/data/alluvial/{links,nodes}/` |
| PDP | `react-geom/public/data/pdp/` |
| Backend PDFs | `express-geom/pdfs/<category>/` |
| Backend metadata | `express-geom/seed.const.js` -> `express-geom/db.json` |

## 3. Naming rules you must keep

- Tree JSON output:
  - Ex-Ante: `<CODE>_<YEAR>_exante.json`
  - Ex-Post: `<CODE>_<YEAR>_expost.json`
- Bubble CSV:
  - Ex-Ante: `<CODE>_<YEAR>_exante.csv`
  - Ex-Post: `<CODE>_<YEAR>_expost.csv`
- Decomposition CSV:
  - `decomposition_<CODE>_<YEAR>_exante.csv`
  - `decomposition_<CODE>_<YEAR>_expost.csv`
- Alluvial JSON:
  - links: `<CODE>_<YEAR>_LINKS.json`
  - nodes: `<CODE>_<YEAR>_NODES.json`
- PDP CSV used by UI:
  - `pdp_<CODE>_<YEAR>.csv`
- Backend PDF path used by API:
  - `express-geom/pdfs/<category>/<CODE>_<YEAR>_all.pdf`

## 4. Country-code normalization rules

The delivery and app may use different codes for the same country in some datasets.

- Great Britain delivery files are often `GBR`; frontend selectors and most assets use `UK`.
- Tree rebuild supports this with `--pair UK:GBR:<years>`.
- For PDP and frontend assets, copy/rename to the code used by frontend filters (typically `UK`, not `GBR`).
- India has historical mixed casing in some files (`IND` vs `ind`). Tree/Bubble components have lowercase fallback; keep naming consistent for new files and prefer uppercase where possible.

## 5. End-to-end update flow from `geom_v2`

### Step A: Stage new delivery

1. Replace/update files under `geom_v2/`.
2. Review changed country-year pairs.

Example inventory commands:

```bash
find geom_v2/estimates/Rdata -name 'obj_*_tree_*_all.RData' | sort
find geom_v2/estimates/pdp_new geom_v2/estimates/pdp_update -name 'pdp_*.csv' | sort
find geom_v2/plots -name '*_all.pdf' | sort
```

### Step B: Update processed world/country tables

Update these files from the new release outputs:

- `react-geom/public/data/processed/final.csv`
- `react-geom/public/data/processed/final_table.csv`
- `react-geom/public/data/processed/results.csv`

These files are consumed directly by `useDataFetch`.

### Step C: Update per-visualization assets

1. Bubble plot CSVs (`ex-ante`/`ex-post`) from your transformed release outputs.
2. Decomposition CSVs from updated decomposition/shapley outputs.
3. Alluvial `NODES/ LINKS` JSON files from transformed alluvial outputs.
4. PDP files from `geom_v2/estimates/pdp_new` and `pdp_update` with target naming `pdp_<CODE>_<YEAR>.csv`.

Example PDP copy (with UK normalization):

```bash
cp geom_v2/estimates/pdp_new/pdp_2022_KAZ.csv react-geom/public/data/pdp/pdp_KAZ_2022.csv
cp geom_v2/estimates/pdp_new/pdp_2019_GBR.csv react-geom/public/data/pdp/pdp_UK_2019.csv
```

### Step D: Rebuild trees from `geom_v2` RData

From repo root:

```bash
npm run data:trees:rebuild
npm run data:trees:validate
```

To target specific country-year pairs:

```bash
Rscript scripts/rebuild_tree_from_rdata.R \
  --pair USA:USA:2016,2018 \
  --pair UK:GBR:2009,2011,2013,2015,2017,2019
```

### Step E: Update backend PDFs

Copy new/replacement PDFs to:

- `express-geom/pdfs/alluvial/`
- `express-geom/pdfs/descriptive/`
- `express-geom/pdfs/ex-ante/`
- `express-geom/pdfs/ex-post/`
- `express-geom/pdfs/types/`

Then ensure `express-geom/seed.const.js` includes the corresponding country/year entries.

Reseed:

```bash
cd express-geom
npm run seed
```

### Step F: Build and smoke test

```bash
# from repo root
npm run data:sync:pdf-trees

# optional local run
cd express-geom && npm run dev
cd ../react-geom && npm start
```

Check at least:
- `/world` loads map/table/chart without console data errors.
- Updated country-year loads tree, bubble, decomposition, alluvial, and PDP (if available).
- PDF tab and download button return the correct file.

## 6. Common failure patterns

- Missing tree/bubble alignment:
  - Run `npm run data:trees:validate` and fix missing `Box_Number` mappings.
- UK/GBR mismatch:
  - Use `--pair UK:GBR:<years>` in tree rebuild and rename frontend assets to `UK`.
- Missing PDFs despite seed update:
  - Ensure physical file exists under `express-geom/pdfs/<category>/<CODE>_<YEAR>_all.pdf`.
- PDP not rendering:
  - Verify filename is `pdp_<FILTER_CODE>_<YEAR>.csv` (filter code used in frontend, usually `UK`, `IND`, etc.).

## 7. Notes about `geom_v2/scripts`

`geom_v2/scripts/transform_alb_*.py` are ad-hoc examples for Albania and are not a complete general pipeline for all countries. Use them only as references if you need to build custom transforms.
