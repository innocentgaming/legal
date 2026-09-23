from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("clarity")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

class ClarityException(Exception):
    def __init__(self, message: str, status_code: int = 400, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

class DocumentProcessingError(ClarityException):
    def __init__(self, message: str, details: dict = None):
        super().__init__(message=message, status_code=422, details=details)

class LLMServiceError(ClarityException):
    def __init__(self, message: str, details: dict = None):
        super().__init__(message=message, status_code=502, details=details)

async def clarity_exception_handler(request: Request, exc: ClarityException):
    logger.error(f"ClarityException on {request.url.path}: {exc.message} | {exc.details}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "error_type": exc.__class__.__name__,
            "message": exc.message,
            "details": exc.details
        }
    )

async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error_type": "InternalServerError",
            "message": "An unexpected error occurred while processing your legal request.",
            "details": str(exc) if True else None
        }
    )
