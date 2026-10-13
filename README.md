# SchoolERP — Multi-Tenant School CRM / ERP SaaS

A production-ready, white-label School ERP SaaS platform. One codebase, infinite schools. Each school is an isolated tenant with its own branding, users, data, and configuration.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/UI |
| State | TanStack Query, Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| HTTP | Axios |
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2.x, Alembic |
| Database | PostgreSQL 15+ |
| Auth | JWT (access token in memory + refresh token in HttpOnly cookie) |
| Validation | Pydantic v2 |

---

## Architecture

```
Platform (Super Admin)
  └── Schools (Tenants)
        └── School Admin / Principal
              ├── Teachers
              ├── Staff
              ├── Students
              └── Parents
```

**Multi-tenancy strategy:** Shared database with row-level isolation. Every school-scoped table has a non-nullable `school_id` (UUID). The tenant is resolved from the JWT claim — never from frontend-supplied input.

**Subdomain routing:** `school-a.domain.com` → slug `school-a` → resolves `school_id` via `/api/v1/public/resolve`.

---

## Project Structure

```
SchoolManagementSystem/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Route handlers (thin — delegate to services)
│   │   ├── core/            # Config, database, security, tenant, permissions
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic
│   │   ├── main.py          # FastAPI app factory + startup
│   │   └── startup.py       # Idempotent DB seeding (permissions, modules, super admin)
│   ├── alembic/             # Database migrations
│   ├── seed/seed.py         # Demo school seed script
│   └── requirements.txt
└── frontend/
    └── src/
        ├── app/             # Next.js App Router pages
        │   ├── login/       # Branded login page
        │   ├── super-admin/ # Super Admin portal
        │   └── dashboard/   # School portal
        ├── components/      # Reusable UI components
        ├── features/        # Feature-scoped components
        ├── hooks/           # Custom React hooks
        ├── lib/             # API client, auth, theme
        ├── store/           # Zustand stores
        └── types/           # TypeScript type definitions
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/school_erp
SECRET_KEY=your-long-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ALLOWED_ORIGINS=http://localhost:3000
APP_ENV=development
SUPER_ADMIN_EMAIL=admin@schoolerp.com
SUPER_ADMIN_PASSWORD=SuperAdmin@123
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=SchoolERP
```

---

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+

### 1. Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE school_erp;"
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate          # macOS/Linux
# venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Copy and configure env
cp .env.example .env
# Edit .env with your DATABASE_URL and SECRET_KEY

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

The server starts at `http://localhost:8000`.
- API docs: `http://localhost:8000/api/docs`
- Health check: `http://localhost:8000/api/v1/health`

On first start, the app automatically:
- Seeds all permission constants
- Seeds all module catalog entries
- Creates the Super Admin user (from env vars)

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure env
cp .env.local.example .env.local

# Start development server
npm run dev
```

Frontend runs at `http://localhost:3000`.

### 4. Seed Demo Data

```bash
cd backend
source venv/bin/activate
python -m seed.seed
```

---

## Database Migration Commands

```bash
cd backend

# Generate a new migration after model changes
alembic revision --autogenerate -m "description of change"

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# View migration history
alembic history
```

---

## Demo Credentials

After running the seed script:

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@schoolerp.com | SuperAdmin@123 |
| School Admin | principal@greenvalley.edu | Admin@1234 |
| Teacher | teacher1@greenvalley.edu | Teacher@1234 |
| Student | student1@greenvalley.edu | Student@1234 |

Demo school: **Green Valley Public School** (`/greenvalley`)

---

## API Overview

```
POST   /api/v1/auth/login               Login
POST   /api/v1/auth/refresh             Refresh access token
POST   /api/v1/auth/logout              Logout
GET    /api/v1/auth/me                  Current user

GET    /api/v1/platform/dashboard       Platform stats (Super Admin)
GET    /api/v1/platform/schools         List all schools
POST   /api/v1/platform/schools         Create school (onboarding)
GET    /api/v1/platform/schools/:id     School detail
PATCH  /api/v1/platform/schools/:id     Update school
POST   /api/v1/platform/schools/:id/activate    Activate
POST   /api/v1/platform/schools/:id/suspend     Suspend
GET    /api/v1/platform/plans           List plans
POST   /api/v1/platform/plans           Create plan

GET    /api/v1/settings/branding        Get branding
PATCH  /api/v1/settings/branding        Update branding
GET    /api/v1/settings/general         Get settings
PATCH  /api/v1/settings/general         Update settings

GET    /api/v1/public/resolve?slug=...  Resolve school slug → branding + modules

GET    /api/v1/health                   Health check
```

---

## Completed Modules (Phase 1)

- [x] FastAPI project scaffold with CORS, exception handlers, versioned router
- [x] SQLAlchemy models: School, Branding, Settings, SubscriptionPlan, Module, SchoolModule, SchoolSubscription, User, Role, Permission, RolePermission, UserRole, RefreshToken, AuditLog
- [x] Alembic migration setup
- [x] JWT authentication (login, refresh, logout) with HttpOnly cookie refresh token
- [x] Login attempt protection (5 attempts → 15 min lockout)
- [x] RBAC system — permission constants, role seeding, `require_permission()` dependency
- [x] Tenant isolation middleware — school_id from JWT only
- [x] Module system — enable/disable per school
- [x] Super Admin portal: dashboard stats, school list, school detail, 6-step onboarding wizard, activate/suspend
- [x] Subscription plans CRUD
- [x] School settings & branding API
- [x] Public resolve endpoint (slug → branding + modules)
- [x] Startup seeder — permissions, modules, super admin (idempotent)
- [x] Demo seed script — Green Valley Public School
- [x] Next.js 15 App Router with TypeScript
- [x] Tailwind CSS + Shadcn/UI configuration
- [x] Axios instance with JWT interceptors + auto-refresh on 401
- [x] Zustand stores: authStore, tenantStore
- [x] Dynamic branding via CSS custom properties
- [x] Protected route layouts (Super Admin + School Admin)
- [x] Reusable components: DataTable, EmptyState, LoadingSkeleton, ErrorState, StatusBadge, PageHeader, ConfirmDialog
- [x] Super Admin dashboard with platform stats
- [x] Super Admin school list with search + filter + pagination
- [x] Super Admin school detail page
- [x] 6-step school onboarding wizard (RHF + Zod validated)
- [x] Super Admin plans management
- [x] School Admin dashboard (stat cards + chart placeholders)
- [x] Dynamic permission/module-aware sidebar
- [x] School branding settings page
- [x] School general settings page
- [x] Login page (shared, brandable)

---

## Pending Modules (Phase 2–8)

- [ ] Phase 2: Academic Sessions, Classes, Sections, Subjects, Students, Parents, Teachers
- [ ] Phase 3: Attendance, Timetable, Homework, Notices, Events
- [ ] Phase 4: Fees, Examinations, Marks, Results, Report Cards
- [ ] Phase 5: Admission CRM (Kanban, Follow-ups, Conversion)
- [ ] Phase 6: Transport, Library, Certificates, ID Cards, Reports
- [ ] Phase 7: School Website Builder (5 templates, CMS, Gallery, SEO)
- [ ] Phase 8: Subscription enforcement, Audit Log UI, White Label, Custom Domains
