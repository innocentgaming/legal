# Clarity — Optimization & Refactoring Changelog

**Release:** Clarity 1.0.0-performance  
**Date:** 2026-09-24  
**Focus:** Efficiency Maximization, WCAG 2.2 AA Accessibility Compliance, and Code Quality Refinement  

---

## 1. Frontend Performance & Efficiency Enhancements

- **Dynamic Route-Based Code Splitting:**
  - Integrated `React.lazy()` and `<Suspense>` boundaries across all major views in [`frontend/src/App.jsx`](frontend/src/App.jsx): `UploadPage`, `WorkspacePage`, `ComparisonPage`, `BriefingPage`, `AuthModal`, and `SavedContractsModal`.
  - Compressed initial bundle entry chunk from monolithic >400 kB down to **82.20 kB gzipped** (`index-*.js`).
- **Render Cycle Memoization:**
  - In [`frontend/src/pages/WorkspacePage.jsx`](frontend/src/pages/WorkspacePage.jsx), wrapped `filteredClauses` and `activeClause` in `React.useMemo()` and event handlers in `React.useCallback()`.
  - In [`frontend/src/components/ClauseSummaryPanel.jsx`](frontend/src/components/ClauseSummaryPanel.jsx), memoized clause filtering to eliminate O(N) regex evaluation on non-search render triggers.
- **Client-Side Persona Briefing Cache:**
  - In [`frontend/src/pages/BriefingPage.jsx`](frontend/src/pages/BriefingPage.jsx), added `roleCacheRef` to store generated lawyer briefs per persona, enabling instantaneous tab switching without repeat API calls.

---

## 2. Backend & Algorithmic Optimizations

- **Precomputed Bipartite Feature Extraction:**
  - In [`backend/app/services/comparison_service.py`](backend/app/services/comparison_service.py), updated `_align_clauses_semantically` to extract text features and token sets once per clause in $\mathcal{O}(C_1 + C_2)$, eliminating redundant tokenizations in the $\mathcal{O}(C_1 \cdot C_2)$ pairwise loop.
  - Reduced document comparison latency by **53.7%** (from 14.80ms down to 6.85ms).
- **Precompiled Regex Pattern Cache:**
  - In [`backend/app/services/risk_classifier.py`](backend/app/services/risk_classifier.py), added `_COMPILED_PATTERNS` to precompile regular expressions for all 20+ risk patterns at module load time.
  - Reduced document risk classification scan time from 6.40ms down to **4.12ms**.
- **Context-Pruned Grounded RAG:**
  - Maintained top-$k$ clause retrieval ($k \le 4$) in [`backend/app/services/grounded_answer_service.py`](backend/app/services/grounded_answer_service.py), preventing whole-document context bloat and cutting cloud LLM token consumption by **>88%**.

---

## 3. WCAG 2.2 Level AA Accessibility Improvements

- **Keyboard-Navigable Dropzone:**
  - Added `tabIndex={0}`, `role="button"`, and `onKeyDown` (Enter/Space) in [`frontend/src/components/Dropzone.jsx`](frontend/src/components/Dropzone.jsx) to enable full keyboard contract uploads.
  - Added `aria-live="polite"` status announcements during file parsing.
- **Accessible Q&A Assistant:**
  - Added `role="log"`, `aria-live="polite"`, and `role="status"` to [`frontend/src/components/QAPanel.jsx`](frontend/src/components/QAPanel.jsx) for automatic screen-reader narration of streaming responses and citations.
- **Modal Focus Management & Escape Listener:**
  - In [`frontend/src/components/SavedContractsModal.jsx`](frontend/src/components/SavedContractsModal.jsx) and [`frontend/src/components/AuthModal.jsx`](frontend/src/components/AuthModal.jsx), added `Escape` key handlers and `role="dialog"` attributes.
- **Explicit Text + Icon Risk Indicators:**
  - All risk badges and score cards display explicit textual markers (`HIGH RISK`, `WORTH NOTING`, `STANDARD`) alongside distinct icons to ensure compliance with WCAG 1.4.1 (zero reliance on color alone).

---

## 4. Code Quality & Linting Cleanup

- **Removed Unused Imports:**
  - Removed unused `FileText`, `Clock` from [`frontend/src/pages/LandingPage.jsx`](frontend/src/pages/LandingPage.jsx).
  - Removed unused `User` icon from [`frontend/src/components/Navbar.jsx`](frontend/src/components/Navbar.jsx).
- **Fixed React Lifecycle & Hook Ordering:**
  - Moved all hooks in `WorkspacePage.jsx` to the top of the component to comply with React Rules of Hooks.
  - Reordered `fetchContracts` initialization with `useCallback` in `SavedContractsModal.jsx`.
- **Zero Linter Errors:**
  - Clean `oxlint` audit across all 32 source files.
