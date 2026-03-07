# Data Refresh Runbook (GEOM)

This runbook describes the end-to-end process to update GEOM datasets and keep Ex-Ante/Ex-Post tree graphs aligned with their PDF source trees.

Use this when you receive a new `geom_v2` delivery, new PDFs, new countries, or schema updates.

For a source-to-target mapping specifically focused on `geom_v2/` inputs, see [`GEOM_V2_DATA_GUIDE.md`](./GEOM_V2_DATA_GUIDE.md).

---

## 1. Scope and source of truth

### Frontend data source of truth

- `react-geom/public/data/processed/`
  - `final.csv`
  - `final_table.csv`
  - `results.csv`
- `react-geom/public/data/ex-ante/`
- `react-geom/public/data/ex-post/`
- `react-geom/public/data/alluvial/`
- `react-geom/public/data/pdp/`

### Backend metadata/PDF source of truth

- `express-geom/pdfs/<category>/`
- `express-geom/seed.const.js`
- `express-geom/seed.js`
- `express-geom/countries.const.js`

### Country/UI metadata

- `react-geom/public/countries.json`
- `react-geom/public/countryOptions.json`
- `react-geom/public/countries.geojson`
- `react-geom/public/world.geojson`

### PDF-tree alignment source

For Ex-Ante/Ex-Post tree chart consistency with PDFs, the source is the RData tree objects in `geom_v2`:

- Preferred:
  - `geom_v2/plots/trees/new/exante/`
  - `geom_v2/plots/trees/new/expost/`
- Fallback:
  - `geom_v2/estimates/Rdata/`
  - `geom_v2/plots/trees/update/`

---

## 2. Prerequisites

- Node.js 18+
- npm
- R + `jsonlite`
- Dependencies installed in monorepo root (`npm install`)

Optional check:

```bash
Rscript --version
Rscript -e "library(jsonlite); cat('jsonlite ok\n')"
```

---

## 3. Place new raw files

1. Copy new raw delivery to `geom_v2/` (or update existing subfolders in place).
2. Copy/update frontend static datasets under `react-geom/public/data/...`.
3. Copy new PDFs to `express-geom/pdfs/<category>/`.

If this release includes country changes:

1. Update `express-geom/countries.const.js`.
2. Update `react-geom/public/countries.json`.
3. Update `react-geom/public/countryOptions.json`.
4. Update map geojson files only if geography changes are required.

---

## 4. Rebuild Ex-Ante/Ex-Post tree JSONs from PDF-source RData

This step ensures the tree graph structure matches the PDF decomposition logic.

### Default rebuild command

```bash
npm run data:trees:rebuild
```

Script:
- `scripts/rebuild_tree_from_rdata.R`

What it does:

1. Loads tree objects from RData (supports both `constparty` and `tree_tr$tree` shapes).
2. Reconstructs tree node structure (`nodeName`, `split_condition`, `children`).
3. Aligns leaf nodes to bubble CSV `Box_Number`.
4. Writes output to:
   - `react-geom/public/data/ex-ante/tree/<COUNTRY>_<YEAR>_exante.json`
   - `react-geom/public/data/ex-post/tree/<COUNTRY>_<YEAR>_expost.json`

### Rebuild a specific country/year set

Use one or more `--pair` arguments in format `OUT:SRC:YYYY,YYYY`:

```bash
Rscript scripts/rebuild_tree_from_rdata.R \
  --pair USA:USA:2016,2018 \
  --pair UK:GBR:2009,2011,2013,2015,2017,2019
```

`OUT` = filename country code used by frontend files.
`SRC` = source code used in `geom_v2` RData/labels naming (can differ, e.g. `UK:GBR`).

---

## 5. Validate tree/bubble integrity

Run:

```bash
npm run data:trees:validate
```

Script:
- `scripts/validate_tree_bubble_alignment.R`

Checks:

1. Tree leaf count and depth are parseable.
2. Every tree leaf `Box_Number` exists in the corresponding bubble CSV.

The command exits non-zero on mismatch.

---

## 6. Seed backend PDF metadata

After adding/removing PDFs:

```bash
cd express-geom
npm run seed
```

This regenerates `express-geom/db.json` from `seed.const.js`.

---

## 7. Build sanity checks

Frontend:

```bash
cd react-geom
npm run build
```

Backend smoke:

```bash
cd express-geom
npm run dev
```

Then verify endpoints, for example:

`GET /api/files/pdf?category=ex-ante&country=USA&year=2018`

---

## 8. One-command workflow

From monorepo root:

```bash
npm run data:sync:pdf-trees
```

This runs:

1. Tree rebuild from RData.
2. Tree/bubble validation.
3. Backend seed.
4. Frontend production build.

---

## 9. Manual QA checklist

1. Open country page and check Ex-Ante and Ex-Post tree graphs.
2. Confirm tree splits/legend behavior are consistent with PDF narrative.
3. Hover tree nodes and bubble nodes:
   - no runtime errors,
   - linked highlighting works,
   - tooltips show correct type metadata.
4. Check alluvial hover tooltips for countries updated in this cycle.
5. Verify selector options contain intended country list.
6. Verify Albania removal or other deprecations are reflected in:
   - selector,
   - processed CSV rows,
   - backend country validation,
   - PDF metadata.

---

## 10. Troubleshooting

### RData load warnings about missing namespaces (`partykit`, `mlt`, etc.)

These can appear during `load()` because serialized objects reference package namespaces. If files still write correctly and validation passes, this is acceptable for conversion.

### `missing bubble` messages during rebuild

The tree rebuild expects bubble CSV to exist first:

- `react-geom/public/data/ex-ante/bubble-plot/...`
- `react-geom/public/data/ex-post/bubble-plot/...`

Create/copy those files before rebuilding trees.

### Validation failure (`missingBoxInBubble > 0`)

Most common causes:

1. Tree leaf IDs do not map to bubble `Box_Number`.
2. Bubble file belongs to a different release/version.
3. Country/year mismatch between tree and bubble inputs.

Fix by replacing the inconsistent bubble or rebuilding from matched source files.

---

## 11. Change management notes

For each release PR, include:

1. List of changed data files.
2. List of country metadata changes.
3. List of seeded PDF records changes.
4. Build and validation outputs.
5. Any unresolved schema assumptions.
