from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full Name")
    email: EmailStr = Field(..., description="User Email Address")
    password: str = Field(..., min_length=6, max_length=128, description="Password (min 6 characters)")

class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User Email Address")
    password: str = Field(..., description="User Password")

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str
    is_guest: bool = False

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ContractHistoryItem(BaseModel):
    id: str
    filename: str
    uploaded_at: str
    clause_count: int
    overall_risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    preview_snippet: Optional[str] = None
    contract_data: Optional[Dict[str, Any]] = None

class SaveContractRequest(BaseModel):
    notes: Optional[str] = None
