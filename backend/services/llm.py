import os
import json
import re
from typing import List, Dict, Any, Optional
import httpx
from backend.config import settings

class LLMService:
    """
    Unified Legal AI Intelligence Service.
    Integrates external LLM APIs (Google Gemini / OpenAI) with automatic fallback
    to an embedded expert legal risk analysis heuristic engine if API keys are not supplied.
    """

    @classmethod
    async def analyze_contract(cls, chunks: List[Dict[str, Any]], raw_text: str, filename: str) -> Dict[str, Any]:
        """
        Runs comprehensive legal risk audit on the parsed contract chunks.
        """
        api_key = settings.GEMINI_API_KEY or settings.OPENAI_API_KEY
        
        if settings.GEMINI_API_KEY:
            try:
                return await cls._analyze_with_gemini(chunks, raw_text, filename)
            except Exception as e:
                print(f"[LLMService] Gemini API call failed: {e}. Falling back to legal heuristic engine.")
        elif settings.OPENAI_API_KEY:
            try:
                return await cls._analyze_with_openai(chunks, raw_text, filename)
            except Exception as e:
                print(f"[LLMService] OpenAI API call failed: {e}. Falling back to legal heuristic engine.")

        # Fallback to deterministic expert legal rule engine
        return cls._heuristic_legal_analysis(chunks, raw_text, filename)

    @classmethod
    async def chat_with_doc(cls, query: str, history: List[Dict[str, str]], retrieved_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Answers legal questions grounded in retrieved document chunks with verifiable citations.
        """
        context_blocks = []
        for i, chunk in enumerate(retrieved_chunks, start=1):
            context_blocks.append(
                f"[Source #{i} - {chunk.get('title', 'Clause')}] (Clause ID: {chunk.get('id', '')})\n{chunk.get('text', '')}"
            )
        context_str = "\n\n".join(context_blocks)

        if settings.GEMINI_API_KEY:
            try:
                return await cls._chat_with_gemini(query, history, context_str, retrieved_chunks)
            except Exception as e:
                print(f"[LLMService] Gemini chat failed: {e}. Using fallback generator.")
        elif settings.OPENAI_API_KEY:
            try:
                return await cls._chat_with_openai(query, history, context_str, retrieved_chunks)
            except Exception as e:
                print(f"[LLMService] OpenAI chat failed: {e}. Using fallback generator.")

        return cls._heuristic_chat_response(query, retrieved_chunks)

    @classmethod
    async def generate_redline(cls, clause_text: str, category: str, request_instructions: str) -> Dict[str, Any]:
        """
        Generates proposed legal redlines, rationale, and bilateral counter-language.
        """
        if settings.GEMINI_API_KEY:
            try:
                return await cls._redline_with_gemini(clause_text, category, request_instructions)
            except Exception as e:
                print(f"[LLMService] Gemini redline failed: {e}.")
        elif settings.OPENAI_API_KEY:
            try:
                return await cls._redline_with_openai(clause_text, category, request_instructions)
            except Exception as e:
                print(f"[LLMService] OpenAI redline failed: {e}.")

        return cls._heuristic_redline(clause_text, category, request_instructions)

    # -------------------------------------------------------------
    # Gemini External API Implementations
    # -------------------------------------------------------------

    @classmethod
    async def _analyze_with_gemini(cls, chunks: List[Dict[str, Any]], raw_text: str, filename: str) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        
        # Build prompt with chunk summary
        chunk_snippets = "\n".join([f"- Clause {c['id']}: [{c['title']}] ({c['category']}): {c['text'][:250]}..." for c in chunks[:40]])
        
        prompt = f"""You are a Senior Corporate Legal Counsel specializing in contract risk analysis.
Audit the following contract "{filename}".

CONTRACT SECTIONS:
{chunk_snippets}

Analyze this contract and provide a JSON response with this EXACT schema:
{{
  "overall_risk_score": <integer 0-100, where 0 is lowest risk and 100 is critical risk>,
  "risk_level": <"High" | "Medium" | "Low">,
  "executive_summary": "<concise 2-3 sentence legal summary of the contract purpose, core obligations, and risk posture>",
  "key_findings": [
    {{
      "clause_id": "<e.g. clause-3>",
      "clause_title": "<title>",
      "severity": "<High" | "Medium" | "Low">,
      "risk_category": "<Liability" | "Indemnity" | "Termination" | "IP" | "Confidentiality" | "Compliance">,
      "issue_summary": "<clear explanation of why this clause is risky or non-standard>",
      "legal_recommendation": "<practical mitigation or counter-proposal language>",
      "flagged_text": "<exact excerpt from clause>"
    }}
  ],
  "missing_clauses": [
    "<e.g. Mutual Indemnification, Force Majeure, Data Protection / GDPR compliance, Limitation on Consequential Damages>"
  ],
  "favorable_terms": [
    "<e.g. Standard 30-day cure period, Mutual confidentiality obligations>"
  ]
}}
Ensure the response is valid raw JSON only without markdown formatting."""

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
            })
            resp.raise_for_status()
            data = resp.json()
            raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(cls._clean_json(raw_json))
            return cls._normalize_analysis_response(parsed, chunks, filename)

    @classmethod
    async def _chat_with_gemini(cls, query: str, history: List[Dict[str, str]], context_str: str, retrieved_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        
        prompt = f"""You are CLARITY, an expert AI Legal Co-Pilot.
Answer the user's question about the contract based STRICTLY on the provided contract excerpts.
Always cite the specific Clause ID / Section Name when referring to terms.
If information is not in the contract, explicitly state that it is not specified.

CONTRACT CONTEXT EXCERPTS:
{context_str}

USER QUESTION:
{query}

Provide a helpful, precise legal explanation. Quote or cite relevant clauses."""

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2}
            })
            resp.raise_for_status()
            data = resp.json()
            answer_text = data["candidates"][0]["content"]["parts"][0]["text"]
            
            citations = [
                {"clause_id": c.get("id"), "title": c.get("title"), "section": c.get("section_number")}
                for c in retrieved_chunks[:3]
            ]
            return {
                "answer": answer_text,
                "citations": citations,
                "provider": "Gemini API"
            }

    @classmethod
    async def _redline_with_gemini(cls, clause_text: str, category: str, instructions: str) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        prompt = f"""You are a Senior Legal Negotiator.
Create a redline revision for this {category} clause.
Goal/Instructions: {instructions or 'Make this clause balanced, market-standard, mutual, and protect our interests with appropriate caps and reasonable cure periods.'}

ORIGINAL CLAUSE:
{clause_text}

Provide JSON with schema:
{{
  "original_text": "{clause_text}",
  "proposed_revision": "<revised legal clause text>",
  "explanation": "<why these changes were made and their legal rationale>",
  "risk_mitigation": "<specific risks reduced by this revision>",
  "bargaining_leverage": "<High | Moderate | Standard>"
}}
Return raw JSON only."""

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"}
            })
            resp.raise_for_status()
            data = resp.json()
            raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(cls._clean_json(raw_json))

    # -------------------------------------------------------------
    # OpenAI External API Implementations
    # -------------------------------------------------------------

    @classmethod
    async def _analyze_with_openai(cls, chunks: List[Dict[str, Any]], raw_text: str, filename: str) -> Dict[str, Any]:
        url = "https://api.openai.com/v1/chat/completions"
        chunk_snippets = "\n".join([f"- Clause {c['id']}: [{c['title']}] ({c['category']}): {c['text'][:250]}..." for c in chunks[:40]])
        
        messages = [
            {"role": "system", "content": "You are a Senior Corporate Legal Counsel. Provide JSON analysis."},
            {"role": "user", "content": f"Audit contract {filename}:\n{chunk_snippets}\nProvide JSON with overall_risk_score, risk_level, executive_summary, key_findings, missing_clauses, favorable_terms."}
        ]
        
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}, json={
                "model": settings.OPENAI_MODEL,
                "messages": messages,
                "response_format": {"type": "json_object"}
            })
            resp.raise_for_status()
            data = resp.json()
            parsed = json.loads(data["choices"][0]["message"]["content"])
            return cls._normalize_analysis_response(parsed, chunks, filename)

    @classmethod
    async def _chat_with_openai(cls, query: str, history: List[Dict[str, str]], context_str: str, retrieved_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        url = "https://api.openai.com/v1/chat/completions"
        messages = [
            {"role": "system", "content": f"You are CLARITY Legal Co-Pilot. Answer using context:\n{context_str}"},
            {"role": "user", "content": query}
        ]
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}, json={
                "model": settings.OPENAI_MODEL,
                "messages": messages
            })
            resp.raise_for_status()
            answer_text = resp.json()["choices"][0]["message"]["content"]
            citations = [{"clause_id": c.get("id"), "title": c.get("title"), "section": c.get("section_number")} for c in retrieved_chunks[:3]]
            return {"answer": answer_text, "citations": citations, "provider": "OpenAI API"}

    @classmethod
    async def _redline_with_openai(cls, clause_text: str, category: str, instructions: str) -> Dict[str, Any]:
        url = "https://api.openai.com/v1/chat/completions"
        prompt = f"Redline this {category} clause.\nInstructions: {instructions}\nOriginal: {clause_text}\nProvide JSON with original_text, proposed_revision, explanation, risk_mitigation, bargaining_leverage."
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}, json={
                "model": settings.OPENAI_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"}
            })
            resp.raise_for_status()
            return json.loads(resp.json()["choices"][0]["message"]["content"])

    # -------------------------------------------------------------
    # Expert Legal Heuristic Engine (Offline / Instant Fallback)
    # -------------------------------------------------------------

    @classmethod
    def _heuristic_legal_analysis(cls, chunks: List[Dict[str, Any]], raw_text: str, filename: str) -> Dict[str, Any]:
        findings: List[Dict[str, Any]] = []
        total_risk_points = 15  # Baseline risk
        categories_found = set()
        
        for c in chunks:
            text_lower = c["text"].lower()
            title_lower = c["title"].lower()
            category = c["category"]
            categories_found.add(category)
            cid = c["id"]
            title = c["title"]

            # 1. Check Uncapped / Asymmetrical Liability
            if "liability" in category.lower() or "liability" in title_lower:
                if any(w in text_lower for w in ["unlimited", "no limitation", "shall not apply to", "without limit", "in no event shall liability be capped"]):
                    findings.append({
                        "clause_id": cid,
                        "clause_title": title,
                        "severity": "High",
                        "risk_category": "Limitation of Liability",
                        "issue_summary": "Uncapped or carve-out liability structure creates catastrophic financial exposure.",
                        "legal_recommendation": "Insert a definitive aggregate liability cap (e.g., 12 months fees paid) and limit consequential damages.",
                        "flagged_text": c["text"][:300]
                    })
                    total_risk_points += 28
                elif "consequential" not in text_lower and "indirect" not in text_lower:
                    findings.append({
                        "clause_id": cid,
                        "clause_title": title,
                        "severity": "Medium",
                        "risk_category": "Limitation of Liability",
                        "issue_summary": "Missing waiver of consequential, punitive, and indirect damages.",
                        "legal_recommendation": "Add standard mutual exclusion for indirect, lost profits, and consequential damages.",
                        "flagged_text": c["text"][:300]
                    })
                    total_risk_points += 14

            # 2. Check One-Sided Indemnification
            if "indemnif" in text_lower or "indemnification" in category.lower():
                if any(w in text_lower for w in ["customer shall indemnify", "licensee shall indemnify", "contractor shall indemnify"]) and not any(w in text_lower for w in ["mutual", "each party shall indemnify", "company shall also indemnify"]):
                    findings.append({
                        "clause_id": cid,
                        "clause_title": title,
                        "severity": "High",
                        "risk_category": "Indemnification",
                        "issue_summary": "One-sided indemnity obligation with no reciprocal protection for intellectual property infringement.",
                        "legal_recommendation": "Make indemnity obligations bilateral and subject to prompt notice, right to control defense, and settlement approval.",
                        "flagged_text": c["text"][:300]
                    })
                    total_risk_points += 22

            # 3. Check Restrictive Covenants / Non-Compete
            if "non-compete" in text_lower or "restrictive covenant" in category.lower():
                findings.append({
                    "clause_id": cid,
                    "clause_title": title,
                    "severity": "High",
                    "risk_category": "Restrictive Covenants",
                    "issue_summary": "Broad non-compete restriction may restrict commercial freedom and market operations.",
                    "legal_recommendation": "Narrow scope to direct competitors or strike non-compete in favor of standard confidentiality protection.",
                    "flagged_text": c["text"][:300]
                })
                total_risk_points += 20

            # 4. Check Termination traps
            if "terminat" in text_lower and ("immediate" in text_lower or "without notice" in text_lower):
                findings.append({
                    "clause_id": cid,
                    "clause_title": title,
                    "severity": "Medium",
                    "risk_category": "Termination & Remedies",
                    "issue_summary": "Unilateral termination without sufficient notice or cure period.",
                    "legal_recommendation": "Negotiate a mandatory 30-day written notice and cure period before termination for material breach.",
                    "flagged_text": c["text"][:300]
                })
                total_risk_points += 12

            # 5. Overbroad IP Assignment
            if "intellectual property" in category.lower() and any(w in text_lower for w in ["assigns all right", "irrevocably transfers", "pre-existing ip"]):
                findings.append({
                    "clause_id": cid,
                    "clause_title": title,
                    "severity": "Medium",
                    "risk_category": "Intellectual Property",
                    "issue_summary": "Potentially captures pre-existing proprietary intellectual property and background technology.",
                    "legal_recommendation": "Explicitly exclude pre-existing materials, standard tooling, and background IP.",
                    "flagged_text": c["text"][:300]
                })
                total_risk_points += 12

        # Check missing critical clauses
        missing_clauses = []
        if "Limitation of Liability" not in categories_found:
            missing_clauses.append("Limitation of Liability & Consequential Damages Waiver")
            total_risk_points += 15
        if "Governing Law & Disputes" not in categories_found:
            missing_clauses.append("Governing Law, Jurisdiction & Dispute Resolution")
            total_risk_points += 10
        if "Confidentiality" not in categories_found:
            missing_clauses.append("Standard Non-Disclosure & Confidentiality Obligations")
            total_risk_points += 10
        if "Force Majeure" not in raw_text:
            missing_clauses.append("Force Majeure & Unforeseen Events Clause")

        final_score = min(95, max(12, total_risk_points))
        risk_level = "High" if final_score >= 65 else ("Medium" if final_score >= 40 else "Low")

        return {
            "overall_risk_score": final_score,
            "risk_level": risk_level,
            "executive_summary": f"Automated legal audit for '{filename}'. Identified {len(findings)} key clause considerations across {len(chunks)} structural sections. Primary exposures relate to {'liability caps, indemnity balance,' if findings else 'standard operational governance terms.'}",
            "key_findings": findings,
            "missing_clauses": missing_clauses,
            "favorable_terms": [
                "Document contains distinct numbered sections for auditability",
                "Includes explicit clause boundaries for dispute navigation"
            ]
        }

    @classmethod
    def _heuristic_chat_response(cls, query: str, retrieved_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not retrieved_chunks:
            return {
                "answer": "No directly matching clauses were found in the uploaded document for your query. Please refer to the document viewer or refine your keywords.",
                "citations": [],
                "provider": "Rule-Based Co-Pilot"
            }

        top_chunk = retrieved_chunks[0]
        answer = f"Based on **{top_chunk.get('title', 'Section')}** ({top_chunk.get('citation', '')}):\n\n"
        answer += f"> \"{top_chunk.get('text', '')[:400]}...\"\n\n"
        answer += f"**Key Takeaway**: This section governs {top_chunk.get('category', 'terms')}. "
        
        q_lower = query.lower()
        if "terminat" in q_lower:
            answer += "Review the notice requirements and cure periods specified in this clause before initiating any termination."
        elif "liab" in q_lower:
            answer += "Ensure that any liability exposure is capped and that indirect/consequential damages are mutually disclaimed."
        elif "indemn" in q_lower:
            answer += "Verify whether indemnity is reciprocal and whether you retain the right to control defense."
        else:
            answer += "Refer to the highlighted clause in the document explorer for full legal obligations."

        citations = [{"clause_id": c.get("id"), "title": c.get("title"), "section": c.get("section_number")} for c in retrieved_chunks[:3]]
        return {
            "answer": answer,
            "citations": citations,
            "provider": "Local Semantic Engine (Set GEMINI_API_KEY for Cloud LLM)"
        }

    @classmethod
    def _heuristic_redline(cls, clause_text: str, category: str, instructions: str) -> Dict[str, Any]:
        # Generates balanced counter-proposal based on legal best practices
        revised = clause_text
        if "liability" in category.lower() or "liability" in clause_text.lower():
            revised = f"{clause_text.rstrip()}\n\nNOTWITHSTANDING ANYTHING TO THE CONTRARY, IN NO EVENT SHALL EITHER PARTY'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED THE TOTAL AMOUNTS ACTUALLY PAID UNDER THIS AGREEMENT IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, AND NEITHER PARTY SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES."
            explanation = "Inserted mutual aggregate liability cap (12 months fees) and explicit waiver of consequential/indirect damages."
            mitigation = "Eliminates catastrophic financial risk and aligns with standard enterprise SaaS/vendor agreements."
        elif "indemnif" in category.lower() or "indemnif" in clause_text.lower():
            revised = f"Each party ('Indemnifying Party') shall defend, indemnify, and hold harmless the other party ('Indemnified Party') from and against third-party claims arising from: (a) gross negligence or willful misconduct, or (b) infringement of third-party intellectual property rights; provided that the Indemnified Party gives prompt written notice, sole control of defense to Indemnifying Party, and reasonable cooperation."
            explanation = "Converted unilateral indemnity into a mutual, capped obligation with mandatory procedural protections (prompt notice, defense control)."
            mitigation = "Prevents uncontested third-party settlements and ensures reciprocal IP infringement protection."
        else:
            revised = f"{clause_text}\n\n[Mutual Standard Revision]: Both parties agree to act in good faith and provide thirty (30) days prior written notice and opportunity to cure before exercising any adverse remedies."
            explanation = "Added reasonable 30-day notice and cure period to promote commercial fairness."
            mitigation = "Protects against sudden unilateral actions or premature breach declarations."

        return {
            "original_text": clause_text,
            "proposed_revision": revised,
            "explanation": explanation,
            "risk_mitigation": mitigation,
            "bargaining_leverage": "Standard Market Term"
        }

    @staticmethod
    def _clean_json(text: str) -> str:
        # Strip markdown ```json ... ```
        text = re.sub(r"^```json\s*", "", text.strip())
        text = re.sub(r"^```\s*", "", text.strip())
        text = re.sub(r"\s*```$", "", text.strip())
        return text.strip()

    @staticmethod
    def _normalize_analysis_response(parsed: Dict[str, Any], chunks: List[Dict[str, Any]], filename: str) -> Dict[str, Any]:
        # Ensure fallback fields are present
        if "overall_risk_score" not in parsed:
            parsed["overall_risk_score"] = 50
        if "risk_level" not in parsed:
            parsed["risk_level"] = "Medium"
        if "executive_summary" not in parsed:
            parsed["executive_summary"] = f"Legal assessment for {filename}."
        if "key_findings" not in parsed:
            parsed["key_findings"] = []
        if "missing_clauses" not in parsed:
            parsed["missing_clauses"] = []
        if "favorable_terms" not in parsed:
            parsed["favorable_terms"] = []
        return parsed
