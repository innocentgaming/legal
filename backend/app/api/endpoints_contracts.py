import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.app.core.config import settings
from backend.app.core.errors import ClarityException
from backend.app.schemas.contract import UploadResponse, DocumentMetadata, Clause, SampleLoadRequest
from backend.app.services.ingestion_service import ingestion_service
from backend.app.utils.sample_contracts import SAMPLE_SAAS_MSA, SAMPLE_NDA, SAMPLE_EMPLOYMENT_IP

router = APIRouter(tags=["Contracts & Ingestion"])

@router.post("/contracts/upload", response_model=UploadResponse)
async def upload_contract(file: UploadFile = File(...)):
    filename = file.filename or "contract.txt"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit.")

    try:
        doc = ingestion_service.ingest_file(filename, content)
        return {
            "status": "success",
            "document": doc.to_metadata_dict(),
            "clauses": doc.clauses
        }
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Ingestion failed: {str(e)}")

@router.post("/contracts/sample/{sample_id}", response_model=UploadResponse)
async def load_sample(sample_id: str):
    samples = {
        "saas-msa": ("Enterprise_SaaS_Master_Services_Agreement.txt", SAMPLE_SAAS_MSA),
        "mutual-nda": ("Mutual_Non_Disclosure_Agreement.txt", SAMPLE_NDA),
        "employment-ip": ("Proprietary_Information_and_Inventions_Agreement.txt", SAMPLE_EMPLOYMENT_IP)
    }

    if sample_id not in samples:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found. Available: saas-msa, mutual-nda, employment-ip")

    filename, text = samples[sample_id]
    doc = ingestion_service.ingest_raw_text(filename, text)
    return {
        "status": "success",
        "document": doc.to_metadata_dict(),
        "clauses": doc.clauses
    }

@router.get("/contracts/current", response_model=UploadResponse)
async def get_current_document():
    doc = ingestion_service.get_active_document()
    if not doc:
        raise HTTPException(status_code=404, detail="No active document in session.")
    return {
        "status": "success",
        "document": doc.to_metadata_dict(),
        "clauses": doc.clauses
    }
