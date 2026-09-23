# CLARITY — AI Legal Co-Pilot

[![Architecture: FastAPI + React](https://img.shields.io/badge/Architecture-FastAPI%20%2B%20React%2FVite-indigo)](https://fastapi.tiangolo.com)
[![Footprint: Under 1MB](https://img.shields.io/badge/Footprint-%3C1MB%20(Lightweight)-emerald)](https://github.com)
[![Parsing: PDFPlumber + Mammoth](https://img.shields.io/badge/Parsing-PDFPlumber%20%2B%20Mammoth-cyan)](https://github.com/jsvine/pdfplumber)
[![Retrieval: In--Memory Vector RAG](https://img.shields.io/badge/Retrieval-In--Memory%20Vector%20RAG-amber)](https://numpy.org)

**CLARITY** is an AI-powered legal co-pilot designed for corporate counsel, legal teams, and procurement professionals to audit contracts, uncover hidden legal liabilities, perform citation-grounded Q&A, and redline clauses.

---

## Key Features

1. **High-Fidelity Document Ingestion**:
   - **PDF**: Powered by `pdfplumber` for layout and table preservation.
   - **DOCX**: Powered by `mammoth` & `python-docx` for structured style conversion.
   - **Plain Text & Markdown**: Multi-encoding fallback support.

2. **Legal Clause Segmentation**:
   - Intelligent parser that automatically detects Recitals, Articles, Sections, Subsections, and legal numbering hierarchies.

3. **In-Memory Hybrid Vector Store**:
   - Ultra-fast in-memory TF-IDF + BM25 and cosine similarity search engine.
   - Zero external database dependencies (no PostgreSQL, Pinecone, or Milvus server required).
   - Zero-retention privacy: document embeddings live in-memory and can be discarded upon session close.

4. **Automated Risk Audit Matrix**:
   - 0-100 contract risk scoring gauge.
   - High / Medium / Low severity flagging for uncapped liability, one-sided indemnity, non-compete clauses, and ambiguous termination traps.
   - Missing protective clauses detection (e.g. Consequential Damages Waiver, Force Majeure, Mutual Indemnification).

5. **Conversational Legal Co-Pilot**:
   - Grounded RAG with exact clause citations and clickable anchors that jump directly to source text in the left pane.

6. **Interactive Clause Redlining & Counter-Proposals**:
   - One-click redline generator with side-by-side diff comparison, negotiation rationale, and risk mitigation advice.

7. **1-Click Benchmark Evaluation**:
   - Pre-bundled with high-risk Enterprise SaaS MSA, Mutual NDA, and IP Assignment contracts for instant demonstration.

---

## Architecture

```
d:/legalAi/
├── backend/
│   ├── main.py              # FastAPI entry point with CORS & API routing
│   ├── config.py            # Environment configuration & LLM settings
│   ├── requirements.txt     # Lightweight dependencies
│   ├── routers/
│   │   └── contracts.py     # Upload, analyze, chat, redline endpoints
│   └── services/
│       ├── parser.py        # PDFPlumber (PDF) & Mammoth (DOCX) parsers
│       ├── chunker.py       # Legal clause boundary segmenter
│       ├── vector_store.py  # In-memory vector & lexical RAG engine
│       └── llm.py           # Unified LLM client (Gemini/OpenAI/Heuristic)
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Split-screen workspace orchestrator
│   │   ├── index.css        # Modern glassmorphic legal design system
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── Dropzone.jsx
│   │       ├── DocumentViewer.jsx
│   │       ├── RiskMatrix.jsx
│   │       ├── ChatDrawer.jsx
│   │       └── RedlineViewer.jsx
│   └── package.json
├── samples/                 # Sample benchmark contracts (DOCX, TXT)
├── tests/                   # Backend unit tests
└── PROJECT_AUDIT.md         # Full architectural audit report
```

---

## Quickstart Guide

### 1. Backend Setup

```bash
# From root directory
cd backend

# Install dependencies
pip install -r requirements.txt

# (Optional) Configure Cloud LLM API Key in .env
# Copy .env.example to .env and set GEMINI_API_KEY or OPENAI_API_KEY
# If no key is set, the built-in Expert Heuristic Engine will run offline automatically!

# Start FastAPI server
uvicorn backend.main:app --reload --port 8000
```

The backend will start at `http://127.0.0.1:8000` (Interactive API docs at `http://127.0.0.1:8000/docs`).

### 2. Frontend Setup

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The frontend will start at `http://localhost:5173`.

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/upload` | `POST` | Upload & parse PDF/DOCX/TXT and index in in-memory vector store |
| `/api/sample/{sample_id}` | `POST` | Load pre-bundled benchmark contract (`saas-msa`, `mutual-nda`, `employment-ip`) |
| `/api/analyze` | `POST` | Run AI legal risk audit (returns score, findings, missing clauses) |
| `/api/chat` | `POST` | Grounded conversational Q&A with exact clause citations |
| `/api/redline` | `POST` | Generate balanced counter-language and legal rationale for any clause |
| `/api/search` | `POST` | Direct vector & keyword semantic search over clauses |
| `/api/status` | `GET` | Get system status and active LLM configuration |

---

## Verification & Testing

Run the automated test suite:

```bash
python -m tests.test_backend
```
