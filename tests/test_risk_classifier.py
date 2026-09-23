import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.services.risk_classifier import RiskClassifierService, DeterministicRiskEngine

client = TestClient(app)

KNOWN_PATTERN_TEST_CASES = [
    # 1. Unlimited liability -> HIGH_RISK
    {
        "clause_id": "CLAUSE-001",
        "title": "Liability",
        "clause_number": "1.1",
        "original_text": "Customer's liability under this Agreement shall be unlimited for any operational breaches.",
        "expected_risk": "HIGH_RISK",
        "pattern_name": "Unlimited liability"
    },
    # 2. Liability Cap -> WORTH_NOTING
    {
        "clause_id": "CLAUSE-002",
        "title": "Liability Cap",
        "clause_number": "1.2",
        "original_text": "Provider's aggregate liability shall not exceed fees paid in the prior 12 months.",
        "expected_risk": "WORTH_NOTING",
        "pattern_name": "Liability cap"
    },
    # 3. Broad One-Sided Indemnification -> HIGH_RISK
    {
        "clause_id": "CLAUSE-003",
        "title": "Indemnification",
        "clause_number": "2.1",
        "original_text": "Customer shall defend, indemnify and hold harmless Provider from any and all claims, liabilities, and damages.",
        "expected_risk": "HIGH_RISK",
        "pattern_name": "Broad indemnification"
    },
    # 4. Standard Mutual Indemnification -> WORTH_NOTING
    {
        "clause_id": "CLAUSE-004",
        "title": "Defense of Claims",
        "clause_number": "2.2",
        "original_text": "Each party shall defend against third-party claims alleging infringement.",
        "expected_risk": "WORTH_NOTING",
        "pattern_name": "Mutual indemnification"
    },
    # 5. Unilateral / Immediate Termination -> HIGH_RISK
    {
        "clause_id": "CLAUSE-005",
        "title": "Termination",
        "clause_number": "3.1",
        "original_text": "Provider may terminate this agreement immediately without notice at its sole discretion.",
        "expected_risk": "HIGH_RISK",
        "pattern_name": "Unilateral termination"
    },
    # 6. Auto-Renewal -> WORTH_NOTING
    {
        "clause_id": "CLAUSE-006",
        "title": "Term and Renewal",
        "clause_number": "3.2",
        "original_text": "This agreement shall automatically renew for consecutive one-year terms unless written notice is provided at least 60 days prior.",
        "expected_risk": "WORTH_NOTING",
        "pattern_name": "Auto-renewal"
    },
    # 7. Non-Compete -> HIGH_RISK
    {
        "clause_id": "CLAUSE-007",
        "title": "Non-Competition",
        "clause_number": "4.1",
        "original_text": "Recipient shall not engage in any competing business within North America for 2 years following termination.",
        "expected_risk": "HIGH_RISK",
        "pattern_name": "Non-compete"
    },
    # 8. Non-Solicitation -> WORTH_NOTING
    {
        "clause_id": "CLAUSE-008",
        "title": "Non-Solicit",
        "clause_number": "4.2",
        "original_text": "Neither party shall solicit or hire any employees of the other party during the term and for 12 months thereafter.",
        "expected_risk": "WORTH_NOTING",
        "pattern_name": "Non-solicitation"
    },
    # 9. Intellectual Property Assignment -> HIGH_RISK
    {
        "clause_id": "CLAUSE-009",
        "title": "IP Ownership",
        "clause_number": "5.1",
        "original_text": "Contractor irrevocably assigns all right, title, and interest in all work product and inventions created to Company.",
        "expected_risk": "HIGH_RISK",
        "pattern_name": "IP assignment"
    },
    # 10. Late Payment Penalties -> WORTH_NOTING
    {
        "clause_id": "CLAUSE-010",
        "title": "Late Fees",
        "clause_number": "6.1",
        "original_text": "Overdue invoices shall incur a late payment penalty of 1.5% per month.",
        "expected_risk": "WORTH_NOTING",
        "pattern_name": "Late payment penalty"
    },
    # 11. Exclusivity -> HIGH_RISK
    {
        "clause_id": "CLAUSE-011",
        "title": "Exclusivity",
        "clause_number": "7.1",
        "original_text": "Distributor shall be the sole and exclusive distributor and shall not contract with any other competitor.",
        "expected_risk": "HIGH_RISK",
        "pattern_name": "Exclusivity"
    },
    # 12. Arbitration -> WORTH_NOTING
    {
        "clause_id": "CLAUSE-012",
        "title": "Dispute Resolution",
        "clause_number": "8.1",
        "original_text": "Any dispute arising under this contract shall be resolved by binding arbitration under AAA rules and each party waives trial by jury.",
        "expected_risk": "WORTH_NOTING",
        "pattern_name": "Arbitration"
    },
    # 13. Data & Privacy Obligations -> WORTH_NOTING
    {
        "clause_id": "CLAUSE-013",
        "title": "Data Privacy",
        "clause_number": "9.1",
        "original_text": "Vendor shall process personal data in compliance with GDPR and provide prompt security breach notification.",
        "expected_risk": "WORTH_NOTING",
        "pattern_name": "Data privacy"
    },
    # 14. Broad Warranties Disclaimer -> WORTH_NOTING
    {
        "clause_id": "CLAUSE-014",
        "title": "Warranty Disclaimer",
        "clause_number": "10.1",
        "original_text": "Software is provided as is, without warranty of any kind, and Licensor disclaims all warranties of merchantability.",
        "expected_risk": "WORTH_NOTING",
        "pattern_name": "Warranty disclaimer"
    },
    # 15. Governing Law -> STANDARD (Not legally harmful by default)
    {
        "clause_id": "CLAUSE-015",
        "title": "Governing Law",
        "clause_number": "11.1",
        "original_text": "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.",
        "expected_risk": "STANDARD",
        "pattern_name": "Governing law"
    },
    # 16. Standard Confidentiality -> STANDARD (Not legally harmful by default)
    {
        "clause_id": "CLAUSE-016",
        "title": "Confidentiality",
        "clause_number": "12.1",
        "original_text": "Receiving Party agrees to protect confidential information using at least reasonable care.",
        "expected_risk": "STANDARD",
        "pattern_name": "Standard confidentiality"
    },
    # 17. Irrelevant / Standard Recitals -> STANDARD (Ensure no false positive flags)
    {
        "clause_id": "CLAUSE-017",
        "title": "Recitals",
        "clause_number": "0.1",
        "original_text": "The parties desire to enter into this agreement for mutual business cooperation on the terms set forth herein.",
        "expected_risk": "STANDARD",
        "pattern_name": "Standard recitals"
    }
]

