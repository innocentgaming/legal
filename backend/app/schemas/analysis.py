from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ClauseRiskResult(BaseModel):
    clause_id: str
    risk_level: str  # "STANDARD" | "WORTH_NOTING" | "HIGH_RISK"
    reason: str
    evidence: str
    source_clause: str
    category: Optional[str] = "General"

class RiskFinding(BaseModel):
    clause_id: Optional[str] = None
    clause_title: Optional[str] = None
    severity: str = "Medium"  # "High" | "Medium" | "Low"
    risk_category: str = "General"
    issue_summary: str = ""
    legal_recommendation: str = ""
    flagged_text: Optional[str] = None

class RiskAnalysisResult(BaseModel):
    overall_risk_score: int
    risk_level: str
    executive_summary: str
    clause_risks: List[ClauseRiskResult] = Field(default_factory=list)
    key_findings: List[RiskFinding] = Field(default_factory=list)
    missing_clauses: List[str] = Field(default_factory=list)
    favorable_terms: List[str] = Field(default_factory=list)
    high_risk_count: int = 0
    worth_noting_count: int = 0
    standard_count: int = 0

class AnalysisResponse(BaseModel):
    status: str = "success"
    document_id: str
    analysis: RiskAnalysisResult
