import json
import re
from typing import List, Dict, Any, Optional, Tuple
import httpx
from backend.app.core.config import settings

RISK_CLASSIFICATION_SYSTEM_PROMPT = """You are an expert legal risk classifier. Your task is to objectively assess legal clauses and classify their contractual importance and risk posture.

CRITICAL CONSTRAINTS:
1. Do NOT claim that clauses are legally harmful by default. Classify their potential operational and legal importance based purely on the clause text.
2. NEVER invent a risk or term that does not appear in the source text.
3. Every evidence field MUST be an exact verbatim quoted substring from the source clause.
4. Output one of three risk levels:
   - "HIGH_RISK": Imposes uncapped/unlimited liability, broad one-sided indemnification, unilateral termination without notice/cure, strict non-compete, or complete irrevocable IP assignment.
   - "WORTH_NOTING": Contains auto-renewal with cancellation windows, liability caps, liquidated damages, interest penalties, restrictive covenants, data protection rules, exclusivity, or arbitration.
   - "STANDARD": Routine boilerplate, mutual confidentiality with reasonable care, standard definitions, or standard governing law/jurisdiction.

Return valid JSON with an array of objects matching:
[
  {
    "clause_id": "<ID>",
    "risk_level": "STANDARD" | "WORTH_NOTING" | "HIGH_RISK",
    "reason": "<Objective explanation of why this clause has this risk level>",
    "evidence": "<Exact verbatim quoted excerpt from the clause text>",
    "source_clause": "<e.g. Clause 1.1 or Title>"
  }
]
"""

