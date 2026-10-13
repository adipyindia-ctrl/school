from __future__ import annotations

"""
School-admin services for role management (module-based access control) and
user registration.

A "role" here is a per-school Role whose granted modules are stored in the
`role_modules` table. A user's effective (accessible) modules are the union of
the module keys granted to their assigned roles, intersected with the modules
currently enabled for their school.
"""

from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.subscription import Module as ModuleModel, SchoolModule
from app.models.user import Role, RoleModule, User, UserRole
from app.services.audit_service import log_action

# user_types a school admin is allowed to create
ALLOWED_USER_TYPES = {"student", "parent", "teacher", "staff"}


# ── Modules ───────────────────────────────────────────────────────────────────

def list_enabled_module_options(db: Session, school_id: UUID) -> list[dict]:
    """Modules currently enabled for the school — the pool an admin can assign."""
    rows = (
        db.query(ModuleModel.key, ModuleModel.name)
        .join(SchoolModule, SchoolModule.module_id == ModuleModel.id)
        .filter(SchoolModule.school_id == school_id, SchoolModule.is_enabled == True)  # noqa: E712
        .order_by(ModuleModel.name)
        .all()
    )
    return [{"key": k, "name": n} for k, n in rows]


def _enabled_module_keys(db: Session, school_id: UUID) -> set[str]:
    return {opt["key"] for opt in list_enabled_module_options(db, school_id)}


# ── Role serialization ──────────────────────────────────────────────────────

def _role_to_dict(db: Session, role: Role) -> dict:
    module_keys = [rm.module_key for rm in role.role_modules]
    user_count = db.query(UserRole).filter(UserRole.role_id == role.id).count()
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "is_system": role.is_system,
        "module_keys": sorted(module_keys),
        "user_count": user_count,
    }


def list_roles(db: Session, school_id: UUID) -> list[dict]:
    roles = (
        db.query(Role)
        .filter(Role.school_id == school_id)
        .order_by(Role.name)
        .all()
    )
    return [_role_to_dict(db, r) for r in roles]


def _validate_module_keys(db: Session, school_id: UUID, keys: list[str]) -> list[str]:
    """Keep only distinct keys that are enabled for the school; reject unknown ones."""
    enabled = _enabled_module_keys(db, school_id)
    cleaned = []
    for k in dict.fromkeys(keys):  # de-dupe, preserve order
        if k not in enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Module '{k}' is not enabled for this school",
            )
        cleaned.append(k)
    return cleaned


def create_role(
    db: Session,
    school_id: UUID,
    *,
    name: str,
    description: Optional[str],
    module_keys: list[str],
    actor_email: str,
) -> dict:
    name = name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role name is required")

    exists = (
        db.query(Role)
        .filter(Role.school_id == school_id, Role.name == name)
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A role named '{name}' already exists",
        )

    cleaned = _validate_module_keys(db, school_id, module_keys)

    role = Role(school_id=school_id, name=name, description=description, is_system=False)
    db.add(role)
    db.flush()
    for key in cleaned:
        db.add(RoleModule(role_id=role.id, module_key=key))

    log_action(
        db,
        action="role_created",
        actor_email=actor_email,
        school_id=school_id,
        resource_type="Role",
        resource_id=str(role.id),
        new_values={"name": name, "module_keys": cleaned},
    )
    db.commit()
    db.refresh(role)
    return _role_to_dict(db, role)


def _get_role_or_404(db: Session, school_id: UUID, role_id: UUID) -> Role:
    role = (
        db.query(Role)
        .filter(Role.id == role_id, Role.school_id == school_id)
        .first()
    )
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return role


def update_role(
    db: Session,
    school_id: UUID,
    role_id: UUID,
    *,
    name: Optional[str],
    description: Optional[str],
    module_keys: Optional[list[str]],
    actor_email: str,
) -> dict:
    role = _get_role_or_404(db, school_id, role_id)
    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System roles cannot be modified",
        )

    if name is not None:
        new_name = name.strip()
        if not new_name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role name is required")
        clash = (
            db.query(Role)
            .filter(Role.school_id == school_id, Role.name == new_name, Role.id != role_id)
            .first()
        )
        if clash:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"A role named '{new_name}' already exists")
        role.name = new_name

    if description is not None:
        role.description = description

    if module_keys is not None:
        cleaned = _validate_module_keys(db, school_id, module_keys)
        # Replace the module set
        db.query(RoleModule).filter(RoleModule.role_id == role.id).delete()
        for key in cleaned:
            db.add(RoleModule(role_id=role.id, module_key=key))

    log_action(
        db,
        action="role_updated",
        actor_email=actor_email,
        school_id=school_id,
        resource_type="Role",
        resource_id=str(role.id),
    )
    db.commit()
    db.refresh(role)
    return _role_to_dict(db, role)


