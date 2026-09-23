from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class BriefingRequest(BaseModel):
    document_id: Optional[str] = None
    target_role: Optional[str] = "General Counsel"  # "General Counsel" | "Procurement Lead" | "C-Suite"
    focus_areas: Optional[List[str]] = []

class ActionItem(BaseModel):
    priority: str  # "Critical" | "Important" | "Advisory"
    action: str
    clause_ref: Optional[str] = None
    suggested_language: Optional[str] = None

class BriefingResponse(BaseModel):
    status: str = "success"
    document_name: str
    target_role: str
    executive_summary: str
    deal_breaker_risks: List[str]
    negotiation_strategy: List[str]
    action_items: List[ActionItem]
    generated_at: str
