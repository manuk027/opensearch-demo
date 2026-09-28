# OpenSearch Product Search API

A simple Node.js + TypeScript + Express + OpenSearch backend built to understand OpenSearch indexing, document retrieval, and product search.

## Tech Stack

- Node.js
- TypeScript
- Express.js
- OpenSearch 2.19.0
- Docker
- Docker Compose
- `@opensearch-project/opensearch`

## Project Structure

```text
opensearch/
├── src/
│   ├── config/
│   │   └── opensearch.ts
│   ├── routes/
│   │   └── product.routes.ts
│   ├── services/
│   │   └── product.service.ts
│   ├── types/
│   │   └── product.ts
│   └── server.ts
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

```text
Client
  │
  ▼
Express Server
  │
  ▼
Product Routes
  │
  ▼
Product Service
  │
  ▼
OpenSearch
  │
  ▼
products index
```

## Getting Started

### 1. Start OpenSearch

Make sure Docker is running.

```bash
docker compose up -d
```

Check the container:

```bash
docker ps
```

Verify OpenSearch:

```bash
curl http://localhost:9200
```

You should receive a response similar to:

```json
{
  "name": "...",
  "cluster_name": "docker-cluster",
  "version": {
    "distribution": "opensearch",
    "number": "2.19.0"
  },
  "tagline": "The OpenSearch Project: https://opensearch.org/"
}
```

### 2. Install Dependencies

```bash
npm install
```

If setting up the project from scratch:

```bash
npm install express @opensearch-project/opensearch
```

```bash
npm install -D typescript ts-node-dev @types/node @types/express
```

### 3. Run the Server

```bash
npm run dev
```

The server runs on:

```text
http://localhost:5001
```

# API Endpoints

## Create / Index a Product

```http
POST /products
```

Example request:

```json
{
  "id": "p101",
  "name": "Dell XPS 15",
  "description": "High performance laptop for developers",
  "category": "laptop",
  "price": 1499
}
```

Using curl:

```bash
curl -X POST http://localhost:5001/products \
  -H "Content-Type: application/json" \
  -d '{
    "id": "p101",
    "name": "Dell XPS 15",
    "description": "High performance laptop for developers",
    "category": "laptop",
    "price": 1499
  }'
```

The product is indexed into the OpenSearch `products` index.

The supplied product ID is used as the OpenSearch document ID.

```text
products
└── p101
```

## Get Product by ID

```http
GET /products/:id
```

Example:

```bash
curl http://localhost:5001/products/p101
```

This performs an exact document lookup using the OpenSearch document ID.

```text
GET /products/p101
        │
        ▼
getProductById("p101")
        │
        ▼
OpenSearch GET
        │
        ▼
products/p101
```

## Search Products

```http
GET /products/search?q=<search-term>
```

Example:

```bash
curl "http://localhost:5001/products/search?q=laptop"
```

The search endpoint uses OpenSearch's `multi_match` query to search across:

- `name`
- `description`
- `category`

The fields have different relevance weights:

```text
name         → 3x
category     → 2x
description  → 1x
```

This allows matches in the product name to receive a higher relevance score than matches in the description.

## Important Route Ordering

The `/search` route must be defined before the `/:id` route.

Correct:

```ts
router.get("/search", ...);

router.get("/:id", ...);
```

If `/:id` is defined first, a request such as:

```text
GET /products/search
```

can be interpreted as:

```text
id = "search"
```

and the application will attempt to find a product whose ID is `search`.

Correct route matching:

```text
GET /products/search
        ↓
/search
        ↓
searchProducts()
```

and:

```text
GET /products/p101
        ↓
/:id
        ↓
getProductById("p101")
```

# Example Products

### Dell XPS

```bash
curl -X POST http://localhost:5001/products \
  -H "Content-Type: application/json" \
  -d '{
    "id": "p101",
    "name": "Dell XPS 15",
    "description": "High performance laptop for developers",
    "category": "laptop",
    "price": 1499
  }'
```

### MacBook

```bash
curl -X POST http://localhost:5001/products \
  -H "Content-Type: application/json" \
  -d '{
    "id": "p102",
    "name": "MacBook Air M4",
    "description": "Lightweight Apple laptop with M4 chip",
    "category": "laptop",
    "price": 999
  }'
```

### Logitech Mouse

```bash
curl -X POST http://localhost:5001/products \
  -H "Content-Type: application/json" \
  -d '{
    "id": "p103",
    "name": "Logitech MX Master 3S",
    "description": "Wireless mouse for productivity",
    "category": "accessories",
    "price": 99
  }'
