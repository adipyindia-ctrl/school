from __future__ import annotations

import sys
import os

# Vercel path fix — add backend root so all app.* imports resolve
_backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_root not in sys.path:
    sys.path.insert(0, _backend_root)

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import v1_router
from app.core.config import settings


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed permissions, modules, super admin
    from app.core.database import SessionLocal
    from app.startup import run_startup
    db = SessionLocal()
    try:
        run_startup(db)
    finally:
        db.close()
    yield
    # Shutdown: nothing needed for now


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-Tenant School ERP SaaS API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Exception handlers ────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    import traceback
    import logging
    logging.error("Unhandled exception: %s\n%s", exc, traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected error occurred",
            "errors": [{"message": str(exc)}],
        },
    )

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(v1_router)


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/api/v1/health", tags=["Health"])
def health_check():
    from sqlalchemy import text
    from app.core.database import SessionLocal
    db_status = "ok"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = f"error: {e}"
    return {
        "success": True,
        "data": {
            "status": "ok",
            "version": settings.APP_VERSION,
            "environment": settings.APP_ENV,
            "database": db_status,
        },
    }
