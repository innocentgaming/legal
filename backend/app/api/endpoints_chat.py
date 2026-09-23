from fastapi import APIRouter, HTTPException
from backend.app.schemas.chat import ChatRequest, ChatResponse
from backend.app.services.ingestion_service import ingestion_service
from backend.app.services.grounded_answer_service import GroundedAnswerService

router = APIRouter(tags=["Conversational Legal RAG"])

@router.post("/chat/query", response_model=ChatResponse)
async def chat_query(req: ChatRequest):
    doc = ingestion_service.get_active_document()
    if not doc or not doc.clauses:
        raise HTTPException(status_code=400, detail="No active contract loaded. Please upload a contract first.")

    # Retrieve top matching chunks using retrieval service
    retrieved = ingestion_service.retrieval_service.search(req.query, top_k=req.top_k or 4)

    try:
        chat_data = await GroundedAnswerService.answer(req.query, req.history or [], retrieved)
        return {
            "status": "success",
            "answer": chat_data["answer"],
            "citations": chat_data.get("citations", []),
            "provider": chat_data.get("provider", "Clarity Engine")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Legal Q&A generation failed: {str(e)}")
