# API Reference

The Express backend (`express-geom`) exposes a REST API on port `3001` (configurable via `PORT` environment variable).

All endpoints are mounted under `/api/files`.

---

## Table of Contents

- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [GET /api/files](#get-apifiles)
  - [POST /api/files](#post-apifiles)
  - [GET /api/files/pdf](#get-apifilepdf)
- [Error Responses](#error-responses)
- [PDF Categories](#pdf-categories)
- [Security](#security)

---

## Base URL

**Development:** `http://localhost:3001`

Set via the frontend's `REACT_APP_API_URL` environment variable.

---

## Endpoints

### GET /api/files

Returns all file records stored in the database.

**Request**

```
GET /api/files
```

No parameters required.

**Response `200 OK`**

```json
[
  {
    "id": "abc123",
    "category": "ex-ante",
    "country": "BRA",
    "year": 2020,
    "filename": "BRA_2020.pdf"
  },
  ...
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique record identifier |
| `category` | string | PDF category (see [PDF Categories](#pdf-categories)) |
| `country` | string | ISO 3166-1 alpha-3 country code |
| `year` | number | Year of the report |
| `filename` | string | PDF filename on disk |

---

### POST /api/files

Creates a new file record in the database.

**Request**

```
POST /api/files
Content-Type: application/json
```

**Body**

```json
{
  "category": "ex-ante",
  "country": "BRA",
  "year": 2020,
  "filename": "BRA_2020.pdf"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | string | Yes | One of the valid PDF categories |
| `country` | string | Yes | ISO 3166-1 alpha-3 country code |
| `year` | number | Yes | Report year |
| `filename` | string | Yes | Filename of the PDF on disk |

**Response `201 Created`**

```json
{
  "id": "abc123",
  "category": "ex-ante",
  "country": "BRA",
  "year": 2020,
  "filename": "BRA_2020.pdf"
}
```

**Response `400 Bad Request`**

Returned when validation fails (handled by Joi).

```json
{
  "error": "\"category\" is required"
}
```

---

### GET /api/files/pdf

Streams a PDF file to the client, identified by category, country, and year.

**Request**

```
GET /api/files/pdf?category=<category>&country=<country>&year=<year>
```

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | Yes | PDF category (see [PDF Categories](#pdf-categories)) |
| `country` | string | Yes | ISO 3166-1 alpha-3 country code (e.g., `BRA`) |
| `year` | string / number | Yes | Four-digit year (e.g., `2020`) |

**Example**

```
GET /api/files/pdf?category=ex-ante&country=BRA&year=2020
```

**Response `200 OK`**

Binary PDF stream.

```
Content-Type: application/pdf
Content-Disposition: inline; filename="BRA_2020.pdf"
```

**Response `404 Not Found`**

Returned when no matching record exists in the database or the file is missing from disk.

```json
{
  "error": "File not found"
}
```

**Response `400 Bad Request`**

Returned when query parameter validation fails.

```json
{
  "error": "\"category\" must be one of [alluvial, descriptive, ex-ante, ex-post, types]"
}
```

---

## Error Responses

All error responses use JSON with an `error` field:

| Status | Meaning |
|--------|---------|
| `400` | Invalid or missing query/body parameters |
| `404` | Requested resource not found |
| `500` | Internal server error |

---

## PDF Categories

The `category` parameter must be one of the following:

| Value | Description |
|-------|-------------|
| `alluvial` | Alluvial/Sankey flow diagram PDFs |
| `descriptive` | Descriptive statistics PDFs |
| `ex-ante` | Ex-ante (predicted inequality) analysis PDFs |
| `ex-post` | Ex-post (decomposed inequality) analysis PDFs |
| `types` | Type distribution PDFs |

PDFs are stored on the backend filesystem at:

```
express-geom/pdfs/<category>/<COUNTRY>_<YEAR>.pdf
```

For example:
```
express-geom/pdfs/ex-ante/BRA_2020.pdf
```

---

## Security

The backend applies the following security measures:

- **Helmet** — Sets security-relevant HTTP response headers (Content-Security-Policy, X-Frame-Options, etc.)
- **CORS** — Currently configured to allow all origins (`*`). Restrict `origin` in production.
- **Joi validation** — All incoming query parameters and request bodies are validated before processing.

> For production deployments, configure CORS to allow only your frontend's origin and consider adding rate limiting.
