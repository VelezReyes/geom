# API Reference

This API is implemented by `express-geom` and is mounted under `/api/files`.

## Base URL

Development base URL:

```text
http://localhost:3001
```

The port is currently hardcoded in `express-geom/index.js`.

## Endpoints

### GET `/api/files`

Returns seeded metadata from LowDB.

Response shape:

```json
{
  "success": true,
  "data": {
    "alluvial": [{ "country": "ARG", "year": 2014 }],
    "descriptive": [{ "country": "ARG", "year": 2014 }],
    "ex-ante": [{ "country": "ARG", "year": 2014 }],
    "ex-post": [{ "country": "ARG", "year": 2014 }],
    "types": [{ "country": "ARG", "year": 2014 }]
  }
}
```

Notes:
- `data` is a category map (not a flat list).
- The category key is `descriptive`.

### POST `/api/files`

Pushes request body into `files` and returns it.

Request:

```json
{
  "category": "ex-ante",
  "country": "BRA",
  "year": 2021
}
```

Response:

```json
{
  "success": true,
  "data": {
    "category": "ex-ante",
    "country": "BRA",
    "year": 2021
  }
}
```

Notes:
- There is currently no Joi validation on this endpoint.
- This endpoint is not required for normal UI usage (seeding is the standard path).

### GET `/api/files/pdf`

Serves a PDF file from disk.

Query params:
- `category` (required): one of `alluvial`, `descriptive`, `ex-ante`, `ex-post`, `types`
- `country` (required): country code from `countries.const.js`
- `year` (required): integer between `1970` and current year

Example:

```text
GET /api/files/pdf?category=ex-ante&country=USA&year=2018
```

File path resolution:

```text
express-geom/pdfs/<category>/<country>_<year>_all.pdf
```

Example:

```text
express-geom/pdfs/ex-ante/USA_2018_all.pdf
```

Validation errors return status `400` with shape:

```json
{
  "success": false,
  "message": [
    {
      "message": "\"category\" must be one of [alluvial, descriptive, ex-ante, ex-post, types]"
    }
  ]
}
```

If `sendFile` fails for missing file/path issues, Express returns an error status (typically `404`) and:

```json
{
  "success": false,
  "message": "error serving the file"
}
```

## Security and Middleware

Current middleware in `express-geom/index.js`:
- `cors({ origin: '*' })`
- `helmet()`
- `express.json()`

For production, restrict CORS to known frontend origins.
