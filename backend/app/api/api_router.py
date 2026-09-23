from fastapi import APIRouter
from backend.app.api.endpoints_health import router as health_router
from backend.app.api.endpoints_contracts import router as contracts_router
from backend.app.api.endpoints_analysis import router as analysis_router
from backend.app.api.endpoints_chat import router as chat_router
from backend.app.api.endpoints_comparison import router as comparison_router
from backend.app.api.endpoints_briefing import router as briefing_router
from backend.app.api.endpoints_auth import router as auth_router

api_router = APIRouter(prefix="/api")

# Mount sub-routers
api_router.include_router(health_router)
api_router.include_router(contracts_router)
api_router.include_router(analysis_router)
api_router.include_router(chat_router)
api_router.include_router(comparison_router)
api_router.include_router(briefing_router)
api_router.include_router(auth_router)
