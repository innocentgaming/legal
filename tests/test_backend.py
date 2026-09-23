import pytest
from backend.services.parser import DocumentParser
from backend.services.chunker import LegalChunker
from backend.services.vector_store import InMemoryVectorStore
from backend.services.llm import LLMService

def test_document_parser_and_chunker():
    sample_text = """MASTER SERVICES AGREEMENT
    
1. SERVICES
Provider shall deliver cloud solutions.

2. INDEMNIFICATION
Customer shall indemnify Provider against all claims.

3. LIMITATION OF LIABILITY
Customer liability is unlimited. Provider liability is capped at $10.
"""
    parsed = DocumentParser.parse_text(sample_text.encode("utf-8"), "test_contract.txt")
    assert parsed["file_type"] == "txt"
    assert parsed["total_words"] > 10

    chunks = LegalChunker.segment_document(parsed)
    assert len(chunks) >= 3
    assert any(c["category"] == "Indemnification" for c in chunks)
    assert any(c["category"] == "Limitation of Liability" for c in chunks)

def test_vector_store_retrieval():
    sample_text = """
1. CONFIDENTIALITY
The Receiving Party shall maintain confidentiality of proprietary technical information.

2. GOVERNING LAW
This agreement shall be governed by Delaware law.
"""
    parsed = DocumentParser.parse_text(sample_text.encode("utf-8"), "test.txt")
    chunks = LegalChunker.segment_document(parsed)
    
    store = InMemoryVectorStore()
    store.index_document(parsed, chunks)
    
    results = store.search("confidential information proprietary", top_k=2)
    assert len(results) > 0
    assert "CONFIDENTIALITY" in results[0]["title"].upper() or "1" in results[0]["section_number"]

def test_heuristic_risk_analysis():
    sample_text = """
1. INDEMNIFICATION
Customer shall indemnify Provider against all claims. Provider has no indemnity obligation.

2. LIMITATION OF LIABILITY
Customer's liability under this agreement shall be unlimited.
"""
    parsed = DocumentParser.parse_text(sample_text.encode("utf-8"), "risky_contract.txt")
    chunks = LegalChunker.segment_document(parsed)
    
    analysis = LLMService._heuristic_legal_analysis(chunks, parsed["raw_text"], "risky_contract.txt")
    assert analysis["overall_risk_score"] >= 60
    assert analysis["risk_level"] in ["High", "Medium"]
    assert len(analysis["key_findings"]) >= 2
    assert any("indemn" in f["issue_summary"].lower() for f in analysis["key_findings"])

if __name__ == "__main__":
    test_document_parser_and_chunker()
    test_vector_store_retrieval()
    test_heuristic_risk_analysis()
    print("ALL BACKEND TESTS PASSED SUCCESSFULLY!")
