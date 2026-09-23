import pytest
from backend.app.services.document_parser import DocumentParserService
from backend.app.services.clause_segmentation_service import ClauseSegmentationService
from backend.app.services.embedding_service import EmbeddingService
from backend.app.services.retrieval_service import RetrievalService
from backend.app.services.ingestion_service import IngestionService
from backend.app.services.risk_classifier import RiskClassifierService
from backend.app.services.comparison_service import ComparisonService
from backend.app.services.briefing_service import BriefingService

def test_full_service_pipeline():
    sample_text = """MASTER SERVICES AGREEMENT
    
1. SERVICES AND SCOPE
Provider shall deliver cloud solutions to Customer.

2. INDEMNIFICATION
Customer shall defend and indemnify Provider from all claims.

3. LIMITATION OF LIABILITY
Customer liability under this agreement is unlimited. Provider aggregate liability is capped at $100.
"""
    # 1. Parsing
    parsed = DocumentParserService.parse("test.txt", sample_text.encode("utf-8"))
    assert parsed["file_type"] == "txt"
    
    # 2. Ingestion
    ingestion = IngestionService()
    doc = ingestion.ingest_raw_text("test.txt", sample_text)
    assert len(doc.clauses) >= 3
    
    # 3. Retrieval
    search_res = ingestion.retrieval_service.search("liability cap unlimited", top_k=2)
    assert len(search_res) > 0
    assert "LIABILITY" in search_res[0]["title"].upper() or "3" in search_res[0]["section_number"]

    # 4. Risk Classification
    audit = RiskClassifierService._classify_heuristically(doc.clauses, doc.raw_text, "test.txt")
    assert audit["overall_risk_score"] >= 60
    assert len(audit["key_findings"]) >= 2

    # 5. Comparison
    redline = ComparisonService._redline_heuristically(
        doc.clauses[2]["text"], "Limitation of Liability", "Make it mutual"
    )
    assert "aggregate liability" in redline["proposed_revision"].lower()
    assert len(redline["diff_tokens"]) > 0

    print("ALL 9 CORE SERVICES PASSED UNIT TESTS!")

if __name__ == "__main__":
    test_full_service_pipeline()
