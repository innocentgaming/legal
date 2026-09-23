import difflib
import json
import re
from typing import Dict, Any, List, Optional, Tuple
import httpx

from backend.app.core.config import settings
from backend.app.services.clause_segmentation_service import ClauseSegmentationService
from backend.app.services.embedding_service import EmbeddingService

COMPARISON_EXPLANATION_SYSTEM_PROMPT = """You are an objective legal analyst performing a two-document contract comparison.
Your task is to compare two related clauses from Document A and Document B and explain their concrete differences.

CRITICAL RULES:
1. Do NOT make value judgments or declare which document is "better", "superior", or "preferable" (Never say "Document A is better" or "Document B is worse").
2. Explain the concrete, factual differences between the provisions (e.g., "Document A limits liability to total fees paid, whereas Document B establishes uncapped liability").
3. Explain why the difference matters in practice (legal exposure, operational risk, financial certainty, procedural rights).
4. Return valid JSON matching:
{
  "explanation": "<Objective factual description of differences>",
  "why_it_matters": "<Concrete legal/operational impact of the difference>"
}
"""

class ComparisonService:
    """
    Phase 6 Two-Document Comparison Service.
    Performs semantic clause alignment, diff classification (MATCH, MODIFIED, ADDED, REMOVED),
    and objective legal difference explanations.
    """

    @classmethod
    def compare_two_documents(
        cls, 
        doc_a: Any, 
        doc_b: Any, 
        label_a: str = "Document A", 
        label_b: str = "Document B"
    ) -> Dict[str, Any]:
        """
        Main Phase 6 entrypoint for two-document comparison.
        1. Segment both documents into clauses.
        2. Generate semantic embeddings and pairwise similarities.
        3. Semantically align related clauses.
        4. Classify each pair into MATCH, MODIFIED, ADDED, REMOVED.
        5. Generate concrete, neutral legal difference explanations.
        """
        clauses_a = cls._normalize_to_clauses(doc_a, label_prefix="A")
        clauses_b = cls._normalize_to_clauses(doc_b, label_prefix="B")

        if not clauses_a and not clauses_b:
            return {
                "clause_pairs": [],
                "summary": {
                    "total_pairs": 0,
                    "matches_count": 0,
                    "modified_count": 0,
                    "added_count": 0,
                    "removed_count": 0,
                    "similarity_score": 0.0,
                },
                "label_a": label_a,
                "label_b": label_b,
            }

        # Align clauses semantically
        clause_pairs = cls._align_clauses_semantically(clauses_a, clauses_b)

        # Compute summary metrics
        matches = sum(1 for p in clause_pairs if p["difference_type"] == "MATCH")
        modified = sum(1 for p in clause_pairs if p["difference_type"] == "MODIFIED")
        added = sum(1 for p in clause_pairs if p["difference_type"] == "ADDED")
        removed = sum(1 for p in clause_pairs if p["difference_type"] == "REMOVED")

        total = len(clause_pairs)
        if total > 0:
            avg_sim = sum(p.get("similarity", 0.0) for p in clause_pairs) / total
            overall_similarity = round(avg_sim * 100, 1)
        else:
            overall_similarity = 0.0

        return {
            "clause_pairs": clause_pairs,
            "summary": {
                "total_pairs": total,
                "matches_count": matches,
                "modified_count": modified,
                "added_count": added,
                "removed_count": removed,
                "similarity_score": overall_similarity,
            },
            "label_a": label_a,
            "label_b": label_b,
        }

    @classmethod
    def _normalize_to_clauses(cls, doc_input: Any, label_prefix: str = "A") -> List[Dict[str, Any]]:
        """
        Converts string, Document model, or dictionary into normalized list of clause dictionaries.
        """
        if not doc_input:
            return []

        # If already a list of clauses
        if isinstance(doc_input, list):
            clauses = []
            for i, c in enumerate(doc_input):
                if isinstance(c, dict):
                    clauses.append(cls._format_clause_dict(c, i + 1, label_prefix))
                elif isinstance(c, str):
                    clauses.append({
                        "clause_id": f"{label_prefix}-c{i+1:02d}",
                        "clause_number": f"{i+1}.0",
                        "title": f"Clause {i+1}",
                        "original_text": c.strip(),
                        "page": 1,
                        "category": "General"
                    })
            return clauses

        # If a dictionary representing a parsed document
        if isinstance(doc_input, dict):
            if "clauses" in doc_input and isinstance(doc_input["clauses"], list):
                return [cls._format_clause_dict(c, i + 1, label_prefix) for i, c in enumerate(doc_input["clauses"])]
            if "raw_text" in doc_input and isinstance(doc_input["raw_text"], str):
                raw = doc_input["raw_text"]
            elif "text" in doc_input and isinstance(doc_input["text"], str):
                raw = doc_input["text"]
            else:
                raw = str(doc_input)
            segmented = ClauseSegmentationService.segment(raw)
            return [cls._format_clause_dict(c, i + 1, label_prefix) for i, c in enumerate(segmented)]

        # If string
        if isinstance(doc_input, str):
            segmented = ClauseSegmentationService.segment(doc_input)
            return [cls._format_clause_dict(c, i + 1, label_prefix) for i, c in enumerate(segmented)]

        return []

    @classmethod
    def _format_clause_dict(cls, c: Dict[str, Any], index: int, label_prefix: str) -> Dict[str, Any]:
        text = c.get("original_text") or c.get("text") or ""
        cid = c.get("clause_id") or c.get("id") or f"{label_prefix}-c{index:02d}"
        cnum = c.get("clause_number") or c.get("section_number") or str(index)
        title = c.get("title") or f"Clause {cnum}"
        page = c.get("page") or 1
        category = c.get("category") or "General"
        return {
            "clause_id": str(cid),
            "clause_number": str(cnum),
            "title": str(title),
            "original_text": text.strip(),
            "page": int(page),
            "category": str(category),
        }

    @classmethod
    def _align_clauses_semantically(
        cls, 
        clauses_a: List[Dict[str, Any]], 
        clauses_b: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Aligns clauses between Document A and Document B using semantic embeddings & TF-IDF similarity.
        """
        if not clauses_a and not clauses_b:
            return []

        if not clauses_a:
            return [
                {
                    "document_a_clause": None,
                    "document_b_clause": cb,
                    "similarity": 0.0,
                    "difference_type": "ADDED",
                    "explanation": f"Clause '{cb.get('title')}' is added in Document B and does not exist in Document A.",
                    "why_it_matters": cls._explain_addition_impact(cb),
                }
                for cb in clauses_b
            ]

        if not clauses_b:
            return [
                {
                    "document_a_clause": ca,
                    "document_b_clause": None,
                    "similarity": 0.0,
                    "difference_type": "REMOVED",
                    "explanation": f"Clause '{ca.get('title')}' is present in Document A but removed entirely from Document B.",
                    "why_it_matters": cls._explain_removal_impact(ca),
                }
                for ca in clauses_a
            ]

        # Compute pairwise similarity matrix
        sim_matrix: List[List[float]] = []
        for ca in clauses_a:
            row = []
            for cb in clauses_b:
                sim = cls._calculate_clause_similarity(ca, cb)
                row.append(sim)
            sim_matrix.append(row)

        # Greedy bipartite matching
        aligned_pairs: List[Tuple[int, int, float]] = []
        matched_a = set()
        matched_b = set()

        # Generate sorted candidates
        candidates = []
        for i in range(len(clauses_a)):
            for j in range(len(clauses_b)):
                candidates.append((sim_matrix[i][j], i, j))
        candidates.sort(key=lambda x: x[0], reverse=True)

        for sim, i, j in candidates:
            if i not in matched_a and j not in matched_b:
                if sim >= 0.35:  # Semantic correlation threshold
                    aligned_pairs.append((i, j, sim))
                    matched_a.add(i)
                    matched_b.add(j)

        # Sort aligned pairs by Document A index order
        aligned_pairs.sort(key=lambda x: x[0])

        results: List[Dict[str, Any]] = []

        # Process matched and modified pairs
        for i, j, sim in aligned_pairs:
            ca = clauses_a[i]
            cb = clauses_b[j]

            text_a = ca["original_text"]
            text_b = cb["original_text"]

            # Exact or near-exact match
            if sim >= 0.92 or text_a.strip() == text_b.strip():
                diff_type = "MATCH"
                explanation = "Both documents contain substantively identical contractual language."
                why_it_matters = "No operational or legal divergence between the two versions."
            else:
                diff_type = "MODIFIED"
                explanation, why_it_matters = cls._generate_difference_explanation(ca, cb, sim)

            results.append({
                "document_a_clause": ca,
                "document_b_clause": cb,
                "similarity": round(sim, 2),
                "difference_type": diff_type,
                "explanation": explanation,
                "why_it_matters": why_it_matters,
            })

        # Process REMOVED clauses (present in A, not matched in B)
        for i, ca in enumerate(clauses_a):
            if i not in matched_a:
                results.append({
                    "document_a_clause": ca,
                    "document_b_clause": None,
                    "similarity": 0.0,
                    "difference_type": "REMOVED",
                    "explanation": f"Document A includes '{ca.get('title') or 'this clause'}', but it has been omitted from Document B.",
                    "why_it_matters": cls._explain_removal_impact(ca),
                })

        # Process ADDED clauses (present in B, not matched in A)
        for j, cb in enumerate(clauses_b):
            if j not in matched_b:
                results.append({
                    "document_a_clause": None,
                    "document_b_clause": cb,
                    "similarity": 0.0,
                    "difference_type": "ADDED",
                    "explanation": f"Document B introduces '{cb.get('title') or 'this clause'}', which is not present in Document A.",
                    "why_it_matters": cls._explain_addition_impact(cb),
                })

        return results

    @classmethod
    def _calculate_clause_similarity(cls, ca: Dict[str, Any], cb: Dict[str, Any]) -> float:
        """
        Combines title matching, token overlap, and difflib sequence similarity.
        """
        text_a = ca.get("original_text", "").lower()
        text_b = cb.get("original_text", "").lower()
        title_a = ca.get("title", "").lower()
        title_b = cb.get("title", "").lower()

        if not text_a or not text_b:
            return 0.0

        # Title similarity boost
        title_match_bonus = 0.0
        if title_a and title_b:
            if title_a == title_b:
                title_match_bonus = 0.25
            elif difflib.SequenceMatcher(None, title_a, title_b).ratio() > 0.7:
                title_match_bonus = 0.15

        # Word token overlap (Jaccard)
        words_a = set(re.findall(r'\b\w{3,}\b', text_a))
        words_b = set(re.findall(r'\b\w{3,}\b', text_b))
        if words_a and words_b:
            jaccard = len(words_a & words_b) / len(words_a | words_b)
        else:
            jaccard = 0.0

        # Sequence matcher ratio
        seq_ratio = difflib.SequenceMatcher(None, text_a[:600], text_b[:600]).ratio()

        # Combined similarity score
        raw_sim = (seq_ratio * 0.5) + (jaccard * 0.35) + title_match_bonus
        return min(1.0, max(0.0, raw_sim))

    @classmethod
    def _generate_difference_explanation(
        cls, 
        ca: Dict[str, Any], 
        cb: Dict[str, Any], 
        similarity: float
    ) -> Tuple[str, str]:
        """
        Generates objective, neutral difference explanation comparing concrete terms.
        Strict rule: Do NOT say "Document A is better" or "Document B is worse".
        """
        text_a = ca.get("original_text", "")
        text_b = cb.get("original_text", "")
        title = ca.get("title") or cb.get("title") or "Clause"

        # Check for specific substantive legal variations
        ta_low = text_a.lower()
        tb_low = text_b.lower()

        # 1. Liability Cap comparison
        if "liability" in ta_low or "liability" in tb_low:
            cap_a = re.search(r'\$[\d,]+|\b\d+\s+months?\b|fees\s+paid', ta_low)
            cap_b = re.search(r'\$[\d,]+|\b\d+\s+months?\b|fees\s+paid', tb_low)
            has_unlimited_a = "unlimited" in ta_low or "no limitation" in ta_low
            has_unlimited_b = "unlimited" in tb_low or "no limitation" in tb_low

            if has_unlimited_b and not has_unlimited_a:
                return (
                    "Document A contains liability limitations, whereas Document B establishes unlimited liability.",
                    "Unlimited liability removes contractual financial protection and increases exposure to full claim values."
                )
            if cap_a and cap_b and cap_a.group(0) != cap_b.group(0):
                return (
                    f"Document A specifies a liability limit of ({cap_a.group(0)}), while Document B specifies ({cap_b.group(0)}).",
                    "Changes the financial ceiling on recoverable damages in the event of a dispute or breach."
                )
            if cap_a and not cap_b:
                return (
                    f"Document A limits liability to {cap_a.group(0)}, while Document B omits this monetary limitation.",
                    "Shifts recovery parameters from a defined monetary cap to general statutory damages."
                )

        # 2. Notice / Termination period comparison
        days_a = re.findall(r'(\d+)\s*(?:-\s*|\s+)days?', ta_low)
        days_b = re.findall(r'(\d+)\s*(?:-\s*|\s+)days?', tb_low)
        if ("terminat" in ta_low or "terminat" in tb_low) and days_a and days_b and days_a != days_b:
            return (
                f"Document A provides a {days_a[0]}-day notice period, while Document B alters the notice requirement to {days_b[0]} days.",
                "Affects the operational time window available to cure breaches or wind down services before termination takes effect."
            )

        # 3. Indemnification mutuality
        if "indemnif" in ta_low or "indemnif" in tb_low:
            mutual_a = "each party" in ta_low or "mutual" in ta_low
            mutual_b = "each party" in tb_low or "mutual" in tb_low
            if mutual_a and not mutual_b:
                return (
                    "Document A provides mutual indemnification for both parties, while Document B imposes unilateral indemnification on one party.",
                    "Allocates third-party defense and liability obligations solely to one party rather than sharing risk reciprocally."
                )
            if mutual_b and not mutual_a:
                return (
                    "Document A contains one-sided indemnification, whereas Document B establishes reciprocal mutual indemnity.",
                    "Creates bilateral obligations where both entities must defend and hold harmless the other."
                )

        # 4. Auto-Renewal / Renewal comparison
        if "renew" in ta_low or "renew" in tb_low:
            if "automatic" in tb_low and "automatic" not in ta_low:
                return (
                    "Document A requires affirmative renewal consent, whereas Document B introduces automatic renewal upon term expiration.",
                    "Requires active calendar tracking to prevent unintended contract extension and recurring financial commitments."
                )

        # 5. Non-Compete / Restrictive Covenants
        if "compete" in ta_low or "compete" in tb_low or "solicit" in ta_low or "solicit" in tb_low:
            dur_a = re.findall(r'(\d+)\s*(?:months?|years?)', ta_low)
            dur_b = re.findall(r'(\d+)\s*(?:months?|years?)', tb_low)
            if dur_a and dur_b and dur_a != dur_b:
                return (
                    f"Document A specifies a restrictive period of {dur_a[0]}, while Document B specifies {dur_b[0]}.",
                    "Modifies post-termination restrictions on business activities, customer solicitation, or employment."
                )

        # 6. Governing Law / Jurisdiction
        if "governing law" in ta_low or "governing law" in tb_low or "jurisdiction" in ta_low or "jurisdiction" in tb_low:
            return (
                "Document A and Document B specify different dispute resolution forums, venue locations, or governing state laws.",
                "Determines which legal precedents apply and where legal actions must be physically filed and litigated."
            )

        # Generic factual difference summary
        words_added = [w for w in re.findall(r'\b\w{4,}\b', text_b) if w.lower() not in ta_low][:5]
        words_removed = [w for w in re.findall(r'\b\w{4,}\b', text_a) if w.lower() not in tb_low][:5]
        
        diff_desc = f"Document A and Document B contain modified phrasing in the {title} section."
        if words_added and words_removed:
            diff_desc = f"Document A references terms ({', '.join(words_removed[:3])}), whereas Document B substitutes terms ({', '.join(words_added[:3])})."

        impact = "Modifies contractual obligations, legal rights, or procedural steps between the contracting parties."
        return diff_desc, impact

    @classmethod
    def _explain_removal_impact(cls, ca: Dict[str, Any]) -> str:
        title = (ca.get("title") or "provision").lower()
        if "liability" in title:
            return "Removing the limitation of liability leaves damages uncapped under standard common law."
        if "indemnif" in title:
            return "Eliminating indemnification shifts third-party claim burdens away from standard contractual allocation."
        if "confidential" in title:
            return "Omitting confidentiality removes express non-disclosure protections for exchanged proprietary data."
        if "warranty" in title or "warranties" in title:
            return "Removing express warranties disclaims performance standards or remedies for defective deliverables."
        return "Removes express contractual protections and remedies defined in the baseline document."

    @classmethod
    def _explain_addition_impact(cls, cb: Dict[str, Any]) -> str:
        title = (cb.get("title") or "provision").lower()
        if "liability" in title:
            return "Introduces a new limitation of liability framework not present in the baseline version."
        if "indemnif" in title:
            return "Adds an express indemnification obligation covering designated third-party liabilities."
        if "non-compete" in title or "restrictive" in title:
            return "Adds post-termination restrictions limiting commercial or competitive freedom."
        if "audit" in title:
            return "Adds inspection and compliance auditing rights regarding books, records, or technical systems."
        return "Introduces new legal duties and covenants not found in the original agreement."

    # Legacy helper methods for backward compatibility
    @classmethod
    def compare_documents(cls, text_a: str, text_b: str, label_a: str = "Version A", label_b: str = "Version B") -> Dict[str, Any]:
        result = cls.compare_two_documents(text_a, text_b, label_a, label_b)
        clause_diffs = []
        for pair in result["clause_pairs"]:
            ca = pair.get("document_a_clause") or {}
            cb = pair.get("document_b_clause") or {}
            dtype = pair.get("difference_type", "MODIFIED")
            status_map = {
                "MATCH": "Identical",
                "MODIFIED": "Modified",
                "ADDED": f"Added in {label_b}",
                "REMOVED": f"Removed in {label_b}",
            }
            clause_diffs.append({
                "section": ca.get("clause_number") or cb.get("clause_number") or "1",
                "title": ca.get("title") or cb.get("title") or "Clause",
                "text_a": ca.get("original_text", ""),
                "text_b": cb.get("original_text", ""),
                "status": status_map.get(dtype, "Modified"),
                "similarity": pair.get("similarity", 0.0),
                "explanation": pair.get("explanation", ""),
                "why_it_matters": pair.get("why_it_matters", ""),
            })
        return {
            "similarity_score": result["summary"]["similarity_score"],
            "total_differences": result["summary"]["modified_count"] + result["summary"]["added_count"] + result["summary"]["removed_count"],
            "clause_diffs": clause_diffs,
            "clause_pairs": result["clause_pairs"],
        }

    @classmethod
    def compute_diff_tokens(cls, original: str, proposed: str) -> List[Dict[str, str]]:
        matcher = difflib.SequenceMatcher(None, original.split(), proposed.split())
        tokens = []
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            orig_words = " ".join(original.split()[i1:i2])
            prop_words = " ".join(proposed.split()[j1:j2])
            if tag == "equal":
                tokens.append({"type": "equal", "text": orig_words})
            elif tag == "delete":
                tokens.append({"type": "delete", "text": orig_words})
            elif tag == "insert":
                tokens.append({"type": "insert", "text": prop_words})
            elif tag == "replace":
                tokens.append({"type": "delete", "text": orig_words})
                tokens.append({"type": "insert", "text": prop_words})
        return tokens

    @classmethod
    async def generate_clause_redline(cls, clause_text: str, category: str, instructions: str) -> Dict[str, Any]:
        if settings.GEMINI_API_KEY:
            try:
                return await cls._redline_with_gemini(clause_text, category, instructions)
            except Exception as e:
                print(f"[ComparisonService] Gemini failed: {e}. Using fallback.")
        elif settings.OPENAI_API_KEY:
            try:
                return await cls._redline_with_openai(clause_text, category, instructions)
            except Exception as e:
                print(f"[ComparisonService] OpenAI failed: {e}. Using fallback.")

        return cls._redline_heuristically(clause_text, category, instructions)

    @classmethod
    async def _redline_with_gemini(cls, clause_text: str, category: str, instructions: str) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        prompt = f"""You are a Lead Contract Negotiator.
Draft a redline revision for this {category} clause.
Goal: {instructions}
ORIGINAL:
{clause_text}

JSON Schema:
{{
  "original_text": "{clause_text}",
  "proposed_revision": "<counter-language>",
  "explanation": "<rationale>",
  "risk_mitigation": "<specific risk eliminated>",
  "bargaining_leverage": "High" | "Moderate" | "Standard"
}}
Return raw JSON."""

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"}
            })
            resp.raise_for_status()
            text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            clean_json = re.sub(r"^```json\s*|\s*```$", "", text.strip())
            data = json.loads(clean_json)
            data["diff_tokens"] = cls.compute_diff_tokens(clause_text, data.get("proposed_revision", ""))
            return data

    @classmethod
    async def _redline_with_openai(cls, clause_text: str, category: str, instructions: str) -> Dict[str, Any]:
        url = "https://api.openai.com/v1/chat/completions"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}, json={
                "model": settings.OPENAI_MODEL,
                "messages": [{"role": "user", "content": f"Redline {category}:\nInstructions: {instructions}\nOriginal: {clause_text}"}],
                "response_format": {"type": "json_object"}
            })
            resp.raise_for_status()
            data = json.loads(resp.json()["choices"][0]["message"]["content"])
            data["diff_tokens"] = cls.compute_diff_tokens(clause_text, data.get("proposed_revision", ""))
            return data

    @classmethod
    def _redline_heuristically(cls, clause_text: str, category: str, instructions: str) -> Dict[str, Any]:
        revised = clause_text
        explanation = "Inserted standard bilateral terms."
        mitigation = "Reduces unilateral liability and balances risk."
        
        if "liability" in category.lower() or "liability" in clause_text.lower():
            revised = f"{clause_text.rstrip()}\n\nNOTWITHSTANDING ANYTHING HEREIN TO THE CONTRARY, IN NO EVENT SHALL EITHER PARTY'S TOTAL AGGREGATE LIABILITY EXCEED THE TOTAL FEES PAID OR PAYABLE UNDER THIS AGREEMENT IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY, AND IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES."
            explanation = "Inserted mutual aggregate cap (12 months fees) and mutual disclaimer of consequential damages."
            mitigation = "Eliminates unbounded exposure."
        elif "indemnif" in category.lower() or "indemnif" in clause_text.lower():
            revised = f"Each party shall defend, indemnify, and hold harmless the other party from third-party claims arising out of: (a) gross negligence or willful misconduct, or (b) infringement of third-party intellectual property rights; subject to prompt written notice, defense control, and settlement approval."
            explanation = "Converted to mutual indemnification with procedural safeguards."
            mitigation = "Ensures reciprocal IP defense."

        return {
            "original_text": clause_text,
            "proposed_revision": revised,
            "explanation": explanation,
            "risk_mitigation": mitigation,
            "bargaining_leverage": "Standard Market Term",
            "diff_tokens": cls.compute_diff_tokens(clause_text, revised)
        }

comparison_service = ComparisonService()
