# Architecture

This document describes the system architecture, component responsibilities, data flow, and key design decisions for the GEOM platform.

---

## Table of Contents

- [High-Level Overview](#high-level-overview)
- [Package Structure](#package-structure)
- [Frontend Architecture](#frontend-architecture)
  - [Routing](#routing)
  - [State Management](#state-management)
  - [Visualization System](#visualization-system)
  - [Data Loading](#data-loading)
- [Backend Architecture](#backend-architecture)
  - [Server Setup](#server-setup)
  - [Database](#database)
  - [File Serving](#file-serving)
- [Data Flow](#data-flow)
- [Filtering System](#filtering-system)
- [Key Design Decisions](#key-design-decisions)

---

## High-Level Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                            Browser                                    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                        React SPA (port 3000)                    │  │
│  │                                                                 │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │  │
│  │  │  Header  │  │ Control  │  │  Footer  │  │ Visualization │  │  │
│  │  │          │  │  Panel   │  │          │  │  (D3 / React) │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │  │
│  │                                                                 │  │
│  │  Context: VisualizationContext | FilterContext | TreeBubble     │  │
│  └───────────────────────────┬─────────────────────────────────────┘  │
│                              │ REST (PDF only)                        │
└──────────────────────────────┼────────────────────────────────────────┘
                               │
                ┌──────────────▼──────────────┐
                │  Express API (port 3001)     │
                │                             │
                │  GET /api/files             │
                │  POST /api/files            │
                │  GET /api/files/pdf         │
                │                             │
                │  LowDB (db.json)            │
                │  PDFs filesystem            │
                └─────────────────────────────┘
```

**Key characteristic:** All data visualizations are driven by static CSV/JSON files bundled with or served alongside the React app. The Express backend is only used for PDF streaming.

---

## Package Structure

The repo is an npm workspace monorepo:

```
package.json              ← workspace root (no runtime code)
express-geom/             ← workspace: backend
react-geom/               ← workspace: frontend
```

Running `npm install` at the root installs dependencies for both workspaces.

---

## Frontend Architecture

### Routing

Routing is handled by React Router v6 (`BrowserRouter`). Two primary routes exist:

| Route | Component | Description |
|-------|-----------|-------------|
| `/world` | `App.js` (world view) | Global map, table, and time series |
| `/country` | `App.js` (country view) | Country-specific analyses |

Both routes render within the same `App.js` layout (Header → ControlPanel → visualization → Footer). The active route drives which visualization components are mounted.

### State Management

State is distributed across three React Contexts, avoiding a dedicated state library:

#### `VisualizationContext`
(`src/contexts/Visualization.context.js`)

Tracks the currently active visualization type. Components read this to know which chart to render.

```
visualization: 'map' | 'table' | 'chart' | 'ante' | 'post' | 'alluvial' | 'descriptive' | 'countryTable'
```

#### `FilterContext`
(`src/contexts/Filter.context.js`)

Manages all active filter selections and available options. Includes:
- `measure` — Gini / MLD
- `perspective` — Ex-Ante RF / Ex-Post Tree
- `approach` — Absolute / Relative
- `variable` — Income / Consumption / Both
- `country` — selected country ISO code
- `year` — selected year
- `region` — Africa / Asia / Europe / LATAM / North America

Filter options are initialized from `utils/initializeFilters.js` and `utils/filters.js`.

#### `TreeBubbleContext`
(`src/contexts/TreeBubble.context.js`)

Tracks hover state for linked tree/bubble plot interactions. When a user hovers a node in the tree, the corresponding bubble is highlighted and vice versa.

### Visualization System

Visualizations are selected via `VisualizationSelector.js` in the `ControlPanel`. Each visualization is an independent component:

| Component | Type | Library | Data Source |
|-----------|------|---------|-------------|
| `Map.js` | Choropleth world map | D3.js | `final.csv` + `world.geojson` |
| `Table.js` | Data grid | React | `final_table.csv` |
| `TimeSeries.js` | Line chart | D3.js | `final.csv` |
| `TreeGraph.js` | Hierarchical tree | D3.js | `ex-ante/tree/*.json` |
| `BubblePlot.js` | Bubble chart | D3.js | `ex-ante/bubble-plot/*.json` |
| `Alluvial.js` | Sankey/alluvial | D3.js | `alluvial/links/*.json` + `alluvial/nodes/*.json` |
| `Decomposition.js` | Bar/area chart | D3.js | `ex-ante/decomposition/*.json` |
| `PdpGrid.js` | Grid of line charts | D3.js | `pdp/*.json` |
| `PDFViewer.js` | PDF embed | @react-pdf-viewer | Express API |
| `TypesDescription.js` | Type descriptions | React | `ex-post/types/*.json` |

All D3 visualizations use `ResizeObserver` to rerender when their container dimensions change.

### Data Loading

#### CSV Data (`useDataFetch` hook)

`src/hooks/useDataFetch.js` loads three CSV files once on mount:

| File | Content |
|------|---------|
| `public/data/processed/final.csv` | World-level time series indicators |
| `public/data/processed/final_table.csv` | Tabular summary data |
| `public/data/processed/results.csv` | Per-country results |

Data is parsed client-side (no server involvement) and stored in component state via the hook.

#### Per-Visualization JSON Data

Individual visualization components fetch their own JSON data files from `public/data/` using the `fetch` API or D3's `d3.json()`. File paths are constructed from the current filter selections (country, year, measure, etc.).

#### PDF URLs (`usePdfUrls` hook)

`src/hooks/usePdfUrls.js` constructs URLs for the Express API:

```
GET http://localhost:3001/api/files/pdf?category=<cat>&country=<iso>&year=<year>
```

The URL is passed to `PDFViewer.js` which renders the PDF inline using `@react-pdf-viewer`.

---

## Backend Architecture

### Server Setup

`express-geom/index.js` bootstraps Express with:

1. **Helmet** — sets security-relevant HTTP headers
2. **CORS** — allows all origins (`*`) for development; should be restricted in production
3. **express.json()** — parses JSON request bodies
4. **Route mount** — `/api/files` → `routes/file.routes.js`

The server listens on `PORT` (env var) or falls back to `3001`.

### Database

The backend uses **LowDB v1** (`lowdb@1.0.0`) with a synchronous `FileSync` adapter. The database is a single JSON file (`db.json`) with the shape:

```json
{
  "files": [
    {
      "id": "...",
      "category": "ex-ante",
      "country": "BRA",
      "year": 2020,
      "filename": "BRA_2020.pdf"
    }
  ]
}
```

> **Note:** LowDB v1 uses synchronous file I/O. This is acceptable for a low-traffic research tool but would need upgrading (to LowDB v3+ or a proper database) under heavier load.

The database is populated by running `npm run seed` which reads `seed.const.js` and writes entries to `db.json`.

### File Serving

`routes/file.routes.js` exposes three endpoints:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/files` | Returns all file records from the DB |
| `POST` | `/api/files` | Creates a new file record |
| `GET` | `/api/files/pdf` | Streams a PDF file by category/country/year |

The PDF endpoint:
1. Validates query parameters with **Joi** (`validate.js`)
2. Looks up the record in LowDB
3. Resolves the absolute file path within `express-geom/pdfs/<category>/`
4. Pipes the file stream to the response with `Content-Type: application/pdf`

---

## Data Flow

### World View (Map / Table / Chart)

```
App mount
  └─ useDataFetch()
       ├─ fetch /public/data/processed/final.csv
       ├─ fetch /public/data/processed/final_table.csv
       └─ fetch /public/data/processed/results.csv
            └─ data stored in hook state
                 └─ passed as props to Map / Table / TimeSeries
```

### Country View (Ex-Ante / Ex-Post / etc.)

```
User selects country + year + analysis type
  └─ FilterContext updates
       └─ Visualization component derives file path
            └─ fetch /public/data/<type>/<country>_<year>.json
                 └─ D3 renders chart
```

### PDF Rendering

```
User clicks PDF tab
  └─ usePdfUrls() generates API URL
       └─ PDFViewer fetches PDF
            └─ GET /api/files/pdf?category=...&country=...&year=...
                 └─ Express validates → looks up DB → streams file
                      └─ @react-pdf-viewer renders inline
```

---

## Filtering System

Filters cascade: changing a high-level filter (e.g., region) resets lower-level ones (e.g., country → year).

**Filter hierarchy:**

```
Region
  └─ Country
       └─ Year
            └─ Measure (Gini / MLD)
                 └─ Perspective (Ex-Ante / Ex-Post)
                      └─ Approach (Absolute / Relative)
                           └─ Variable (Income / Consumption / Both)
```

Filter options for the country dropdown are loaded from `public/countryOptions.json`. Year options are derived dynamically from the CSV data for the selected country.

---

## Key Design Decisions

### Static CSV over API endpoints

All time series and summary data is shipped as static CSV files rather than served via API. This simplifies deployment (no database reads for chart data), but means data updates require a new build.

### LowDB for PDF metadata

Using a JSON file as a database keeps the backend dependency-light. The only data stored is which PDFs exist. In the current architecture the seeding is a manual step.

### No Redux / Zustand

Three React Contexts are sufficient given the relatively small shared-state surface. Adding a dedicated state library would introduce boilerplate without clear benefit at this scale.

### D3 with ResizeObserver

Rather than using a charting library (e.g., Recharts, Victory), D3.js is used directly for maximum control over the custom visualizations (alluvial, tree, decomposition). ResizeObserver replaps window resize events for more accurate container-aware rerendering.

### PUBLIC_URL for WordPress embedding

The production build target is a WordPress site using the ReactPress plugin. The `PUBLIC_URL` is therefore set to `/wp-content/reactpress/apps/react-geom/build`. This must be changed if deploying to a different host path.
