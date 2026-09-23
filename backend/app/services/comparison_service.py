import difflib
import json
import re
from typing import Dict, Any, List
import httpx
from backend.app.core.config import settings
from backend.app.services.clause_segmentation_service import ClauseSegmentationService

class ComparisonService:
    """
    Handles clause redline generation, diff calculation,
    and multi-version document comparison.
    """

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
    def compare_documents(cls, text_a: str, text_b: str, label_a: str = "Version A", label_b: str = "Version B") -> Dict[str, Any]:
        clauses_a = ClauseSegmentationService.segment(text_a)
        clauses_b = ClauseSegmentationService.segment(text_b)

        # Compute sequence similarity
        matcher = difflib.SequenceMatcher(None, text_a, text_b)
        sim_ratio = matcher.ratio()

        clause_diffs = []
        max_len = max(len(clauses_a), len(clauses_b))

        for i in range(max_len):
            ca = clauses_a[i] if i < len(clauses_a) else None
            cb = clauses_b[i] if i < len(clauses_b) else None

            if ca and cb:
                clause_sim = difflib.SequenceMatcher(None, ca["text"], cb["text"]).ratio()
                clause_diffs.append({
                    "section": ca.get("section_number") or cb.get("section_number") or str(i+1),
                    "title": ca.get("title") or cb.get("title"),
                    "text_a": ca["text"],
                    "text_b": cb["text"],
                    "status": "Identical" if clause_sim > 0.98 else ("Modified" if clause_sim > 0.4 else "Replaced"),
                    "similarity": round(clause_sim, 2)
                })
            elif ca and not cb:
                clause_diffs.append({
                    "section": ca.get("section_number") or str(i+1),
                    "title": ca.get("title"),
                    "text_a": ca["text"],
                    "text_b": "",
                    "status": "Removed in Version B",
                    "similarity": 0.0
                })
            elif cb and not ca:
                clause_diffs.append({
                    "section": cb.get("section_number") or str(i+1),
                    "title": cb.get("title"),
                    "text_a": "",
                    "text_b": cb["text"],
                    "status": "Added in Version B",
                    "similarity": 0.0
                })

        return {
            "similarity_score": round(sim_ratio * 100, 1),
            "total_differences": sum(1 for d in clause_diffs if d["status"] != "Identical"),
            "clause_diffs": clause_diffs
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
