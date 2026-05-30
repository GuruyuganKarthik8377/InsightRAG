# API Reference: InsightRAG API

This document details the RESTful API endpoints exposed by the InsightRAG FastAPI backend server. The default base URL for local development is `http://localhost:8001`.

---

## Endpoint Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/upload` | Upload and ingest a new document (PDF, DOCX, TXT) |
| **POST** | `/answer` | Resolve a query using the 3-Layer pipeline (Structured -> RAG -> Claude) |
| **POST** | `/query` | Direct retrieve-and-rerank database search (no LLM generation) |
| **GET** | `/document` | Get details and deterministic extracted metadata of the active document |

---

## Endpoint Details

### 1. Upload & Ingest Document

* **Endpoint:** `/upload`
* **Method:** `POST`
* **Content-Type:** `multipart/form-data`
* **Supported Formats:** PDF (`.pdf`), Word (`.docx`), Plain Text (`.txt`)

#### Request Parameters
The request requires a single form file field:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | Binary File | Yes | The document file to be parsed and indexed |

#### Example CURL Request
```bash
curl -X POST "http://localhost:8001/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@invoice_1092.pdf"
```

#### Response Schema (`200 OK`)
Returns the ingestion status, page counts, chunk counts, and the list of deterministically extracted Layer-1 schema fields.

```json
{
  "status": "indexed",
  "doc_id": "84c8a8cf-3abf-47dc-9860-91a5e56e0be0",
  "filename": "invoice_1092.pdf",
  "num_chunks": 12,
  "num_pages": 2,
  "extracted_fields": {
    "invoice_number": {
      "value": "INV-2026-1092",
      "page": 1
    },
    "billing_date": {
      "value": "2026-05-15",
      "page": 1
    },
    "amount_due": {
      "value": "$14,250.00",
      "page": 1
    },
    "vendor_name": {
      "value": "Acme Global Solutions Inc.",
      "page": 1
    },
    "client_name": {
      "value": "Karthik Enterprises",
      "page": 1
    },
    "payment_terms": {
      "value": "Net 30",
      "page": 2
    }
  }
}
```

---

### 2. Answer Query (3-Layer Pipeline)

* **Endpoint:** `/answer`
* **Method:** `POST`
* **Content-Type:** `application/json`

#### Request Body
```json
{
  "query": "string"
}
```

#### Example CURL Request
```bash
curl -X POST "http://localhost:8001/answer" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the total amount due and who is the client?"}'
```

#### Response Schema (`200 OK`)
Returns the synthesized answer, a heuristic confidence score, inline citations mapping to search chunks, the raw source chunks retrieved, and an indication of which layer resolved the query.

```json
{
  "query": "What is the total amount due and who is the client?",
  "answer": "The total amount due is $14,250.00 [invoice_1092.pdf - page 1] and the client is Karthik Enterprises [invoice_1092.pdf - page 1].",
  "confidence": 0.985,
  "citations": [
    {
      "source": "invoice_1092.pdf",
      "page": 1,
      "chunk_id": "84c8a8cf-3abf-47dc-9860-91a5e56e0be0_chunk_0"
    }
  ],
  "results": [
    {
      "text": "INVOICE #INV-2026-1092\nDate: 2026-05-15\nAmount Due: $14,250.00\nClient Name: Karthik Enterprises\n...",
      "score": 0.985,
      "source": "invoice_1092.pdf",
      "page": 1,
      "chunk_id": "84c8a8cf-3abf-47dc-9860-91a5e56e0be0_chunk_0"
    }
  ],
  "source_layer": "rag"
}
```

*Note: `source_layer` will be `"structured"` if resolved deterministically by Layer 1, `"rag"` if resolved by the vector search and Claude, or `"none"` if no documents are indexed.*

---

### 3. Query Database (Direct Search)

* **Endpoint:** `/query`
* **Method:** `POST`
* **Content-Type:** `application/json`

#### Request Body
```json
{
  "query": "string"
}
```

#### Example CURL Request
```bash
curl -X POST "http://localhost:8001/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "payment terms liability exclusions"}'
```

#### Response Schema (`200 OK`)
Returns a list of matching context passages ordered by relevancy (dense/sparse RRF + reranking scores). Generative AI synthesis is bypassed.

```json
{
  "query": "payment terms liability exclusions",
  "results": [
    {
      "text": "Section 4.1 Payment Terms: Invoices are sent monthly. Client agrees to clear all dues within Net 30 terms. Late payments accrue a 1.5% interest rate...",
      "score": 0.892,
      "source": "invoice_1092.pdf",
      "page": 2,
      "chunk_id": "84c8a8cf-3abf-47dc-9860-91a5e56e0be0_chunk_4"
    }
  ],
  "message": null
}
```

---

### 4. Active Document Status

* **Endpoint:** `/document`
* **Method:** `GET`
* **Content-Type:** `application/json`

#### Example CURL Request
```bash
curl -X GET "http://localhost:8001/document"
```

#### Response Schema (`200 OK`)
Returns a metadata summary and the active schema mapping of the document currently active in memory.

```json
{
  "doc_id": "84c8a8cf-3abf-47dc-9860-91a5e56e0be0",
  "filename": "invoice_1092.pdf",
  "num_pages": 2,
  "num_chunks": 12,
  "fields": {
    "invoice_number": {
      "value": "INV-2026-1092",
      "page": 1
    },
    "amount_due": {
      "value": "$14,250.00",
      "page": 1
    }
  }
}
```

*Note: If no document is currently loaded, `doc_id` and `filename` will return `null` and `fields` will be empty.*
