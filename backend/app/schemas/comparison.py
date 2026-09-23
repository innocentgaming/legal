from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ClauseComparisonRequest(BaseModel):
    clause_id: Optional[str] = None
    clause_text: str
    category: Optional[str] = "General Legal Terms"
    instructions: Optional[str] = "Make this clause balanced, mutual, with reasonable liability caps and notice periods."

class DiffToken(BaseModel):
    type: str  # "equal" | "delete" | "insert"
    text: str

class ClauseComparisonResponse(BaseModel):
    status: str = "success"
    original_text: str
    proposed_revision: str
    explanation: str
    risk_mitigation: str
    bargaining_leverage: str
    diff_tokens: Optional[List[DiffToken]] = []

class DocumentCompareRequest(BaseModel):
    document_text_a: str
    document_text_b: str
    label_a: Optional[str] = "Version A"
    label_b: Optional[str] = "Version B"

class DocumentCompareResponse(BaseModel):
    status: str = "success"
    similarity_score: float
    total_differences: int
    clause_diffs: List[Dict[str, Any]]
