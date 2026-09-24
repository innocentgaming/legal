"""
Clarity FastAPI Application Entry Point Alias
Allows both `backend.main:app` and `backend.app.main:app` to be used interchangeably.
"""
from backend.main import app

__all__ = ["app"]
