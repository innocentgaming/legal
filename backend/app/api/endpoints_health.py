from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.services.ingestion_service import ingestion_service

router = APIRouter(tags=["Health & Status"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "clarity-backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@router.get("/status")
async def system_status():
    doc = ingestion_service.get_active_document()
    has_gemini = bool(settings.GEMINI_API_KEY)
    has_openai = bool(settings.OPENAI_API_KEY)
    active_provider = "Gemini Cloud API" if has_gemini else ("OpenAI API" if has_openai else "In-Memory Heuristic Engine")

    return {
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "active_llm_provider": active_provider,
        "has_gemini_key": has_gemini,
        "has_openai_key": has_openai,
        "document_loaded": doc is not None,
        "active_document": doc.to_metadata_dict() if doc else None
    }
