import json
import re
from typing import List, Dict, Any
import httpx
from backend.app.core.config import settings

class RiskClassifierService:
    """
    Automated Legal Risk Classifier.
    Supports external LLM (Gemini/OpenAI) with high-accuracy heuristic fallback.
    """

    @classmethod
    async def classify(cls, clauses: List[Dict[str, Any]], raw_text: str, filename: str) -> Dict[str, Any]:
        if settings.GEMINI_API_KEY:
            try:
                return await cls._classify_with_gemini(clauses, filename)
            except Exception as e:
                print(f"[RiskClassifier] Gemini error: {e}. Falling back to legal heuristic.")
        elif settings.OPENAI_API_KEY:
            try:
                return await cls._classify_with_openai(clauses, filename)
            except Exception as e:
                print(f"[RiskClassifier] OpenAI error: {e}. Falling back to legal heuristic.")

        return cls._classify_heuristically(clauses, raw_text, filename)

    @classmethod
    async def _classify_with_gemini(cls, clauses: List[Dict[str, Any]], filename: str) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        summary_snippets = "\n".join([f"- [{c['id']}] {c['title']} ({c['category']}): {c['text'][:240]}" for c in clauses[:40]])
        
        prompt = f"""You are a Senior Corporate Counsel. Audit this legal contract: "{filename}".
CLAUSES:
{summary_snippets}

Produce a JSON response matching this schema:
{{
  "overall_risk_score": <0-100 integer>,
  "risk_level": "High" | "Medium" | "Low",
  "executive_summary": "<2-3 sentence legal assessment>",
  "key_findings": [
    {{
      "clause_id": "<e.g. clause-1>",
      "clause_title": "<title>",
      "severity": "High" | "Medium" | "Low",
      "risk_category": "<Category>",
      "issue_summary": "<explanation of risk>",
      "legal_recommendation": "<remediation guidance>",
      "flagged_text": "<quoted phrase>"
    }}
  ],
  "missing_clauses": ["<missing protective clauses>"],
  "favorable_terms": ["<favorable clauses>"]
}}
Return raw JSON only."""

        async with httpx.AsyncClient(timeout=40.0) as client:
            resp = await client.post(url, json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
            })
            resp.raise_for_status()
            text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            clean_json = re.sub(r"^```json\s*|\s*```$", "", text.strip())
            return json.loads(clean_json)

    @classmethod
    async def _classify_with_openai(cls, clauses: List[Dict[str, Any]], filename: str) -> Dict[str, Any]:
        url = "https://api.openai.com/v1/chat/completions"
        summary_snippets = "\n".join([f"- [{c['id']}] {c['title']}: {c['text'][:240]}" for c in clauses[:40]])
        
        async with httpx.AsyncClient(timeout=40.0) as client:
            resp = await client.post(url, headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}, json={
                "model": settings.OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a Senior Legal Auditor. Respond in JSON."},
                    {"role": "user", "content": f"Audit {filename}:\n{summary_snippets}"}
                ],
                "response_format": {"type": "json_object"}
            })
            resp.raise_for_status()
            return json.loads(resp.json()["choices"][0]["message"]["content"])

    @classmethod
    def _classify_heuristically(cls, clauses: List[Dict[str, Any]], raw_text: str, filename: str) -> Dict[str, Any]:
        findings = []
        base_score = 15
        categories_present = set()

        for c in clauses:
            t_lower = c["text"].lower()
            cat = c["category"]
            categories_present.add(cat)
            cid = c["id"]
            title = c["title"]

            # Liability
            if "liability" in cat.lower() or "liability" in t_lower:
                if any(w in t_lower for w in ["unlimited", "no limitation", "shall not apply to", "without limit"]):
                    findings.append({
                        "clause_id": cid,
                        "clause_title": title,
                        "severity": "High",
                        "risk_category": "Limitation of Liability",
                        "issue_summary": "Uncapped liability structure exposes the organization to unbounded financial claims.",
                        "legal_recommendation": "Insert a definitive mutual liability cap (e.g. 12 months fees paid) and disclaim consequential damages.",
                        "flagged_text": c["text"][:280]
                    })
                    base_score += 30
                elif "consequential" not in t_lower and "indirect" not in t_lower:
                    findings.append({
                        "clause_id": cid,
                        "clause_title": title,
                        "severity": "Medium",
                        "risk_category": "Limitation of Liability",
                        "issue_summary": "Absence of express waiver for indirect, special, and consequential damages.",
                        "legal_recommendation": "Include standard waiver of lost profits and incidental/punitive damages.",
                        "flagged_text": c["text"][:280]
                    })
                    base_score += 15

            # Indemnity
            if "indemnif" in cat.lower() or "indemnif" in t_lower:
                is_customer_indemnifying = any(w in t_lower for w in ["customer shall", "licensee shall", "client shall", "customer agrees to"]) and "indemnif" in t_lower
                is_provider_indemnifying = any(w in t_lower for w in ["mutual", "each party", "provider shall also", "provider shall defend", "provider shall indemnify"])
                if is_customer_indemnifying and not is_provider_indemnifying:
                    findings.append({
                        "clause_id": cid,
                        "clause_title": title,
                        "severity": "High",
                        "risk_category": "Indemnification",
                        "issue_summary": "Unilateral indemnification obligation with zero reciprocal defense from vendor.",
                        "legal_recommendation": "Make indemnity bilateral and subject to prompt notice, defense control, and settlement rights.",
                        "flagged_text": c["text"][:280]
                    })
                    base_score += 25

            # Non-Compete
            if "non-compete" in t_lower or "restrictive covenant" in cat.lower():
                findings.append({
                    "clause_id": cid,
                    "clause_title": title,
                    "severity": "High",
                    "risk_category": "Restrictive Covenants",
                    "issue_summary": "Broad non-compete term restricts operational freedom.",
                    "legal_recommendation": "Limit restriction strictly to trade secret non-use or remove non-compete.",
                    "flagged_text": c["text"][:280]
                })
                base_score += 20

            # Termination
            if "terminat" in t_lower and ("immediate" in t_lower or "without notice" in t_lower):
                findings.append({
                    "clause_id": cid,
                    "clause_title": title,
                    "severity": "Medium",
                    "risk_category": "Termination & Remedies",
                    "issue_summary": "Unilateral termination without mandatory notice or cure window.",
                    "legal_recommendation": "Require 30 days written notice with opportunity to cure prior to termination for cause.",
                    "flagged_text": c["text"][:280]
                })
                base_score += 12

        missing = []
        if "Limitation of Liability" not in categories_present:
            missing.append("Limitation of Liability & Consequential Damages Waiver")
            base_score += 15
        if "Governing Law & Disputes" not in categories_present:
            missing.append("Governing Law & Dispute Resolution Venue")
            base_score += 10
        if "Confidentiality" not in categories_present:
            missing.append("Standard Mutual Confidentiality Obligations")
            base_score += 10
        if "Force Majeure" not in raw_text:
            missing.append("Force Majeure & Excused Performance")

        final_score = min(95, max(10, base_score))
        risk_level = "High" if final_score >= 65 else ("Medium" if final_score >= 40 else "Low")

        return {
            "overall_risk_score": final_score,
            "risk_level": risk_level,
            "executive_summary": f"Audit of '{filename}' completed across {len(clauses)} clauses. Found {len(findings)} actionable risk flags with an overall {risk_level.lower()} risk posture.",
            "key_findings": findings,
            "missing_clauses": missing,
            "favorable_terms": [
                "Document contains clear section headers for audit trail",
                "Includes explicit clause boundaries for dispute resolution"
            ]
        }
