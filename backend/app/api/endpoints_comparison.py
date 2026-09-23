from fastapi import APIRouter, HTTPException
from backend.app.schemas.comparison import (
    ClauseComparisonRequest, 
    ClauseComparisonResponse, 
    DocumentCompareRequest, 
    DocumentCompareResponse
)
from backend.app.services.comparison_service import ComparisonService
from backend.app.services.ingestion_service import ingestion_service

router = APIRouter(tags=["Clause Redline & Version Comparison"])

@router.post("/comparison/clause", response_model=ClauseComparisonResponse)
async def redline_clause(req: ClauseComparisonRequest):
    clause_text = req.clause_text
    
    if req.clause_id and not clause_text:
        doc = ingestion_service.get_active_document()
        if doc:
            for c in doc.clauses:
                if c["id"] == req.clause_id:
                    clause_text = c["text"]
                    break

    if not clause_text:
        raise HTTPException(status_code=400, detail="Clause text or valid clause_id is required.")

    try:
        redline_data = await ComparisonService.generate_clause_redline(
            clause_text=clause_text,
            category=req.category or "General Legal Terms",
            instructions=req.instructions or ""
        )
        return {
            "status": "success",
            "original_text": redline_data.get("original_text", clause_text),
            "proposed_revision": redline_data.get("proposed_revision", ""),
            "explanation": redline_data.get("explanation", ""),
            "risk_mitigation": redline_data.get("risk_mitigation", ""),
            "bargaining_leverage": redline_data.get("bargaining_leverage", "Standard Market Term"),
            "diff_tokens": redline_data.get("diff_tokens", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Redline generation failed: {str(e)}")

@router.post("/comparison/documents", response_model=DocumentCompareResponse)
async def compare_documents(req: DocumentCompareRequest):
    if not req.document_text_a.strip() or not req.document_text_b.strip():
        raise HTTPException(status_code=400, detail="Both document texts are required for comparison.")

    try:
        diff_summary = ComparisonService.compare_documents(
            text_a=req.document_text_a,
            text_b=req.document_text_b,
            label_a=req.label_a or "Version A",
            label_b=req.label_b or "Version B"
        )
        return {
            "status": "success",
            "similarity_score": diff_summary["similarity_score"],
            "total_differences": diff_summary["total_differences"],
            "clause_diffs": diff_summary["clause_diffs"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document comparison failed: {str(e)}")
