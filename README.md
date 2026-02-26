# GEOM — Global Estimates of Opportunity and Mobility

A full-stack monorepo for visualizing and analyzing global inequality and mobility data. The platform provides interactive visualizations including choropleth maps, time series charts, alluvial diagrams, tree decompositions, and bubble plots, along with downloadable PDF reports per country.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Coding Rules](#coding-rules)
- [Troubleshooting](#troubleshooting)

---

## Overview

GEOM is a research data platform presenting country-level indicators on inequality of opportunity and mobility (e.g., Gini, MLD). Users can explore results through a world map view, filter by region/country/year, and drill into detailed per-country analyses including:

- **Ex-Ante analysis** — predicted inequality using Random Forest
- **Ex-Post analysis** — decomposed inequality from tree-based models
- **Alluvial diagrams** — flow of mobility across categories
- **Descriptive statistics** — summary tables and PDFs
- **Decomposition charts** — variable contribution breakdowns
- **Partial Dependence Plots (PDP)** — model sensitivity analysis

---

## Architecture

The monorepo contains two packages managed via npm workspaces:

```
mono-geom/
├── express-geom/   ← Node.js/Express REST API (port 3001)
└── react-geom/     ← React SPA (port 3000 in dev)
```

**Data flow:**

1. The React frontend loads CSV datasets from `/public/data/` at startup.
2. Visualizations are rendered client-side using D3.js.
3. PDF reports are fetched on-demand from the Express backend via `/api/files/pdf`.
4. The backend reads PDFs from the local filesystem (`/pdfs/`) and streams them to the client.
5. A LowDB JSON file (`db.json`) tracks available file metadata.

For a detailed architecture diagram and component breakdown, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Project Structure

```
geom-deploy-v7/
├── express-geom/               # Backend package
│   ├── index.js                # Server entry point
│   ├── low-database.js         # LowDB setup
│   ├── seed.js                 # Database seeding script
│   ├── seed.const.js           # Seed data constants
│   ├── countries.const.js      # Country code mappings
│   ├── db.json                 # LowDB data file (gitignored)
│   ├── routes/
│   │   └── file.routes.js      # /api/files routes
│   ├── utils/
│   │   └── validate.js         # Joi validation helpers
│   ├── pdfs/                   # PDF storage by category
│   │   ├── alluvial/
│   │   ├── descriptive/
│   │   ├── ex-ante/
│   │   ├── ex-post/
│   │   └── types/
│   └── test/
│       └── index.test.js
│
├── react-geom/                 # Frontend package
│   ├── public/
│   │   ├── index.html
│   │   ├── countries.json      # Country metadata
│   │   ├── countries.geojson   # Country boundaries
│   │   ├── world.geojson       # World boundaries
│   │   ├── countryOptions.json # Dropdown options
│   │   ├── tooltips.json       # Tooltip text
│   │   └── instructions.json   # UI help content
│   ├── src/
│   │   ├── App.js              # Root component & routing
│   │   ├── index.js            # React entry point
│   │   ├── contexts/           # React Context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── components/         # UI components
│   │   ├── utils/              # Helpers and constants
│   │   └── public/data/        # Static CSV/JSON datasets
│   │       ├── processed/      # World & country CSVs
│   │       ├── ex-ante/        # Ex-ante data (tree, bubble, decomp)
│   │       ├── ex-post/        # Ex-post data
│   │       ├── alluvial/       # Alluvial link/node data
│   │       └── pdp/            # Partial dependence plot data
│   ├── Dockerfile
│   ├── .env
│   └── .env.example
│
├── legacy/                     # Archived v1 code (HTML/JS/CSS)
├── docs/                       # Extended documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEVELOPMENT.md
├── netlify.toml                # Netlify deployment config
├── commitlint.config.js        # Commit message rules
└── package.json                # Workspace root
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18.x |
| npm | 8+ |

### Install dependencies

From the repo root, install all workspace dependencies:

```bash
npm install
```

### Seed the backend database

Before running the backend for the first time, populate the LowDB database:

```bash
cd express-geom
npm run seed
```

### Run in development

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd express-geom
npm run dev
# Starts on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd react-geom
npm start
# Starts on http://localhost:3000
```

---

## Available Scripts

### Root

| Command | Description |
|---------|-------------|
| `npm test` | Run all workspace tests |
| `npm run build` | Build React app for production |
| `npm run prepare` | Install Husky git hooks |

### Backend (`express-geom`)

| Command | Description |
|---------|-------------|
| `npm start` | Start Express server on port 3001 |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm test` | Run Jest tests |
| `npm run seed` | Seed `db.json` from `seed.const.js` |

### Frontend (`react-geom`)

| Command | Description |
|---------|-------------|
| `npm start` | Start CRA dev server on port 3000 |
| `npm run build` | Production build to `/build` |
| `npm test` | Run Jest tests in watch mode |
| `npm run eject` | Eject from CRA (irreversible) |

---

## Environment Variables

The frontend reads from `react-geom/.env`. Copy the example file to get started:

```bash
cp react-geom/.env.example react-geom/.env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `http://localhost:3001` | Base URL for the Express backend |
| `REACT_APP_VERSION` | `0.2.0` | App version shown in the UI |

---

## Deployment

### Netlify (Frontend)

Deployment is configured in [`netlify.toml`](netlify.toml):

- **Build base:** `react-geom/`
- **Build command:** `CI=false npm run build`
- **Publish directory:** `build/`
- Husky is skipped during CI via `HUSKY_SKIP_INSTALL=1`

Push to the main branch to trigger a Netlify deploy.

### Docker (Frontend)

A multi-stage Dockerfile is provided in `react-geom/`:

```bash
cd react-geom
docker build -t geom-app .
docker run -p 80:80 geom-app
```

The image uses Node 18 to build, then serves the static output via Nginx on port 80.

### Backend

The Express server is intended to run on a Node-capable host (e.g., a VPS or container). Ensure the `/pdfs` directory is populated before starting.

For a full deployment walkthrough, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

---

## Coding Rules

### Branches

| Branch | Purpose |
|--------|---------|
| `main` (or `master`) | Production |
| `develop` | Active development |

### Branch Naming

```
<type>/GEOM-<id>/<short-description>
```

Examples:
- `feat/GEOM-42/add-alluvial-filter`
- `fix/GEOM-17/map-tooltip-positioning`
- `test/GEOM-8/update-api-tests`

### Commit Message Format

Follows the [Angular Conventional Commits](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines) spec, enforced via `commitlint`:

```
<type>(<scope>): <subject>
```

**Types:**

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure, no feature/bug |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `build` | Build system or dependencies |
| `ci` | CI configuration |
| `chore` | Maintenance tasks |
| `revert` | Revert a previous commit |

**Scopes:** `express-geom`, `react-geom`, `data`, `legacy`, `public`

Examples:
```
feat(react-geom): add region filter to world map
fix(express-geom): handle missing PDF file gracefully
docs(public): update tooltips for ex-ante view
```

### Code Review Process

1. Create a PR targeting `develop` following the branch naming convention.
2. Ensure your branch is up-to-date with `develop`.
3. Add relevant labels and request a review from at least one team member.
4. Reviewer checks: tests pass, logic is sound, style is consistent.
5. Obtain approval before merging.

---

## Troubleshooting

**npm install fails**
Check the [npm status page](https://status.npmjs.org/) for outages. Also try deleting `node_modules` and `package-lock.json` and running `npm install` again.

**Backend returns 404 for PDFs**
Ensure the `express-geom/pdfs/` directories are populated with PDF files and that `npm run seed` has been run to register them in `db.json`.

**`db.json` not found error**
Run `npm run seed` inside `express-geom/` to initialize the database.

**React app shows blank page after build**
The `PUBLIC_URL` is set to a WordPress ReactPress path. If deploying elsewhere, update the `PUBLIC_URL` value in the root `package.json` build script or set it as an environment variable.

**Port conflicts**
The frontend defaults to port 3000 and the backend to port 3001. If those ports are in use, set `PORT=<n>` before starting each server, and update `REACT_APP_API_URL` accordingly.

---

## Further Reading

- [Architecture & Data Flow](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Development Guide](docs/DEVELOPMENT.md)
