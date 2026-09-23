from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.app.schemas.analysis import AnalysisResponse, RiskAnalysisResult, ClauseRiskResult
from backend.app.services.ingestion_service import ingestion_service
from backend.app.services.risk_classifier import RiskClassifierService

router = APIRouter(tags=["Legal Risk Audit"])

class SingleClauseRiskRequest(BaseModel):
    clause_text: str
    title: Optional[str] = ""
    clause_id: Optional[str] = "CLAUSE-001"

@router.post("/analysis/audit", response_model=AnalysisResponse)
@router.post("/contracts/audit", response_model=AnalysisResponse)
async def audit_active_contract():
    doc = ingestion_service.get_active_document()
    if not doc or not doc.clauses:
        raise HTTPException(status_code=400, detail="No active contract loaded. Please upload a document first.")

    if doc.analysis_cache:
        return {
            "status": "success",
            "document_id": doc.id,
            "analysis": doc.analysis_cache
        }

    try:
        analysis_data = await RiskClassifierService.classify(doc.clauses, doc.raw_text, doc.filename)
        doc.analysis_cache = analysis_data
        return {
            "status": "success",
            "document_id": doc.id,
            "analysis": analysis_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk classification failed: {str(e)}")

@router.post("/analysis/clause-risk", response_model=ClauseRiskResult)
async def audit_single_clause(request: SingleClauseRiskRequest):
    return RiskClassifierService.classify_single_clause(request.clause_text, request.title, request.clause_id)