def delete_role(db: Session, school_id: UUID, role_id: UUID, *, actor_email: str) -> None:
    role = _get_role_or_404(db, school_id, role_id)
    if role.is_system:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="System roles cannot be deleted")

    in_use = db.query(UserRole).filter(UserRole.role_id == role.id).count()
    if in_use:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete — {in_use} user(s) are assigned this role",
        )

    db.delete(role)  # role_modules cascade-deleted
    log_action(
        db,
        action="role_deleted",
        actor_email=actor_email,
        school_id=school_id,
        resource_type="Role",
        resource_id=str(role_id),
    )
    db.commit()


# ── User registration ─────────────────────────────────────────────────────────

def create_school_user(
    db: Session,
    school_id: UUID,
    *,
    first_name: str,
    last_name: str,
    email: str,
    phone: Optional[str],
    password: str,
    user_type: str,
    role_id: UUID,
    actor_email: str,
    actor_id: UUID,
) -> dict:
    if user_type not in ALLOWED_USER_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"user_type must be one of {sorted(ALLOWED_USER_TYPES)}",
        )
    if len(password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")

    email_norm = email.lower().strip()
    existing = db.query(User).filter(User.email == email_norm).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")

    # Role must belong to this school
    role = _get_role_or_404(db, school_id, role_id)

    user = User(
        school_id=school_id,
        email=email_norm,
        password_hash=hash_password(password),
        first_name=first_name.strip(),
        last_name=last_name.strip(),
        phone=phone,
        user_type=user_type,
        is_active=True,
    )
    db.add(user)
    db.flush()
    db.add(UserRole(user_id=user.id, role_id=role.id, assigned_by=actor_id))

    log_action(
        db,
        action="user_created",
        actor_id=actor_id,
        actor_email=actor_email,
        school_id=school_id,
        resource_type="User",
        resource_id=str(user.id),
        new_values={"email": email_norm, "user_type": user_type, "role_id": str(role_id)},
    )
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "user_type": user.user_type,
        "is_active": user.is_active,
        "role_id": role.id,
        "role_name": role.name,
        "created_at": user.created_at,
    }


def list_school_users(db: Session, school_id: UUID) -> list[dict]:
    users = (
        db.query(User)
        .filter(User.school_id == school_id, User.deleted_at == None)  # noqa: E711
        .order_by(User.created_at.desc())
        .all()
    )
    result = []
    for u in users:
        ur = db.query(UserRole).filter(UserRole.user_id == u.id).first()
        role_name = None
        role_id = None
        if ur:
            role = db.query(Role).filter(Role.id == ur.role_id).first()
            if role:
                role_id = role.id
                role_name = role.name
        result.append({
            "id": u.id,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "phone": u.phone,
            "user_type": u.user_type,
            "is_active": u.is_active,
            "role_id": role_id,
            "role_name": role_name,
            "created_at": u.created_at,
        })
    return result


# ── Effective modules for a user ───────────────────────────────────────────────

def get_effective_module_keys(db: Session, user: User) -> list[str]:
    """
    Modules a user can access = union of module keys granted to their roles,
    intersected with modules currently enabled for their school.

    school_admin/super_admin are unrestricted (return all enabled modules).
    """
    if user.user_type in ("school_admin", "super_admin"):
        if not user.school_id:
            return []
        return sorted(_enabled_module_keys(db, user.school_id))

    if not user.school_id:
        return []

    granted = (
        db.query(RoleModule.module_key)
        .join(UserRole, UserRole.role_id == RoleModule.role_id)
        .filter(UserRole.user_id == user.id)
        .distinct()
        .all()
    )
    granted_keys = {g[0] for g in granted}
    enabled = _enabled_module_keys(db, user.school_id)
    return sorted(granted_keys & enabled)
