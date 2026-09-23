from fastapi import APIRouter, HTTPException
from backend.app.schemas.chat import QARequest, QAResponse, ChatRequest, ChatResponse
from backend.app.services.ingestion_service import ingestion_service
from backend.app.services.grounded_answer_service import GroundedAnswerService

router = APIRouter(tags=["Conversational Legal RAG"])

@router.post("/qa", response_model=QAResponse)
@router.post("/chat/query", response_model=QAResponse)
async def perform_grounded_qa(req: QARequest):
    """
    Executes grounded document Q&A.
    Answers strictly based on retrieved clauses with verifiable citations.
    Enforces guardrail refusal against signing advice.
    """
    question_text = (req.question or req.query or "").strip()
    if not question_text:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    doc = ingestion_service.get_active_document()
    if not doc or not doc.clauses:
        raise HTTPException(status_code=400, detail="No active document in session. Please upload a contract first.")

    # Retrieve top matching chunks using in-memory hybrid retrieval
    retrieved = ingestion_service.retrieval_service.search(question_text, top_k=req.top_k or 4)

    try:
        qa_data = await GroundedAnswerService.answer(
            question=question_text,
            history=req.history or [],
            retrieved_chunks=retrieved,
            document_id=req.document_id or doc.id
        )
        return {
            "status": "success",
            "answer": qa_data["answer"],
            "citations": qa_data.get("citations", []),
            "grounded": qa_data.get("grounded", True),
            "provider": qa_data.get("provider", "Clarity Grounded Engine"),
            "label": qa_data.get("label", "Answer based on your uploaded document"),
            "disclaimer": "Answer based on your uploaded document. Clarity provides informational analysis and is not a substitute for legal counsel."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grounded Q&A processing error: {str(e)}")
