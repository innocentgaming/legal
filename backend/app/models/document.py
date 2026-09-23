from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

class InMemoryDocument:
    """
    In-memory representation of an uploaded legal contract.
    No persistent database required.
    """
    def __init__(self, filename: str, file_type: str, raw_text: str, page_count: int, tables_found: int = 0):
        self.id: str = f"doc_{uuid.uuid4().hex[:8]}"
        self.filename: str = filename
        self.file_type: str = file_type
        self.raw_text: str = raw_text
        self.page_count: int = page_count
        self.tables_found: int = tables_found
        self.created_at: str = datetime.utcnow().isoformat() + "Z"
        
        words = raw_text.split()
        self.total_words: int = len(words)
        self.total_chars: int = len(raw_text)
        
        self.clauses: List[Dict[str, Any]] = []
        self.analysis_cache: Optional[Dict[str, Any]] = None
        self.briefing_cache: Optional[Dict[str, Any]] = None

    def to_metadata_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.id,
            "filename": self.filename,
            "file_type": self.file_type,
            "page_count": self.page_count,
            "total_words": self.total_words,
            "total_chars": self.total_chars,
            "tables_found": self.tables_found,
            "clause_count": len(self.clauses),
            "created_at": self.created_at
        }
