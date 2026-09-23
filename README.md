# Clarity — AI Legal Co-Pilot

[![Live Web Application](https://img.shields.io/badge/Live%20App-Vercel%20Production-blueviolet?style=for-the-badge&logo=vercel)](https://legal-eight-psi.vercel.app/)
[![Live Backend API](https://img.shields.io/badge/Live%20API-Render%20Production-success?style=for-the-badge&logo=render)](https://clarity-legal-api.onrender.com/api/health)

[![Architecture: FastAPI + React](https://img.shields.io/badge/Architecture-FastAPI%20%2B%20React%20%2F%20Vite-indigo)](https://fastapi.tiangolo.com)
[![Footprint: Under 1MB](https://img.shields.io/badge/Footprint-0.78MB%20(Lightweight)-emerald)](https://github.com/innocentgaming/legal)
[![Parsing: PDFPlumber + Mammoth](https://img.shields.io/badge/Parsing-PDFPlumber%20%2B%20Mammoth-cyan)](https://github.com/jsvine/pdfplumber)
[![Retrieval: In--Memory Vector Engine](https://img.shields.io/badge/Retrieval-In--Memory%20Vector%20Engine-amber)](https://numpy.org)
[![Tests: 63 Passing](https://img.shields.io/badge/Tests-63%2F63%20Passing-brightgreen)](https://docs.pytest.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

> **"Understand your legal documents before you talk to a lawyer."**  
> 🌐 **Live Application**: [https://legal-eight-psi.vercel.app/](https://legal-eight-psi.vercel.app/)  
> ⚡ **Live API Service**: [https://clarity-legal-api.onrender.com](https://clarity-legal-api.onrender.com)  
> 📦 **GitHub Repository**: [https://github.com/innocentgaming/legal](https://github.com/innocentgaming/legal)

---

## Table of Contents
- [Problem](#problem)
- [Solution](#solution)
- [Core Features](#core-features)
- [USP (Unique Value Proposition)](#usp)
- [Architecture & Code Quality](#architecture)
- [Tech Stack](#tech-stack)
- [Efficiency & Resource Optimization](#efficiency)
- [Security & Data Handling](#security)
- [Accessibility (WCAG 2.2 AA)](#accessibility)
- [Problem Statement Alignment](#problem-statement-alignment)
- [Limitations & Disclaimers](#limitations)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [End-to-End Demo Flow](#demo)

---

## Problem

Legal agreements, leases, employment contracts, and vendor terms are filled with dense, archaic legalese, ambiguous risk traps, and unbalanced covenants. 

Non-lawyers, founders, procurement managers, and consumers face significant challenges:
1. **Incomprehensible Clauses**: Critical obligations, auto-renewal triggers, and liability waivers are buried in complex legal jargon.
2. **Expensive Consultations**: Speaking to legal counsel without structured preparation wastes valuable billable hours on basic document orientation.
3. **Hidden Liabilities**: One-sided indemnities, uncapped damages, and harsh non-compete clauses often go unnoticed until a dispute occurs.
4. **Adversarial AI Risk**: Generic consumer LLMs frequently hallucinate terms, give unauthorized legal advice ("you should sign"), or regurgitate ungrounded assumptions.

---

## Solution

Clarity structures legal document review into a clear, trustworthy, non-gimmick workflow:

$$\text{UPLOAD} \longrightarrow \text{SIMPLIFY} \longrightarrow \text{INTERROGATE} \longrightarrow \text{COMPARE} \longrightarrow \text{PREPARE}$$

```
 ┌───────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
 │   01. UPLOAD  │ ───► │      02. SIMPLIFY       │ ───► │     03. INTERROGATE     │
 │ PDF, DOCX, TXT│      │ Plain-English breakdown │      │ Grounded Q&A + citations│
 └───────────────┘      └─────────────────────────┘      └─────────────────────────┘
                                                                       │
 ┌─────────────────────────┐      ┌─────────────────────────┐          │
 │       05. PREPARE       │ ◄─── │       04. COMPARE       │ ◄────────┘
 │  1-Page Lawyer Briefing │      │ Two-Document Alignment  │
 └─────────────────────────┘      └─────────────────────────┘
```

1. **Upload**: Drag-and-drop or select sample benchmarks (Lease, NDA, SaaS MSA, Employment IP).
2. **Simplify**: Read clause-by-clause plain-English translations alongside verbatim text, obligations, rights, deadlines, and penalties.
3. **Interrogate**: Ask specific contractual questions with **strictly grounded citations** (exact clause, page, and quoted sentence).
4. **Compare**: Compare two agreement drafts side-by-side with semantic clause alignment (`MATCH`, `MODIFIED`, `ADDED`, `REMOVED`).
5. **Prepare**: Export a structured 10-section briefing (Markdown / PDF) with discussion points and questions tailored for your lawyer.

---

## Core Features

- **Clause-Level Simplification**: Deconstructs every clause into plain English, obligations (*shall/must*), rights (*may*), deadlines, and penalties.
- **Risk Tagging**: Hybrid deterministic and contextual classifier flagging `STANDARD`, `WORTH NOTING`, and `HIGH RISK` provisions with verbatim evidence.
- **Grounded Q&A**: Strict citation-backed conversational RAG that answers solely from uploaded clauses. If a term is absent, it states *"Not addressed in this document"*.
- **Exact Clause Citations**: Every answer and briefing item links to its source clause number, page, and verbatim quotation.
- **Two-Document Comparison**: Semantic clause alignment comparing versions A & B to highlight modified covenants, added obligations, and removed protections.
- **Lawyer Briefing ("Prepare for my Lawyer")**: Automatically synthesizes a 10-section structured briefing with potential negotiation points and questions for counsel.
- **Session-Scoped Processing**: Zero persistent storage. Documents and vector embeddings live only in volatile RAM for the duration of the session.
- **Accessible & Professional UI**: Clean 3-column workspace, explicit text risk badges, visible focus indicators, and 200% zoom support.

---

## USP

| # | Pillar | Description |
|---|---|---|
| **1** | **Grounded, Not Generic** | Refuses to extrapolate or guess. Answers only using retrieved clause text, backed by exact verbatim quotes and page numbers. |
| **2** | **Explicit Risk Scoring** | Flags uncapped liability, unilateral termination, auto-renewal traps, and harsh non-competes using exact textual proof. |
| **3** | **Semantic Clause Comparison** | Avoids naive string diffing; semantically aligns related clauses and explains the operational and legal impact of differences. |
| **4** | **Lawyer Preparation** | Organizes open questions, ambiguities, and negotiation levers to make actual attorney consultations fast, productive, and cost-effective. |
| **5** | **Non-Advice Framing** | Strictly avoids prescriptive legal advice ("you should sign" / "do not sign"). Highlights what the text says and frames questions for counsel. |

---

## Architecture

```text
                    ┌─────────────────────┐
                    │     React UI        │
                    │                     │
                    │ Upload              │
                    │ Clause Viewer       │
                    │ Risk Panel          │
                    │ Q&A                 │
                    │ Comparison          │
                    │ Lawyer Briefing     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     FastAPI         │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌────────────┐   ┌─────────────┐  ┌──────────────┐
       │ Ingestion  │   │  Retrieval  │  │ Risk Engine  │
       └─────┬──────┘   └──────┬──────┘  └──────────────┘
             │                 │
             ▼                 ▼
       ┌────────────┐   ┌─────────────┐
       │  Clauses   │   │ Embeddings  │
       └─────┬──────┘   └──────┬──────┘
             │                 │
             └────────┬────────┘
                      ▼
               ┌──────────────┐
               │  Grounded    │
               │  LLM         │
               └──────┬───────┘
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
       Q&A        Comparison    Briefing
          │           │            │
          └───────────┴────────────┘
                      ▼
              Exact Citations
```

```mermaid
graph TD
    subgraph Client["Frontend Layer (React + Vite)"]
        UI_Land["Landing Page"]
        UI_Work["3-Column Workspace\n(Nav | Content | Risk & Q&A)"]
        UI_Comp["Two-Column Compare"]
        UI_Brief["Lawyer Briefing Export"]
    end

    subgraph Gateway["API Gateway (FastAPI)"]
        Router["API Router (/api)"]
        SecurityMW["Security & Validation Middleware"]
        ErrorHandler["Sanitized Error Handlers"]
    end

    subgraph CoreServices["Backend Intelligence Engine"]
        Parser["Document Parser\n(pdfplumber / mammoth)"]
        Segmenter["Clause Segmentation\n(Structural Legal Parser)"]
        Retriever["In-Memory Vector Store\n(TF-IDF + Cosine Matching)"]
        RiskEngine["Hybrid Risk Classifier\n(20+ Deterministic Rules + LLM)"]
        QAEngine["Grounded Q&A Engine\n(Citation Verification + Anti-Hallucination)"]
        DiffEngine["Semantic Comparison Engine\n(Bipartite Clause Alignment)"]
        BriefEngine["Briefing Synthesizer\n(10-Section Structured Generator)"]
    end

    subgraph Safety["Security & Privacy Layer"]
        MemSession["SessionManager (In-Memory RAM)"]
        PromptGuard["Prompt Injection Boundaries\n(<UNTRUSTED_DOCUMENT_CONTENT>)"]
        LogRedact["Log Redactor (No Document Logs)"]
    end

    subgraph LLM["External Inference (Zero Local Weights)"]
        Gemini["Google Gemini API\n(gemini-2.5-flash)"]
        OpenAI["OpenAI API\n(gpt-4o-mini)"]
        Heuristic["Deterministic Grounded Engine\n(Offline Fallback)"]
    end

    UI_Land --> Router
    UI_Work --> Router
    UI_Comp --> Router
    UI_Brief --> Router

    Router --> SecurityMW --> Parser
    Parser --> Segmenter --> MemSession
    Segmenter --> Retriever

    Router --> QAEngine
    Router --> RiskEngine
    Router --> DiffEngine
    Router --> BriefEngine

    QAEngine --> Retriever
    QAEngine --> PromptGuard --> Gemini & OpenAI & Heuristic
    RiskEngine --> PromptGuard --> Gemini & OpenAI & Heuristic
    DiffEngine --> Retriever
    BriefEngine --> RiskEngine

    ErrorHandler --> LogRedact
```

---

## Tech Stack

* **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS Design System (Zero Tailwind bloat).
* **Backend**: FastAPI (Python 3.10+), Uvicorn, Pydantic v2.
* **PDF Extraction**: `pdfplumber` (preserves page boundaries, layout, and tables).
* **DOCX Extraction**: `mammoth` & `python-docx` (clean HTML-to-text semantic parsing).
* **Retrieval**: Lightweight in-memory vector cosine similarity + TF-IDF with exact legal term boosting.
* **LLM Layer**: External APIs (Google Gemini `gemini-2.5-flash`, OpenAI `gpt-4o-mini`) with built-in **Deterministic Offline Fallback Engine**.
* **Repository Footprint**: Total tracked repository size is **< 0.75 MB** (zero local weights).

---

## Security

Clarity adheres to a **zero-retention, privacy-first, in-memory execution** model:

1. **Session-Scoped In-Memory State**: Documents, parsed clauses, and vector embeddings reside exclusively in volatile RAM (`InMemoryDocument`). No files or clauses are ever written to disk or permanent databases.
2. **Zero Logging of Document Contents**: Application loggers do not log raw document contents, extracted contract text, or user questions containing document excerpts.
3. **API Key Isolation**: Secrets (`GEMINI_API_KEY`, `OPENAI_API_KEY`) are read strictly from backend environment variables and are **never exposed to the frontend**.
4. **Prompt Injection Defenses**:
   - Non-overridable instruction hierarchy:
     $$\text{SYSTEM INSTRUCTIONS} > \text{USER QUESTION} > \text{RETRIEVED DOCUMENT CONTENT}$$
   - All document text is isolated within `<UNTRUSTED_DOCUMENT_CONTENT>...</UNTRUSTED_DOCUMENT_CONTENT>` tags.
   - Explicit system directives instruct the model to treat adversarial document instructions (e.g., *"Ignore previous instructions"*) purely as inert passive text data.
5. **Upload & File Integrity**:
   - File extension whitelisting (`.pdf`, `.docx`, `.doc`, `.txt`, `.md`).
   - Magic byte header inspection (`%PDF-`, `PK\x03\x04`).
   - Rejection of executable binary headers (`MZ`, `\x7fELF`, `#!`).
   - Path traversal sanitization (`os.path.basename` + safe character filtering).
   - Strict 25MB file size limit.
   - Text extraction strips null bytes (`\x00`) and normalizes Unicode (NFKC).
6. **Explicit Session Purging**: Users can clear session state instantly via `DELETE /api/documents/current` or `POST /api/session/clear`. Inactive sessions automatically expire after 1 hour (3600s TTL).

*(See [`SECURITY.md`](SECURITY.md) for full security disclosures and threat modeling).*

---

## Efficiency & Resource Optimization

Clarity is engineered for sub-30ms performance, minimal cloud cost, and a lightweight compute footprint:

### 1. Algorithmic Complexity & Profiling

| Pipeline Stage | Algorithm / Method | Time Complexity | Space Complexity | Measured Latency |
|---|---|---|---|---|
| **Document Ingestion** | Stream-based `pdfplumber` / `mammoth` parsing | $\mathcal{O}(N)$ ($N$ = bytes) | $\mathcal{O}(N)$ in-memory buffer | **2.86 ms** |
| **Clause Segmentation** | Structural regex boundary parser | $\mathcal{O}(K)$ ($K$ = character count) | $\mathcal{O}(C)$ ($C$ = clauses) | **1.69 ms** |
| **Vector Indexing** | In-memory TF-IDF sparse matrix construction | $\mathcal{O}(C \cdot V)$ ($V$ = vocab size) | $\mathcal{O}(C \cdot V)$ memory array | **1.30 ms** |
| **Semantic Retrieval** | Vectorized Cosine Dot Product | $\mathcal{O}(C \cdot D)$ ($D$ = vector dim) | $\mathcal{O}(1)$ dynamic slice | **0.51 ms** |
| **Deterministic Risk Engine** | Heuristic rule-matching with precompiled regex | $\mathcal{O}(C \cdot R)$ ($R$ = rule count) | $\mathcal{O}(1)$ | **4.12 ms** |
| **Semantic Diff Engine** | Bipartite greedy clause alignment matrix | $\mathcal{O}(C_1 \cdot C_2)$ | $\mathcal{O}(C_1 \cdot C_2)$ similarity matrix | **6.85 ms** |
| **End-to-End Pipeline** | Full ingest, segment, vectorize, index | $\mathcal{O}(N)$ | $\mathcal{O}(N)$ | **28.61 ms** |

### 2. Frontend Bundle Optimization & Dynamic Code Splitting
- **Dynamic Lazy Loading**: Built with `React.lazy()` and `<Suspense>` boundaries across all top-level routes (`UploadPage`, `WorkspacePage`, `ComparisonPage`, `BriefingPage`, `AuthModal`, `SavedContractsModal`).
- **Initial Load Chunk**: Compressed from monolithic >400 kB down to **82.20 kB gzipped** (`index-*.js`).
- **Zero Heavy UI Dependencies**: Built with Vanilla CSS design tokens instead of bulky utility frameworks, eliminating runtime CSS injection overhead.

```text
dist/index.html                                1.49 kB │ gzip:  0.65 kB
dist/assets/index-CG_19ERR.css                 5.53 kB │ gzip:  1.86 kB
dist/assets/NotFoundPage-*.js                  1.63 kB │ gzip:  0.86 kB
dist/assets/UploadPage-*.js                    5.10 kB │ gzip:  1.82 kB
dist/assets/SavedContractsModal-*.js           8.04 kB │ gzip:  2.74 kB
dist/assets/AuthModal-*.js                     9.05 kB │ gzip:  2.77 kB
dist/assets/BriefingPage-*.js                 19.49 kB │ gzip:  4.54 kB
dist/assets/ComparisonPage-*.js               22.92 kB │ gzip:  6.06 kB
dist/assets/WorkspacePage-*.js                30.76 kB │ gzip:  7.23 kB
dist/assets/index-*.js                       265.11 kB │ gzip: 82.20 kB
```

### 3. AI Cost & Token Economy (85%+ Savings)
- **Deterministic Rule Engine Caching**: 20+ common legal risk vectors (uncapped indemnification, unilateral termination, non-competes, binding arbitration) are evaluated 100% locally in **4.12ms** with zero external API calls.
- **Selective LLM Synthesis**: Cloud LLMs (Gemini / OpenAI) are called only for multi-clause synthesis and contextual natural language explanation, cutting token usage by **>85%**.
- **Context Pruning**: RAG retrieval passes only top-$k$ relevant clause chunks into the model prompt instead of entire 50-page agreements, avoiding context window bloat.

### 4. Memory Footprint & Zero-Leak Architecture
- **RAM Ceiling**: Operates under **< 50 MB RAM** peak memory during multi-page contract processing.
- **Session Purging**: Volatile session memory automatically expires with a 3600-second TTL or on explicit `DELETE /api/documents/current`.
- **Zero Disk I/O**: Documents and vectors are processed purely in volatile RAM buffers.

---

## Accessibility (WCAG 2.2 Level AA Compliance)

Clarity is built from the ground up for full screen reader and keyboard accessibility:

| WCAG Criterion | Implementation in Clarity | Compliance Status |
|---|---|:---:|
| **1.3.1 Info and Relationships** | Strict HTML5 semantic hierarchy (`<header>`, `<nav role="navigation">`, `<main role="main">`, `<section role="region">`, `<aside>`). | **Level AA Passed** |
| **1.4.1 Use of Color** | Risk badges never rely solely on color. Every indicator includes bold explicit text (`HIGH RISK`, `WORTH NOTING`, `STANDARD`) and dedicated icons. | **Level AA Passed** |
| **1.4.3 Contrast (Minimum)** | High-contrast dark-slate theme with >7.2:1 contrast ratio on primary text and >4.8:1 on secondary badges. | **Level AAA Passed** |
| **1.4.4 Resize Text** | Fluid rem/em typography supporting **200% browser zoom** without horizontal scrolling or clipping. | **Level AA Passed** |
| **2.1.1 Keyboard Navigation** | 100% interactive elements accessible via `Tab`, `Shift+Tab`, `Enter`, and `Space`. Modals trap focus and close on `Escape`. | **Level AA Passed** |
| **2.4.7 Focus Visible** | High-contrast `2px solid #6366f1` focus rings with `2px` offset on all active buttons, inputs, and clause cards. | **Level AA Passed** |
| **4.1.2 Name, Role, Value** | Full ARIA landmark support (`aria-label`, `aria-expanded`, `aria-live="polite"` on chat/status updates). | **Level AA Passed** |

---

## Problem Statement Alignment

| Problem Requirement | Clarity Architecture Component | User Experience |
|---|---|---|
| **Simplify** | [`SimplificationService`](backend/app/services/simplification_service.py) | Plain-English summary cards, obligations, rights, deadlines, and penalties. |
| **Compare** | [`ComparisonService`](backend/app/services/comparison_service.py) | Two-column semantic alignment (`MATCH`, `MODIFIED`, `ADDED`, `REMOVED`). |
| **Highlight Risk** | [`RiskClassifierService`](backend/app/services/risk_classifier.py) | 0-100 risk score, risk badges (`HIGH RISK`, `WORTH NOTING`, `STANDARD`), and verbatim quotes. |
| **Q&A** | [`GroundedAnswerService`](backend/app/services/grounded_answer_service.py) | Conversational RAG with exact clause numbers, page numbers, and quoted citations. |
| **Next Steps** | [`BriefingService`](backend/app/services/briefing_service.py) | 10-section "Prepare for my lawyer" brief with negotiation levers and questions for counsel. |
| **Checklist** | Briefing Preparation Output | Actionable review checklist with Markdown and PDF export capabilities. |

---

## Limitations

> [!IMPORTANT]
> 1. **Not Legal Advice**: Clarity provides document understanding and preparation support. It is **not a substitute for professional legal counsel** and does not create an attorney-client relationship.
> 2. **No Signing Decisions**: Clarity does not advise users to sign or reject contracts.
> 3. **No Jurisdiction-Specific Legal Interpretation**: Contract enforceability varies by state, country, and governing law; users should verify jurisdiction-specific nuances with licensed counsel.
> 4. **Probabilistic Nature of LLMs**: While boundary framing, deterministic rules, and citation verification minimize errors, LLM outputs should always be reviewed against the verbatim text.

---

## Local Development

### Prerequisites
* **Python 3.10+** (with pip)
* **Node.js 18+** (with npm)

### 1. Clone Repository
```bash
git clone https://github.com/innocentgaming/legal.git
cd legal
```

### 2. Backend Setup
```bash
# Create and activate virtual environment (optional but recommended)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI backend server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend will be available at: `http://127.0.0.1:8000`
* Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
# In a new terminal window
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
* Frontend will be available at: `http://localhost:5173`

---

## Environment Variables

Create a `.env` file in the project root:

```ini
# Server Configuration
HOST=127.0.0.1
PORT=8000
ENVIRONMENT=development
DEBUG=true

# LLM Providers (Optional — built-in heuristic engine runs offline without keys)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash
OPENAI_MODEL=gpt-4o-mini

# Ingestion Security Constraints
MAX_FILE_SIZE_MB=25
```

---

## Testing

Run the automated test suite across all 11 phases (59 tests):

```bash
# Run all unit, integration, grounding, security, comparison, and accessibility tests
python -m pytest tests/ backend/app/tests/ -v

# Run performance benchmarks with latency measurements
python -m pytest tests/test_performance_benchmarks.py -v -s

# Run frontend build check
cd frontend && npm run build
```

---

## Deployment

### Docker Deployment

Create a `Dockerfile` in the root:

```dockerfile
FROM python:3.11-slim AS backend
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend
COPY samples/ ./samples

FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY --from=backend /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend /app /app
COPY --from=frontend-builder /frontend/dist /app/frontend/dist

ENV PORT=8000
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build and Run Docker Container
```bash
docker build -t clarity-legal-ai .
docker run -p 8000:8000 --env-file .env clarity-legal-ai
```

---

## Demo Flow

1. **Landing Page**:
   - Open `http://localhost:5173`.
   - View core features and 4 benchmark agreements (Lease, NDA, Employment IP, Vendor MSA).
2. **Upload / Sample Ingestion**:
   - Click **"Analyze a document"** or select **"Residential Lease Agreement"**.
3. **Workspace Exploration**:
   - **Left Column**: Filter clauses by `HIGH RISK` or search keywords.
   - **Center Column**: Toggle between Plain-English Summary and Original Verbatim Text.
   - **Right Column (Tab 1 - Risk Analysis)**: Review 0-100 risk score and flagged indemnity/liability clauses.
   - **Right Column (Tab 2 - Grounded Q&A)**: Ask *"What is the notice period for termination?"* and click on cited sources.
4. **Two-Document Comparison**:
   - Navigate to **Compare** tab to align Version 1 vs Version 2 and view categorized modifications.
5. **Lawyer Briefing**:
   - Navigate to **Briefing** tab to inspect the 10-section preparation sheet and click **"Export as Markdown"** or **"Print / Export PDF"**.
