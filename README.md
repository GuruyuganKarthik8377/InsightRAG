# InsightRAG

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![React: 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)

InsightRAG is an enterprise-grade **3-Layer Retrieval-Augmented Generation (RAG)** question-answering system designed to extract high-fidelity insights and synthesize context-grounded answers from complex documents (PDFs, DOCX, TXT). It integrates a deterministic schema-routing layer, local hybrid search (dense semantic + sparse lexical), cross-encoder reranking, and Claude 3.5 Sonnet context-constrained generation with semantic grounding validation.

---

## 🎨 Workspace Showcase

The web workspace features a modern dark aesthetic with a fluid 3-column glassmorphic layout:

| 1. Seamless Drag-and-Drop Ingestion | 2. Precision Claude-Grounded Chat |
| :---: | :---: |
| ![Document Ingestion UI](screenshots/upload-page.png) | ![Grounded Response Interface](screenshots/chat-interface.png) |

| 3. Citation and Retrieval Inspection Panel |
| :---: |
| ![Retrieval and Highlight Panel](screenshots/retrieval-panel.png) |

---

## 🚀 Key Technical Features

- **PDF Support:** Extract text by layout blocks using PyMuPDF to preserve tables and structural flows.
- **DOCX Support:** Native Word document parser for paragraph and table extraction.
- **TXT Support:** Efficient reader for standard flat-file text documents.
- **Hybrid Search:** Combines dense semantic representations with sparse lexical keyword matching in parallel.
- **BM25 Retrieval:** Lexical search index for capturing exact terminology, IDs, and alphanumeric codes.
- **Semantic Retrieval:** Dense vector representations generated via local `BAAI/bge-large-en` embeddings and indexed via **FAISS**.
- **Claude AI:** Deep cognitive synthesis powered by Anthropic Claude 3.5 Sonnet.
- **Citation Generation:** Direct inline citation parsing `[source - page]` maps claims strictly to context files.
- **Large Document Support:** Chunk overlapping strategies (900-char size, 150-char overlap) map long documents without context fragmentation.
- **Document Isolation:** Independent state reset and FAISS schema reloads isolate analysis strictly to the active document.

---

## 🏗️ Architecture Blueprint

The diagram below details how documents are indexed, and how user queries are routed and resolved across the three-layer pipeline:

```mermaid
graph TD
    %% Styling
    classDef layerStyle fill:#2A2D34,stroke:#4E5D6C,stroke-width:2px,color:#fff;
    classDef databaseStyle fill:#1F2937,stroke:#10B981,stroke-width:2px,color:#fff;
    classDef modelStyle fill:#3B82F6,stroke:#1D4ED8,stroke-width:2px,color:#fff;
    
    %% Elements
    Query([User Query]) --> L1Router{Layer 1: Schema Router}
    
    subgraph L1 [Layer 1: Deterministic Extraction]
        L1Router -- "Field Hit" --> StructField[Get Extracted Value]
        StructField --> DirectReturn[Instant Metadata Answer]
    end
    class L1 layerStyle;

    L1Router -- "Field Miss" --> L2 [Layer 2: Hybrid Retrieval]
    
    subgraph L2Pipeline [Layer 2: Hybrid Retrieval & Rerank]
        L2 --> Dense[Dense Search: FAISS]
        L2 --> Sparse[Sparse Search: BM25]
        
        DenseEmbedding([BAAI/bge-large-en]) -.-> Dense
        
        Dense --> RRF[Reciprocal Rank Fusion]
        Sparse --> RRF
        
        RRF --> Rerank[Cross-Encoder Reranker]
        RerankerModel([BAAI/bge-reranker-large]) -.-> Rerank
        
        Rerank --> ScoreCheck{Top Score < 0.35?}
        ScoreCheck -- "Yes" --> Expand[LLM Query Expansion]
        Expand --> ReRetrieve[Second Hybrid Search]
        ReRetrieve --> Merge[Merge & Rerank]
        Merge --> L3
        ScoreCheck -- "No" --> L3[Layer 3: Synthesized QA]
    end
    class L2Pipeline layerStyle;
    class Dense,Sparse databaseStyle;
    class DenseEmbedding,RerankerModel modelStyle;

    subgraph L3Pipeline [Layer 3: Constraint Synthesis & Grounding]
        L3 --> Claude[Claude 3.5 Sonnet Synthesis]
        Claude --> Grounding{Semantic Grounding Check}
        Grounding -- "Pass" --> Unified[Response + Inline Citations]
        Grounding -- "Fail" --> Fallback[Fallback: 'I don't know']
    end
    class L3Pipeline layerStyle;
```

