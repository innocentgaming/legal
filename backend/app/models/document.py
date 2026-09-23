from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from backend.app.services.simplification_service import SimplificationService

class ClauseModel:
    def __init__(
        self,
        clause_id: str,
        clause_number: str,
        original_text: str,
        page: int,
        title: str,
        section_id: str,
        category: str = "General Legal Terms",
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.clause_id: str = clause_id
        self.clause_number: str = clause_number
        self.original_text: str = original_text.strip()
        self.page: int = max(1, page)
        self.title: str = title
        self.section_id: str = section_id
        self.category: str = category
        self.metadata: Dict[str, Any] = metadata or {}
        
        words = self.original_text.split()
        self.metadata.update({
            "word_count": len(words),
            "char_count": len(self.original_text),
            "category": self.category,
            "section_id": self.section_id,
            "section_title": self.title
        })

        # Phase 3: Plain-language explanation & legal concept extraction
        simplification = SimplificationService.simplify_clause_sync(self.original_text, self.title, self.category)
        self.plain_language: str = simplification["plain_language"]
        self.obligations: List[str] = simplification["obligations"]
        self.rights: List[str] = simplification["rights"]
        self.deadlines: List[str] = simplification["deadlines"]
        self.penalties: List[str] = simplification["penalties"]
        self.risk_level: str = simplification["risk_level"]
        self.source_location: Dict[str, Any] = {
            "page": self.page,
            "section_id": self.section_id,
            "section_title": self.title
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "clause_id": self.clause_id,
            "id": self.clause_id,  # backward compatibility
            "clause_number": self.clause_number,
            "section_number": self.clause_number,
            "title": self.title,
            "original_text": self.original_text,
            "text": self.original_text,  # backward compatibility
            "plain_language": self.plain_language,
            "obligations": self.obligations,
            "rights": self.rights,
            "deadlines": self.deadlines,
            "penalties": self.penalties,
            "risk_level": self.risk_level,
            "source_location": self.source_location,
            "page": self.page,
            "category": self.category,
            "clause_index": int(self.clause_id.split("-")[-1]) if "-" in self.clause_id and self.clause_id.split("-")[-1].isdigit() else 1,
            "word_count": self.metadata.get("word_count", len(self.original_text.split())),
            "char_count": self.metadata.get("char_count", len(self.original_text)),
            "citation": f"{self.title} ({self.clause_id})" if self.title else self.clause_id,
            "metadata": self.metadata
        }

class SectionModel:
    def __init__(self, section_id: str, title: str, section_number: str):
        self.section_id: str = section_id
        self.title: str = title
        self.section_number: str = section_number
        self.clauses: List[ClauseModel] = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "section_id": self.section_id,
            "title": self.title,
            "section_number": self.section_number,
            "clauses": [c.to_dict() for c in self.clauses]
        }

class InMemoryDocument:
    """
    Session-scoped in-memory representation of an ingested legal contract.
    Zero persistent database retention.
    """
    def __init__(self, filename: str, document_type: str, raw_text: str, page_count: int, tables_found: int = 0):
        self.id: str = f"DOC-{uuid.uuid4().hex[:8].upper()}"
        self.filename: str = filename
        self.document_type: str = document_type
        self.raw_text: str = raw_text
        self.page_count: int = max(1, page_count)
        self.tables_found: int = tables_found
        self.processing_status: str = "completed"
        self.created_at: str = datetime.now(timezone.utc).isoformat()
        
        words = raw_text.split()
        self.total_words: int = len(words)
        self.total_chars: int = len(raw_text)
        
        self.sections: List[SectionModel] = []
        self.clauses: List[Dict[str, Any]] = []
        
        # Session intelligence cache (strictly scoped to active document lifecycle)
        self.analysis_cache: Optional[Dict[str, Any]] = None
        self.briefing_cache: Dict[str, Any] = {}

    def add_section(self, section: SectionModel):
        self.sections.append(section)
        for c in section.clauses:
            self.clauses.append(c.to_dict())

    @property
    def clause_count(self) -> int:
        return len(self.clauses)

    def to_metadata_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.id,
            "filename": self.filename,
            "document_type": self.document_type,
            "file_type": self.document_type,
            "page_count": self.page_count,
            "clause_count": self.clause_count,
            "total_words": self.total_words,
            "total_chars": self.total_chars,
            "tables_found": self.tables_found,
            "processing_status": self.processing_status,
            "created_at": self.created_at
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.id,
            "filename": self.filename,
            "document_type": self.document_type,
            "page_count": self.page_count,
            "clause_count": self.clause_count,
            "processing_status": self.processing_status,
            "metadata": self.to_metadata_dict(),
            "sections": [s.to_dict() for s in self.sections],
            "clauses": self.clauses
        }