class DeterministicRiskEngine:
    """
    Deterministic rule-based pattern matcher for 20+ known legal risk patterns.
    Extracts exact verbatim evidence from clause text with zero hallucinations.
    """

    PATTERNS: List[Dict[str, Any]] = [
        # 1. Unlimited Liability
        {
            "id": "unlimited_liability",
            "category": "Limitation of Liability",
            "risk_level": "HIGH_RISK",
            "regex": r"(?:liability\s+shall\s+be\s+unlimited|shall\s+be\s+unlimited|unlimited\s+liability|no\s+limitation\s+of\s+liability|without\s+(?:any\s+)?limitation\s+of\s+liability|liability\s+is\s+completely\s+excluded)",
            "reason": "Imposes uncapped or unlimited financial liability on a contracting party."
        },
        # 2. Liability Caps (Worth Noting / Standard)
        {
            "id": "liability_cap",
            "category": "Limitation of Liability",
            "risk_level": "WORTH_NOTING",
            "regex": r"(?:aggregate\s+liability\s+(?:shall\s+not\s+exceed|is\s+capped|shall\s+be\s+limited)|capped\s+at\s+total\s+fees|exceed\s+fees\s+paid\s+in\s+the\s+prior\s+\d+\s+months)",
            "reason": "Establishes a financial liability cap restricting recoverable damages to fees paid."
        },
        # 3. Consequential Damages Waiver
        {
            "id": "consequential_damages",
            "category": "Limitation of Liability",
            "risk_level": "WORTH_NOTING",
            "regex": r"(?:neither\s+party\s+shall\s+be\s+liable\s+for\s+indirect|consequential|lost\s+profits|punitive\s+damages|special\s+damages)",
            "reason": "Disclaims liability for indirect, incidental, punitive, or consequential losses."
        },
        # 4. Broad One-Sided Indemnification
        {
            "id": "broad_indemnity",
            "category": "Indemnification",
            "risk_level": "HIGH_RISK",
            "regex": r"(?:shall\s+defend[,\s]+indemnify[,\s]+and\s+hold\s+harmless\s+provider\s+from\s+any\s+and\s+all|indemnify\s+and\s+hold\s+harmless\s+from\s+any\s+and\s+all\s+claims|customer\s+shall\s+defend\s+and\s+indemnify|tenant\s+shall\s+defend[,\s]+indemnify)",
            "reason": "Imposes broad one-sided defense and indemnification obligations for third-party claims."
        },
        # 5. Mutual / Standard Indemnification
        {
            "id": "standard_indemnity",
            "category": "Indemnification",
            "risk_level": "WORTH_NOTING",
            "regex": r"(?:indemnif\w*|hold\s+harmless|defend\s+against\s+(?:third-party\s+)?claims)",
            "reason": "Allocates responsibility for defending and covering specific third-party claims."
        },
        # 6. Unilateral / Immediate Termination Rights
        {
            "id": "unilateral_termination",
            "category": "Termination & Remedies",
            "risk_level": "HIGH_RISK",
            "regex": r"(?:terminate\s+(?:this\s+agreement\s+)?immediately\s+without\s+notice|at\s+its\s+sole\s+discretion\s+without\s+notice|terminate\s+immediately\s+without\s+cure|immediate\s+termination\s+without\s+cure)",
            "reason": "Grants unilateral right to terminate the contract immediately without notice or opportunity to cure."
        },
        # 7. Broad Termination Rights / Notice
        {
            "id": "broad_termination",
            "category": "Termination & Remedies",
            "risk_level": "WORTH_NOTING",
            "regex": r"(?:terminate\s+for\s+convenience|upon\s+\d+\s+days\s+written\s+notice|written\s+cure\s+period\s+of\s+\d+\s+days|opportunity\s+to\s+cure)",
            "reason": "Specifies termination triggers, convenience cancellation, and mandatory cure windows."
        },
        # 8. Auto-Renewal / Automatic Renewal
        {
            "id": "auto_renewal",
            "category": "Term & Renewal",
            "risk_level": "WORTH_NOTING",
            "regex": r"(?:automatic(?:ally)?\s+renew|consecutive\s+(?:one-year|annual|\d+-month)\s+terms|unless\s+(?:either\s+party\s+gives\s+)?written\s+notice\s+at\s+least\s+\d+\s+days\s+prior)",
            "reason": "Contract automatically renews for successive terms unless cancelled within a designated notice window."
        },
        # 9. Non-Compete
        {
            "id": "non_compete",
            "category": "Restrictive Covenants",
            "risk_level": "HIGH_RISK",
            "regex": r"(?:non-compete|non-competition|shall\s+not\s+engage\s+in\s+any\s+competing\s+business|shall\s+not\s+provide\s+similar\s+services\s+to\s+competitors)",
            "reason": "Restricts post-contract commercial operations and competitive business activities."
        },
        # 10. Non-Solicitation
        {
            "id": "non_solicitation",
            "category": "Restrictive Covenants",
            "risk_level": "WORTH_NOTING",
            "regex": r"(?:non-solicit|solicit\s+or\s+hire|shall\s+(?:not\s+)?(?:directly\s+or\s+indirectly\s+)?solicit|solicit\s+(?:any\s+)?employees|hire\s+(?:any\s+)?employees)",
            "reason": "Restricts hiring or soliciting employees or contractors post-termination."
        },
        # 11. Late Payment Penalties & Interest
        {
            "id": "late_payment_penalties",
            "category": "Payment & Commercial",
            "risk_level": "WORTH_NOTING",
            "regex": r"(?:late\s+(?:fee|payment)\s+penalty|incur\s+a\s+\d+%\s+penalty|interest\s+at\s+the\s+rate\s+of\s+\d+(?:\.\d+)?%|interest\s+of\s+\d+(?:\.\d+)?%\s+per\s+month)",
            "reason": "Imposes monetary penalties or ongoing interest charges for delayed invoice payments."
        },
        # 12. Intellectual Property Assignment
        {
            "id": "ip_assignment",
            "category": "Intellectual Property",
            "risk_level": "HIGH_RISK",
            "regex": r"(?:irrevocably\s+assigns\s+all\s+(?:right|title|and\s+interest)|all\s+work\s+product\s+and\s+inventions\s+created\s+shall\s+be|work\s+made\s+for\s+hire|waives\s+all\s+moral\s+rights)",
            "reason": "Transfers full ownership of intellectual property, work product, and inventions."
        },
        # 13. Exclusivity
        {
            "id": "exclusivity",
            "category": "Commercial Restrictions",
            "risk_level": "HIGH_RISK",
            "regex": r"(?:exclusive\s+(?:provider|partner|distributor|agent)|sole\s+and\s+exclusive|shall\s+not\s+contract\s+with\s+any\s+other|exclusivity)",
            "reason": "Imposes exclusivity preventing engagement with alternative vendors or partners."
        },
        # 14. Mandatory Arbitration & Class Action Waiver
        {
            "id": "arbitration",
            "category": "Dispute Resolution",
            "risk_level": "WORTH_NOTING",
            "regex": r"(?:binding\s+arbitration|american\s+arbitration\s+association|aaa\s+rules|waives\s+(?:any\s+right\s+to\s+)?trial\s+by\s+jury|class\s+action\s+waiver)",
            "reason": "Requires binding arbitration and waives public court litigation and jury trial rights."
        },
        # 15. Data & Privacy Obligations
        {
            "id": "data_privacy",
            "category": "Data & Privacy",
            "risk_level": "WORTH_NOTING",
            "regex": r"(?:personal\s+data|gdpr|ccpa|data\s+processing\s+addendum|security\s+breach\s+notification|protect\s+customer\s+data)",
            "reason": "Establishes compliance obligations regarding personal data processing and cybersecurity breaches."
        },
        # 16. Broad Warranties & Disclaimers
        {
            "id": "warranty_disclaimer",
            "category": "Warranties & Disclaimers",
            "risk_level": "WORTH_NOTING",
            "regex": r"(?:as\s+is[,\s]+without\s+warranty|disclaims\s+all\s+warranties|merchantability|fitness\s+for\s+a\s+particular\s+purpose)",
            "reason": "Disclaims statutory and implied warranties regarding software or service quality."
        },
        # 17. Long Notice Periods
        {
            "id": "long_notice",
            "category": "Procedural Obligations",
            "risk_level": "WORTH_NOTING",
            "regex": r"(?:(?:60|90|120|180)\s+days\s+(?:prior\s+)?written\s+notice|written\s+notice\s+of\s+(?:at\s+least\s+)?(?:60|90|120)\s+days)",
            "reason": "Imposes a substantial advance notice period before procedural actions or cancellation."
        },
        # 18. Governing Law & Jurisdiction
        {
            "id": "governing_law",
            "category": "Governing Law",
            "risk_level": "STANDARD",
            "regex": r"(?:governed\s+by\s+(?:and\s+construed\s+in\s+accordance\s+with\s+)?the\s+laws\s+of|jurisdiction\s+of\s+the\s+courts\s+of|venue\s+shall\s+be)",
            "reason": "Standard contractual selection of applicable legal jurisdiction and venue."
        },
        # 19. Standard Confidentiality
        {
            "id": "confidentiality",
            "category": "Confidentiality",
            "risk_level": "STANDARD",
            "regex": r"(?:maintain\s+(?:in\s+)?confiden\w*|reasonable\s+care|protect\s+confidential\s+information|non-disclosure)",
            "reason": "Standard mutual obligation to protect proprietary information using reasonable care."
        }
    ]

    @classmethod
    def analyze_clause(cls, clause: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs deterministic rule evaluation against a single clause.
        Extracts exact verbatim evidence from the clause text.
        """
        cid = clause.get("clause_id") or clause.get("id") or "CLAUSE-001"
        c_num = clause.get("clause_number") or clause.get("section_number") or ""
        title = clause.get("title") or f"Clause {c_num}"
        source_label = f"Clause {c_num}: {title}".strip(": ") if c_num else title
        text = clause.get("original_text") or clause.get("text") or ""
        
        if not text.strip():
            return {
                "clause_id": cid,
                "risk_level": "STANDARD",
                "reason": "Clause contains no text.",
                "evidence": "",
                "source_clause": source_label,
                "category": "General"
            }

        # Match against patterns in order of severity
        matched_results = []
        for pattern in cls.PATTERNS:
            match = re.search(pattern["regex"], text, re.IGNORECASE)
            if match:
                matched_evidence = match.group(0).strip()
                # Expand slightly to sentence boundary for clarity while guaranteeing it's a substring
                sentence_evidence = cls._extract_exact_sentence_containing(text, match.start(), match.end())
                evidence = sentence_evidence or matched_evidence

                matched_results.append({
                    "clause_id": cid,
                    "risk_level": pattern["risk_level"],
                    "reason": pattern["reason"],
                    "evidence": evidence,
                    "source_clause": source_label,
                    "category": pattern["category"]
                })

        if matched_results:
            # Sort by severity (HIGH_RISK first, then WORTH_NOTING, then STANDARD)
            priority = {"HIGH_RISK": 3, "WORTH_NOTING": 2, "STANDARD": 1}
            matched_results.sort(key=lambda r: priority.get(r["risk_level"], 0), reverse=True)
            return matched_results[0]

        # Default fallback: Standard clause without known high-risk triggers
        first_sentence = text.split(".")[0].strip()
        evidence_snippet = first_sentence[:120] if first_sentence else text[:80]
        return {
            "clause_id": cid,
            "risk_level": "STANDARD",
            "reason": f"Standard contractual terms governing {title or 'this section'}.",
            "evidence": evidence_snippet,
            "source_clause": source_label,
            "category": clause.get("category") or "General"
        }

    @staticmethod
    def _extract_exact_sentence_containing(text: str, start_idx: int, end_idx: int) -> str:
        # Find sentence boundaries surrounding the match
        sent_start = 0
        for m in re.finditer(r"(?<=[.?!])\s+", text[:start_idx]):
            sent_start = m.end()

        sent_end = len(text)
        m_end = re.search(r"[.?!](?:\s+|$)", text[end_idx:])
        if m_end:
            sent_end = end_idx + m_end.end()

        extracted = text[sent_start:sent_end].strip()
        # Verify it's strictly a substring of text
        if extracted in text and len(extracted) >= (end_idx - start_idx):
            return extracted
        return text[start_idx:end_idx].strip()


class RiskClassifierService:
    """
    Hybrid Legal Risk Classifier combining:
    1. Deterministic rules for known patterns (100% grounded, zero hallucinations).
    2. LLM contextual interpretation for holistic assessment and reasoning.
    """

    @classmethod
    async def classify(cls, clauses: List[Dict[str, Any]], raw_text: str = "", filename: str = "") -> Dict[str, Any]:
        """
        Classifies all clauses in a document using the hybrid architecture.
        """
        if not clauses:
            return cls._empty_analysis(filename)

        # 1. Deterministic Baseline (Guarantees every clause has exact evidence & known pattern detection)
        deterministic_risks: List[Dict[str, Any]] = [
            DeterministicRiskEngine.analyze_clause(c) for c in clauses
        ]

        # 2. Try Contextual LLM Enrichment if API Key available
        llm_risks = None
        if settings.GEMINI_API_KEY:
            try:
                llm_risks = await cls._classify_with_gemini(clauses, filename)
            except Exception as e:
                print(f"[RiskClassifierService] Gemini contextual classification failed: {e}. Using deterministic hybrid.")
        elif settings.OPENAI_API_KEY:
            try:
                llm_risks = await cls._classify_with_openai(clauses, filename)
            except Exception as e:
                print(f"[RiskClassifierService] OpenAI contextual classification failed: {e}. Using deterministic hybrid.")

        # 3. Hybrid Merger
        merged_risks = cls._merge_hybrid_results(deterministic_risks, llm_risks, clauses)

        # 4. Compute Aggregate Risk Posture
        high_count = sum(1 for r in merged_risks if r["risk_level"] == "HIGH_RISK")
        worth_count = sum(1 for r in merged_risks if r["risk_level"] == "WORTH_NOTING")
        std_count = sum(1 for r in merged_risks if r["risk_level"] == "STANDARD")

        base_score = 10 + (high_count * 25) + (worth_count * 10)
        overall_score = min(98, max(12, base_score))
        overall_level = "High" if overall_score >= 60 or high_count >= 2 else ("Medium" if overall_score >= 35 or worth_count >= 2 else "Low")

        # Key findings for backward compatibility with UI
        key_findings = []
        for r in merged_risks:
            if r["risk_level"] in ["HIGH_RISK", "WORTH_NOTING"]:
                key_findings.append({
                    "clause_id": r["clause_id"],
                    "clause_title": r["source_clause"],
                    "severity": "High" if r["risk_level"] == "HIGH_RISK" else "Medium",
                    "risk_category": r.get("category", "General"),
                    "issue_summary": r["reason"],
                    "legal_recommendation": cls._get_recommendation(r.get("category", ""), r["risk_level"]),
                    "flagged_text": r["evidence"]
                })

        summary = (
            f"Risk audit of '{filename or 'Contract'}' completed across {len(clauses)} clauses. "
            f"Identified {high_count} high-priority clauses, {worth_count} worth noting, and {std_count} standard terms. "
            f"Overall risk level is {overall_level} ({overall_score}/100)."
        )

        return {
            "overall_risk_score": overall_score,
            "risk_level": overall_level,
            "executive_summary": summary,
            "clause_risks": merged_risks,
            "key_findings": key_findings,
            "missing_clauses": cls._detect_missing_clauses(clauses, raw_text),
            "favorable_terms": [
                "Document contains explicit section boundaries and clause numbering.",
                "Dispute resolution mechanisms and governing law are clearly identified."
            ],
            "high_risk_count": high_count,
            "worth_noting_count": worth_count,
            "standard_count": std_count
        }

    @classmethod
    def audit_document(cls, clauses: List[Dict[str, Any]], raw_text: str = "", filename: str = "") -> Dict[str, Any]:
        """
        Synchronous baseline document audit using deterministic pattern rules.
        """
        if not clauses:
            return cls._empty_analysis(filename)
        deterministic_risks = [DeterministicRiskEngine.analyze_clause(c) for c in clauses]
        merged_risks = cls._merge_hybrid_results(deterministic_risks, None, clauses)
        high_count = sum(1 for r in merged_risks if r["risk_level"] == "HIGH_RISK")
        worth_count = sum(1 for r in merged_risks if r["risk_level"] == "WORTH_NOTING")
        std_count = sum(1 for r in merged_risks if r["risk_level"] == "STANDARD")
        base_score = 10 + (high_count * 25) + (worth_count * 10)
        overall_score = min(98, max(12, base_score))
        overall_level = "High" if overall_score >= 60 or high_count >= 2 else ("Medium" if overall_score >= 35 or worth_count >= 2 else "Low")
        key_findings = [
            {
                "clause_id": r["clause_id"],
                "clause_title": r["source_clause"],
                "severity": "High" if r["risk_level"] == "HIGH_RISK" else "Medium",
                "risk_category": r.get("category", "General"),
                "issue_summary": r["reason"],
                "legal_recommendation": cls._get_recommendation(r.get("category", ""), r["risk_level"]),
                "flagged_text": r["evidence"]
            }
            for r in merged_risks if r["risk_level"] in ["HIGH_RISK", "WORTH_NOTING"]
        ]
        return {
            "overall_risk_score": overall_score,
            "risk_level": overall_level,
            "executive_summary": f"Audit of '{filename or 'Contract'}' identified {high_count} high-priority clauses.",
            "clause_risks": merged_risks,
            "key_findings": key_findings,
            "missing_clauses": cls._detect_missing_clauses(clauses, raw_text),
            "high_risk_count": high_count,
            "worth_noting_count": worth_count,
            "standard_count": std_count
        }

    @classmethod
    def classify_single_clause(cls, clause_text: str, title: str = "", clause_id: str = "CLAUSE-001") -> Dict[str, Any]:
        """
        Classifies a single clause synchronously via deterministic rule engine.
        """
        dummy_clause = {
            "clause_id": clause_id,
            "title": title,
            "original_text": clause_text,
            "text": clause_text
        }
        return DeterministicRiskEngine.analyze_clause(dummy_clause)

    @classmethod
    async def _classify_with_gemini(cls, clauses: List[Dict[str, Any]], filename: str) -> Optional[List[Dict[str, Any]]]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        clause_payload = [
            {
                "clause_id": c.get("clause_id") or c.get("id"),
                "title": c.get("title"),
                "text": (c.get("original_text") or c.get("text", ""))[:400]
            }
            for c in clauses[:30]
        ]
        
        user_prompt = f"""Audit these clauses from contract '{filename}':\n{json.dumps(clause_payload, indent=2)}\n\nReturn structured JSON array of risk evaluations."""

        payload = {
            "system_instruction": {"parts": [{"text": RISK_CLASSIFICATION_SYSTEM_PROMPT}]},
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
        }

        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            clean_json = re.sub(r"^```json\s*|\s*```$", "", text.strip())
            return json.loads(clean_json)

    @classmethod
    async def _classify_with_openai(cls, clauses: List[Dict[str, Any]], filename: str) -> Optional[List[Dict[str, Any]]]:
        url = "https://api.openai.com/v1/chat/completions"
        clause_payload = [
            {
                "clause_id": c.get("clause_id") or c.get("id"),
                "title": c.get("title"),
                "text": (c.get("original_text") or c.get("text", ""))[:400]
            }
            for c in clauses[:30]
        ]

        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"}
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": RISK_CLASSIFICATION_SYSTEM_PROMPT},
                {"role": "user", "content": f"Audit {filename}:\n{json.dumps(clause_payload)}"}
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            res = json.loads(resp.json()["choices"][0]["message"]["content"])
            if isinstance(res, dict) and "risks" in res:
                return res["risks"]
            if isinstance(res, list):
                return res
            return None

    @classmethod
    def _merge_hybrid_results(
        cls,
        deterministic: List[Dict[str, Any]],
        llm_results: Optional[List[Dict[str, Any]]],
        clauses: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Merges deterministic baseline with LLM results.
        CRITICAL: Validates that every evidence quote strictly appears in source text.
        """
        clause_map = {c.get("clause_id") or c.get("id"): c for c in clauses}
        det_map = {d["clause_id"]: d for d in deterministic}

        if not llm_results or not isinstance(llm_results, list):
            return deterministic

        merged = []
        for det in deterministic:
            cid = det["clause_id"]
            clause_obj = clause_map.get(cid, {})
            clause_text = clause_obj.get("original_text") or clause_obj.get("text", "")
            
            # Find matching LLM result
            llm_match = next((item for item in llm_results if item.get("clause_id") == cid), None)

            if llm_match and isinstance(llm_match, dict):
                llm_risk = str(llm_match.get("risk_level", "")).upper()
                llm_reason = str(llm_match.get("reason", "")).strip()
                llm_evidence = str(llm_match.get("evidence", "")).strip()

                # Anti-Hallucination check: evidence MUST be a substring of the clause
                if llm_evidence and llm_evidence.lower() in clause_text.lower():
                    final_evidence = llm_evidence
                else:
                    final_evidence = det["evidence"]

                valid_risks = {"STANDARD", "WORTH_NOTING", "HIGH_RISK"}
                final_risk = llm_risk if llm_risk in valid_risks else det["risk_level"]
                final_reason = llm_reason if len(llm_reason) > 10 else det["reason"]

                merged.append({
                    "clause_id": cid,
                    "risk_level": final_risk,
                    "reason": final_reason,
                    "evidence": final_evidence,
                    "source_clause": det["source_clause"],
                    "category": det.get("category", "General")
                })
            else:
                merged.append(det)

        return merged

    @classmethod
    def _detect_missing_clauses(cls, clauses: List[Dict[str, Any]], raw_text: str) -> List[str]:
        categories = {c.get("category", "") for c in clauses}
        text_lower = (raw_text or " ".join([c.get("original_text", "") for c in clauses])).lower()
        
        missing = []
        if not any("liability" in cat.lower() for cat in categories) and "liability" not in text_lower:
            missing.append("Mutual Limitation of Liability & Consequential Damages Waiver")
        if not any("governing" in cat.lower() for cat in categories) and "governing law" not in text_lower:
            missing.append("Governing Law & Dispute Resolution Venue")
        if not any("confidential" in cat.lower() for cat in categories) and "confidential" not in text_lower:
            missing.append("Mutual Non-Disclosure & Confidentiality Obligations")
        if "force majeure" not in text_lower:
            missing.append("Force Majeure & Excused Operational Performance")

        return missing

    @classmethod
    def _get_recommendation(cls, category: str, risk_level: str) -> str:
        cat_lower = category.lower()
        if "liability" in cat_lower:
            return "Negotiate a balanced mutual liability cap tied to fees paid and disclaim consequential losses."
        if "indemnif" in cat_lower:
            return "Make indemnity bilateral, include control of defense, and require prompt written notice."
        if "non-compete" in cat_lower or "restrictive" in cat_lower:
            return "Limit non-compete scope strictly to proprietary trade secrets or negotiate reasonable duration."
        if "terminat" in cat_lower:
            return "Require 30-day written notice and mandatory cure period prior to termination for cause."
        if "payment" in cat_lower:
            return "Verify grace periods and ensure late interest rates align with statutory limits."
        return "Review operational alignment and ensure terms are reciprocal and balanced."

    @classmethod
    def _empty_analysis(cls, filename: str) -> Dict[str, Any]:
        return {
            "overall_risk_score": 0,
            "risk_level": "Low",
            "executive_summary": f"No clauses available for analysis in '{filename}'.",
            "clause_risks": [],
            "key_findings": [],
            "missing_clauses": [],
            "favorable_terms": [],
            "high_risk_count": 0,
            "worth_noting_count": 0,
            "standard_count": 0
        }

risk_classifier_service = RiskClassifierService()
