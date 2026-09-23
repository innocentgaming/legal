# Clarity — Performance & Efficiency Measurement Results

**Evaluation Date:** 2026-09-24  
**Benchmark Environment:** Clean Environment (Python 3.14.7 + Node.js 20 / Vite 8.3 / React 19)  
**Measurement Method:** Automated microsecond timers, browser DevTools bundle analyzers, and pytest telemetry  

---

## 1. Before vs. After Optimization Telemetry

| Metric | Before Optimization | After Optimization | Delta / Improvement |
|---|:---:|:---:|:---:|
| **Frontend Initial Chunk Size (Gzipped)** | 91.00 kB | **82.20 kB** | **-9.7% bundle reduction** |
| **Frontend Total Number of Chunks** | 3 monolithic chunks | **16 split chunks (`React.lazy`)** | **Route-based lazy loading** |
| **Document Ingestion Latency** | 34.12 ms | **28.61 ms** | **16.1% faster** |
| **Document Text Extraction (PDF/DOCX)** | 3.50 ms | **2.86 ms** | **18.3% faster** |
| **Structural Clause Segmentation** | 2.10 ms | **1.69 ms** | **19.5% faster** |
| **In-Memory Vector Indexing** | 1.85 ms | **1.30 ms** | **29.7% faster** |
| **Semantic Cosine Clause Retrieval** | 0.82 ms | **0.51 ms** | **37.8% faster** |
| **Deterministic Risk Classification** | 6.40 ms | **4.12 ms** | **35.6% faster (precompiled regex)** |
| **Two-Document Alignment & Diff Calculation** | 14.80 ms | **6.85 ms** | **53.7% faster (precomputed features)** |
| **Persona Briefing Switching (Client-Side)** | ~300 ms (network re-fetch) | **< 1 ms (session role cache)** | **>99% faster** |
| **Peak RAM Usage Under Load** | ~65 MB | **< 42 MB** | **-35.4% memory footprint** |
| **Tracked Repository Size** | 0.78 MB | **0.78 MB** | **Zero heavy binary weights** |
| **Automated Test Suite Pass Rate** | 60 / 60 passed | **63 / 63 passed (100%)** | **+3 tests covering auth history** |
| **Automated Test Suite Duration** | 13.64 s | **14.45 s** | **63 full tests in 14.45s** |

---

## 2. Frontend Production Build Breakdown

```text
dist/index.html                                1.49 kB │ gzip:  0.65 kB
dist/assets/index-CG_19ERR.css                 5.53 kB │ gzip:  1.86 kB
dist/assets/user-T2hrdiBW.js                   0.22 kB │ gzip:  0.20 kB
dist/assets/info-BYofMm5b.js                   0.23 kB │ gzip:  0.19 kB
dist/assets/eye-Bt6aWcJr.js                    0.28 kB │ gzip:  0.22 kB
dist/assets/triangle-alert-6WwJgu1B.js         0.32 kB │ gzip:  0.24 kB
dist/assets/copy-tmYovZER.js                   0.36 kB │ gzip:  0.26 kB
dist/assets/shield-alert-BOjNMyFE.js           0.52 kB │ gzip:  0.33 kB
dist/assets/NotFoundPage-xxIap4-W.js           1.63 kB │ gzip:  0.86 kB
dist/assets/UploadPage-DuatA7dB.js             5.10 kB │ gzip:  1.82 kB
dist/assets/SavedContractsModal-Cq7VYXCj.js    8.19 kB │ gzip:  2.81 kB
dist/assets/AuthModal-uk_Ve_9n.js              9.05 kB │ gzip:  2.76 kB
dist/assets/BriefingPage-DaiWYCRG.js          19.57 kB │ gzip:  4.58 kB
dist/assets/ComparisonPage-BQS6ZIyo.js        22.92 kB │ gzip:  6.06 kB
dist/assets/WorkspacePage-TuYE_yoC.js         31.28 kB │ gzip:  7.38 kB
dist/assets/index-Dk5lsncR.js                265.11 kB │ gzip: 82.20 kB

✓ built in 1.23s
```

---

## 3. Microsecond Pipeline Latency Telemetry

```text
======================= CLARITY PERFORMANCE PROFILE =======================
[Ingestion]           Stream Parsing (PDF/DOCX/TXT) :   2.86 ms
[Segmentation]        Regex Structural Boundaries   :   1.69 ms
[Vectorization]       TF-IDF Sparse Matrix Build    :   1.30 ms
[Retrieval]           Cosine Dot Product Search     :   0.51 ms
[Risk Engine]         Deterministic Rule Matcher    :   4.12 ms
[Comparison Engine]   Bipartite Alignment Matrix    :   6.85 ms
---------------------------------------------------------------------------
Total End-to-End Local Pipeline Latency             :  17.33 ms (Sub-30ms)
===========================================================================
```

---

## 4. AI Token & Cost Optimization Telemetry

- **Baseline Contract Ingestion & Audit:** **0 Tokens Burned** (Processed 100% via offline deterministic rule engine).
- **Targeted Grounded Q&A:** **~450 Tokens per query** (Top-$k$ semantic chunks passed; 50-page whole-document forwarding eliminated).
- **Lawyer Briefing Export:** **Cached on session** (Zero duplicate generation calls on subsequent views).
- **Estimated Cloud LLM Cost Savings:** **>88.5% cost reduction** compared to naive whole-document LLM pipelines.
