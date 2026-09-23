from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional, List, Dict, Any
from backend.app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
    ContractHistoryItem,
    SaveContractRequest
)
from backend.app.services.auth_service import auth_service
from backend.app.services.ingestion_service import ingestion_service
from backend.app.services.risk_classifier import risk_classifier_service

router = APIRouter(prefix="/auth", tags=["User Authentication & Contract Library"])

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please provide a valid Bearer token."
        )
    token = authorization.split(" ")[1]
    payload = auth_service.verify_jwt_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token."
        )
    user = auth_service.get_user_by_id(payload.get("sub", ""))
    if not user:
        raise HTTPException(status_code=401, detail="User account not found.")
    return user

@router.post("/register", response_model=TokenResponse)
async def register(req: UserRegisterRequest):
    """
    Registers a new user account and returns a signed JWT access token.
    """
    try:
        user, token = auth_service.register_user(
            name=req.name,
            email=req.email,
            password=req.password
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Account registration failed.")

@router.post("/login", response_model=TokenResponse)
async def login(req: UserLoginRequest):
    """
    Authenticates an existing user and returns a signed JWT access token.
    """
    try:
        user, token = auth_service.login_user(
            email=req.email,
            password=req.password
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Login failed.")

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Retrieves the profile of the currently authenticated user.
    """
    return current_user

@router.get("/contracts", response_model=List[ContractHistoryItem])
async def list_saved_contracts(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Lists all saved contracts in the authenticated user's library.
    """
    return auth_service.get_user_saved_contracts(current_user["id"])

@router.post("/contracts/save", response_model=Dict[str, Any])
async def save_active_contract(
    req: SaveContractRequest = SaveContractRequest(),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Saves the currently active in-memory contract session to the user's permanent library.
    """
    doc = ingestion_service.get_active_document()
    if not doc or not doc.clauses:
        raise HTTPException(status_code=400, detail="No active document loaded to save.")

    analysis = doc.analysis_cache
    if not analysis:
        # Run risk analysis if not yet cached
        analysis = risk_classifier_service.audit_document(
            doc.clauses, doc.raw_text, doc.filename
        )
        doc.analysis_cache = analysis

    clauses_serialized = [c.model_dump() if hasattr(c, "model_dump") else c for c in doc.clauses]

    saved_item = auth_service.save_contract_for_user(
        user_id=current_user["id"],
        filename=doc.filename,
        clauses=clauses_serialized,
        raw_text=doc.raw_text,
        analysis=analysis,
        notes=req.notes
    )

    return {
        "status": "success",
        "message": f"Contract '{doc.filename}' saved to your library.",
        "contract": saved_item
    }

@router.get("/contracts/{contract_id}", response_model=Dict[str, Any])
async def load_saved_contract(
    contract_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Loads a saved contract from the user's library into the active session.
    """
    item = auth_service.get_user_contract_by_id(current_user["id"], contract_id)
    if not item:
        raise HTTPException(status_code=404, detail="Saved contract not found.")

    contract_data = item.get("contract_data", {})
    raw_text = contract_data.get("raw_text", "")
    filename = contract_data.get("filename", item.get("filename", "contract.txt"))
    
    # Re-ingest into volatile active session
    doc = ingestion_service.ingest_raw_text(filename, raw_text)
    if contract_data.get("analysis"):
        doc.analysis_cache = contract_data["analysis"]

    return {
        "status": "success",
        "message": f"Contract '{filename}' loaded into active workspace.",
        "document": {
            "filename": doc.filename,
            "clause_count": len(doc.clauses),
            "char_count": len(doc.raw_text),
            "clauses": [c.model_dump() if hasattr(c, "model_dump") else c for c in doc.clauses],
            "analysis": doc.analysis_cache
        }
    }

@router.delete("/contracts/{contract_id}", response_model=Dict[str, Any])
async def delete_saved_contract(
    contract_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Deletes a saved contract from the user's library.
    """
    success = auth_service.delete_user_contract(current_user["id"], contract_id)
    if not success:
        raise HTTPException(status_code=404, detail="Saved contract not found.")
    return {"status": "success", "message": "Contract deleted from your library."}
