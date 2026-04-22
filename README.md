# findapi

A lightweight, zero-framework REST API that exposes MongoDB collections over HTTP.

## Why Build a Custom Query Layer

Research platforms that store data in MongoDB often need a way to let frontends, scripts, and collaborators query collections without giving them direct database access. Off-the-shelf REST frameworks add routing, middleware stacks, and dependencies that are overkill when all you need is filtered reads against a known set of collections. findapi fills that gap: one Node.js file, one dependency, and a query interface driven entirely by URL parameters.

## How findapi Works

findapi starts an HTTP server on port 3000 and translates URL query parameters into MongoDB `find()` calls. You specify what to search for, which fields to return, and how many documents you want -- all through the URL. It enforces allowlists for databases and collections, sanitizes queries to prevent NoSQL injection, and rate-limits requests per IP.

There is no write path. findapi is read-only by design.

## Quick Example

Fetch 5 documents where `provenance.image.case_id` is `TCGA-55-6543`:

```
http://localhost:3000/?limit=5&find={"provenance.image.case_id":"TCGA-55-6543"}
```

Return only specific fields with a projection:

```
http://localhost:3000/?limit=10&find={"type":"Feature"}&project={"provenance":1}
```

Paginate through results using an offset (the `_id` of the last document returned):

```
http://localhost:3000/?limit=100&offset="507f1f77bcf86cd799439011"
```

All responses are JSON arrays.

## Query Parameters

| Parameter    | Required | Description                                      | Default         |
|--------------|----------|--------------------------------------------------|-----------------|
| `limit`      | Yes      | Maximum number of documents to return (max 10000) | --              |
| `find`       | No       | JSON query filter                                 | `{}`            |
| `project`    | No       | JSON projection (which fields to include/exclude) | `{}`            |
| `offset`     | No       | ObjectId string for cursor-based pagination       | --              |
| `db`         | No       | Target database (must be in allowlist)            | `u24_luad`      |
| `collection` | No       | Target collection (must be in allowlist)          | `objects`       |

## Usage

### Run directly with Node.js

```bash
npm install
MONHOST=localhost MONPORT=27017 npm start
```

### Run with Docker

Using the helper script:

```bash
python3 run_docker_findapi.py -m <mongohost> -p <mongoport> -w <webport>
```

Or build and run manually:

```bash
docker build -t findapi .
docker run -e MONHOST=172.17.0.1 -e MONPORT=27017 -p 3000:3000 -d findapi
```

### Environment Variables

| Variable         | Description                              | Default                          |
|------------------|------------------------------------------|----------------------------------|
| `MONHOST`        | MongoDB hostname                         | Falls back to `172.17.0.1`       |
| `MONPORT`        | MongoDB port                             | Falls back to `27015`            |
| `ALLOWED_ORIGIN` | CORS allowed origin                      | `null` (blocks cross-origin)     |
| `RATE_LIMIT_MAX` | Max requests per IP per minute           | `100`                            |

## Security

- **NoSQL injection protection** -- query sanitization strips `$`-prefixed operators from user input
- **Allowlisted databases and collections** -- only explicitly permitted targets are queryable
- **Rate limiting** -- per-IP request throttling (configurable)
- **No user-controlled connection URLs** -- MongoDB connection is server-side only
- **CORS locked down** -- requires explicit `ALLOWED_ORIGIN` configuration
- **Read-only** -- no insert, update, or delete operations exist

## License

BSD 3-Clause. See [LICENSE](LICENSE) for details.

<br>
