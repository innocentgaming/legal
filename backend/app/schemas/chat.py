from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CitationObject(BaseModel):
    clause_id: str
    clause_number: str = ""
    page: int = 1
    quoted_source: str
    relevance: str = ""
    title: Optional[str] = ""
    snippet: Optional[str] = None
    section: Optional[str] = None

# Backward compatibility alias
ChatCitation = CitationObject

class QARequest(BaseModel):
    question: Optional[str] = None
    query: Optional[str] = None
    document_id: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    top_k: Optional[int] = 4

# Backward compatibility alias
ChatRequest = QARequest

class QAResponse(BaseModel):
    status: str = "success"
    answer: str
    citations: List[CitationObject] = Field(default_factory=list)
    grounded: bool = True
    provider: str = "Clarity Grounded Engine"
    label: str = "Answer based on your uploaded document"
    disclaimer: str = "Answer based on your uploaded document. Clarity provides informational analysis and is not a substitute for legal counsel."

# Backward compatibility alias
ChatResponse = QAResponse