def test_deterministic_known_pattern_detection_and_exact_evidence():
    for tc in KNOWN_PATTERN_TEST_CASES:
        result = DeterministicRiskEngine.analyze_clause(tc)
        
        # 1. Verify exact required schema fields
        assert "clause_id" in result
        assert "risk_level" in result
        assert "reason" in result
        assert "evidence" in result
        assert "source_clause" in result
        
        # 2. Verify expected risk level
        assert result["risk_level"] == tc["expected_risk"], (
            f"Pattern '{tc['pattern_name']}' expected {tc['expected_risk']}, got {result['risk_level']}. "
            f"Reason: {result['reason']}"
        )
        
        # 3. Anti-Hallucination: Verify evidence strictly appears in original clause text
        if result["evidence"]:
            assert result["evidence"] in tc["original_text"], (
                f"Evidence '{result['evidence']}' not found in original text: '{tc['original_text']}'"
            )
        
        # 4. Verify reason is non-empty
        assert len(result["reason"]) > 10

def test_hybrid_risk_classifier_document_audit():
    # Construct a realistic benchmark multi-clause contract
    clauses = [
        {
            "clause_id": tc["clause_id"],
            "clause_number": tc["clause_number"],
            "title": tc["title"],
            "original_text": tc["original_text"],
            "text": tc["original_text"],
            "category": "Legal"
        }
        for tc in KNOWN_PATTERN_TEST_CASES
    ]
    
    # Ingest document into session
    sample_text = "\n\n".join([f"SECTION {tc['clause_number']} {tc['title']}\n{tc['original_text']}" for tc in KNOWN_PATTERN_TEST_CASES])
    res_upload = client.post(
        "/api/documents/upload",
        files={"file": ("risk_benchmark_contract.txt", sample_text.encode("utf-8"), "text/plain")}
    )
    assert res_upload.status_code == 200

    # Run Risk Audit endpoint
    res_audit = client.post("/api/analysis/audit")
    assert res_audit.status_code == 200
    data = res_audit.json()
    assert data["status"] == "success"
    
    analysis = data["analysis"]
    assert "overall_risk_score" in analysis
    assert "risk_level" in analysis
    assert "clause_risks" in analysis
    assert "key_findings" in analysis
    assert len(analysis["clause_risks"]) >= 15

    # Check that high risk, worth noting, and standard counts are accurate
    assert analysis["high_risk_count"] >= 4
    assert analysis["worth_noting_count"] >= 6
    assert analysis["standard_count"] >= 3

    # Check evidence for all clause risks
    for cr in analysis["clause_risks"]:
        assert cr["risk_level"] in ["STANDARD", "WORTH_NOTING", "HIGH_RISK"]
        assert len(cr["reason"]) > 5
        assert cr["source_clause"] is not None

def test_single_clause_risk_classification_endpoint():
    # 1. High risk test
    res_high = client.post("/api/analysis/clause-risk", json={
        "clause_text": "Customer shall not engage in any competing business for 3 years following termination.",
        "title": "Non-Compete",
        "clause_id": "CLAUSE-TEST-1"
    })
    assert res_high.status_code == 200
    data_high = res_high.json()
    assert data_high["risk_level"] == "HIGH_RISK"
    assert "competing business" in data_high["evidence"] or "shall not engage" in data_high["evidence"]

    # 2. Standard clause test (must not be flagged as high risk)
    res_std = client.post("/api/analysis/clause-risk", json={
        "clause_text": "This agreement shall be governed by the laws of New York.",
        "title": "Governing Law",
        "clause_id": "CLAUSE-TEST-2"
    })
    assert res_std.status_code == 200
    data_std = res_std.json()
    assert data_std["risk_level"] == "STANDARD"

if __name__ == "__main__":
    pytest.main(["-v", __file__])
