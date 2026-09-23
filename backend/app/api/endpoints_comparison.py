from fastapi import APIRouter, HTTPException, Body
from typing import Any, Dict
from backend.app.schemas.comparison import (
    ClauseComparisonRequest, 
    ClauseComparisonResponse, 
    DocumentCompareRequest, 
    DocumentCompareResponse,
    CompareTwoDocumentsRequest,
    CompareTwoDocumentsResponse
)
from backend.app.services.comparison_service import ComparisonService
from backend.app.services.ingestion_service import ingestion_service

router = APIRouter(tags=["Clause Redline & Version Comparison"])

@router.post("/compare", response_model=CompareTwoDocumentsResponse)
async def compare_two_documents(req: CompareTwoDocumentsRequest):
    """
    PHASE 6: Two-Document Comparison Endpoint.
    Semantically aligns clauses between Document A and Document B,
    classifies difference types (MATCH, MODIFIED, ADDED, REMOVED),
    and explains concrete differences without subjective bias.
    """
    doc_a = req.document_a
    doc_b = req.document_b

    if not doc_a or not doc_b:
        raise HTTPException(
            status_code=400, 
            detail="Both 'document_a' and 'document_b' are required for comparison."
        )

    try:
        comparison_res = ComparisonService.compare_two_documents(
            doc_a=doc_a,
            doc_b=doc_b,
            label_a=req.label_a or "Document A",
            label_b=req.label_b or "Document B"
        )
        return comparison_res
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Semantic two-document comparison failed: {str(e)}"
        )

@router.post("/comparison/documents", response_model=CompareTwoDocumentsResponse)
async def compare_documents_legacy(req: DocumentCompareRequest):
    """
    Backward compatible endpoint for document comparison.
    """
    doc_a = req.document_a or req.document_text_a
    doc_b = req.document_b or req.document_text_b

    if not doc_a or not doc_b:
        raise HTTPException(status_code=400, detail="Both document texts are required for comparison.")

    try:
        return ComparisonService.compare_two_documents(
            doc_a=doc_a,
            doc_b=doc_b,
            label_a=req.label_a or "Document A",
            label_b=req.label_b or "Document B"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document comparison failed: {str(e)}")

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
