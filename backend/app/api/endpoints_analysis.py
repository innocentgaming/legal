from fastapi import APIRouter, HTTPException
from backend.app.schemas.analysis import AnalysisResponse, RiskAnalysisResult
from backend.app.services.ingestion_service import ingestion_service
from backend.app.services.risk_classifier import RiskClassifierService

router = APIRouter(tags=["Legal Risk Audit"])

@router.post("/analysis/audit", response_model=AnalysisResponse)
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
