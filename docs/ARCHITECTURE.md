# Architecture

Current architecture of GEOM in this repository.

## High-Level Overview

- `react-geom` serves the SPA (world and country views, D3 visualizations).
- `express-geom` serves PDF files and basic metadata endpoints.
- Most analytical data is static CSV/JSON in frontend `public/data`.

## Monorepo Structure

```text
geom/
├── express-geom/
│   ├── index.js
│   ├── routes/file.routes.js
│   ├── seed.const.js
│   ├── db.json
│   └── pdfs/
├── react-geom/
│   ├── src/
│   └── public/
├── docs/
└── scripts/
```

## Frontend Architecture (`react-geom`)

### Routing

React Router routes:
- `/world`
- `/country`

Defined in `react-geom/src/utils/routes.js` and mounted from `App.js`.

### State Management

Primary contexts:
- `VisualizationContext`
- `FilterContext`
- `TreeBubble.context` (hover linkage between tree and bubble)

### Data Loading

`useDataFetch` loads CSV data from:
- `/data/processed/final.csv`
- `/data/processed/final_table.csv`
- `/data/processed/results.csv`

Visualization components load additional JSON/CSV assets from `react-geom/public/data/...`.

### PDF URL Construction

`usePdfUrls` builds frontend links for:

```text
<REACT_APP_API_URL>/api/files/pdf?category=<category>&country=<country>&year=<year>
```

## Backend Architecture (`express-geom`)

### Server

`index.js` configures:
- `express.json()`
- `cors({ origin: '*' })`
- `helmet()`
- route mount: `/api/files`

Port is currently hardcoded to `3001`.

### Database

LowDB (`db.json`) is seeded from `seed.const.js` using `npm run seed`.

`GET /api/files` returns a category map under `data`, for example:

```json
{
  "success": true,
  "data": {
    "ex-ante": [{ "country": "USA", "year": 2018 }]
  }
}
```

### PDF Serving

`GET /api/files/pdf`:
1. Validates query with Joi.
2. Resolves file path by convention.
3. Sends file from disk.

File naming convention used by the route:

```text
express-geom/pdfs/<category>/<COUNTRY>_<YEAR>_all.pdf
```

Note: the route currently serves by file naming convention and does not query LowDB before sending.

## Data Flow

### Charts (world/country)

1. React loads static CSV/JSON from `public/data`.
2. Filters update context state.
3. Visual components rerender with filtered data.

### PDFs

1. Frontend generates API URL from current country/year.
2. Backend validates `category`, `country`, `year`.
3. Backend streams matching PDF from `express-geom/pdfs`.

## Key Constraints

- Static data updates require frontend rebuild.
- Backend port and CORS are not environment-driven in current implementation.
- Root `npm test` is not wired to workspace tests.
