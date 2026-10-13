from __future__ import annotations

"""
Runs on app startup (idempotent):
1. Seed all Permission records
2. Seed all Module records
3. Create Super Admin user if not exists
"""

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.permissions import Modules, Permissions
from app.core.security import hash_password
from app.models.subscription import Module
from app.models.user import Permission, User


def run_startup(db: Session) -> None:
    _seed_permissions(db)
    _seed_modules(db)
    _ensure_super_admin(db)


def _seed_permissions(db: Session) -> None:
    existing_keys = {p.key for p in db.query(Permission.key).all()}
    new_perms = []
    for key, name in Permissions.all_permissions():
        if key not in existing_keys:
            module_key = key.split(".")[0]
            new_perms.append(Permission(key=key, name=name, module_key=module_key))
    if new_perms:
        db.bulk_save_objects(new_perms)
        db.commit()


def _seed_modules(db: Session) -> None:
    existing_keys = {m.key for m in db.query(Module.key).all()}
    new_modules = []
    for key, name, is_core in Modules.all_modules():
        if key not in existing_keys:
            new_modules.append(Module(key=key, name=name, is_core=is_core))
    if new_modules:
        db.bulk_save_objects(new_modules)
        db.commit()


def _ensure_super_admin(db: Session) -> None:
    existing = db.query(User).filter(User.email == settings.SUPER_ADMIN_EMAIL).first()
    if not existing:
        admin = User(
            email=settings.SUPER_ADMIN_EMAIL,
            password_hash=hash_password(settings.SUPER_ADMIN_PASSWORD),
            first_name="Super",
            last_name="Admin",
            user_type="super_admin",
            school_id=None,
        )
        db.add(admin)
        db.commit()
