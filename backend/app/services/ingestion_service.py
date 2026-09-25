import gc
import os
from typing import Dict, Any, Optional
from backend.app.core.config import settings
from backend.app.core.errors import DocumentProcessingError
from backend.app.models.document import InMemoryDocument
from backend.app.services.document_parser import DocumentParserService
from backend.app.services.clause_segmentation_service import ClauseSegmentationService
from backend.app.services.retrieval_service import RetrievalService

from backend.app.core.security import SecurityService, session_manager

class IngestionService:
    """
    Coordinates legal document ingestion pipeline with strict memory bounds:
    1. Security validation (MIME/magic bytes, size, non-empty, path traversal)
    2. Format parsing (PDF, DOCX, TXT)
    3. Text sanitization (null bytes, control chars, Unicode normalization)
    4. Structural clause & section segmentation
    5. In-memory vector store indexing
    6. Memory footprint bound enforcement & proactive GC reclamation
    7. Session-scoped document tracking (Zero persistence)
    """

    MAX_CONCURRENT_SESSIONS = 50

    def __init__(self):
        self.active_document: Optional[InMemoryDocument] = None
        self.retrieval_service = RetrievalService()

    def ingest_file(self, filename: str, content: bytes, session_id: str = "default_session") -> InMemoryDocument:
        # 1. Security Validation & Path Traversal Prevention
        is_valid, safe_filename, error_msg = SecurityService.validate_file_upload(
            filename=filename,
            content=content,
            max_size_mb=settings.MAX_FILE_SIZE_MB,
            allowed_extensions=settings.ALLOWED_EXTENSIONS
        )
        if not is_valid:
            raise DocumentProcessingError(
                error_msg,
                details={"filename": safe_filename, "reason": "validation_failed"}
            )

        # 2. Parse Layout & Extract text (includes text sanitization)
        parsed_data = DocumentParserService.parse(safe_filename, content)

        # 3. Create Session-Scoped In-Memory Document
        doc = InMemoryDocument(
            filename=parsed_data["filename"],
            document_type=parsed_data["document_type"],
            raw_text=parsed_data["raw_text"],
            page_count=parsed_data["page_count"],
            tables_found=parsed_data.get("tables_found", 0)
        )

        # 4. Structural Clause Segmentation
        sections = ClauseSegmentationService.segment_document(parsed_data)
        for s in sections:
            doc.add_section(s)

        # 5. Index in In-Memory Retrieval Store
        self.retrieval_service.index_clauses(doc.clauses)

        self.active_document = doc
        session_manager.set_session_document(session_id, doc)

        # 6. Proactive Memory Reclamation (free temporary parse buffers)
        del parsed_data
        gc.collect()

        return doc

    def ingest_raw_text(self, filename: str, text: str, session_id: str = "default_session") -> InMemoryDocument:
        clean_text = SecurityService.sanitize_extracted_text(text)
        content_bytes = clean_text.encode("utf-8")
        return self.ingest_file(filename, content_bytes, session_id=session_id)

    def get_active_document(self) -> Optional[InMemoryDocument]:
        return self.active_document

    def reset_session(self) -> None:
        self.active_document = None
        self.retrieval_service = RetrievalService()
        session_manager.clear_all()
        gc.collect()

ingestion_service = IngestionService()

