from typing import List, Optional, Dict
from pydantic import BaseModel

class ChatCitation(BaseModel):
    clause_id: str
    title: str
    section: Optional[str] = None
    snippet: Optional[str] = None

class ChatRequest(BaseModel):
    query: str
    document_id: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = []
    top_k: Optional[int] = 4

class ChatResponse(BaseModel):
    status: str = "success"
    answer: str
    citations: List[ChatCitation]
    provider: str
