from typing import Dict, Any, Optional
from backend.app.models.document import InMemoryDocument
from backend.app.services.document_parser import DocumentParserService
from backend.app.services.clause_segmentation_service import ClauseSegmentationService
from backend.app.services.retrieval_service import RetrievalService

class IngestionService:
    """
    Coordinates document ingestion, layout parsing, clause segmentation,
    and in-memory vector indexing.
    """

    def __init__(self):
        self.active_document: Optional[InMemoryDocument] = None
        self.retrieval_service = RetrievalService()

    def ingest_file(self, filename: str, content: bytes) -> InMemoryDocument:
        # 1. Parse layout
        parsed_data = DocumentParserService.parse(filename, content)
        
        # 2. Build In-Memory Document Model
        doc = InMemoryDocument(
            filename=parsed_data["filename"],
            file_type=parsed_data["file_type"],
            raw_text=parsed_data["raw_text"],
            page_count=parsed_data["page_count"],
            tables_found=parsed_data["tables_found"]
        )

        # 3. Segment into clauses
        clauses = ClauseSegmentationService.segment(doc.raw_text, doc.id)
        doc.clauses = clauses

        # 4. Index in retrieval service
        self.retrieval_service.index_clauses(clauses)

        self.active_document = doc
        return doc

    def ingest_raw_text(self, filename: str, text: str) -> InMemoryDocument:
        content_bytes = text.encode("utf-8")
        return self.ingest_file(filename, content_bytes)

    def get_active_document(self) -> Optional[InMemoryDocument]:
        return self.active_document

# Singleton instance for active session
ingestion_service = IngestionService()
