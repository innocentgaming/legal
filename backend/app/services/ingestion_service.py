import os
from typing import Dict, Any, Optional
from backend.app.core.config import settings
from backend.app.core.errors import DocumentProcessingError
from backend.app.models.document import InMemoryDocument
from backend.app.services.document_parser import DocumentParserService
from backend.app.services.clause_segmentation_service import ClauseSegmentationService
from backend.app.services.retrieval_service import RetrievalService

class IngestionService:
    """
    Coordinates legal document ingestion pipeline:
    1. Validation (MIME type, size, non-empty)
    2. Format parsing (PDF, DOCX, TXT)
    3. Structural clause & section segmentation
    4. In-memory vector store indexing
    5. Session-scoped document tracking (Zero persistence)
    """

    def __init__(self):
        self.active_document: Optional[InMemoryDocument] = None
        self.retrieval_service = RetrievalService()

    def ingest_file(self, filename: str, content: bytes) -> InMemoryDocument:
        # 1. Validation
        if not filename:
            filename = "document.txt"

        ext = os.path.splitext(filename)[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise DocumentProcessingError(
                f"Unsupported file format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}",
                details={"filename": filename, "allowed": list(settings.ALLOWED_EXTENSIONS)}
            )

        if not content or len(content.strip()) == 0:
            raise DocumentProcessingError(
                f"Cannot ingest empty document '{filename}'.",
                details={"filename": filename, "reason": "empty_content"}
            )

        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise DocumentProcessingError(
                f"File size ({len(content)/(1024*1024):.1f}MB) exceeds maximum limit of {settings.MAX_FILE_SIZE_MB}MB.",
                details={"filename": filename, "size_bytes": len(content), "max_bytes": max_bytes}
            )

        # 2. Parse Layout & Extract text
        parsed_data = DocumentParserService.parse(filename, content)

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
        return doc

    def ingest_raw_text(self, filename: str, text: str) -> InMemoryDocument:
        content_bytes = text.encode("utf-8")
        return self.ingest_file(filename, content_bytes)

    def get_active_document(self) -> Optional[InMemoryDocument]:
        return self.active_document

    def reset_session(self) -> None:
        self.active_document = None
        self.retrieval_service = RetrievalService()

ingestion_service = IngestionService()
