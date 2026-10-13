from __future__ import annotations

import secrets
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_token,
    refresh_token_expiry,
    verify_password,
)
from app.models.user import RefreshToken, Role, RolePermission, Permission, User, UserRole
from app.schemas.auth import LoginRequest, TokenResponse, UserSummary
from app.services.audit_service import log_action

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def _get_user_permissions(db: Session, user: User) -> list[str]:
    """Resolve all permissions for a user via their roles."""
    perms = (
        db.query(Permission.key)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(UserRole, UserRole.role_id == RolePermission.role_id)
        .filter(UserRole.user_id == user.id)
        .distinct()
        .all()
    )
    return [p.key for p in perms]


def login(
    db: Session,
    payload: LoginRequest,
    ip_address: Optional[str] = None,
) -> tuple[str, str, UserSummary]:
    """Returns (access_token, raw_refresh_token, user_summary)."""
    user = db.query(User).filter(User.email == payload.email, User.is_active == True).first()

    # Generic error to prevent user enumeration
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
    )

    if not user:
        raise credentials_error

    # Check lock
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Account locked. Try again after {user.locked_until.strftime('%H:%M UTC')}",
        )

    if not verify_password(payload.password, user.password_hash):
        user.failed_attempts += 1
        if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
            from datetime import timedelta
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
            user.failed_attempts = 0
        db.commit()
        raise credentials_error

    # Successful login
    user.failed_attempts = 0
    user.locked_until = None
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    permissions = _get_user_permissions(db, user)

    access_token = create_access_token(
        user_id=str(user.id),
        email=user.email,
        user_type=user.user_type,
        school_id=str(user.school_id) if user.school_id else None,
        permissions=permissions,
    )

    raw_token = generate_refresh_token()
    rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=refresh_token_expiry(),
        ip_address=ip_address,
    )
    db.add(rt)

    log_action(
        db,
        action="login",
        actor_id=user.id,
        actor_email=user.email,
        school_id=user.school_id,
        resource_type="User",
        resource_id=str(user.id),
        ip_address=ip_address,
    )
    db.commit()

    from app.services.role_admin_service import get_effective_module_keys
    modules = get_effective_module_keys(db, user)

    user_summary = UserSummary(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        user_type=user.user_type,
        school_id=user.school_id,
        permissions=permissions,
        modules=modules,
    )
    return access_token, raw_token, user_summary


def refresh_access_token(
    db: Session,
    raw_refresh_token: str,
    ip_address: Optional[str] = None,
) -> tuple[str, str]:
    """Returns (new_access_token, new_raw_refresh_token). Old refresh token is rotated."""
    token_hash = hash_token(raw_refresh_token)
    rt = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash, RefreshToken.revoked_at == None)
        .first()
    )

    if not rt or not rt.is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.id == rt.user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Revoke old token
    rt.revoked_at = datetime.now(timezone.utc)

    permissions = _get_user_permissions(db, user)
    new_access = create_access_token(
        user_id=str(user.id),
        email=user.email,
        user_type=user.user_type,
        school_id=str(user.school_id) if user.school_id else None,
        permissions=permissions,
    )
    new_raw = generate_refresh_token()
    new_rt = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(new_raw),
        expires_at=refresh_token_expiry(),
        ip_address=ip_address,
    )
    db.add(new_rt)
    db.commit()
    return new_access, new_raw


def logout(db: Session, raw_refresh_token: str, actor_email: str) -> None:
    token_hash = hash_token(raw_refresh_token)
    rt = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if rt:
        rt.revoked_at = datetime.now(timezone.utc)
        db.commit()