---

## ⚙️ Environment Variables

The backend reads configuration parameters from `backend/.env`. Copy the provided root-level template:

```bash
cp .env.example backend/.env
```

| Key | Default | Description |
| :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | *Required* | Your Anthropic Claude API key for Layer-3 synthesis. |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-5-20250929` | The Claude model selected for answer generation. |
| `EMBED_MODEL` | `BAAI/bge-large-en` | HuggingFace path for dense vector embeddings. |
| `RERANK_MODEL` | `BAAI/bge-reranker-large` | HuggingFace path for cross-encoder reranking. |
| `FAISS_INDEX_PATH` | `data/faiss_index/index.faiss` | Output directory path for vector storage. |
| `METADATA_PATH` | `data/faiss_index/metadata.pkl` | Output path for document schema pickle data. |
| `UPLOAD_DIR` | `data/raw_docs` | Temporary document extraction workspace folder. |

---

## 🛠️ Installation & Setup

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**

### 1. Backend Server Setup
```bash
# Navigate to the backend folder
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install package dependencies
pip install -r requirements.txt

# Pre-cache local ML embedding and reranker models
python scripts/fetch_models.py

# Configure your API key
cp ../.env.example .env
# Open .env and add your ANTHROPIC_API_KEY=sk-ant-...

# Run the FastAPI server
uvicorn app.main:app --reload
```

Interactive API documentation will be available at `http://localhost:8000/docs` (or the port outputted by Uvicorn).

### 2. Frontend React Setup
```bash
# Navigate to the frontend folder
cd frontend

# Install package dependencies
npm install

# Start the local development server
npm run dev
```

The frontend client compiles and runs on `http://localhost:5173`.

---

## 🔄 Example Workflow

1. **Upload Document:**
   Drag and drop an invoice PDF (e.g. `invoice_1092.pdf`) into the upload zone. The backend extracts pages, runs Layer 1 schema extraction, chunks the document, embeds it using local model execution, and builds both FAISS and BM25 search indices. The frontend displays the loaded metadata (such as billing amounts and vendor fields).
2. **Submit a Question:**
   Type: *"What is the vendor name and what are our payment terms?"*
3. **Multi-Layer Processing:**
   - **Layer 1 check:** The router identifies "payment terms" as a deterministic schema key. It fetches the extracted value directly.
   - **Layer 2 check:** For the rest of the question, a hybrid retrieval and reranking sequence is triggered. Chunks from vector similarity and keyword counts are unified via RRF and reranked using the cross-encoder model.
   - **Layer 3 constraint:** Top search references are packaged into a structured context and sent to Claude 3.5 Sonnet. The semantic grounding check confirms factuality against the source chunks.
4. **Answer Review:**
   The frontend displays the synthesized, highly reliable answer with page references and highlights the exact matching phrases in the retrieval details panel.

---

## 🛠️ Technologies Used

### Backend API
- **FastAPI:** High-performance web framework for Python.
- **FAISS:** Facebook AI Similarity Search for dense vector indexing.
- **BM25:** rank_bm25 lexical scoring engine.
- **Sentence Transformers:** Local execution of dense embeddings (`bge-large-en`) and cross-encoder reranker (`bge-reranker-large`).
- **Anthropic Client:** Interface for Claude 3.5 Sonnet generative reasoning.
- **PyMuPDF / python-docx:** Professional document parsing libraries.

### Frontend Web App
- **React & TypeScript:** Type-safe, modular user interface execution.
- **Vite:** High-speed asset bundling and developer server.
- **Tailwind CSS:** Premium styling framework.
- **Zustand:** Ultra-lightweight state coordination.
- **React Query:** High-performance backend synchronization caching.

---

## 📂 Detailed Documentation

For a deeper dive into code modules, system deployment, and schema layouts, review our sub-documentation:
- 📖 **[System Design Specification](docs/SYSTEM_DESIGN.md):** Deep-dive into RRF math, reranker configurations, grounding code, and query expansion.
- 📖 **[API REST Reference](docs/API_REFERENCE.md):** Detailed descriptions of payloads, schemas, and endpoints.
- 📖 **[Deployment & Scaling Guide](docs/DEPLOYMENT.md):** Productionizing with Docker, multi-worker setups, CPU vs. GPU configurations, and data persistence.
- 📖 **[Architecture Details](architecture/architecture.md):** Comprehensive developer sequence flows.
