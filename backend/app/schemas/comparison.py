from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

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
    document_text_a: Optional[str] = ""
    document_text_b: Optional[str] = ""
    document_a: Optional[Any] = None
    document_b: Optional[Any] = None
    label_a: Optional[str] = "Document A"
    label_b: Optional[str] = "Document B"

class DocumentCompareResponse(BaseModel):
    status: str = "success"
    similarity_score: float
    total_differences: int
    clause_diffs: List[Dict[str, Any]]

# Phase 6 Standardized Schemas
class ComparedClauseDetail(BaseModel):
    clause_id: Optional[str] = None
    clause_number: Optional[str] = ""
    title: Optional[str] = "Clause"
    original_text: str
    page: Optional[int] = 1
    category: Optional[str] = "General"

class ClausePair(BaseModel):
    document_a_clause: Optional[ComparedClauseDetail] = None
    document_b_clause: Optional[ComparedClauseDetail] = None
    similarity: float
    difference_type: str = Field(..., description="'MATCH' | 'MODIFIED' | 'ADDED' | 'REMOVED'")
    explanation: str
    why_it_matters: Optional[str] = ""

class ComparisonSummary(BaseModel):
    total_pairs: int
    matches_count: int
    modified_count: int
    added_count: int
    removed_count: int
    similarity_score: float

class CompareTwoDocumentsRequest(BaseModel):
    document_a: Any = Field(..., description="Document A raw text, JSON object, or parsed structure")
    document_b: Any = Field(..., description="Document B raw text, JSON object, or parsed structure")
    label_a: Optional[str] = "Document A"
    label_b: Optional[str] = "Document B"

class CompareTwoDocumentsResponse(BaseModel):
    clause_pairs: List[ClausePair]
    summary: Optional[ComparisonSummary] = None
    label_a: Optional[str] = "Document A"
    label_b: Optional[str] = "Document B"
