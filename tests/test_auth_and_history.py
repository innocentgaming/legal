import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_user_registration_and_login_flow():
    # 1. Register new user
    register_payload = {
        "name": "Sarah Connor",
        "email": "sarah.connor@example.com",
        "password": "SecurePassword123!"
    }
    resp = client.post("/api/auth/register", json=register_payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "sarah.connor@example.com"
    token = data["access_token"]

    # 2. Duplicate registration should fail
    dup_resp = client.post("/api/auth/register", json=register_payload)
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.text

    # 3. Login with wrong password should fail
    bad_login = client.post("/api/auth/login", json={
        "email": "sarah.connor@example.com",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

    # 4. Login with correct password
    good_login = client.post("/api/auth/login", json={
        "email": "sarah.connor@example.com",
        "password": "SecurePassword123!"
    })
    assert good_login.status_code == 200
    login_token = good_login.json()["access_token"]

    # 5. Access /api/auth/me with Bearer token
    headers = {"Authorization": f"Bearer {login_token}"}
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["name"] == "Sarah Connor"

def test_unauthenticated_access_rejected():
    # Attempting to access saved contracts without token
    resp = client.get("/api/auth/contracts")
    assert resp.status_code == 401

    # Bad token
    bad_token_resp = client.get("/api/auth/contracts", headers={"Authorization": "Bearer invalid.token.value"})
    assert bad_token_resp.status_code == 401

def test_contract_history_save_load_delete():
    # Register test user
    user_email = "lawyer.test@example.com"
    reg = client.post("/api/auth/register", json={
        "name": "Harvey Specter",
        "email": user_email,
        "password": "HarveyPassword2026"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Ingest sample contract into session
    sample_text = """MASTER SERVICES AGREEMENT
1. Services and Scope. Provider agrees to deliver cloud services.
2. Limitation of Liability. IN NO EVENT SHALL PROVIDER BE LIABLE FOR DAMAGES EXCEEDING $100."""
    
    ingest_resp = client.post(
        "/api/documents/upload",
        files={"file": ("MSA_Test.txt", sample_text.encode("utf-8"), "text/plain")}
    )
    assert ingest_resp.status_code == 200

    # 2. Save active contract to user library
    save_resp = client.post("/api/auth/contracts/save", json={"notes": "Q3 Vendor Review"}, headers=headers)
    assert save_resp.status_code == 200
    saved_doc = save_resp.json()["contract"]
    contract_id = saved_doc["id"]
    assert saved_doc["filename"] == "MSA_Test.txt"
    assert saved_doc["clause_count"] >= 2

    # 3. List saved contracts
    list_resp = client.get("/api/auth/contracts", headers=headers)
    assert list_resp.status_code == 200
    contracts_list = list_resp.json()
    assert len(contracts_list) >= 1
    assert contracts_list[0]["id"] == contract_id

    # 4. Clear active session
    client.post("/api/session/clear")
    status_resp = client.get("/api/documents/current")
    assert status_resp.status_code == 404

    # 5. Reload saved contract into active workspace
    load_resp = client.get(f"/api/auth/contracts/{contract_id}", headers=headers)
    assert load_resp.status_code == 200
    assert load_resp.json()["document"]["filename"] == "MSA_Test.txt"
    assert len(load_resp.json()["document"]["clauses"]) >= 2

    # 6. Verify active session is restored
    active_resp = client.get("/api/documents/current")
    assert active_resp.status_code == 200
    assert active_resp.json()["filename"] == "MSA_Test.txt"

    # 7. Delete saved contract
    del_resp = client.delete(f"/api/auth/contracts/{contract_id}", headers=headers)
    assert del_resp.status_code == 200

    # 8. Verify list is now empty
    list_after = client.get("/api/auth/contracts", headers=headers)
    assert len(list_after.json()) == 0
