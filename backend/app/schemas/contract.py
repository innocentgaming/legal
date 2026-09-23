from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ClauseMetadata(BaseModel):
    word_count: int = 0
    char_count: int = 0
    category: str = "General Legal Terms"
    section_id: Optional[str] = None
    section_title: Optional[str] = None
    relevance_score: Optional[float] = None

class ClauseSchema(BaseModel):
    clause_id: str
    clause_number: str
    title: str = ""
    original_text: str
    plain_language: str = "Not clearly specified in this clause."
    obligations: List[str] = Field(default_factory=list)
    rights: List[str] = Field(default_factory=list)
    deadlines: List[str] = Field(default_factory=list)
    penalties: List[str] = Field(default_factory=list)
    risk_level: str = "STANDARD"
    source_location: Dict[str, Any] = Field(default_factory=dict)
    
    page: int = 1
    category: str = "General Legal Terms"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # Optional backward compatibility fields
    id: Optional[str] = None
    section_number: Optional[str] = None
    text: Optional[str] = None
    citation: Optional[str] = None
    clause_index: Optional[int] = None
    word_count: Optional[int] = None
    char_count: Optional[int] = None

class SectionSchema(BaseModel):
    section_id: str
    title: str
    section_number: str
    clauses: List[ClauseSchema]

class DocumentMetadataSchema(BaseModel):
    document_id: str
    filename: str
    document_type: str
    page_count: int
    clause_count: int
    total_words: int
    total_chars: int
    tables_found: int = 0
    processing_status: str = "completed"
    created_at: str

class IngestionResponse(BaseModel):
    document_id: str
    filename: str
    document_type: str
    page_count: int
    clause_count: int
    processing_status: str
    metadata: DocumentMetadataSchema
    sections: List[SectionSchema]
    clauses: List[ClauseSchema]

# Backward compatibility alias
UploadResponse = IngestionResponse
