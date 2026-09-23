from datetime import datetime, timezone
from typing import List, Dict, Any
import httpx
from backend.app.core.config import settings

class BriefingService:
    """
    Generates actionable executive briefings for legal counsel,
    deal leads, and negotiation teams.
    """

    @classmethod
    async def generate_briefing(cls, filename: str, clauses: List[Dict[str, Any]], target_role: str = "General Counsel") -> Dict[str, Any]:
        # Fast rule-based & LLM-enhanced executive briefing
        critical_clauses = [c for c in clauses if c["category"] in ["Indemnification", "Limitation of Liability", "Termination & Remedies", "Restrictive Covenants"]]
        
        deal_breakers = []
        action_items = []
        
        for c in critical_clauses:
            text_l = c["text"].lower()
            if "liability" in c["category"].lower() and "unlimited" in text_l:
                deal_breakers.append(f"Uncapped Liability in {c['title']} requires immediate addition of an aggregate 12-month fee cap.")
                action_items.append({
                    "priority": "Critical",
                    "action": f"Strike unlimited liability in {c['title']} and insert aggregate 12-month cap.",
                    "clause_ref": c["id"],
                    "suggested_language": "Aggregate liability shall not exceed fees paid in prior 12 months."
                })
            elif "indemnif" in c["category"].lower() and ("customer shall indemnify" in text_l or "licensee shall indemnify" in text_l):
                deal_breakers.append(f"One-sided indemnity obligation in {c['title']} without IP defense reciprocity.")
                action_items.append({
                    "priority": "Critical",
                    "action": "Make indemnification mutual for third-party IP infringement.",
                    "clause_ref": c["id"],
                    "suggested_language": "Each party shall defend and indemnify the other for IP claims."
                })

        if not deal_breakers:
            deal_breakers.append("Standard commercial risk profile; verify termination cure window and governing law.")
            action_items.append({
                "priority": "Important",
                "action": "Verify 30-day notice and cure period before signing.",
                "clause_ref": "clause-1",
                "suggested_language": "Either party may terminate upon 30 days written notice for material breach."
            })

        strategy = [
            f"1. Lead negotiations by redlining the high-liability clauses in {critical_clauses[0]['title'] if critical_clauses else 'Section 1'}.",
            "2. Offer reciprocal IP indemnification in exchange for a strict 12-month liability ceiling.",
            "3. Request 30-day written cure periods for any operational breach."
        ]

        return {
            "document_name": filename,
            "target_role": target_role,
            "executive_summary": f"Prepared briefing for {target_role} on '{filename}'. Highlights key negotiation levers across {len(clauses)} clauses with emphasis on liability bounds and reciprocal operational covenants.",
            "deal_breaker_risks": deal_breakers,
            "negotiation_strategy": strategy,
            "action_items": action_items,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
