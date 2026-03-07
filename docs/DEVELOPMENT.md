# Development Guide

This guide documents local setup and day-to-day development for the current repository state.

## Prerequisites

- Node.js 18+
- npm 8+
- Git
- R + `jsonlite` (only for tree rebuild/validation tasks)

## Local Setup

### 1. Clone and enter repository

```bash
git clone <repo-url>
cd geom
```

### 2. Install dependencies

```bash
npm install
```

### 3. Frontend env file

```bash
cp react-geom/.env.example react-geom/.env
```

Set at least:

```env
REACT_APP_API_URL=http://localhost:3001
```

### 4. Seed backend database

```bash
cd express-geom
npm run seed
cd ..
```

### 5. Start services

Terminal 1 (backend):

```bash
cd express-geom
npm run dev
```

Terminal 2 (frontend):

```bash
cd react-geom
npm start
```

## Development Workflow

### Branching

Repository currently uses `main` as the primary branch. Use feature/fix branches off `main`.

Example:

```bash
git checkout main
git pull origin main
git checkout -b feat/GEOM-<id>/<short-description>
```

### Commit messages

Commitlint is configured with Conventional Commits:

```text
<type>(<scope>): <subject>
```

Example:

```bash
git commit -m "fix(react-geom): handle empty country options"
```

## Testing

Root `npm test` is a placeholder and currently exits with error.

Use workspace-specific test commands:

```bash
# Backend tests
cd express-geom
npm test

# Frontend tests
cd ../react-geom
npm test
```

## Working with PDFs

### PDF location

PDF files are served from:

```text
express-geom/pdfs/<category>/<COUNTRY>_<YEAR>_all.pdf
```

Categories:
- `alluvial`
- `descriptive`
- `ex-ante`
- `ex-post`
- `types`

### Metadata seeding

`express-geom/seed.const.js` is the source for `express-geom/db.json`.

After updating seed data:

```bash
cd express-geom
npm run seed
```

## Data Refresh

Use the runbook for complete release workflow:
- [`./DATA_REFRESH_RUNBOOK.md`](./DATA_REFRESH_RUNBOOK.md)

Quick commands from repo root:

```bash
npm run data:trees:rebuild
npm run data:trees:validate
npm run data:sync:pdf-trees
```

## Deployment Notes

### Frontend

- Netlify config is in `netlify.toml`
- Root build script sets a WordPress ReactPress `PUBLIC_URL`

### Backend

- Express server currently listens on hardcoded port `3001`
- CORS is open (`origin: '*'`) by default