```

Now search:

```bash
curl "http://localhost:5001/products/search?q=laptop"
```

Example response:

```json
{
  "query": "laptop",
  "count": 2,
  "products": [
    {
      "id": "p102",
      "name": "MacBook Air M4",
      "description": "Lightweight Apple laptop with M4 chip",
      "category": "laptop",
      "price": 999
    },
    {
      "id": "p101",
      "name": "Dell XPS 15",
      "description": "High performance laptop for developers",
      "category": "laptop",
      "price": 1499
    }
  ]
}
```

# How Search Works

When the client sends:

```text
GET /products/search?q=laptop
```

the request flows through the application:

```text
Client
  │
  ▼
GET /products/search?q=laptop
  │
  ▼
product.routes.ts
  │
  ▼
searchProducts()
  │
  ▼
OpenSearch
  │
  ▼
multi_match query
  │
  ├── name
  ├── description
  └── category
  │
  ▼
Matching documents
  │
  ▼
Product[]
```

The search is performed by OpenSearch rather than by JavaScript filtering.

The service uses a query similar to:

```ts
const response = await openSearchClient.search({
  index: "products",
  body: {
    query: {
      multi_match: {
        query,
        fields: [
          "name^3",
          "description",
          "category^2"
        ]
      }
    }
  }
});
```

The `^` notation boosts the relevance of a field.

```text
name        → 3x
category    → 2x
description → 1x
```

Search results from OpenSearch contain internal metadata such as:

```json
{
  "_index": "products",
  "_id": "p102",
  "_score": 1.234,
  "_source": {
    "id": "p102",
    "name": "MacBook Air M4",
    "description": "Lightweight Apple laptop with M4 chip",
    "category": "laptop",
    "price": 999
  }
}
```

The service converts these raw OpenSearch hits into clean product objects:

```json
{
  "id": "p102",
  "name": "MacBook Air M4",
  "description": "Lightweight Apple laptop with M4 chip",
  "category": "laptop",
  "price": 999
}
```

# OpenSearch Concepts

| Concept | Meaning |
|---|---|
| Cluster | Collection of OpenSearch nodes |
| Index | Collection of related documents |
| Document | JSON object stored in an index |
| Field | Property inside a document |
| `_id` | Unique document identifier |
| `_source` | Original document data |
| Query | Instructions used to find documents |
| `_score` | Relevance score for a search result |

For this project:

```text
OpenSearch
│
└── products
    │
    ├── p101
    │   ├── name
    │   ├── description
    │   ├── category
    │   └── price
    │
    ├── p102
    │
    └── p103
```

## Database vs OpenSearch Terminology

| Traditional Database | OpenSearch |
|---|---|
| Database | Cluster |
| Table | Index |
| Row | Document |
| Column | Field |
| Primary key | Document `_id` |

# Direct OpenSearch Queries

### Check OpenSearch

```bash
curl http://localhost:9200
```

### List indices

```bash
curl http://localhost:9200/_cat/indices?v
```

### Get a document

```bash
curl http://localhost:9200/products/_doc/p101
```

### Check cluster health

```bash
curl http://localhost:9200/_cluster/health
```

# Current Features

- Connect Node.js to OpenSearch
- Create/index product documents
- Automatically create/use the `products` index
- Retrieve products by document ID
- Full-text product search
- Search multiple fields
- Field relevance boosting
- Return clean product objects instead of raw OpenSearch hits
- Dockerized OpenSearch setup

# Learning Flow

```text
1. Connect to OpenSearch
        ↓
2. Create/index documents
        ↓
3. Retrieve documents by ID
        ↓
4. Search documents
        ↓
5. Multi-field search
        ↓
6. Relevance scoring
        ↓
7. Filtering
        ↓
8. Sorting
        ↓
9. Pagination
        ↓
10. Mappings
        ↓
11. Analyzers & tokenization
        ↓
12. Aggregations
```

The project focuses on understanding how OpenSearch works in a backend application, starting with document indexing and exact retrieval and progressing toward a practical product search system.

# Future Improvements

The next features can be implemented progressively:

- Product filtering
- Price range filtering
- Sorting by price
- Pagination
- Search result highlighting
- Fuzzy search
- Autocomplete
- Custom index mappings
- Custom analyzers
- Tokenization
- Aggregations
- Faceted search
- MongoDB + OpenSearch integration
- Synchronizing database changes with OpenSearch

# Learning Objective

The purpose of this project is not just to build an API, but to understand the role of OpenSearch in a backend system:

```text
Application
     │
     ├── Product data
     │
     ▼
OpenSearch
     │
     ├── Index documents
     ├── Analyze text
     ├── Build search indexes
     ├── Execute queries
     └── Rank matching documents
```

The project can later be extended into a more realistic e-commerce search system.
