from typing import List, Optional
from pydantic import BaseModel, Field

class DocumentMetadata(BaseModel):
    document_id: str
    filename: str
    file_type: str
    page_count: int
    total_words: int
    total_chars: int
    tables_found: int = 0
    clause_count: int = 0
    created_at: str

class Clause(BaseModel):
    id: str
    clause_index: int
    section_number: str
    title: str
    category: str
    text: str
    word_count: int
    char_count: int
    citation: str
    relevance_score: Optional[float] = None

class UploadResponse(BaseModel):
    status: str = "success"
    document: DocumentMetadata
    clauses: List[Clause]

class SampleLoadRequest(BaseModel):
    sample_id: str
