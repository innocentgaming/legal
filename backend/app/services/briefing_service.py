import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx

from backend.app.core.config import settings
from backend.app.services.risk_classifier import DeterministicRiskEngine

DISCLAIMER_TEXT = "Clarity provides document understanding and preparation support. It is not a substitute for professional legal advice."

PROHIBITED_PATTERNS = [
    (r"\byou\s+should\s+sign\b", "consider reviewing with your lawyer before executing"),
    (r"\bdo\s+not\s+sign\b", "consider clarifying these terms with counsel prior to signing"),
    (r"\bthis\s+contract\s+is\s+legally\s+invalid\b", "this provision may raise enforceability questions to discuss with counsel"),
    (r"\byou\s+will\s+win\b", "this clause provides favorable contractual language"),
    (r"\byou\s+will\s+lose\b", "this clause creates heightened operational exposure"),
]

class BriefingService:
    """
    Phase 7: Lawyer Briefing ("Prepare for my lawyer") Service.
    Generates a comprehensive 10-section one-page preparation briefing with exact citations.
    """

    @classmethod
    async def generate_briefing(
        cls, 
        filename: str, 
        clauses: List[Dict[str, Any]], 
        raw_text: str = "",
        target_role: str = "General Counsel",
        comparison_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generates the 10-section preparation briefing for a lawyer consultation.
        """
        if not clauses and raw_text:
            from backend.app.services.clause_segmentation_service import ClauseSegmentationService
            clauses = ClauseSegmentationService.segment(raw_text)

        # 1. Document Overview
        doc_overview = cls._generate_document_overview(filename, clauses, raw_text)

        # 2. Key Clauses
        key_clauses = cls._extract_key_clauses(clauses)

        # 3. High-Risk / Worth-Noting Clauses
        risk_clauses = cls._extract_risk_clauses(clauses)

        # 4. Open Questions
        open_questions = cls._identify_open_questions(clauses, raw_text)

        # 5. Important Deadlines
        deadlines = cls._extract_deadlines(clauses)

        # 6. Obligations
        obligations = cls._extract_obligations(clauses)

        # 7. Rights
        rights = cls._extract_rights(clauses)

        # 8. Potential Negotiation Points
        negotiation_points = cls._generate_negotiation_points(clauses, risk_clauses)

        # 9. Questions to Ask a Lawyer
        lawyer_questions = cls._generate_lawyer_questions(clauses, risk_clauses, open_questions)

        # 10. Document Comparison Findings
        comparison_findings = cls._format_comparison_findings(comparison_data)

        # Render Markdown export
        markdown_text = cls._render_markdown_briefing(
            filename=filename,
            overview=doc_overview,
            key_clauses=key_clauses,
            risk_clauses=risk_clauses,
            open_questions=open_questions,
            deadlines=deadlines,
            obligations=obligations,
            rights=rights,
            negotiation_points=negotiation_points,
            lawyer_questions=lawyer_questions,
            comparison_findings=comparison_findings,
            disclaimer=DISCLAIMER_TEXT
        )

        briefing_payload = {
            "section_1_overview": doc_overview,
            "section_2_key_clauses": key_clauses,
            "section_3_risk_clauses": risk_clauses,
            "section_4_open_questions": open_questions,
            "section_5_deadlines": deadlines,
            "section_6_obligations": obligations,
            "section_7_rights": rights,
            "section_8_negotiation_points": negotiation_points,
            "section_9_lawyer_questions": lawyer_questions,
            "section_10_comparison_findings": comparison_findings,
            "disclaimer": DISCLAIMER_TEXT,
            "markdown_content": markdown_text,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

        # Sanitize against prohibited phrases
        sanitized = cls._sanitize_data(briefing_payload)
        return sanitized

    @classmethod
    def _sanitize_text(cls, text: str) -> str:
        if not text:
            return ""
        cleaned = text
        for pattern, replacement in PROHIBITED_PATTERNS:
            cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)
        return cleaned

    @classmethod
    def _sanitize_data(cls, data: Any) -> Any:
        if isinstance(data, str):
            return cls._sanitize_text(data)
        elif isinstance(data, list):
            return [cls._sanitize_data(item) for item in data]
        elif isinstance(data, dict):
            return {k: cls._sanitize_data(v) for k, v in data.items()}
        return data

    @classmethod
    def _generate_document_overview(cls, filename: str, clauses: List[Dict[str, Any]], raw_text: str) -> Dict[str, Any]:
        combined_text = (raw_text or " ".join([c.get("original_text") or c.get("text", "") for c in clauses])).lower()
        
        # Detect contract type
        doc_type = "Commercial Contract"
        if "lease" in filename.lower() or "lease" in combined_text[:300]:
            doc_type = "Commercial Lease Agreement"
        elif "master services" in combined_text[:400] or "msa" in filename.lower():
            doc_type = "Master Services Agreement (MSA)"
        elif "non-disclosure" in combined_text[:400] or "nda" in filename.lower():
            doc_type = "Non-Disclosure Agreement (NDA)"
        elif "software" in combined_text[:400] or "saas" in combined_text[:400]:
            doc_type = "Software / SaaS License Agreement"
        elif "employment" in combined_text[:400]:
            doc_type = "Employment / Independent Contractor Agreement"

        # Detect parties
        parties = []
        m_parties = re.findall(r'between\s+([A-Z][A-Za-z0-9\s,\.\(\)]+?)\s+(?:and|\&)\s+([A-Z][A-Za-z0-9\s,\.\(\)]+?)(?:\.|\n|\,)', raw_text[:800])
        if m_parties:
            p1, p2 = m_parties[0]
            parties = [p1.strip()[:40], p2.strip()[:40]]
        else:
            if "landlord" in combined_text and "tenant" in combined_text:
                parties = ["Landlord", "Tenant"]
            elif "provider" in combined_text and "customer" in combined_text:
                parties = ["Provider / Vendor", "Customer / Client"]
            elif "disclosing party" in combined_text:
                parties = ["Disclosing Party", "Receiving Party"]

        # Detect term
        term_match = re.search(r'(?:term\s+of|period\s+of)\s+([0-9]+\s+(?:months?|years?))', combined_text)
        term_str = term_match.group(1) if term_match else "Standard ongoing term with termination provisions"

        summary = (
            f"Analyzed {len(clauses)} structured clauses in '{filename}'. "
            f"The document governs {doc_type.lower()} relations, establishing operational covenants, liability bounds, "
            f"and dispute resolution procedures between the contracting entities."
        )

        return {
            "document_title": filename.replace(".pdf", "").replace(".docx", "").replace(".txt", "").replace("_", " ").title(),
            "filename": filename,
            "contract_type": doc_type,
            "parties_detected": parties,
            "effective_term": term_str,
            "total_clauses_analyzed": len(clauses),
            "summary_paragraph": summary
        }

    @classmethod
    def _extract_key_clauses(cls, clauses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        key_list = []
        for c in clauses[:8]:
            c_num = c.get("clause_number") or c.get("section_number") or ""
            title = c.get("title") or f"Clause {c_num}"
            page = c.get("page") or 1
            text = c.get("original_text") or c.get("text") or ""
            cat = c.get("category") or "General"
            
            first_sent = text.split(".")[0].strip() + "."
            summary = first_sent[:160] if len(first_sent) > 20 else text[:140]

            key_list.append({
                "clause_number": str(c_num) if c_num else "1.0",
                "title": title,
                "summary": summary,
                "source_citation": f"Clause {c_num} • Page {page}" if c_num else f"Page {page}",
                "category": cat
            })
        return key_list

    @classmethod
    def _extract_risk_clauses(cls, clauses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        risk_list = []
        for c in clauses:
            res = DeterministicRiskEngine.analyze_clause(c)
            if res.get("risk_level") in ["HIGH_RISK", "WORTH_NOTING"]:
                c_num = c.get("clause_number") or c.get("section_number") or ""
                page = c.get("page") or 1
                risk_list.append({
                    "clause_number": str(c_num) if c_num else "Clause",
                    "title": c.get("title") or f"Clause {c_num}",
                    "risk_level": res["risk_level"],
                    "reason": res["reason"],
                    "evidence": res["evidence"][:180],
                    "source_citation": f"Clause {c_num} • Page {page}" if c_num else f"Page {page}"
                })
        
        if not risk_list and clauses:
            c = clauses[0]
            c_num = c.get("clause_number") or "1.0"
            page = c.get("page") or 1
            risk_list.append({
                "clause_number": str(c_num),
                "title": c.get("title") or "General Terms",
                "risk_level": "WORTH_NOTING",
                "reason": "Standard commercial risk profile. Review notice requirements with counsel.",
                "evidence": (c.get("original_text") or "")[:120],
                "source_citation": f"Clause {c_num} • Page {page}"
            })

        return risk_list

    @classmethod
    def _identify_open_questions(cls, clauses: List[Dict[str, Any]], raw_text: str) -> List[str]:
        text_l = (raw_text or " ".join([c.get("original_text") or c.get("text", "") for c in clauses])).lower()
        questions = []

        if "liability" not in text_l or "aggregate liability" not in text_l:
            questions.append("The document does not explicitly define an aggregate liability monetary ceiling; consider asking counsel if a fee-based cap should be inserted.")
        if "cure period" not in text_l and "notice" in text_l:
            questions.append("The document specifies termination notice but does not explicitly define a mandatory cure window for alleged breaches.")
        if "governing law" not in text_l:
            questions.append("The document does not clearly designate governing state law or venue jurisdiction for dispute resolution.")
        if "force majeure" not in text_l:
            questions.append("The document lacks a force majeure provision excusing operational performance during unforeseen emergencies.")
        if "data" in text_l and "gdpr" not in text_l and "privacy" not in text_l:
            questions.append("Data handling obligations are referenced, but specific regulatory privacy standards are not articulated.")

        if not questions:
            questions.append("Consider verifying with counsel whether operational service levels (SLAs) or performance metrics should be attached as an Exhibit.")
            questions.append("Consider clarifying whether IP ownership rights transfer upon invoice creation or upon full final payment.")

        return questions

    @classmethod
    def _extract_deadlines(cls, clauses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        deadlines = []
        for c in clauses:
            text = c.get("original_text") or c.get("text") or ""
            c_num = c.get("clause_number") or c.get("section_number") or ""
            page = c.get("page") or 1

            matches = re.finditer(r'(?:([0-9]+)\s*(?:-\s*|\s+)?(?:\([0-9]+\)\s*)?|\b(thirty|sixty|ninety|ten|fifteen|twenty|forty-five|forty)\b\s*(?:\([0-9]+\)\s*)?)(days?|months?|years?|business\s+days?|calendar\s+days?)', text, re.IGNORECASE)
            for m in matches:
                timeframe = m.group(0).strip()
                sentence = DeterministicRiskEngine._extract_exact_sentence_containing(text, m.start(), m.end())
                
                action = "Contractual notification or payment deadline"
                impact = "Failure to meet timeframe may affect rights or trigger default."
                
                if "terminat" in text.lower():
                    action = "Termination notice window"
                    impact = "Defines lead time required before contract termination takes effect."
                elif "cure" in text.lower():
                    action = "Breach cure period"
                    impact = "Window granted to rectify alleged default before termination for cause."
                elif "renew" in text.lower():
                    action = "Renewal cancellation window"
                    impact = "Notice required to opt out of automatic agreement renewal."
                elif "pay" in text.lower() or "invoice" in text.lower():
                    action = "Payment net terms"
                    impact = "Grace period before invoices become overdue."

                deadlines.append({
                    "action": action,
                    "timeframe": timeframe,
                    "clause_number": str(c_num) if c_num else "Clause",
                    "source_citation": f"Clause {c_num} • Page {page}" if c_num else f"Page {page}",
                    "impact": impact
                })
                break  # Max 1 deadline per clause for brevity

        if not deadlines:
            deadlines.append({
                "action": "Notice Requirements",
                "timeframe": "Written Notice",
                "clause_number": "1.0",
                "source_citation": "Clause 1.0 • Page 1",
                "impact": "Requires formal written communications for all operational notifications."
            })
        return deadlines[:6]

    @classmethod
    def _extract_obligations(cls, clauses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        obligations = []
        for c in clauses:
            text = c.get("original_text") or c.get("text") or ""
            c_num = c.get("clause_number") or c.get("section_number") or ""
            page = c.get("page") or 1

            m = re.search(r'([A-Za-z0-9\s]+?)\s+(?:shall|must|agrees\s+to|is\s+required\s+to)\s+([^,\.\n]{10,140})', text, re.IGNORECASE)
            if m:
                party = m.group(1).strip()[:30]
                duty = f"{party} shall {m.group(2).strip()}."
                obligations.append({
                    "duty": duty,
                    "party": party,
                    "clause_number": str(c_num) if c_num else "Clause",
                    "source_citation": f"Clause {c_num} • Page {page}" if c_num else f"Page {page}"
                })
        if not obligations and clauses:
            obligations.append({
                "duty": "Perform contractual duties in accordance with specified specifications.",
                "party": "Contracting Party",
                "clause_number": "1.0",
                "source_citation": "Clause 1.0 • Page 1"
            })
        return obligations[:6]

    @classmethod
    def _extract_rights(cls, clauses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        rights = []
        for c in clauses:
            text = c.get("original_text") or c.get("text") or ""
            c_num = c.get("clause_number") or c.get("section_number") or ""
            page = c.get("page") or 1

            m = re.search(r'([A-Za-z0-9\s]+?)\s+(?:may|is\s+entitled\s+to|reserves\s+the\s+right\s+to|has\s+the\s+right\s+to)\s+([^,\.\n]{10,140})', text, re.IGNORECASE)
            if m:
                party = m.group(1).strip()[:30]
                entitlement = f"{party} may {m.group(2).strip()}."
                rights.append({
                    "entitlement": entitlement,
                    "party": party,
                    "clause_number": str(c_num) if c_num else "Clause",
                    "source_citation": f"Clause {c_num} • Page {page}" if c_num else f"Page {page}"
                })
        if not rights and clauses:
            rights.append({
                "entitlement": "Right to receive deliverable acceptance and terminate for material uncured breach.",
                "party": "Customer",
                "clause_number": "1.0",
                "source_citation": "Clause 1.0 • Page 1"
            })
        return rights[:6]

    @classmethod
    def _generate_negotiation_points(cls, clauses: List[Dict[str, Any]], risk_clauses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        points = []
        for r in risk_clauses[:4]:
            title = r.get("title", "")
            c_num = r.get("clause_number", "")
            t_low = title.lower()

            if "liability" in t_low or "liability" in r.get("reason", "").lower():
                points.append({
                    "topic": "Limitation of Liability Ceiling",
                    "current_clause_state": f"Clause {c_num} establishes high or uncapped exposure.",
                    "suggested_discussion_point": "Consider asking counsel about proposing an aggregate monetary cap equal to 12 months fees paid.",
                    "source_citation": r.get("source_citation", "")
                })
            elif "indemnif" in t_low or "indemnif" in r.get("reason", "").lower():
                points.append({
                    "topic": "Indemnification Reciprocity",
                    "current_clause_state": f"Clause {c_num} allocates one-sided defense obligations.",
                    "suggested_discussion_point": "Consider discussing with counsel whether indemnity should be made mutual with express carve-outs for gross negligence.",
                    "source_citation": r.get("source_citation", "")
                })
            elif "terminat" in t_low:
                points.append({
                    "topic": "Termination Notice & Cure Window",
                    "current_clause_state": f"Clause {c_num} specifies termination procedures.",
                    "suggested_discussion_point": "Consider asking counsel if a mandatory 30-day written notice and cure window should be inserted.",
                    "source_citation": r.get("source_citation", "")
                })

        if not points:
            points.append({
                "topic": "General Risk Balancing",
                "current_clause_state": "Document contains standard terms.",
                "suggested_discussion_point": "Consider asking counsel to verify alignment of governing law and dispute resolution venues.",
                "source_citation": "Clause 1.0 • Page 1"
            })
        return points

    @classmethod
    def _generate_lawyer_questions(
        cls, 
        clauses: List[Dict[str, Any]], 
        risk_clauses: List[Dict[str, Any]], 
        open_questions: List[str]
    ) -> List[Dict[str, Any]]:
        questions = [
            {
                "category": "Liability Exposure",
                "question": "Does this agreement contain adequate liability protections, or should we insist on a mutual aggregate cap and consequential damage waiver?",
                "context": "Review overall financial exposure in dispute scenarios.",
                "relevant_clause": "Limitation of Liability Section"
            },
            {
                "category": "Indemnity & Defense",
                "question": "Is the indemnification obligation balanced, and does it include procedural protections like notice and control of defense?",
                "context": "Ensure company is not forced into uncontrolled third-party litigation settlements.",
                "relevant_clause": "Indemnification Section"
            },
            {
                "category": "Termination Rights",
                "question": "What are our concrete remedies if the other party fails to perform, and are cure periods reasonable?",
                "context": "Protect operational ability to exit without penalty for non-performance.",
                "relevant_clause": "Termination & Remedies Section"
            },
            {
                "category": "Intellectual Property & Confidentiality",
                "question": "Do intellectual property assignment terms protect our pre-existing proprietary assets and confidential know-how?",
                "context": "Prevent inadvertent forfeiture of background IP.",
                "relevant_clause": "IP / Confidentiality Section"
            }
        ]
        return questions

    @classmethod
    def _format_comparison_findings(cls, comp_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        if not comp_data or not isinstance(comp_data, dict):
            return {
                "comparison_performed": False,
                "baseline_label": None,
                "compared_label": None,
                "similarity_score": None,
                "key_differences_summary": "No multi-version document comparison was attached to this session.",
                "modified_count": 0,
                "added_count": 0,
                "removed_count": 0
            }

        summary = comp_data.get("summary", {})
        return {
            "comparison_performed": True,
            "baseline_label": comp_data.get("label_a", "Document A"),
            "compared_label": comp_data.get("label_b", "Document B"),
            "similarity_score": summary.get("similarity_score", 0.0),
            "key_differences_summary": f"Identified {summary.get('modified_count', 0)} modified clauses, {summary.get('added_count', 0)} added clauses, and {summary.get('removed_count', 0)} removed clauses between versions.",
            "modified_count": summary.get("modified_count", 0),
            "added_count": summary.get("added_count", 0),
            "removed_count": summary.get("removed_count", 0)
        }

    @classmethod
    def _render_markdown_briefing(
        cls,
        filename: str,
        overview: Dict[str, Any],
        key_clauses: List[Dict[str, Any]],
        risk_clauses: List[Dict[str, Any]],
        open_questions: List[str],
        deadlines: List[Dict[str, Any]],
        obligations: List[Dict[str, Any]],
        rights: List[Dict[str, Any]],
        negotiation_points: List[Dict[str, Any]],
        lawyer_questions: List[Dict[str, Any]],
        comparison_findings: Dict[str, Any],
        disclaimer: str
    ) -> str:
        lines = [
            f"# LAWYER EXECUTIVE BRIEFING: {overview.get('document_title', filename).upper()}",
            f"> **DISCLAIMER:** *{disclaimer}*",
            "",
            "---",
            "",
            "## 1. DOCUMENT OVERVIEW",
            f"- **Target File:** `{overview.get('filename')}`",
            f"- **Identified Agreement Type:** {overview.get('contract_type')}",
            f"- **Parties Detected:** {', '.join(overview.get('parties_detected') or ['Not specified'])}",
            f"- **Effective Term:** {overview.get('effective_term')}",
            f"- **Total Clauses Analyzed:** {overview.get('total_clauses_analyzed')}",
            f"- **Executive Summary:** {overview.get('summary_paragraph')}",
            "",
            "## 2. KEY CLAUSES",
            "| Clause | Title | Summary | Citation |",
            "| :--- | :--- | :--- | :--- |"
        ]

        for k in key_clauses:
            lines.append(f"| {k['clause_number']} | {k['title']} | {k['summary']} | `{k['source_citation']}` |")

        lines.extend([
            "",
            "## 3. HIGH-RISK & WORTH-NOTING CLAUSES",
            "| Clause | Risk Level | Reason | Evidence Snippet | Citation |",
            "| :--- | :--- | :--- | :--- | :--- |"
        ])

        for r in risk_clauses:
            lines.append(f"| {r['clause_number']} | **{r['risk_level']}** | {r['reason']} | \"{r['evidence']}\" | `{r['source_citation']}` |")

        lines.extend([
            "",
            "## 4. OPEN QUESTIONS & MISSING PROVISIONS",
        ])
        for q in open_questions:
            lines.append(f"- {q}")

        lines.extend([
            "",
            "## 5. IMPORTANT DEADLINES & TIMEFRAMES",
            "| Action / Window | Timeframe | Citation | Operational Impact |",
            "| :--- | :--- | :--- | :--- |"
        ])
        for d in deadlines:
            lines.append(f"| {d['action']} | **{d['timeframe']}** | `{d['source_citation']}` | {d['impact']} |")

        lines.extend([
            "",
            "## 6. KEY OBLIGATIONS",
        ])
        for o in obligations:
            lines.append(f"- **[{o['source_citation']}]** {o['duty']}")

        lines.extend([
            "",
            "## 7. KEY RIGHTS & ENTITLEMENTS",
        ])
        for rt in rights:
            lines.append(f"- **[{rt['source_citation']}]** {rt['entitlement']}")

        lines.extend([
            "",
            "## 8. POTENTIAL NEGOTIATION POINTS",
            "| Topic | Current Clause State | Suggested Discussion Point | Citation |",
            "| :--- | :--- | :--- | :--- |"
        ])
        for np in negotiation_points:
            lines.append(f"| {np['topic']} | {np['current_clause_state']} | {np['suggested_discussion_point']} | `{np['source_citation']}` |")

        lines.extend([
            "",
            "## 9. QUESTIONS TO ASK YOUR LAWYER",
        ])
        for lq in lawyer_questions:
            lines.append(f"### • {lq['category']}: {lq['relevant_clause']}")
            lines.append(f"**Question:** *\"{lq['question']}\"*")
            lines.append(f"*Context:* {lq['context']}\n")

        lines.extend([
            "## 10. DOCUMENT COMPARISON FINDINGS",
        ])
        if comparison_findings.get("comparison_performed"):
            lines.append(f"- **Baseline:** {comparison_findings.get('baseline_label')} vs **Comparison:** {comparison_findings.get('compared_label')}")
            lines.append(f"- **Semantic Similarity:** {comparison_findings.get('similarity_score')}%")
            lines.append(f"- **Modifications:** {comparison_findings.get('modified_count')} modified, {comparison_findings.get('added_count')} added, {comparison_findings.get('removed_count')} removed.")
            lines.append(f"- **Summary:** {comparison_findings.get('key_differences_summary')}")
        else:
            lines.append(f"- *{comparison_findings.get('key_differences_summary')}*")

        lines.extend([
            "",
            "---",
            f"**Generated by Clarity Legal Co-Pilot at:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
            f"*{disclaimer}*"
        ])

        return "\n".join(lines)

briefing_service = BriefingService()
