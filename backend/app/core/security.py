from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


# ── Password helpers ──────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    # bcrypt has a 72-byte limit — truncate safely
    plain_bytes = plain.encode("utf-8")[:72]
    plain = plain_bytes.decode("utf-8", errors="ignore")
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    # bcrypt has a 72-byte limit — truncate safely
    plain_bytes = plain.encode("utf-8")[:72]
    plain = plain_bytes.decode("utf-8", errors="ignore")
    return pwd_context.verify(plain, hashed)


# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_access_token(
    *,
    user_id: str,
    email: str,
    user_type: str,
    school_id: Optional[str] = None,
    permissions: list[str],
    expires_delta: Optional[timedelta] = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "user_type": user_type,
        "permissions": permissions,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": secrets.token_hex(16),
    }
    if school_id:
        payload["school_id"] = str(school_id)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Raises JWTError on invalid/expired token."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


# ── Refresh token helpers ─────────────────────────────────────────────────────

def generate_refresh_token() -> str:
    """Returns a cryptographically secure opaque token."""
    return secrets.token_urlsafe(64)


def hash_token(raw: str) -> str:
    """Store only the hash in DB, never the raw token."""
    return hashlib.sha256(raw.encode()).hexdigest()


def refresh_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)


# ── Impersonation token ───────────────────────────────────────────────────────

IMPERSONATION_EXPIRES_MINUTES = 60  # 1 hour — no refresh token issued


def create_impersonation_token(
    *,
    target_user_id: str,
    target_email: str,
    target_user_type: str,
    school_id: str,
    permissions: list[str],
    impersonated_by: str,
) -> str:
    """
    Issues a 1-hour JWT for a Super Admin impersonating a school user.
    No refresh token should be issued alongside this token.

    Extra claims compared to a normal access token:
      - ``is_impersonation: true``  — lets the frontend show the impersonation banner
      - ``impersonated_by``         — UUID of the acting Super Admin, for audit tracing
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=IMPERSONATION_EXPIRES_MINUTES)
    payload: dict[str, Any] = {
        "sub": str(target_user_id),
        "email": target_email,
        "user_type": target_user_type,
        "school_id": str(school_id),
        "permissions": permissions,
        "is_impersonation": True,
        "impersonated_by": str(impersonated_by),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": secrets.token_hex(16),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
