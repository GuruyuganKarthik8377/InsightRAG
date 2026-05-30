# Deployment & Setup Guide: InsightRAG

This guide outlines instructions for setting up the InsightRAG system locally for development, configuring environment variables, and deploying to production.

---

## System Requirements

Ensure your host machine satisfies the following baseline requirements:
- **Operating System:** macOS, Linux, or Windows (via WSL2)
- **Python:** version `3.10` or higher
- **Node.js:** version `18` or higher
- **RAM:** Minimum 8 GB (16 GB recommended due to local machine learning models loading in memory)

---

## Local Development Setup

The repository is structured as an organized monorepo containing a Python FastAPI backend and a React/Vite/TypeScript frontend.

```
InsightRAG/
├── backend/       # FastAPI server, models loading, local FAISS index
└── frontend/      # React client app
```

### 1. Backend Configuration
Navigate to the `backend/` directory and configure the Python environment:

```bash
# Navigate to backend
cd backend

# Create a virtual environment
python3 -m venv .venv

# Activate the virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install required dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

#### Pre-Caching Local ML Models
Before running the API, run the model fetch script. This downloads the SentenceTransformers dense embedding (`BAAI/bge-large-en`) and cross-encoder reranker (`BAAI/bge-reranker-large`) models to a local cache directory. Doing this prevents cold-start API timeouts during the first search:

```bash
python scripts/fetch_models.py
```

#### Configure Local Variables
Copy `.env.example` from the root into `backend/.env`:
```bash
cp ../.env.example .env
```
Open `backend/.env` and replace `YOUR_API_KEY_HERE` with your active **Anthropic Claude API Key**:
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

#### Run FastAPI Server
Start the Uvicorn application server:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
The backend API documentation will be available at `http://localhost:8001/docs`.

---

### 2. Frontend Configuration
In a separate terminal window, set up the React web application:

```bash
# Navigate to frontend
cd frontend

# Install package dependencies
npm install

# Start the Vite local development server
npm run dev
```
Open the printed local URL (typically `http://localhost:5173`) in your browser.

---

## Environment Variables Breakdown

The backend reads configuration directly from environment variables. These are defined inside `backend/app/config.py`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | None | **Required.** Your Anthropic developer key for Layer-3 synthesis. |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-5-20250929` | The specific model used for response synthesis. |
| `EMBED_MODEL` | `BAAI/bge-large-en` | HuggingFace ID of the dense embedding representation model. |
| `RERANK_MODEL` | `BAAI/bge-reranker-large` | HuggingFace ID of the cross-encoder reranker model. |
| `FAISS_INDEX_PATH` | `data/faiss_index/index.faiss` | Filepath where the FAISS index vectors are written. |
| `METADATA_PATH` | `data/faiss_index/metadata.pkl` | Filepath where text chunk schemas are pickled. |
| `UPLOAD_DIR` | `data/raw_docs` | Directory where uploaded files are briefly written during parsing. |

---

## Production Deployment Strategies

Deploying a local-heavy AI application (which loads SentenceTransformers models locally and utilizes a local FAISS database) requires careful consideration of memory and compute bounds.

### 1. Docker Deployment (Recommended)
You can containerize the FastAPI backend and React frontend. Below is an architectural blueprint:

#### Backend Dockerfile
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system utilities (git, compilers for FAISS build)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run pre-caching during image build so models are baked in
RUN python scripts/fetch_models.py

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
```

#### Frontend Dockerfile
For production, Vite assets should be compiled into static HTML/JS and served behind an Nginx reverse proxy:
```dockerfile
# Stage 1: Build React application
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve static files via Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. High-Performance Scaling Considerations

#### A. CPU vs. GPU
- **Embeddings/Reranking:** By default, SentenceTransformers runs on **CPU**. In a highly concurrent environment, dense embedding and reranking can become CPU bottlenecks (reranking 20 chunks on a modern CPU takes ~1.5 - 3 seconds).
- **Optimization:** If deploying on AWS/GCP, use an instance with a GPU (e.g., NVIDIA T4) and ensure PyTorch detects CUDA (`device="cuda"`). This drops reranking latency to `<100ms`.

#### B. Memory Footprint
- The local embeddings model (`bge-large-en`) and cross-encoder model (`bge-reranker-large`) occupy ~2.5 GB of RAM in memory once loaded.
- Ensure your hosting container or VM has at least **4 GB of free RAM** allocated strictly to the backend process.

#### C. Persistent Storage
- Because document indexes are saved locally (`data/faiss_index/index.faiss`), restarting a stateless container will wipe loaded indices.
- **Solution:** Bind a persistent storage volume (such as AWS EBS, GCP Persistent Disk, or Kubernetes PersistentVolumeClaims) to the `/app/data/` folder on the host. This guarantees that your vector store and metadata index persist across backend restarts.
