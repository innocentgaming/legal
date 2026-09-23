import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.services.grounded_answer_service import GroundedAnswerService

client = TestClient(app)

SAMPLE_LEASE_CONTRACT = """COMMERCIAL LEASE AGREEMENT

1. PREMISES AND USE
1.1 Leased Property. Landlord leases to Tenant the commercial office suite at 100 Main Street.
1.2 Permitted Use. Tenant shall use the premises exclusively for general office purposes.

2. RENT AND PAYMENT
2.1 Base Rent. Tenant shall pay monthly base rent of $4,500 due on the first day of each calendar month.
2.2 Late Fee. Any rent unpaid after a 5-day grace period incurs a late penalty fee of 5%.

3. SECURITY DEPOSIT AND REFUNDS
3.1 Deposit Amount. Tenant has deposited $9,000 as security for performance.
3.2 Refund Condition. Landlord shall return the security deposit within thirty (30) days following lease expiration.

4. MAINTENANCE AND REPAIRS
4.1 Tenant Obligations. Tenant shall maintain interior fixtures and keep the suite in good repair.
4.2 Landlord Obligations. Landlord shall maintain structural components, roof, and foundation.

5. TERMINATION AND DEFAULT
5.1 Default Notice. If Tenant defaults on rent, Landlord may terminate upon ten (10) days written notice.
5.2 Surrender. Upon termination, Tenant shall surrender the premises in broom-clean condition.
"""

@pytest.fixture(autouse=True)
def setup_active_contract():
    # Ensure active document is loaded before QA tests
    res = client.post(
        "/api/documents/upload",
        files={"file": ("commercial_lease_qa.txt", SAMPLE_LEASE_CONTRACT.encode("utf-8"), "text/plain")}
    )
    assert res.status_code == 200

def test_qa_correct_retrieval_and_citations():
    # 1. Ask question directly answered in the text
    res = client.post("/api/qa", json={
        "question": "What is the monthly rent and when is it due?"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["grounded"] is True
    assert "4,500" in data["answer"] or "first day" in data["answer"] or "Base Rent" in data["answer"]
    assert "Answer based on your uploaded document" in data["label"]

    # Verify citation object structure
    assert len(data["citations"]) >= 1
    cit = data["citations"][0]
    assert "clause_id" in cit
    assert "clause_number" in cit
    assert "page" in cit
    assert "quoted_source" in cit
    assert "relevance" in cit
    assert cit["page"] >= 1
    assert len(cit["quoted_source"]) > 5

    # Verify citation accuracy: quoted_source must appear in sample text
    assert cit["quoted_source"] in SAMPLE_LEASE_CONTRACT

def test_qa_missing_information_anti_hallucination():
    # 2. Ask question about a topic completely unaddressed in the contract
    res = client.post("/api/qa", json={
        "question": "Can the landlord raise the rent mid-lease during the first year?"
    })
    assert res.status_code == 200
    data = res.json()
    # Contract does NOT have mid-lease rent increase clause
    assert "not addressed" in data["answer"].lower() or "does not" in data["answer"].lower() or "not clearly" in data["answer"].lower()

def test_qa_irrelevant_query():
    # 3. Ask completely irrelevant non-contract query
    res = client.post("/api/qa", json={
        "question": "What is the airspeed velocity of an unladen swallow in quantum space?"
    })
    assert res.status_code == 200
    data = res.json()
    assert "not addressed in this document" in data["answer"].lower() or "not addressed" in data["answer"].lower()

def test_qa_guardrail_signing_advice_refusal():
    # 4. Guardrail: "Should I sign this?" must trigger refusal explanation
    res = client.post("/api/qa", json={
        "question": "Should I sign this lease agreement today?"
    })
    assert res.status_code == 200
    data = res.json()
    assert "lawyer" in data["answer"].lower() or "legal advice" in data["answer"].lower()
    assert "does not" in data["answer"].lower() or "signing decision" in data["answer"].lower()
    assert data["grounded"] is False
    assert len(data["citations"]) == 0

def test_qa_empty_question_rejection():
    # 5. Empty question should return 400 Bad Request
    res = client.post("/api/qa", json={"question": "   "})
    assert res.status_code == 400
    assert "empty" in res.json().get("detail", "").lower()

def test_qa_very_long_question_handling():
    # 6. Very long question (> 2000 chars) should be handled safely
    long_q = "Can you check the security deposit return timeline? " + ("Explain all deposit details. " * 80)
    res = client.post("/api/qa", json={"question": long_q})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert len(data["answer"]) > 10

def test_qa_backward_compatible_chat_query_endpoint():
    # 7. Test /api/chat/query endpoint compatibility
    res = client.post("/api/chat/query", json={
        "query": "How many days notice does the landlord need for default termination?"
    })
    assert res.status_code == 200
    data = res.json()
    assert "10" in data["answer"] or "ten" in data["answer"].lower() or "Default" in data["answer"]
    assert len(data["citations"]) >= 1

if __name__ == "__main__":
    pytest.main(["-v", __file__])
