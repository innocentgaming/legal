import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.services.simplification_service import SimplificationService

client = TestClient(app)

def test_unit_simplification_heuristic_and_anti_hallucination():
    # 1. High-risk clause with unlimited liability and one-sided indemnity
    high_risk_clause = (
        "Customer shall defend, indemnify and hold harmless Provider from any and all damages. "
        "Customer's liability under this Agreement shall be unlimited and Provider liability is completely excluded. "
        "Provider may terminate this agreement immediately without notice upon any breach."
    )
    res = SimplificationService.simplify_clause_sync(high_risk_clause, title="Indemnification and Liability", category="Indemnification")
    
    assert res["risk_level"] == "HIGH_RISK"
    assert len(res["plain_language"]) > 20
    assert any("indemnif" in o.lower() or "shall" in o.lower() for o in res["obligations"])
    assert "Not clearly specified in this clause." not in res["obligations"]
    assert any("terminate immediately" in p.lower() or "indemnif" in p.lower() for p in res["penalties"])

    # 2. Standard mutual confidentiality clause
    std_clause = (
        "Each party agrees to maintain Confidential Information in confidence using at least reasonable care, "
        "and not to disclose such information to third parties without prior written consent."
    )
    res_std = SimplificationService.simplify_clause_sync(std_clause, title="Confidentiality", category="Confidentiality")
    assert res_std["risk_level"] == "STANDARD"
    assert "protect" in res_std["plain_language"].lower() or "confidential" in res_std["plain_language"].lower()
    assert res_std["deadlines"] == ["Not clearly specified in this clause."]
    assert res_std["penalties"] == ["Not clearly specified in this clause."]

    # 3. Clause with specific deadlines and rights
    deadline_clause = (
        "Either party may terminate this agreement upon thirty (30) days prior written notice. "
        "Customer may request a refund within 15 days of the Effective Date."
    )
    res_dl = SimplificationService.simplify_clause_sync(deadline_clause, title="Termination and Refund", category="Termination")
    assert res_dl["risk_level"] == "WORTH_NOTING"
    assert any("30" in d or "15" in d for d in res_dl["deadlines"])
    assert any("may" in r.lower() for r in res_dl["rights"])

def test_phase3_ingestion_and_clause_schema_fields():
    # Ingest a contract and test that all required Phase 3 fields are present and correctly typed
    contract_text = """MASTER SERVICES AGREEMENT

1. DEFINITIONS AND SCOPE
1.1 Cloud Services. Provider shall deliver software platform access as specified in Order Forms.

2. PAYMENT AND BILLING
2.1 Monthly Fees. Customer agrees to pay all invoiced amounts within 30 days of invoice date.
2.2 Late Fee. Unpaid balances incur a late fee penalty of 1.5% per month.

3. INDEMNIFICATION AND LIABILITY
3.1 Customer Indemnity. Customer shall indemnify and hold harmless Provider against third-party patent claims.
3.2 Liability Cap. Aggregate liability is capped at total fees paid in the prior 12 months.
"""
    res = client.post(
        "/api/documents/upload",
        files={"file": ("msa_simplification_test.txt", contract_text.encode("utf-8"), "text/plain")}
    )
    assert res.status_code == 200, f"Upload failed: {res.text}"
    data = res.json()

    clauses = data["clauses"]
    assert len(clauses) >= 4

    required_fields = [
        "clause_id",
        "clause_number",
        "title",
        "original_text",
        "plain_language",
        "obligations",
        "rights",
        "deadlines",
        "penalties",
        "risk_level",
        "source_location"
    ]

    for c in clauses:
        for field in required_fields:
            assert field in c, f"Missing required field '{field}' in clause {c.get('clause_id')}"
        
        # Verify types
        assert isinstance(c["clause_id"], str)
        assert isinstance(c["clause_number"], str)
        assert isinstance(c["title"], str)
        assert isinstance(c["original_text"], str)
        assert isinstance(c["plain_language"], str)
        assert isinstance(c["obligations"], list)
        assert isinstance(c["rights"], list)
        assert isinstance(c["deadlines"], list)
        assert isinstance(c["penalties"], list)
        assert c["risk_level"] in ["STANDARD", "WORTH_NOTING", "HIGH_RISK"]
        assert isinstance(c["source_location"], dict)
        assert "page" in c["source_location"]
        assert "section_id" in c["source_location"]

def test_get_document_clauses_endpoint():
    res = client.get("/api/documents/clauses")
    assert res.status_code == 200
    clauses = res.json()
    assert len(clauses) >= 4
    assert clauses[0]["clause_id"] == "CLAUSE-001"
    assert len(clauses[0]["plain_language"]) > 10

def test_simplify_single_clause_endpoint():
    res = client.post("/api/documents/clauses/CLAUSE-001/simplify")
    assert res.status_code == 200
    clause_data = res.json()
    assert clause_data["clause_id"] == "CLAUSE-001"
    assert "plain_language" in clause_data
    assert "risk_level" in clause_data
    assert clause_data["risk_level"] in ["STANDARD", "WORTH_NOTING", "HIGH_RISK"]

if __name__ == "__main__":
    pytest.main(["-v", __file__])
