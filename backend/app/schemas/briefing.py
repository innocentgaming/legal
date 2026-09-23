from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

DISCLAIMER_TEXT = "Clarity provides document understanding and preparation support. It is not a substitute for professional legal advice."

class ClauseCitation(BaseModel):
    clause_id: Optional[str] = None
    clause_number: Optional[str] = ""
    title: Optional[str] = ""
    page: Optional[int] = 1
    quoted_snippet: Optional[str] = ""

class DocumentOverview(BaseModel):
    document_title: str
    filename: str
    contract_type: str
    parties_detected: List[str] = []
    effective_term: Optional[str] = "Not specified"
    total_clauses_analyzed: int
    summary_paragraph: str

class KeyClauseItem(BaseModel):
    clause_number: str
    title: str
    summary: str
    source_citation: str
    category: str

class RiskClauseItem(BaseModel):
    clause_number: str
    title: str
    risk_level: str  # "HIGH_RISK" | "WORTH_NOTING" | "STANDARD"
    reason: str
    evidence: str
    source_citation: str

class DeadlineItem(BaseModel):
    action: str
    timeframe: str
    clause_number: str
    source_citation: str
    impact: str

class ObligationItem(BaseModel):
    duty: str
    party: str
    clause_number: str
    source_citation: str

class RightItem(BaseModel):
    entitlement: str
    party: str
    clause_number: str
    source_citation: str

class NegotiationPointItem(BaseModel):
    topic: str
    current_clause_state: str
    suggested_discussion_point: str
    source_citation: str

class LawyerQuestionItem(BaseModel):
    category: str
    question: str
    context: str
    relevant_clause: str

class ComparisonSummaryItem(BaseModel):
    comparison_performed: bool = False
    baseline_label: Optional[str] = None
    compared_label: Optional[str] = None
    similarity_score: Optional[float] = None
    key_differences_summary: Optional[str] = None
    modified_count: int = 0
    added_count: int = 0
    removed_count: int = 0

class LawyerBriefingData(BaseModel):
    # The 10 Mandatory Sections
    section_1_overview: DocumentOverview
    section_2_key_clauses: List[KeyClauseItem]
    section_3_risk_clauses: List[RiskClauseItem]
    section_4_open_questions: List[str]
    section_5_deadlines: List[DeadlineItem]
    section_6_obligations: List[ObligationItem]
    section_7_rights: List[RightItem]
    section_8_negotiation_points: List[NegotiationPointItem]
    section_9_lawyer_questions: List[LawyerQuestionItem]
    section_10_comparison_findings: ComparisonSummaryItem

    # Metadata & Rendered exports
    disclaimer: str = DISCLAIMER_TEXT
    markdown_content: str
    generated_at: str

class BriefingRequest(BaseModel):
    document_id: Optional[str] = None
    target_role: Optional[str] = "General Counsel"
    focus_areas: Optional[List[str]] = []
    include_comparison: Optional[bool] = True
    comparison_data: Optional[Dict[str, Any]] = None

class BriefingResponse(BaseModel):
    status: str = "success"
    briefing: LawyerBriefingData
    disclaimer: str = DISCLAIMER_TEXT
