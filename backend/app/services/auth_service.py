import os
import time
import json
import base64
import hmac
import hashlib
import secrets
from typing import Optional, Dict, List, Any
from datetime import datetime, timezone

JWT_SECRET = os.getenv("JWT_SECRET", "clarity-secret-key-legal-copilot-production-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_SECONDS = 7 * 24 * 3600  # 7 days

class AuthService:
    """
    Production-grade Authentication and User Contract History Service.
    Uses PBKDF2-HMAC-SHA256 password hashing with per-user cryptographic salt
    and standard HMAC-SHA256 signed JWT tokens without external binary dependencies.
    """
    _users: Dict[str, Dict[str, Any]] = {}  # email -> user record
    _user_contracts: Dict[str, List[Dict[str, Any]]] = {}  # user_id -> list of saved contracts

    @classmethod
    def _hash_password(cls, password: str, salt: Optional[str] = None) -> tuple[str, str]:
        if not salt:
            salt = secrets.token_hex(16)
        pwd_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100_000
        ).hex()
        return pwd_hash, salt

    @classmethod
    def _verify_password(cls, password: str, salt: str, expected_hash: str) -> bool:
        pwd_hash, _ = cls._hash_password(password, salt)
        return hmac.compare_digest(pwd_hash, expected_hash)

    @classmethod
    def _base64url_encode(cls, data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

    @classmethod
    def _base64url_decode(cls, text: str) -> bytes:
        rem = len(text) % 4
        if rem > 0:
            text += '=' * (4 - rem)
        return base64.urlsafe_b64decode(text.encode('utf-8'))

    @classmethod
    def create_jwt_token(cls, user_id: str, email: str, name: str) -> str:
        header = {"alg": "HS256", "typ": "JWT"}
        payload = {
            "sub": user_id,
            "email": email,
            "name": name,
            "iat": int(time.time()),
            "exp": int(time.time()) + JWT_EXPIRATION_SECONDS
        }
        
        encoded_header = cls._base64url_encode(json.dumps(header).encode('utf-8'))
        encoded_payload = cls._base64url_encode(json.dumps(payload).encode('utf-8'))
        signature_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
        
        signature = hmac.new(
            JWT_SECRET.encode('utf-8'),
            signature_input,
            hashlib.sha256
        ).digest()
        encoded_signature = cls._base64url_encode(signature)
        
        return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

    @classmethod
    def verify_jwt_token(cls, token: str) -> Optional[Dict[str, Any]]:
        try:
            parts = token.split('.')
            if len(parts) != 3:
                return None
            encoded_header, encoded_payload, encoded_signature = parts
            
            signature_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
            expected_sig = hmac.new(
                JWT_SECRET.encode('utf-8'),
                signature_input,
                hashlib.sha256
            ).digest()
            expected_encoded_sig = cls._base64url_encode(expected_sig)
            
            if not hmac.compare_digest(encoded_signature, expected_encoded_sig):
                return None
            
            payload_json = cls._base64url_decode(encoded_payload).decode('utf-8')
            payload = json.loads(payload_json)
            
            if payload.get("exp", 0) < time.time():
                return None  # expired
            
            return payload
        except Exception:
            return None

    @classmethod
    def register_user(cls, name: str, email: str, password: str) -> tuple[Dict[str, Any], str]:
        email_clean = email.strip().lower()
        if email_clean in cls._users:
            raise ValueError("An account with this email already exists.")
        
        user_id = f"usr_{secrets.token_hex(8)}"
        pwd_hash, salt = cls._hash_password(password)
        created_at = datetime.now(timezone.utc).isoformat()
        
        user_record = {
            "id": user_id,
            "name": name.strip(),
            "email": email_clean,
            "password_hash": pwd_hash,
            "salt": salt,
            "created_at": created_at
        }
        cls._users[email_clean] = user_record
        cls._user_contracts[user_id] = []
        
        token = cls.create_jwt_token(user_id, email_clean, user_record["name"])
        return cls._sanitize_user(user_record), token

    @classmethod
    def login_user(cls, email: str, password: str) -> tuple[Dict[str, Any], str]:
        email_clean = email.strip().lower()
        user = cls._users.get(email_clean)
        if not user:
            raise ValueError("Invalid email or password.")
        
        if not cls._verify_password(password, user["salt"], user["password_hash"]):
            raise ValueError("Invalid email or password.")
        
        token = cls.create_jwt_token(user["id"], user["email"], user["name"])
        return cls._sanitize_user(user), token

    @classmethod
    def get_user_by_id(cls, user_id: str) -> Optional[Dict[str, Any]]:
        for user in cls._users.values():
            if user["id"] == user_id:
                return cls._sanitize_user(user)
        return None

    @classmethod
    def _sanitize_user(cls, user_record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": user_record["id"],
            "name": user_record["name"],
            "email": user_record["email"],
            "created_at": user_record["created_at"],
            "is_guest": False
        }

    # -------------------------------------------------------------
    # Saved Contracts Library for Authenticated Users
    # -------------------------------------------------------------

    @classmethod
    def save_contract_for_user(
        cls,
        user_id: str,
        filename: str,
        clauses: List[Dict[str, Any]],
        raw_text: str,
        analysis: Optional[Dict[str, Any]] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        if user_id not in cls._user_contracts:
            cls._user_contracts[user_id] = []
        
        contract_id = f"doc_{secrets.token_hex(6)}"
        now_str = datetime.now(timezone.utc).isoformat()
        
        risk_score = None
        risk_level = None
        if analysis:
            risk_score = analysis.get("overall_risk_score")
            risk_level = analysis.get("risk_level")

        preview = raw_text[:300].strip().replace("\n", " ") + "..." if len(raw_text) > 300 else raw_text

        saved_item = {
            "id": contract_id,
            "filename": filename,
            "uploaded_at": now_str,
            "clause_count": len(clauses),
            "overall_risk_score": risk_score,
            "risk_level": risk_level,
            "preview_snippet": preview,
            "notes": notes,
            "contract_data": {
                "filename": filename,
                "raw_text": raw_text,
                "clauses": clauses,
                "analysis": analysis,
                "saved_at": now_str
            }
        }
        
        cls._user_contracts[user_id].insert(0, saved_item)
        return saved_item

    @classmethod
    def get_user_saved_contracts(cls, user_id: str) -> List[Dict[str, Any]]:
        items = cls._user_contracts.get(user_id, [])
        # Return summary items without full raw text to keep payload light
        return [
            {
                "id": it["id"],
                "filename": it["filename"],
                "uploaded_at": it["uploaded_at"],
                "clause_count": it["clause_count"],
                "overall_risk_score": it["overall_risk_score"],
                "risk_level": it["risk_level"],
                "preview_snippet": it["preview_snippet"],
                "notes": it.get("notes")
            }
            for it in items
        ]

    @classmethod
    def get_user_contract_by_id(cls, user_id: str, contract_id: str) -> Optional[Dict[str, Any]]:
        items = cls._user_contracts.get(user_id, [])
        for it in items:
            if it["id"] == contract_id:
                return it
        return None

    @classmethod
    def delete_user_contract(cls, user_id: str, contract_id: str) -> bool:
        items = cls._user_contracts.get(user_id, [])
        for i, it in enumerate(items):
            if it["id"] == contract_id:
                items.pop(i)
                return True
        return False

auth_service = AuthService()
