from fastapi import APIRouter, HTTPException, Query, Response
from typing import Optional
from backend.app.schemas.briefing import BriefingRequest, BriefingResponse, DISCLAIMER_TEXT
from backend.app.services.ingestion_service import ingestion_service
from backend.app.services.briefing_service import BriefingService

router = APIRouter(tags=["Lawyer Briefings & Action Plans"])

@router.post("/briefing/generate", response_model=BriefingResponse)
@router.post("/briefing", response_model=BriefingResponse)
async def generate_lawyer_briefing(req: BriefingRequest):
    """
    PHASE 7: "Prepare for my lawyer" One-Page Briefing Generation.
    Constructs a comprehensive 10-section preparation briefing with exact source citations,
    potential negotiation levers, questions for counsel, and mandatory legal disclaimers.
    """
    doc = ingestion_service.get_active_document()
    if not doc or not doc.clauses:
        raise HTTPException(status_code=400, detail="No active document loaded. Please upload a contract first.")

    target_role = req.target_role or "General Counsel"
    comparison_data = req.comparison_data

    try:
        briefing_data = await BriefingService.generate_briefing(
            filename=doc.filename,
            clauses=doc.clauses,
            raw_text=doc.raw_text,
            target_role=target_role,
            comparison_data=comparison_data
        )
        return {
            "status": "success",
            "briefing": briefing_data,
            "disclaimer": DISCLAIMER_TEXT
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lawyer briefing generation failed: {str(e)}")

@router.get("/briefing/export")
async def export_briefing_markdown(format: str = Query("markdown", description="Export format: 'markdown' | 'txt'")):
    """
    Exports the current lawyer briefing in Markdown format with preserved citations.
    """
    doc = ingestion_service.get_active_document()
    if not doc or not doc.clauses:
        raise HTTPException(status_code=400, detail="No active document loaded.")

    briefing_data = await BriefingService.generate_briefing(
        filename=doc.filename,
        clauses=doc.clauses,
        raw_text=doc.raw_text
    )
    md_content = briefing_data.get("markdown_content", "")
    filename = f"Lawyer_Briefing_{doc.filename.replace(' ', '_')}.md"

    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
