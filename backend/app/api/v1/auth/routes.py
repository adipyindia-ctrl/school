from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenant import CurrentUser, get_current_user
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    TokenResponse,
    UserSummary,
)
from app.schemas.common import SuccessResponse
from app.schemas.user import UserUpdate, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

REFRESH_COOKIE = "refresh_token"
COOKIE_MAX_AGE = 7 * 24 * 3600  # 7 days


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=raw_token,
        httponly=True,
        secure=False,  # Set True in production (HTTPS only)
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=REFRESH_COOKIE, path="/api/v1/auth")


@router.post("/login", response_model=SuccessResponse[TokenResponse])
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else None
    access_token, raw_refresh, user_summary = auth_service.login(db, payload, ip_address=ip)
    _set_refresh_cookie(response, raw_refresh)
    return SuccessResponse(
        data=TokenResponse(access_token=access_token, user=user_summary),
        message="Login successful",
    )


@router.post("/refresh", response_model=SuccessResponse[TokenResponse])
def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: Optional[str] = Cookie(default=None),
):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")
    ip = request.client.host if request.client else None
    new_access, new_raw = auth_service.refresh_access_token(db, refresh_token, ip_address=ip)
    _set_refresh_cookie(response, new_raw)
    # Fetch the full user from DB so refresh returns accurate names
    from app.core.security import decode_access_token
    from app.models.user import User as UserModel
    from app.services.role_admin_service import get_effective_module_keys
    payload_data = decode_access_token(new_access)
    db_user = db.query(UserModel).filter(UserModel.id == payload_data["sub"]).first()
    modules = get_effective_module_keys(db, db_user) if db_user else []
    user_summary = UserSummary(
        id=payload_data["sub"],
        email=payload_data["email"],
        first_name=db_user.first_name if db_user else "",
        last_name=db_user.last_name if db_user else "",
        user_type=payload_data["user_type"],
        school_id=payload_data.get("school_id"),
        permissions=payload_data.get("permissions", []),
        modules=modules,
    )
    return SuccessResponse(
        data=TokenResponse(access_token=new_access, user=user_summary),
        message="Token refreshed",
    )


@router.post("/logout", response_model=SuccessResponse[dict])
def logout(
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: Optional[str] = Cookie(default=None),
    current_user: CurrentUser = Depends(get_current_user),
):
    if refresh_token:
        auth_service.logout(db, refresh_token, actor_email=current_user.email)
    _clear_refresh_cookie(response)
    return SuccessResponse(data={}, message="Logged out successfully")


@router.get("/me", response_model=SuccessResponse[UserResponse])
def get_me(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    from app.models.user import User as UserModel
    user = db.query(UserModel).filter(UserModel.id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return SuccessResponse(data=UserResponse.model_validate(user))


@router.patch("/me", response_model=SuccessResponse[UserResponse])
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    from app.models.user import User as UserModel
    user = db.query(UserModel).filter(UserModel.id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = payload.model_dump(exclude_unset=True)
    # Prevent privilege escalation — only allow profile fields
    for field in ("first_name", "last_name", "phone", "photo_url"):
        if field in update_data:
            setattr(user, field, update_data[field])

    db.commit()
    db.refresh(user)
    return SuccessResponse(data=UserResponse.model_validate(user), message="Profile updated")


@router.post("/change-password", response_model=SuccessResponse[dict])
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    from app.models.user import User as UserModel
    from app.core.security import verify_password, hash_password
    user = db.query(UserModel).filter(UserModel.id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return SuccessResponse(data={}, message="Password changed successfully")


@router.get("/check-email", response_model=SuccessResponse[dict])
def check_email_availability(
    email: str,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_current_user),
):
    """
    Check whether an email address is already registered in the system.
    Used by the school onboarding wizard before creating a school admin account.
    Returns: { available: bool }
    """
    from app.models.user import User as UserModel
    exists = db.query(UserModel).filter(
        UserModel.email == email.lower().strip(),
        UserModel.deleted_at == None,
    ).first()
    return SuccessResponse(
        data={"available": exists is None},
        message="Email is available" if exists is None else "Email already in use",
    )


@router.post("/impersonation/end", response_model=SuccessResponse[dict])
def end_impersonation(
    request: Request,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Called by the frontend when a Super Admin exits an impersonation session.
    Since impersonation tokens have no server-side refresh token to revoke,
    this endpoint only writes an audit log entry and returns 200.
    The client clears the impersonation token from memory.
    """
    from app.core.security import decode_access_token
    from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
    from fastapi import Header
    from app.services.audit_service import log_action

    ip = request.client.host if request.client else None

    # Determine if this is an impersonation token by checking is_impersonation claim.
    # We read the raw Authorization header to inspect the claim without another decode.
    auth_header = request.headers.get("Authorization", "")
    is_impersonation_token = False
    impersonated_by = None
    if auth_header.startswith("Bearer "):
        raw_token = auth_header[7:]
        try:
            payload = decode_access_token(raw_token)
            is_impersonation_token = bool(payload.get("is_impersonation"))
            impersonated_by = payload.get("impersonated_by")
        except Exception:
            pass

    log_action(
        db,
        action="impersonation_ended",
        actor_id=current_user.user_id if is_impersonation_token else None,
        actor_email=current_user.email,
        school_id=current_user.school_id,
        resource_type="User",
        resource_id=str(current_user.user_id),
        new_values={
            "impersonated_by": impersonated_by,
            "school_id": str(current_user.school_id) if current_user.school_id else None,
        },
        ip_address=ip,
    )
    db.commit()

    return SuccessResponse(data={}, message="Impersonation session ended")
