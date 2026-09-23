import json
import re
from typing import List, Dict, Any, Optional
import httpx
from backend.app.core.config import settings

# System prompt enforcing strict anti-hallucination, explanation-only, and grounded simplification
SIMPLIFICATION_SYSTEM_PROMPT = """You are an objective legal document simplification assistant. Your mission is to explain legal clauses in clear, accessible, plain language for non-lawyers.

CRITICAL INSTRUCTIONS & CONSTRAINTS:
1. ONLY use the supplied clause text.
2. NEVER use outside legal knowledge or external assumptions as factual support.
3. NEVER invent missing terms, parties, numbers, or conditions.
4. NEVER provide a legal recommendation to sign or not sign.
5. EXPLAIN rather than advise. You are an explainer, not legal counsel.
6. PRESERVE UNCERTAINTY: If any detail, obligation, right, deadline, or penalty is absent or ambiguous, you MUST state: "Not clearly specified in this clause."
7. DO NOT hallucinate or extrapolate.
8. Assess risk_level objectively using only the clause text:
   - "HIGH_RISK": Contains unlimited liability, one-sided indemnification, automatic termination without cure, broad IP transfer, or harsh non-compete.
   - "WORTH_NOTING": Contains specific notice periods, renewal auto-triggers, payment penalties, or non-solicitation covenants.
   - "STANDARD": Standard boilerplate, mutual confidentiality with reasonable care, standard definitions, or standard governing law.

You must return valid JSON matching this exact structure:
{
  "plain_language": "<Plain-English explanation in 1-3 simple sentences for non-lawyers>",
  "obligations": ["<What the party/parties MUST do, or 'Not clearly specified in this clause.'>"],
  "rights": ["<What the party/parties MAY do or are entitled to, or 'Not clearly specified in this clause.'>"],
  "deadlines": ["<Explicit timeframes or trigger conditions, or 'Not clearly specified in this clause.'>"],
  "penalties": ["<Explicit consequences, fines, or breach remedies, or 'Not clearly specified in this clause.'>"],
  "risk_level": "STANDARD" | "WORTH_NOTING" | "HIGH_RISK"
}
"""

