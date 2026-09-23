from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.routers.contracts import router as contracts_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="High-performance lightweight AI Legal Co-Pilot for contract analysis, risk detection, clause redlining, and grounded Q&A."
)

# Enable CORS for React frontend (Vite default is 5173 or any local port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints
app.include_router(contracts_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "clarity-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
