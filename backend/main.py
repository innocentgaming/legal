from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.errors import ClarityException, clarity_exception_handler, generic_exception_handler
from backend.app.api.api_router import api_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Production-grade AI Legal Co-Pilot: Ingestion, Risk Audit, Citation-Grounded RAG, Redlining, and Briefings."
)

# Exception handlers
app.add_exception_handler(ClarityException, clarity_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API
app.include_router(api_router)

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "health_check": "/api/health",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