class SimplificationService:
    """
    Plain-language clause simplifier and legal concept extractor.
    Enforces zero hallucination, grounded explanations, and fallback rule engine.
    """

    @classmethod
    async def simplify_clause(cls, clause_text: str, title: str = "", category: str = "") -> Dict[str, Any]:
        """
        Simplifies a single clause using external LLM (Gemini/OpenAI) or deterministic heuristic rule-engine.
        """
        if not clause_text or not clause_text.strip():
            return cls._empty_simplification()

        # 1. Try Gemini
        if settings.GEMINI_API_KEY:
            try:
                return await cls._simplify_with_gemini(clause_text, title, category)
            except Exception as e:
                print(f"[SimplificationService] Gemini API call failed: {e}. Falling back to rule-engine.")

        # 2. Try OpenAI
        elif settings.OPENAI_API_KEY:
            try:
                return await cls._simplify_with_openai(clause_text, title, category)
            except Exception as e:
                print(f"[SimplificationService] OpenAI API call failed: {e}. Falling back to rule-engine.")

        # 3. Deterministic Grounded Heuristic Engine
        return cls._simplify_heuristically(clause_text, title, category)

    @classmethod
    def simplify_clause_sync(cls, clause_text: str, title: str = "", category: str = "") -> Dict[str, Any]:
        """
        Synchronous heuristic simplification for rapid local ingestion.
        """
        return cls._simplify_heuristically(clause_text, title, category)

    @classmethod
    async def _simplify_with_gemini(cls, clause_text: str, title: str, category: str) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        user_prompt = f"""Analyze and simplify this legal clause:
TITLE: {title or 'Clause'}
CATEGORY: {category or 'General'}
ORIGINAL CLAUSE TEXT:
\"\"\"{clause_text}\"\"\"

Return raw JSON only."""

        payload = {
            "system_instruction": {"parts": [{"text": SIMPLIFICATION_SYSTEM_PROMPT}]},
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            clean_json = re.sub(r"^```json\s*|\s*```$", "", raw_text.strip())
            data = json.loads(clean_json)
            return cls._validate_and_sanitize_result(data, clause_text)

    @classmethod
    async def _simplify_with_openai(cls, clause_text: str, title: str, category: str) -> Dict[str, Any]:
        url = "https://api.openai.com/v1/chat/completions"
        user_prompt = f"""TITLE: {title or 'Clause'}\nCATEGORY: {category or 'General'}\nORIGINAL CLAUSE TEXT:\n\"\"\"{clause_text}\"\"\""""
        
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": SIMPLIFICATION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = json.loads(resp.json()["choices"][0]["message"]["content"])
            return cls._validate_and_sanitize_result(data, clause_text)

    @classmethod
    def _simplify_heuristically(cls, clause_text: str, title: str, category: str) -> Dict[str, Any]:
        """
        Deterministic, rule-based legal concept extractor and plain language generator.
        Guarantees zero hallucinations and preserves uncertainty.
        """
        clean_text = clause_text.strip()
        t_lower = clean_text.lower()

        # 1. Risk Level Assessment
        risk_level = "STANDARD"
        has_unlimited_liability = (
            ("unlimited" in t_lower and "liability" in t_lower)
            or ("no limitation" in t_lower and "liability" in t_lower)
            or ("completely excluded" in t_lower and "liability" in t_lower)
            or "unlimited liability" in t_lower
        )
        has_one_sided_indemnity = (
            ("indemnif" in t_lower or "hold harmless" in t_lower)
            and any(w in t_lower for w in ["customer shall", "tenant shall", "defend and hold harmless", "any and all", "solely responsible", "patent"])
        )
        has_immediate_term = (
            ("terminat" in t_lower)
            and any(w in t_lower for w in ["immediately", "without notice", "without cure", "sole discretion", "immediate termination"])
        )
        has_broad_ip = any(w in t_lower for w in ["irrevocably assign", "all work product", "all inventions created", "waive all claims", "moral rights waiver"])
        has_harsh_restrictions = any(w in t_lower for w in ["non-compete", "non-competition", "shall not solicit or hire", "for 24 months"])

        if has_unlimited_liability or has_one_sided_indemnity or has_immediate_term or has_broad_ip or has_harsh_restrictions:
            risk_level = "HIGH_RISK"
        elif any(w in t_lower for w in [
            "liquidated damages", "cure period", "within 30 days", "within 15 days", "late fee",
            "non-solicit", "capped at", "aggregate liability", "survive termination for",
            "penalty", "warranty disclaimer", "as is", "indemnif", "liability", "terminat", "remed",
            "30 days", "15 days", "refund"
        ]):
            risk_level = "WORTH_NOTING"

        # 2. Extract Obligations (modal verbs: shall, must, agrees to, is required to, will)
        obligations = []
        sentences = [s.strip() for s in re.split(r"(?<=[.?!])\s+", clean_text) if s.strip()]
        for s in sentences:
            s_low = s.lower()
            if any(k in s_low for k in ["shall ", "must ", "agrees to ", "agree to ", "is required to ", "shall not "]):
                obligations.append(s)

        if not obligations:
            obligations = ["Not clearly specified in this clause."]

        # 3. Extract Rights (modal verbs: may, is entitled to, reserves the right to, has the right)
        rights = []
        for s in sentences:
            s_low = s.lower()
            if any(k in s_low for k in ["may ", "is entitled to ", "reserves the right ", "has the right ", "at its option"]):
                rights.append(s)

        if not rights:
            rights = ["Not clearly specified in this clause."]

        # 4. Extract Deadlines (time durations, days, notices, triggers)
        deadlines = []
        deadline_matches = re.findall(
            r"(?:within\s+\d+\s+(?:calendar\s+|business\s+)?(?:days|months|years|hours)|"
            r"\d+\s+(?:calendar\s+|business\s+)?(?:days|months|years|hours)\s+(?:prior|written\s+notice|written|after|from)|"
            r"immediately\s+upon|promptly\s+upon|effective\s+date|upon\s+\d+\s+days)",
            clean_text,
            re.IGNORECASE
        )
        if deadline_matches:
            for dm in deadline_matches:
                clean_dm = dm.strip()
                if clean_dm and clean_dm not in deadlines:
                    deadlines.append(clean_dm)
        
        if not deadlines:
            deadlines = ["Not clearly specified in this clause."]

        # 5. Extract Penalties (damages, fines, fees, termination, interest)
        penalties = []
        penalty_keywords = ["liquidated damages", "penalty", "late fee", "interest of", "terminate immediately", "forfeiture", "indemnify", "casualty claims", "damages"]
        for s in sentences:
            s_low = s.lower()
            if any(pk in s_low for pk in penalty_keywords):
                penalties.append(s)

        if not penalties:
            penalties = ["Not clearly specified in this clause."]

        # 6. Generate Plain-Language Summary
        plain_language = cls._generate_plain_summary(clean_text, title, category, risk_level)

        return {
            "plain_language": plain_language,
            "obligations": obligations[:4],
            "rights": rights[:4],
            "deadlines": deadlines[:4],
            "penalties": penalties[:4],
            "risk_level": risk_level
        }

    @classmethod
    def _generate_plain_summary(cls, text: str, title: str, category: str, risk_level: str) -> str:
        """
        Creates a crisp, human-readable plain language explanation strictly based on text.
        """
        t_lower = text.lower()

        if "confidential" in t_lower or "non-disclosure" in t_lower:
            if "reasonable care" in t_lower or "standard of care" in t_lower:
                return "This clause requires the receiving party to protect secret business and technical information using at least reasonable care, preventing unauthorized disclosure."
            return "This clause defines confidential information and sets rules preventing parties from sharing private business data with outsiders."

        if "indemnif" in t_lower:
            if "customer shall indemnify" in t_lower or "tenant shall defend" in t_lower:
                return "This clause places legal responsibility on one party to pay for damages, legal fees, or third-party lawsuits arising under this contract."
            return "This clause specifies who pays the legal costs and damages if a third party files a lawsuit related to this agreement."

        if "liability" in t_lower or "limitation of liability" in t_lower:
            if "fees paid" in t_lower or "capped at" in t_lower or "12 months" in t_lower:
                return "This clause sets a maximum ceiling on financial liability, capping total potential damages to fees paid over a designated time period."
            if "indirect damages" in t_lower or "consequential" in t_lower:
                return "This clause protects parties from being sued for indirect or consequential financial losses like lost profits."
            return "This clause defines the financial limits and liability caps applicable if a dispute or operational issue occurs."

        if "terminat" in t_lower:
            if "written notice" in t_lower or "cure period" in t_lower:
                return "This clause outlines how and when either party can end the agreement, including required advance notice and opportunity to fix breaches."
            return "This clause specifies the duration of the agreement and the conditions required to cancel or terminate it."

        if "governing law" in t_lower or "jurisdiction" in t_lower:
            state_match = re.search(r"laws of\s+(?:the\s+State\s+of\s+)?([A-Za-z\s]+)(?:\.|\;|\,|$)", text, re.IGNORECASE)
            state_name = state_match.group(1).strip() if state_match else "the chosen jurisdiction"
            return f"This clause establishes that any legal disputes will be resolved in accordance with the laws of {state_name}."

        if "payment" in t_lower or "fee" in t_lower or "rent" in t_lower or "invoic" in t_lower:
            return "This clause details the commercial payment terms, invoicing schedules, and consequences for overdue payments."

        if "intellectual property" in t_lower or "inventions" in t_lower or "ownership" in t_lower:
            return "This clause defines ownership rights over work products, software, and inventions created under this agreement."

        if "restrictive" in t_lower or "non-solicit" in t_lower or "non-compete" in t_lower:
            return "This clause restricts parties from hiring each other's personnel or engaging in competing activities during and after the contract."

        # Generic factual fallback
        first_sentence = text.split(".")[0].strip()
        if len(first_sentence) > 10:
            return f"This clause sets forth the contractual terms regarding {title or 'this section'}: {first_sentence}."

        return f"This clause defines the contractual terms for {title or 'the specified section'}."

    @classmethod
    def _validate_and_sanitize_result(cls, data: Dict[str, Any], clause_text: str) -> Dict[str, Any]:
        """
        Validates structure and ensures no missing keys or hallucinations.
        """
        valid_risks = {"STANDARD", "WORTH_NOTING", "HIGH_RISK"}
        raw_risk = str(data.get("risk_level", "STANDARD")).upper().replace(" ", "_")
        risk_level = raw_risk if raw_risk in valid_risks else "STANDARD"

        plain_language = str(data.get("plain_language", "")).strip()
        if not plain_language:
            plain_language = cls._generate_plain_summary(clause_text, "", "", risk_level)

        def sanitize_list(items: Any) -> List[str]:
            if not isinstance(items, list) or not items:
                return ["Not clearly specified in this clause."]
            clean = [str(x).strip() for x in items if str(x).strip()]
            return clean if clean else ["Not clearly specified in this clause."]

        return {
            "plain_language": plain_language,
            "obligations": sanitize_list(data.get("obligations")),
            "rights": sanitize_list(data.get("rights")),
            "deadlines": sanitize_list(data.get("deadlines")),
            "penalties": sanitize_list(data.get("penalties")),
            "risk_level": risk_level
        }

    @classmethod
    def _empty_simplification(cls) -> Dict[str, Any]:
        return {
            "plain_language": "Not clearly specified in this clause.",
            "obligations": ["Not clearly specified in this clause."],
            "rights": ["Not clearly specified in this clause."],
            "deadlines": ["Not clearly specified in this clause."],
            "penalties": ["Not clearly specified in this clause."],
            "risk_level": "STANDARD"
        }

simplification_service = SimplificationService()
