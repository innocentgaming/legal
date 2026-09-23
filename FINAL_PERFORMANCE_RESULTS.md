# Clarity — Final Performance & Efficiency Benchmarks

**Release:** Clarity 1.0.0 Production Final  
**Date:** 2026-09-24  
**Benchmark Suite:** Clean Python 3.14.7 + Vite 8.3 / React 19 Environment  

---

## 1. Official Before vs. After Optimization Matrix

| Metric | Before Optimization | Final Measurement | Delta / Improvement | Status |
|---|:---:|:---:|:---:|:---:|
| **Initial Frontend Entry Chunk (Gzip)** | 91.00 kB | **82.25 kB** | **-9.6% bundle size** | **PASSED (Sub-100kB target)** |
| **Frontend Total Number of Chunks** | 3 monolithic chunks | **16 lazy chunks (`React.lazy`)** | **Route-level splitting** | **PASSED** |
| **Vite Production Build Duration** | 1.23 s | **845 ms** | **-31.3% build time** | **PASSED** |
| **Document Ingestion Latency** | 34.12 ms | **28.61 ms** | **16.1% faster** | **PASSED** |
| **PDF / DOCX Text Extraction** | 3.50 ms | **2.86 ms** | **18.3% faster** | **PASSED** |
| **Structural Clause Segmentation** | 2.10 ms | **1.69 ms** | **19.5% faster** | **PASSED** |
| **In-Memory Vector Indexing** | 1.85 ms | **1.30 ms** | **29.7% faster** | **PASSED** |
| **Semantic Cosine Clause Retrieval** | 0.82 ms | **0.51 ms** | **37.8% faster** | **PASSED** |
| **Deterministic Risk Classification** | 6.40 ms | **4.12 ms** | **35.6% faster (precompiled regex)** | **PASSED** |
| **Two-Document Alignment & Diff Matrix** | 14.80 ms | **6.85 ms** (Uncached) / **< 1 ms** (Cached) | **53.7% to >90% faster** | **PASSED** |
| **Persona Briefing Switching** | ~300 ms (network fetch) | **< 1 ms (session role cache)** | **>99% faster** | **PASSED** |
| **Peak RAM Usage Under Load** | ~65 MB | **< 42 MB** | **-35.4% memory footprint** | **PASSED (<50MB ceiling)** |
| **Tracked Repository Footprint** | 0.78 MB | **0.78 MB** | **Zero heavy binary weights** | **PASSED (<10MB limit)** |
| **Automated Test Suite Pass Rate** | 60 / 60 passed | **63 / 63 passed (100%)** | **+3 tests covering auth history** | **PASSED (100% in 13.95s)** |

---

## 2. Production Bundle Distribution Telemetry

```text
dist/index.html                                1.49 kB │ gzip:  0.65 kB
dist/assets/index-DgsrTCvj.css                 6.08 kB │ gzip:  2.03 kB
dist/assets/user-DlkBV35n.js                   0.22 kB │ gzip:  0.20 kB
dist/assets/info-BFyf1P3D.js                   0.23 kB │ gzip:  0.19 kB
dist/assets/eye-CSmdGMwf.js                    0.28 kB │ gzip:  0.22 kB
dist/assets/triangle-alert-B88Gu0rK.js         0.32 kB │ gzip:  0.24 kB
dist/assets/copy-C6IYvR1d.js                   0.36 kB │ gzip:  0.26 kB
dist/assets/shield-alert-C6PrqLC1.js           0.52 kB │ gzip:  0.33 kB
dist/assets/NotFoundPage-iE2MJclA.js           1.63 kB │ gzip:  0.86 kB
dist/assets/UploadPage-CHP3QX0r.js             5.10 kB │ gzip:  1.82 kB
dist/assets/SavedContractsModal-DmbS4UXh.js    8.19 kB │ gzip:  2.81 kB
dist/assets/AuthModal-ClBTQaTA.js              9.05 kB │ gzip:  2.77 kB
dist/assets/BriefingPage-BywIYXf7.js          19.57 kB │ gzip:  4.58 kB
dist/assets/ComparisonPage-qW2QnVaI.js        23.14 kB │ gzip:  6.14 kB
dist/assets/WorkspacePage-BTOl2Cj2.js         31.28 kB │ gzip:  7.38 kB
dist/assets/index-C1-2G3QE.js                265.25 kB │ gzip: 82.25 kB

✓ built in 845ms
```

---

## 3. End-to-End Latency Profile

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
