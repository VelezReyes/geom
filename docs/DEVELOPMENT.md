# Development Guide

This guide covers everything needed to set up a local development environment, work with the codebase, add new features, and deploy the application.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Development Workflow](#development-workflow)
- [Adding a New Visualization](#adding-a-new-visualization)
- [Adding a New Filter](#adding-a-new-filter)
- [Adding PDF Reports](#adding-pdf-reports)
- [Working with Data](#working-with-data)
- [Data Refresh Runbook](#data-refresh-runbook)
- [Testing](#testing)
- [Deployment](#deployment)
  - [Netlify](#netlify)
  - [Docker](#docker)
  - [Backend Server](#backend-server)
- [Known Limitations](#known-limitations)

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18.x | Use nvm for version management |
| npm | 8+ | Comes with Node 18 |
| Git | Any | With Husky hooks support |

Verify your versions:

```bash
node -v   # should print v18.x.x
npm -v    # should print 8.x.x or higher
```

---

## Local Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd geom-deploy-v7
```

### 2. Install all dependencies

From the repo root (installs both workspaces):

```bash
npm install
```

### 3. Configure environment variables

```bash
cp react-geom/.env.example react-geom/.env
```

The defaults work for local development — no changes needed unless you run the backend on a different port.

### 4. Seed the backend database

```bash
cd express-geom
npm run seed
cd ..
```

This reads `seed.const.js` and writes file records to `db.json`. Re-run this whenever PDFs are added or removed.

### 5. Start both services

**Terminal 1 — Backend:**
```bash
cd express-geom
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd react-geom
npm start
```

Open `http://localhost:3000` in your browser.

---

## Development Workflow

### Branches

Always branch from `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feat/GEOM-<id>/<description>
```

### Commits

Commits are linted via `commitlint` on every `git commit`. The format must be:

```
<type>(<scope>): <subject>
```

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
Valid scopes: `express-geom`, `react-geom`, `data`, `legacy`, `public`

Example:
```bash
git commit -m "feat(react-geom): add year slider to country view"
```

A pre-commit hook also runs `lint-staged` which lints JavaScript files before the commit is finalized.

### Pull Requests

1. Push your branch and open a PR targeting `develop`.
2. Ensure the PR title and description are clear.
3. Request at least one reviewer.
4. Merge only after approval.

---

## Adding a New Visualization

### 1. Create the component

Add a new file in `react-geom/src/components/` or `react-geom/src/`:

```jsx
// react-geom/src/components/MyChart.js
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

function MyChart({ data }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data) return;
    const svg = d3.select(svgRef.current);
    // D3 rendering logic here
  }, [data]);

  return <svg ref={svgRef} />;
}

export default MyChart;
```

### 2. Register the visualization type

Add the new type to the valid set in `react-geom/src/utils/routes.js` and update `VisualizationSelector.js` to include the new option.

### 3. Mount in App.js

In `react-geom/src/App.js`, add a conditional render in the appropriate route section:

```jsx
{visualization === 'myChart' && <MyChart data={csvData} />}
```

### 4. Add data file (if needed)

Place JSON data files in the appropriate subdirectory under `react-geom/src/public/data/`. Follow the existing naming convention: `<COUNTRY>_<YEAR>.json`.

---

## Adding a New Filter

### 1. Define the filter options

Add entries to `react-geom/src/utils/filters.js`:

```js
export const MY_FILTER_OPTIONS = [
  { value: 'optionA', label: 'Option A' },
  { value: 'optionB', label: 'Option B' },
];
```

### 2. Add to initial state

Update `react-geom/src/utils/initializeFilters.js` to set the default value.

### 3. Add to FilterContext

In `react-geom/src/contexts/Filter.context.js`, add the new state variable and expose it via the context value.

### 4. Add the UI control

In `react-geom/src/components/Filter.js`, add a `react-select` dropdown or radio group bound to the new context value.

### 5. Consume in visualization components

Read the new filter value from `FilterContext` in the relevant components and adjust the data file path or rendering accordingly.

---

## Adding PDF Reports

PDF files must be placed in the correct directory on the backend filesystem and registered in the database.

### 1. Place the PDF

```
express-geom/pdfs/<category>/<COUNTRY>_<YEAR>.pdf
```

Example:
```
express-geom/pdfs/ex-ante/BRA_2021.pdf
```

Valid categories: `alluvial`, `descriptive`, `ex-ante`, `ex-post`, `types`

### 2. Add the seed entry

Open `express-geom/seed.const.js` and add a record:

```js
{ category: 'ex-ante', country: 'BRA', year: 2021, filename: 'BRA_2021.pdf' }
```

### 3. Re-seed the database

```bash
cd express-geom
npm run seed
```

### 4. Verify

Start the backend and test:

```
GET http://localhost:3001/api/files/pdf?category=ex-ante&country=BRA&year=2021
```

---

## Working with Data

### CSV Data Updates

The three main CSV files live in `react-geom/src/public/data/processed/`:

| File | Update frequency | Notes |
|------|-----------------|-------|
| `final.csv` | Each data release | World-level indicators |
| `final_table.csv` | Each data release | Table summary |
| `results.csv` | Each data release | Country-level results |

After updating these files, rebuild the frontend to include the new data in the bundle.

### Adding a New Country

1. Add the ISO code and name mapping to `express-geom/countries.const.js`.
2. Add the country entry to `react-geom/public/countries.json`.
3. Add a dropdown entry to `react-geom/public/countryOptions.json`.
4. Ensure GeoJSON features in `countries.geojson` include the country.
5. Place the country's data JSON files in the appropriate `public/data/` subdirectories.
6. Add PDF files to `express-geom/pdfs/` and re-seed.

### Tooltip and Instruction Content

- **Tooltips:** Edit `react-geom/public/tooltips.json` — these are loaded at runtime.
- **Instructions:** Edit `react-geom/public/instructions.json` — these populate the help sidebar.

---

## Data Refresh Runbook

For the complete step-by-step process (data replacement, PDF/tree alignment, validation, seeding, and troubleshooting), use:

- [DATA_REFRESH_RUNBOOK.md](./DATA_REFRESH_RUNBOOK.md)

Quick commands from repo root:

```bash
npm run data:trees:rebuild
npm run data:trees:validate
npm run data:sync:pdf-trees
```

---

## Testing

### Run all tests

```bash
# From repo root
npm test
```

### Frontend tests only

```bash
cd react-geom
npm test
```

Tests use Jest + React Testing Library. Test files are co-located with components (`*.test.js`).

### Backend tests only

```bash
cd express-geom
npm test
```

Tests use Jest. The test file is at `test/index.test.js` and covers the `/api/files` endpoints.

### Writing tests

For new React components, create `ComponentName.test.js` alongside the component:

```jsx
import { render, screen } from '@testing-library/react';
import MyChart from './MyChart';

test('renders without crashing', () => {
  render(<MyChart data={[]} />);
});
```

For new API endpoints, add test cases to `express-geom/test/index.test.js`.

---

## Deployment

### Netlify

The frontend deploys automatically via Netlify when changes are pushed to the configured branch.

Configuration is in [`netlify.toml`](../netlify.toml):

```toml
[build]
  base = "react-geom"
  command = "CI=false npm run build"
  publish = "build"

[build.environment]
  HUSKY_SKIP_INSTALL = "1"
```

**Manual deploy:**
```bash
cd react-geom
CI=false npm run build
# Upload /build to Netlify manually via CLI or dashboard
```

**Important:** The `PUBLIC_URL` is currently set to `/wp-content/reactpress/apps/react-geom/build` in the root `package.json` build script. This is for WordPress/ReactPress embedding. Change it if deploying to a different host path.

### Docker

Build and run the frontend container:

```bash
cd react-geom
docker build -t geom-frontend .
docker run -p 80:80 geom-frontend
```

The Dockerfile uses a multi-stage build:
1. **Stage 1:** Node 18 — installs deps and builds React app
2. **Stage 2:** Nginx Alpine — serves the static `/build` output on port 80

### Backend Server

The Express backend requires a Node 18+ environment with the `/pdfs` directory populated.

```bash
cd express-geom
npm run seed          # initialize db.json
npm start             # start on port 3001 (or $PORT)
```

For production, consider running behind a reverse proxy (Nginx, Caddy) with:
- HTTPS termination
- Process management (PM2 or systemd)
- Restricted CORS origin (update `origin` in `index.js`)

---

## Known Limitations

| Issue | Location | Notes |
|-------|----------|-------|
| `MIN_YEAR` is hardcoded to 1970 | `react-geom/src/App.js` | Should be derived from CSV data |
| CORS allows all origins | `express-geom/index.js` | Restrict to frontend origin in production |
| PDF file existence not validated before streaming | `express-geom/routes/file.routes.js` | Add `fs.existsSync` check |
| No table pagination | `react-geom/src/components/Table.js` | Large datasets may be slow to render |
| LowDB v1 uses synchronous file I/O | `express-geom/low-database.js` | Fine for low traffic; upgrade for scale |
| Seeding is a manual step | `express-geom/seed.js` | Could be automated via a startup check |
| Legacy code is not removed | `legacy/` | Archived but still present in the repo |
