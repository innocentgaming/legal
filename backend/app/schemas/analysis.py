from typing import List, Optional
from pydantic import BaseModel

class RiskFinding(BaseModel):
    clause_id: Optional[str] = None
    clause_title: Optional[str] = None
    severity: str  # "High" | "Medium" | "Low"
    risk_category: str
    issue_summary: str
    legal_recommendation: str
    flagged_text: Optional[str] = None

class RiskAnalysisResult(BaseModel):
    overall_risk_score: int
    risk_level: str
    executive_summary: str
    key_findings: List[RiskFinding]
    missing_clauses: List[str]
    favorable_terms: List[str]

class AnalysisResponse(BaseModel):
    status: str = "success"
    document_id: str
    analysis: RiskAnalysisResult
