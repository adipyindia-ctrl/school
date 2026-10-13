from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser:
    def __init__(
        self,
        user_id: UUID,
        email: str,
        user_type: str,
        school_id: Optional[UUID],
        permissions: list[str],
    ) -> None:
        self.user_id = user_id
        self.email = email
        self.user_type = user_type
        self.school_id = school_id
        self.permissions = permissions

    @property
    def is_super_admin(self) -> bool:
        return self.user_type == "super_admin"

    def has_permission(self, perm: str) -> bool:
        if self.is_super_admin:
            return True
        return perm in self.permissions


def _extract_token(
    credentials: Optional[HTTPAuthorizationCredentials],
) -> str:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> CurrentUser:
    token = _extract_token(credentials)
    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    email = payload.get("email", "")
    user_type = payload.get("user_type", "")
    school_id_str = payload.get("school_id")
    permissions: list[str] = payload.get("permissions", [])

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    # Verify user is still active in DB
    from app.models.user import User
    user = db.query(User).filter(User.id == UUID(user_id), User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    # Verify school subscription is active (non-super-admin only)
    school_id: Optional[UUID] = UUID(school_id_str) if school_id_str else None
    if school_id and user_type != "super_admin":
        from app.models.school import School
        school = db.query(School).filter(School.id == school_id).first()
        if not school or school.status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="School account is suspended or not found",
            )

        # Block non-admin users when the school's subscription has expired.
        # school_admin needs access to renew; super_admin is already excluded above.
        if user_type not in ("school_admin", "super_admin"):
            from datetime import date
            from app.models.subscription import SchoolSubscription
            active_sub = (
                db.query(SchoolSubscription)
                .filter(
                    SchoolSubscription.school_id == school_id,
                    SchoolSubscription.status.in_(["active", "trial"]),
                    SchoolSubscription.end_date >= date.today(),
                )
                .first()
            )
            if not active_sub:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="School subscription has expired. Please contact your administrator.",
                )

    return CurrentUser(
        user_id=UUID(user_id),
        email=email,
        user_type=user_type,
        school_id=school_id,
        permissions=permissions,
    )


def get_super_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if not current_user.is_super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super Admin access required")
    return current_user


def get_school_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Allows school_admin (scoped to their own school) or super_admin."""
    if current_user.user_type not in ("school_admin", "super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="School Admin access required",
        )
    if current_user.user_type == "school_admin" and not current_user.school_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No school context")
    return current_user


def require_permission(perm: str):
    """Dependency factory: raises 403 if user lacks the given permission."""
    def _check(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not current_user.has_permission(perm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {perm}",
            )
        return current_user
    return _check


def require_module(module_key: str):
    """Dependency factory: raises 403 if module is not enabled for the school."""
    def _check(
        current_user: CurrentUser = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> CurrentUser:
        if current_user.is_super_admin:
            return current_user
        if not current_user.school_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No school context")
        from app.models.subscription import SchoolModule
        sm = (
            db.query(SchoolModule)
            .join(SchoolModule.module)
            .filter(
                SchoolModule.school_id == current_user.school_id,
                SchoolModule.is_enabled == True,
            )
            .first()
        )
        # Use a more targeted query
        from app.models.subscription import Module as ModuleModel
        enabled = (
            db.query(SchoolModule)
            .join(ModuleModel, SchoolModule.module_id == ModuleModel.id)
            .filter(
                SchoolModule.school_id == current_user.school_id,
                SchoolModule.is_enabled == True,
                ModuleModel.key == module_key,
            )
            .first()
        )
        if not enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Module '{module_key}' is not enabled for this school",
            )
        return current_user
    return _check
