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
    from backend.app.core.security import SecurityService
    sanitized_details = {}
    if exc.details and isinstance(exc.details, dict):
        for k, v in exc.details.items():
            # Never log raw text/content payloads in logs
            if k in ["raw_text", "content", "document_text", "clause_text", "text"]:
                sanitized_details[k] = "[DOCUMENT_CONTENT_REDACTED]"
            else:
                sanitized_details[k] = SecurityService.redact_sensitive_log(str(v)[:200])

    log_msg = SecurityService.redact_sensitive_log(f"ClarityException on {request.url.path}: {exc.message} | {sanitized_details}")
    logger.error(log_msg)

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
    from backend.app.core.security import SecurityService
    sanitized_error = SecurityService.redact_sensitive_log(str(exc)[:300])
    logger.error(f"Unhandled error on {request.url.path}: {sanitized_error}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error_type": "InternalServerError",
            "message": "An unexpected error occurred while processing your legal request.",
            "details": sanitized_error if not str(exc).startswith("<") else "Processing error"
        }
    )
