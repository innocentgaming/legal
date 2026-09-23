import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.services.briefing_service import BriefingService, DISCLAIMER_TEXT
from backend.app.services.ingestion_service import ingestion_service

client = TestClient(app)

SAMPLE_BRIEFING_DOC = """MASTER SERVICES AGREEMENT

1. SERVICES AND SCOPE
Provider shall deliver cloud architecture consulting to Customer in accordance with Statement of Work specifications.

2. PAYMENT TERMS
Customer shall pay all undisputed invoices within thirty (30) days of receipt. Late amounts accrue 1.5% monthly interest.

3. INDEMNIFICATION
Customer shall defend, indemnify, and hold harmless Provider from all third-party intellectual property and regulatory claims.

4. LIMITATION OF LIABILITY
Customer agrees that Provider's aggregate liability is capped at $500, and Customer liability under this agreement is unlimited.

5. TERMINATION FOR CONVENIENCE
Either party may terminate this agreement upon thirty (30) days prior written notice. If Customer terminates, Customer must pay all remaining contract fees.
"""

def test_briefing_10_sections_and_citations():
    import asyncio
    from backend.app.services.clause_segmentation_service import ClauseSegmentationService
    clauses = ClauseSegmentationService.segment(SAMPLE_BRIEFING_DOC)

    briefing = asyncio.run(BriefingService.generate_briefing(
        filename="Master_Services_Agreement_v1.docx",
        clauses=clauses,
        raw_text=SAMPLE_BRIEFING_DOC,
        target_role="General Counsel"
    ))

    # 1. Overview
    assert "section_1_overview" in briefing
    assert briefing["section_1_overview"]["total_clauses_analyzed"] >= 4
    assert briefing["section_1_overview"]["contract_type"] != ""

    # 2. Key Clauses
    assert "section_2_key_clauses" in briefing
    assert len(briefing["section_2_key_clauses"]) >= 3
    assert any("• Page" in k["source_citation"] for k in briefing["section_2_key_clauses"])

    # 3. High-Risk / Worth-Noting Clauses
    assert "section_3_risk_clauses" in briefing
    assert len(briefing["section_3_risk_clauses"]) >= 1
    assert any("HIGH_RISK" in r["risk_level"] or "WORTH_NOTING" in r["risk_level"] for r in briefing["section_3_risk_clauses"])

    # 4. Open Questions
    assert "section_4_open_questions" in briefing
    assert len(briefing["section_4_open_questions"]) >= 1

    # 5. Deadlines
    assert "section_5_deadlines" in briefing
    assert len(briefing["section_5_deadlines"]) >= 1
    assert any("30" in d["timeframe"] for d in briefing["section_5_deadlines"])

    # 6. Obligations
    assert "section_6_obligations" in briefing
    assert len(briefing["section_6_obligations"]) >= 1

    # 7. Rights
    assert "section_7_rights" in briefing
    assert len(briefing["section_7_rights"]) >= 1

    # 8. Negotiation Points
    assert "section_8_negotiation_points" in briefing
    assert len(briefing["section_8_negotiation_points"]) >= 1

    # 9. Questions to ask lawyer
    assert "section_9_lawyer_questions" in briefing
    assert len(briefing["section_9_lawyer_questions"]) >= 3

    # 10. Comparison findings
    assert "section_10_comparison_findings" in briefing

    # Disclaimer
    assert briefing["disclaimer"] == DISCLAIMER_TEXT
    assert "not a substitute for professional legal advice" in briefing["disclaimer"].lower()

def test_briefing_guardrails_and_no_prohibited_phrases():
    # Test sanitizer
    forbidden_text = "You should sign this agreement because you will win and the other party will lose. Do not sign if rejected."
    sanitized = BriefingService._sanitize_text(forbidden_text)
    assert "you should sign" not in sanitized.lower()
    assert "do not sign" not in sanitized.lower()
    assert "you will win" not in sanitized.lower()
    assert "you will lose" not in sanitized.lower()

def test_briefing_markdown_export_rendering():
    from backend.app.services.clause_segmentation_service import ClauseSegmentationService
    clauses = ClauseSegmentationService.segment(SAMPLE_BRIEFING_DOC)
    
    import asyncio
    briefing = asyncio.run(BriefingService.generate_briefing(
        filename="Test_Agreement.pdf",
        clauses=clauses,
        raw_text=SAMPLE_BRIEFING_DOC
    ))

    md = briefing["markdown_content"]
    assert "# LAWYER EXECUTIVE BRIEFING" in md
    assert "## 1. DOCUMENT OVERVIEW" in md
    assert "## 2. KEY CLAUSES" in md
    assert "## 3. HIGH-RISK & WORTH-NOTING CLAUSES" in md
    assert "## 4. OPEN QUESTIONS" in md
    assert "## 5. IMPORTANT DEADLINES" in md
    assert "## 6. KEY OBLIGATIONS" in md
    assert "## 7. KEY RIGHTS" in md
    assert "## 8. POTENTIAL NEGOTIATION POINTS" in md
    assert "## 9. QUESTIONS TO ASK YOUR LAWYER" in md
    assert "## 10. DOCUMENT COMPARISON FINDINGS" in md
    assert DISCLAIMER_TEXT in md
    assert "Clause" in md

def test_api_generate_briefing_endpoint():
    # Ingest document first
    ingestion_service.ingest_raw_text("briefing_sample.txt", SAMPLE_BRIEFING_DOC)

    response = client.post("/api/briefing/generate", json={"target_role": "General Counsel"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "briefing" in data
    assert data["disclaimer"] == DISCLAIMER_TEXT
    assert len(data["briefing"]["section_9_lawyer_questions"]) >= 2

def test_api_export_markdown_endpoint():
    response = client.get("/api/briefing/export")
    assert response.status_code == 200
    assert "text/markdown" in response.headers.get("content-type", "")
    assert len(response.text) > 200
