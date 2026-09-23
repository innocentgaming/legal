import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from pydantic import BaseModel

from backend.config import settings
from backend.services.parser import DocumentParser
from backend.services.chunker import LegalChunker
from backend.services.vector_store import InMemoryVectorStore
from backend.services.llm import LLMService

router = APIRouter(prefix="/api", tags=["Contracts & Legal Intelligence"])

# Global session vector store instance (Lightweight in-memory)
vector_store = InMemoryVectorStore()
current_document_state: Dict[str, Any] = {}

class ChatRequest(BaseModel):
    query: str
    history: Optional[List[Dict[str, str]]] = []
    top_k: Optional[int] = 4

class RedlineRequest(BaseModel):
    clause_id: Optional[str] = None
    clause_text: str
    category: Optional[str] = "General Legal Terms"
    instructions: Optional[str] = "Make this clause balanced, mutual, and market standard with liability caps and reasonable cure periods."

class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5

@router.post("/upload")
async def upload_contract(file: UploadFile = File(...)):
    """
    Upload and parse PDF, DOCX, or TXT legal contract.
    Extracts text using PDFPlumber (PDF) or Mammoth (DOCX), segments into legal clauses,
    and indexes in in-memory vector store.
    """
    filename = file.filename or "contract.txt"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not supported. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File size exceeds maximum allowed limit ({settings.MAX_FILE_SIZE_MB}MB)")

    try:
        parsed_doc = DocumentParser.parse_file(filename, content)
        chunks = LegalChunker.segment_document(parsed_doc)
        
        # Index in in-memory vector store
        vector_store.index_document(parsed_doc, chunks)
        
        # Store state
        current_document_state.clear()
        current_document_state.update({
            "metadata": {
                "filename": filename,
                "file_type": parsed_doc.get("file_type"),
                "page_count": parsed_doc.get("page_count"),
                "total_words": parsed_doc.get("total_words"),
                "total_chars": parsed_doc.get("total_chars"),
                "tables_found": parsed_doc.get("tables_found", 0),
                "clause_count": len(chunks)
            },
            "raw_text": parsed_doc.get("raw_text", ""),
            "chunks": chunks,
            "analysis": None
        })

        return {
            "status": "success",
            "metadata": current_document_state["metadata"],
            "chunks": chunks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse document: {str(e)}")

@router.post("/sample/{sample_id}")
async def load_sample_contract(sample_id: str):
    """
    Loads one of the pre-bundled benchmark legal contracts for instant demonstration.
    """
    samples = {
        "saas-msa": {
            "filename": "Enterprise_SaaS_Master_Services_Agreement.txt",
            "content": SAMPLE_SAAS_MSA
        },
        "mutual-nda": {
            "filename": "Mutual_Non_Disclosure_Agreement.txt",
            "content": SAMPLE_NDA
        },
        "employment-ip": {
            "filename": "Proprietary_Information_and_Inventions_Agreement.txt",
            "content": SAMPLE_EMPLOYMENT_IP
        }
    }

    if sample_id not in samples:
        raise HTTPException(status_code=404, detail="Sample not found. Available: saas-msa, mutual-nda, employment-ip")

    sample_info = samples[sample_id]
    content_bytes = sample_info["content"].encode("utf-8")
    
    parsed_doc = DocumentParser.parse_text(content_bytes, sample_info["filename"])
    chunks = LegalChunker.segment_document(parsed_doc)
    
    vector_store.index_document(parsed_doc, chunks)
    
    current_document_state.clear()
    current_document_state.update({
        "metadata": {
            "filename": sample_info["filename"],
            "file_type": "txt",
            "page_count": parsed_doc.get("page_count"),
            "total_words": parsed_doc.get("total_words"),
            "total_chars": parsed_doc.get("total_chars"),
            "tables_found": 0,
            "clause_count": len(chunks)
        },
        "raw_text": parsed_doc.get("raw_text", ""),
        "chunks": chunks,
        "analysis": None
    })

    return {
        "status": "success",
        "metadata": current_document_state["metadata"],
        "chunks": chunks
    }

@router.post("/analyze")
async def analyze_document():
    """
    Run comprehensive AI Legal Risk Audit on current document.
    """
    if not current_document_state.get("chunks"):
        raise HTTPException(status_code=400, detail="No document currently loaded. Please upload a contract first.")

    chunks = current_document_state["chunks"]
    raw_text = current_document_state.get("raw_text", "")
    filename = current_document_state["metadata"]["filename"]

    analysis = await LLMService.analyze_contract(chunks, raw_text, filename)
    current_document_state["analysis"] = analysis
    
    return {
        "status": "success",
        "analysis": analysis
    }

@router.post("/chat")
async def chat_with_contract(req: ChatRequest):
    """
    Conversational RAG query with exact clause citations and highlight anchors.
    """
    if not current_document_state.get("chunks"):
        raise HTTPException(status_code=400, detail="No document loaded. Upload a contract before chatting.")

    # Retrieve relevant clauses via in-memory vector store
    retrieved = vector_store.search(req.query, top_k=req.top_k or 4)
    
    # Generate grounded response
    chat_result = await LLMService.chat_with_doc(req.query, req.history or [], retrieved)
    
    return {
        "status": "success",
        "answer": chat_result.get("answer"),
        "citations": chat_result.get("citations", []),
        "provider": chat_result.get("provider"),
        "retrieved_chunks": retrieved
    }

@router.post("/redline")
async def redline_clause(req: RedlineRequest):
    """
    Generate proposed redline revision, legal rationale, and risk mitigation.
    """
    clause_text = req.clause_text
    if req.clause_id and not clause_text:
        # Find clause by ID
        for c in current_document_state.get("chunks", []):
            if c["id"] == req.clause_id:
                clause_text = c["text"]
                break

    if not clause_text:
        raise HTTPException(status_code=400, detail="Clause text or valid clause_id is required.")

    redline_result = await LLMService.generate_redline(clause_text, req.category or "General Legal Terms", req.instructions or "")
    
    return {
        "status": "success",
        "redline": redline_result
    }

@router.post("/search")
async def search_clauses(req: SearchRequest):
    """
    Direct semantic & lexical clause search.
    """
    results = vector_store.search(req.query, top_k=req.top_k or 5)
    return {
        "status": "success",
        "query": req.query,
        "results": results
    }

@router.get("/status")
async def get_system_status():
    """
    Returns system status, active LLM configuration, and loaded document metadata.
    """
    has_gemini = bool(settings.GEMINI_API_KEY)
    has_openai = bool(settings.OPENAI_API_KEY)
    
    active_provider = "Gemini Cloud API" if has_gemini else ("OpenAI API" if has_openai else "Embedded Heuristic Legal Engine")
    
    return {
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "active_llm_provider": active_provider,
        "has_gemini_key": has_gemini,
        "has_openai_key": has_openai,
        "document_loaded": bool(current_document_state.get("chunks")),
        "loaded_metadata": current_document_state.get("metadata", None)
    }

# -------------------------------------------------------------
# Embedded Sample Benchmark Legal Contracts
# -------------------------------------------------------------

SAMPLE_SAAS_MSA = """MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is made and entered into as of October 1, 2026 ("Effective Date"), by and between CloudCore Systems Inc., a Delaware corporation ("Provider"), and Nexus Enterprises LLC ("Customer").

1. SERVICES AND ACCESS
Provider shall provide Customer with access to Provider's proprietary hosted SaaS platform (the "Subscription Services") in accordance with the applicable Order Form. Provider reserves the right to modify or discontinue any feature with or without prior notice.

2. FEES AND PAYMENT TERMS
Customer shall pay all fees specified in applicable Order Forms. Except as otherwise specified herein: (a) fees are quoted and payable in United States dollars, (b) fees are based on services purchased and not actual usage, and (c) payment obligations are non-cancelable and fees paid are non-refundable. Invoices are due net 15 days from the date of invoice. Late payments shall incur interest at the rate of 2.5% per month or the maximum permitted by law.

3. PROPRIETARY RIGHTS AND INTELLECTUAL PROPERTY
Customer acknowledges that Provider and its licensors retain all right, title, and interest in and to the Subscription Services, documentation, and all related intellectual property rights. Customer hereby grants Provider a perpetual, irrevocable, royalty-free, worldwide license to use and incorporate into the Subscription Services any suggestion, enhancement request, recommendation, correction or other feedback provided by Customer.

4. CONFIDENTIALITY
4.1 Definition. "Confidential Information" means all information disclosed by a party ("Disclosing Party") to the other party ("Receiving Party"), whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information.
4.2 Protection. The Receiving Party shall use the same degree of care that it uses to protect the confidentiality of its own confidential information of like kind (but not less than reasonable care).

5. INDEMNIFICATION
5.1 Customer Indemnification. Customer shall defend, indemnify, and hold harmless Provider, its affiliates, officers, directors, and employees from and against any and all claims, demands, suits, damages, liabilities, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to Customer's use of the Subscription Services or breach of this Agreement.
5.2 Provider Indemnification. [INTENTIONALLY OMITTED]

6. LIMITATION OF LIABILITY
6.1 EXCLUSION OF CONSEQUENTIAL DAMAGES. IN NO EVENT SHALL PROVIDER HAVE ANY LIABILITY TO CUSTOMER FOR ANY LOST PROFITS, LOSS OF USE, OR FOR ANY INDIRECT, SPECIAL, INCIDENTAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES, HOWEVER CAUSED.
6.2 AGGREGATE LIABILITY. IN NO EVENT SHALL THE TOTAL AGGREGATE LIABILITY OF PROVIDER ARISING OUT OF OR RELATED TO THIS AGREEMENT, WHETHER IN CONTRACT, TORT, OR UNDER ANY OTHER THEORY OF LIABILITY, EXCEED THE AMOUNT PAID BY CUSTOMER HEREUNDER IN THE ONE (1) MONTH PRECEDING THE INCIDENT. CUSTOMER'S LIABILITY UNDER THIS AGREEMENT SHALL BE UNLIMITED.

7. TERM AND TERMINATION
7.1 Term. This Agreement commences on the Effective Date and continues until all subscriptions hereunder have expired or been terminated.
7.2 Termination for Cause. Provider may terminate this Agreement immediately upon written notice if Customer breaches Section 2 (Fees) or Section 3 (Proprietary Rights). Either party may terminate if the other party materially breaches any other provision and fails to cure such breach within 10 days of notice.
7.3 Effect of Termination. Upon termination, Customer shall immediately cease all use of the Services and pay all remaining unpaid fees for the entire term.

8. RESTRICTIVE COVENANTS
Customer agrees that during the term of this Agreement and for a period of two (2) years thereafter, Customer shall not directly or indirectly hire, solicit, or engage any employee or contractor of Provider.

9. GOVERNING LAW AND VENUE
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles. The parties submit to the exclusive personal jurisdiction of the state and federal courts located in Wilmington, Delaware.
"""

SAMPLE_NDA = """MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of September 15, 2026, by and between Alpha BioTech Inc. and Beta Innovations LLC (each a "Party" and collectively the "Parties").

1. PURPOSE
The Parties wish to explore a potential business relationship concerning joint pharmaceutical delivery systems (the "Purpose") and in connection therewith may disclose confidential technical, financial, and proprietary information.

2. CONFIDENTIAL INFORMATION
"Confidential Information" means all non-public information disclosed by one Party ("Disclosing Party") to the other Party ("Receiving Party"), including but not limited to trade secrets, algorithms, source code, clinical data, customer lists, and financial models.

3. OBLIGATIONS OF RECEIVING PARTY
3.1 Standard of Care. The Receiving Party agrees to maintain the Confidential Information in strict confidence and to use at least the same degree of care that it uses to protect its own confidential information of like importance, but in no event less than a reasonable degree of care.
3.2 Permitted Use. The Receiving Party shall use Confidential Information solely for the Purpose and shall restrict disclosure only to its employees and legal counsel who have a need to know.

4. EXCLUSIONS
Confidential Information does not include information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was already known to Receiving Party prior to disclosure; (c) is independently developed without reference to Disclosing Party's Confidential Information; or (d) is received rightfully from a third party without duty of confidentiality.

5. TERM AND SURVIVAL
This Agreement shall remain in effect for a period of two (2) years from the Effective Date. The confidentiality obligations herein shall survive termination and remain binding for a period of five (5) years following receipt of information; provided that trade secrets shall remain confidential indefinitely.

6. RETURN OF MATERIALS
Upon written request by Disclosing Party, Receiving Party shall promptly return or certify destruction of all documents and copies containing Confidential Information.

7. REMEDIES AND INJUNCTIVE RELIEF
The Parties acknowledge that unauthorized disclosure of Confidential Information may cause irreparable harm for which monetary damages alone would be inadequate. Accordingly, Disclosing Party shall be entitled to seek injunctive relief without the requirement of posting a bond.

8. MISCELLANEOUS
This Agreement constitutes the entire understanding between the Parties and shall be governed by the laws of the Commonwealth of Massachusetts.
"""

SAMPLE_EMPLOYMENT_IP = """PROPRIETARY INFORMATION AND INVENTIONS AGREEMENT

1. RECITALS
In consideration of my employment or continued employment with Apex AI Labs Inc. ("Company"), I hereby agree to the covenants set forth in this Proprietary Information and Inventions Agreement ("Agreement").

2. CONFIDENTIALITY
I will maintain in strict confidence and will not disclose, copy, or use any Company Proprietary Information, except as required in the performance of my duties for the Company.

3. ASSIGNMENT OF INVENTIONS
3.1 Inventions Retained and Licensed. Attached hereto as Exhibit A is a complete list of all prior inventions made by me prior to employment.
3.2 Assignment. I hereby irrevocably assign and transfer to the Company all my right, title, and interest in and to any and all Inventions (including intellectual property rights) created, conceived, reduced to practice, or authored by me during the period of my employment, whether or not during normal working hours or using Company resources.

4. NON-SOLICITATION AND NON-COMPETITION
4.1 Non-Solicitation. During my employment and for eighteen (18) months following termination, I will not directly or indirectly solicit any employee or customer of Company.
4.2 Non-Competition. During my employment and for a period of twelve (12) months after termination, I shall not engage in, assist, or perform services for any business entity that competes with the products or services developed by the Company.

5. AT-WILL EMPLOYMENT
I understand that nothing in this Agreement alters my status as an at-will employee, and either Company or I may terminate employment at any time with or without cause.
"""
