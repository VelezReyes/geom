# GEOM — Global Estimates of Opportunity and Mobility

Monorepo for the GEOM web application:
- `react-geom`: React frontend for interactive inequality/mobility visualizations.
- `express-geom`: Express backend used to serve PDFs.

## Contents

- [Quick Start](#quick-start)
- [Workspace Structure](#workspace-structure)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)
- [Data and PDF Refresh](#data-and-pdf-refresh)
- [Deployment](#deployment)
- [Additional Documentation](#additional-documentation)

## Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- R (only needed for tree rebuild/validation scripts)

### Install dependencies

From repository root:

```bash
npm install
```

### Seed backend metadata

```bash
cd express-geom
npm run seed
```

### Run locally

Terminal 1 (backend):

```bash
cd express-geom
npm run dev
# http://localhost:3001
```

Terminal 2 (frontend):

```bash
cd react-geom
npm start
# http://localhost:3000
```

## Workspace Structure

```text
geom/
├── express-geom/      # Express API + PDF files + seed metadata
├── react-geom/        # React app (Create React App)
├── docs/              # Project docs
├── scripts/           # R scripts for tree rebuild/validation
├── pdfs/              # Legacy/shared PDF artifact folder
└── legacy/            # Archived legacy implementation
```

## Scripts

### Root (`package.json`)

| Command | What it does |
| --- | --- |
| `npm run build` | Builds frontend using the WordPress/ReactPress `PUBLIC_URL` value configured at root |
| `npm run data:trees:rebuild` | Rebuilds tree JSON from RData (`scripts/rebuild_tree_from_rdata.R`) |
| `npm run data:trees:validate` | Validates tree/bubble alignment (`scripts/validate_tree_bubble_alignment.R`) |
| `npm run data:sync:pdf-trees` | Rebuild trees, validate, seed backend, and build frontend |
| `npm test` | Placeholder script; currently exits with error (`no test specified`) |

### Backend (`express-geom/package.json`)

| Command | What it does |
| --- | --- |
| `npm start` | Runs Express server |
| `npm run dev` | Runs server via nodemon |
| `npm run seed` | Regenerates `express-geom/db.json` from `seed.const.js` |
| `npm test` | Runs backend Jest tests |

### Frontend (`react-geom/package.json`)

| Command | What it does |
| --- | --- |
| `npm start` | Starts CRA dev server |
| `npm run build` | Creates production bundle |
| `npm test` | Runs frontend tests |
| `npm run eject` | Ejects CRA config (irreversible) |

## Environment Variables

Frontend env file: `react-geom/.env` (copy from `.env.example`).

Current template (`react-geom/.env.example`):

```env
PROTOCOL=
DOMAIN=
PORT=
REACT_APP_API_URL=$PROTOCOL://$DOMAIN:$PORT
REACT_APP_VERSION=
REACT_APP_SITE_TITLE=
```

Typical local value:

```env
REACT_APP_API_URL=http://localhost:3001
```

## Data and PDF Refresh

See the runbook for full release/update workflow:
- [`docs/DATA_REFRESH_RUNBOOK.md`](docs/DATA_REFRESH_RUNBOOK.md)

Common commands:

```bash
npm run data:trees:rebuild
npm run data:trees:validate
npm run data:sync:pdf-trees
```

## Deployment

### Frontend (Netlify)

Configured in `netlify.toml`:
- `base = "react-geom"`
- `command = "CI=false npm run build"`
- `publish = "build"`

### Backend

Run `express-geom` on a Node host and ensure `express-geom/pdfs/*` and `express-geom/db.json` are present and seeded.

Note: backend currently listens on hardcoded port `3001` in `express-geom/index.js`.

## Additional Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Data Refresh Runbook](docs/DATA_REFRESH_RUNBOOK.md)
- [GEOM_V2 Data Update Guide](docs/GEOM_V2_DATA_GUIDE.md)
