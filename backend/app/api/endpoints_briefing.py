from fastapi import APIRouter, HTTPException
from backend.app.schemas.briefing import BriefingRequest, BriefingResponse
from backend.app.services.ingestion_service import ingestion_service
from backend.app.services.briefing_service import BriefingService

router = APIRouter(tags=["Lawyer Briefings & Action Plans"])

@router.post("/briefing/generate", response_model=BriefingResponse)
async def generate_lawyer_briefing(req: BriefingRequest):
    doc = ingestion_service.get_active_document()
    if not doc or not doc.clauses:
        raise HTTPException(status_code=400, detail="No active document loaded. Please upload a contract first.")

    target_role = req.target_role or "General Counsel"
    try:
        briefing_data = await BriefingService.generate_briefing(
            filename=doc.filename,
            clauses=doc.clauses,
            target_role=target_role
        )
        return {
            "status": "success",
            "document_name": briefing_data["document_name"],
            "target_role": briefing_data["target_role"],
            "executive_summary": briefing_data["executive_summary"],
            "deal_breaker_risks": briefing_data["deal_breaker_risks"],
            "negotiation_strategy": briefing_data["negotiation_strategy"],
            "action_items": briefing_data["action_items"],
            "generated_at": briefing_data["generated_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Briefing generation failed: {str(e)}")
