import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.app.core.config import settings
from backend.app.core.errors import DocumentProcessingError
from backend.app.schemas.contract import IngestionResponse, DocumentMetadataSchema, ClauseSchema, SectionSchema
from backend.app.services.ingestion_service import ingestion_service
from backend.app.utils.sample_contracts import SAMPLE_SAAS_MSA, SAMPLE_NDA, SAMPLE_EMPLOYMENT_IP

router = APIRouter(tags=["Document Ingestion"])

@router.post("/documents/upload", response_model=IngestionResponse)
@router.post("/contracts/upload", response_model=IngestionResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Ingests a legal contract (PDF, DOCX, or TXT).
    Preserves page boundaries, structural headings, whitespace normalization,
    and numbered clauses with stable IDs (CLAUSE-001, CLAUSE-002).
    """
    filename = file.filename or "contract.txt"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
        )

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file stream: {str(e)}")

    if not content or len(content.strip()) == 0:
        raise HTTPException(status_code=400, detail="Cannot upload an empty document.")

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413, 
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
        )

    try:
        doc = ingestion_service.ingest_file(filename, content)
        return doc.to_dict()
    except DocumentProcessingError as e:
        raise HTTPException(status_code=422, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal ingestion error: {str(e)}")

@router.post("/documents/sample/{sample_id}", response_model=IngestionResponse)
@router.post("/contracts/sample/{sample_id}", response_model=IngestionResponse)
async def load_sample(sample_id: str):
    """
    Loads one of the pre-bundled benchmark legal contracts.
    """
    samples = {
        "saas-msa": ("Enterprise_SaaS_Master_Services_Agreement.txt", SAMPLE_SAAS_MSA),
        "mutual-nda": ("Mutual_Non_Disclosure_Agreement.txt", SAMPLE_NDA),
        "employment-ip": ("Proprietary_Information_and_Inventions_Agreement.txt", SAMPLE_EMPLOYMENT_IP)
    }

    if sample_id not in samples:
        raise HTTPException(
            status_code=404, 
            detail=f"Sample '{sample_id}' not found. Available: {', '.join(samples.keys())}"
        )

    filename, text = samples[sample_id]
    doc = ingestion_service.ingest_raw_text(filename, text)
    return doc.to_dict()

@router.get("/documents/current", response_model=IngestionResponse)
@router.get("/contracts/current", response_model=IngestionResponse)
async def get_current_document():
    doc = ingestion_service.get_active_document()
    if not doc:
        raise HTTPException(status_code=404, detail="No document currently loaded in this session.")
    return doc.to_dict()

@router.get("/documents/clauses", response_model=List[ClauseSchema])
@router.get("/contracts/clauses", response_model=List[ClauseSchema])
async def get_document_clauses():
    """
    Returns all segmented clauses with plain-language explanations,
    obligations, rights, deadlines, penalties, risk levels, and source locations.
    """
    doc = ingestion_service.get_active_document()
    if not doc:
        raise HTTPException(status_code=404, detail="No document currently loaded in this session.")
    return doc.clauses

@router.post("/documents/clauses/{clause_id}/simplify", response_model=ClauseSchema)
@router.post("/contracts/clauses/{clause_id}/simplify", response_model=ClauseSchema)
async def simplify_clause_endpoint(clause_id: str):
    """
    Performs on-demand LLM simplification for a specific clause.
    """
    from backend.app.services.simplification_service import SimplificationService
    doc = ingestion_service.get_active_document()
    if not doc:
        raise HTTPException(status_code=404, detail="No document currently loaded in this session.")
    
    target = None
    for c in doc.clauses:
        if c.get("clause_id") == clause_id or c.get("id") == clause_id:
            target = c
            break
            
    if not target:
        raise HTTPException(status_code=404, detail=f"Clause '{clause_id}' not found in active document.")
        
    res = await SimplificationService.simplify_clause(
        target.get("original_text", target.get("text", "")),
        target.get("title", ""),
        target.get("category", "")
    )
    target.update(res)
    return target

@router.delete("/documents/current")
@router.delete("/contracts/current")
@router.post("/session/clear")
async def clear_current_session():
    """
    Clears all active session-scoped document data, vector store indices,
    and cached in-memory structures. Guarantees zero persistent storage.
    """
    ingestion_service.reset_session()
    return {
        "status": "success",
        "message": "Session data cleared successfully. Zero document contents retained."
    }

