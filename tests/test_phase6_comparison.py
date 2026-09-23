import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.services.comparison_service import ComparisonService

client = TestClient(app)

DOC_A_SAMPLE = """MASTER SERVICES AGREEMENT

1. SERVICES AND DELIVERABLES
Provider shall deliver cloud architecture consulting services to Customer in accordance with attached Statements of Work.

2. INDEMNIFICATION
Each party shall defend, indemnify and hold harmless the other party from and against any third-party claims arising from gross negligence or intentional misconduct.

3. LIMITATION OF LIABILITY
In no event shall either party's aggregate liability exceed the total fees paid under this agreement in the prior twelve (12) months.

4. TERMINATION
Either party may terminate this agreement for convenience upon thirty (30) days prior written notice.

5. EXPRESS WARRANTIES
Provider warrants that all professional services will be performed in a timely, professional, and workmanlike manner.
"""

DOC_B_SAMPLE = """AMENDED MASTER SERVICES AGREEMENT

1. SERVICES AND DELIVERABLES
Provider shall deliver cloud architecture consulting services to Customer in accordance with attached Statements of Work.

2. TERMINATION
Either party may terminate this agreement for convenience upon ten (10) days prior written notice.

3. LIMITATION OF LIABILITY
Customer agrees that Provider's liability is completely excluded, and Customer liability under this agreement shall be unlimited.

4. INDEMNIFICATION
Customer shall defend, indemnify and hold harmless Provider from all third-party claims, lawsuits, and regulatory penalties.

5. MANDATORY ARBITRATION
All disputes arising under this agreement shall be settled through binding confidential arbitration in New York City.
"""

def test_semantic_alignment_and_difference_detection():
    result = ComparisonService.compare_two_documents(
        doc_a=DOC_A_SAMPLE,
        doc_b=DOC_B_SAMPLE,
        label_a="Original MSA",
        label_b="Vendor Counter-Proposal"
    )

    assert "clause_pairs" in result
    assert "summary" in result
    pairs = result["clause_pairs"]
    summary = result["summary"]

    assert summary["total_pairs"] >= 5
    assert summary["matches_count"] >= 1  # Services & Deliverables is identical
    assert summary["modified_count"] >= 2  # Liability and Termination are modified
    assert summary["added_count"] >= 1     # Mandatory Arbitration is added
    assert summary["removed_count"] >= 1   # Express Warranties is removed

    # 1. Verify Scope Clause is MATCH
    scope_pair = next((p for p in pairs if p["difference_type"] == "MATCH"), None)
    assert scope_pair is not None
    assert "SERVICES" in scope_pair["document_a_clause"]["title"].upper() or "SERVICES" in scope_pair["document_a_clause"]["original_text"].upper()

    # 2. Verify Liability is MODIFIED and aligned despite different positions
    liability_pair = next((
        p for p in pairs 
        if p["difference_type"] == "MODIFIED" and p["document_a_clause"] and "LIABILITY" in p["document_a_clause"]["original_text"].upper()
    ), None)
    assert liability_pair is not None
    assert "unlimited" in liability_pair["explanation"].lower() or "liability" in liability_pair["explanation"].lower()
    assert len(liability_pair["why_it_matters"]) > 10

    # 3. Verify Added Arbitration Clause
    added_pair = next((
        p for p in pairs 
        if p["difference_type"] == "ADDED" and p["document_b_clause"] and "ARBITRATION" in p["document_b_clause"]["original_text"].upper()
    ), None)
    assert added_pair is not None
    assert added_pair["document_a_clause"] is None
    assert added_pair["similarity"] == 0.0

    # 4. Verify Removed Warranties Clause
    removed_pair = next((
        p for p in pairs 
        if p["difference_type"] == "REMOVED" and p["document_a_clause"] and "WARRANT" in p["document_a_clause"]["original_text"].upper()
    ), None)
    assert removed_pair is not None
    assert removed_pair["document_b_clause"] is None

def test_neutral_factual_explanations():
    result = ComparisonService.compare_two_documents(DOC_A_SAMPLE, DOC_B_SAMPLE)
    for pair in result["clause_pairs"]:
        explanation = pair.get("explanation", "").lower()
        why_it_matters = pair.get("why_it_matters", "").lower()

        # Enforce no value-judgment or subjective bias
        assert "document a is better" not in explanation
        assert "document b is better" not in explanation
        assert "document a is worse" not in explanation
        assert "document b is worse" not in explanation

def test_api_post_compare_endpoint():
    payload = {
        "document_a": DOC_A_SAMPLE,
        "document_b": DOC_B_SAMPLE,
        "label_a": "Master Agreement v1",
        "label_b": "Master Agreement v2"
    }
    response = client.post("/api/compare", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "clause_pairs" in data
    assert "summary" in data
    assert data["summary"]["matches_count"] >= 1
    assert data["summary"]["modified_count"] >= 2
    assert data["summary"]["added_count"] >= 1
    assert data["summary"]["removed_count"] >= 1
    assert data["label_a"] == "Master Agreement v1"
    assert data["label_b"] == "Master Agreement v2"

def test_api_post_compare_empty_rejection():
    response = client.post("/api/compare", json={"document_a": "", "document_b": ""})
    assert response.status_code == 400
    assert "required" in response.json()["detail"].lower()

def test_reordered_clauses_semantic_alignment():
    doc_1 = """1. GOVERNING LAW
This agreement is governed by the laws of California.

2. CONFIDENTIALITY
Each party shall protect confidential information with reasonable care.
"""
    doc_2 = """1. CONFIDENTIALITY
Each party shall protect confidential information with reasonable care.

2. GOVERNING LAW
This agreement is governed by the laws of New York and subject to NY courts.
"""
    result = ComparisonService.compare_two_documents(doc_1, doc_2)
    pairs = result["clause_pairs"]

    conf_pair = next((p for p in pairs if p["document_a_clause"] and "CONFIDENTIALITY" in p["document_a_clause"]["title"].upper()), None)
    assert conf_pair is not None
    assert conf_pair["difference_type"] == "MATCH"
    assert conf_pair["document_b_clause"] is not None
    assert "CONFIDENTIALITY" in conf_pair["document_b_clause"]["title"].upper()

    gov_pair = next((p for p in pairs if p["document_a_clause"] and "GOVERNING" in p["document_a_clause"]["title"].upper()), None)
    assert gov_pair is not None
    assert gov_pair["difference_type"] == "MODIFIED"
    assert "California" in gov_pair["document_a_clause"]["original_text"]
    assert "New York" in gov_pair["document_b_clause"]["original_text"]
