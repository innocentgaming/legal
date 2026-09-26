import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
load_dotenv(Path(__file__).parent.parent.parent / ".env")
load_dotenv(Path(__file__).parent.parent.parent.parent / ".env")

class Settings:
    APP_NAME: str = "CLARITY — AI Legal Co-Pilot"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS
    CORS_ORIGINS: list = ["*"]
    
    # LLM Settings (external APIs, zero local weights)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # Ingestion constraints
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "25"))
    ALLOWED_EXTENSIONS: set = {".pdf", ".docx", ".doc", ".txt", ".md"}

settings = Settings()
