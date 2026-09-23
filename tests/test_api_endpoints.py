from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api():
    base_url = "/api"
    # 1. Health
    res = client.get(f"{base_url}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] Health check passed:", res.json())

    # 2. Status
    res = client.get(f"{base_url}/status")
    assert res.status_code == 200
    print("[OK] System status passed:", res.json())

    # 3. Load Sample Contract
    res = client.post(f"{base_url}/contracts/sample/saas-msa")
    assert res.status_code == 200
    data = res.json()
    assert len(data["clauses"]) > 0
    print(f"[OK] Ingestion sample passed: Ingested {len(data['clauses'])} clauses.")

    # 4. Risk Audit
    res = client.post(f"{base_url}/analysis/audit")
    assert res.status_code == 200
    audit_data = res.json()
    print(f"[OK] Risk audit passed: Score = {audit_data['analysis']['overall_risk_score']}/100, Level = {audit_data['analysis']['risk_level']}")

    # 5. Grounded Q&A
    res = client.post(f"{base_url}/chat/query", json={"query": "What is the liability limit?"})
    assert res.status_code == 200
    chat_data = res.json()
    assert len(chat_data["answer"]) > 10
    print(f"[OK] Grounded Q&A passed: Provider = {chat_data['provider']}, Citations = {len(chat_data['citations'])}")

    # 6. Clause Redlining
    clause_sample = data["clauses"][0]["original_text"] if "original_text" in data["clauses"][0] else data["clauses"][0]["text"]
    res = client.post(f"{base_url}/comparison/clause", json={
        "clause_text": clause_sample,
        "category": "Services",
        "instructions": "Make it balanced"
    })
    assert res.status_code == 200
    print("[OK] Clause redlining passed:", res.json()["bargaining_leverage"])

    # 7. Lawyer Briefing
    res = client.post(f"{base_url}/briefing/generate", json={"target_role": "General Counsel"})
    assert res.status_code == 200
    briefing_data = res.json()
    b_obj = briefing_data.get("briefing", briefing_data)
    questions = b_obj.get("section_9_lawyer_questions") or b_obj.get("action_items", [])
    print(f"[OK] Lawyer briefing passed: {len(questions)} lawyer questions / action items generated.")

    print("\nALL PHASE 1 & PHASE 2 REST API ENDPOINTS VERIFIED AND OPERATIONAL!")

if __name__ == "__main__":
    test_api()
