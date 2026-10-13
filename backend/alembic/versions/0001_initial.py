"""Initial schema — all core tables

Revision ID: 0001_initial
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS subscription_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
        max_students INTEGER NOT NULL DEFAULT 500,
        max_teachers INTEGER NOT NULL DEFAULT 50,
        storage_mb INTEGER NOT NULL DEFAULT 1024,
        sms_limit INTEGER NOT NULL DEFAULT 0,
        trial_days INTEGER NOT NULL DEFAULT 30,
        is_active BOOLEAN NOT NULL DEFAULT true,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_core BOOLEAN NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS plan_modules (
        plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        PRIMARY KEY (plan_id, module_id)
    );
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS schools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        code VARCHAR(20) UNIQUE,
        slug VARCHAR(50) UNIQUE,
        school_type VARCHAR(20) DEFAULT 'cbse',
        established_year INTEGER,
        phone VARCHAR(20),
        email VARCHAR(200),
        website VARCHAR(300),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100) DEFAULT 'India',
        pincode VARCHAR(10),
        status VARCHAR(20) NOT NULL DEFAULT 'trial',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS school_brandings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
        primary_color VARCHAR(7) DEFAULT '#1a56db',
        secondary_color VARCHAR(7) DEFAULT '#1e429f',
        sidebar_color VARCHAR(7) DEFAULT '#1e429f',
        accent_color VARCHAR(7) DEFAULT '#e74694',
        font_family VARCHAR(100) DEFAULT 'Inter',
        logo_url TEXT,
        favicon_url TEXT,
        login_bg_url TEXT,
        dashboard_logo_url TEXT,
        welcome_message TEXT,
        footer_text TEXT,
        support_phone VARCHAR(20),
        support_email VARCHAR(200),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS school_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
        academic_year_start_month INTEGER DEFAULT 4,
        attendance_threshold NUMERIC(5,2) DEFAULT 75.0,
        fee_due_day INTEGER DEFAULT 10,
        timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
        currency VARCHAR(10) DEFAULT 'INR',
        date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS school_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES subscription_plans(id),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'trial',
        amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS school_modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        is_enabled BOOLEAN NOT NULL DEFAULT true,
        enabled_at TIMESTAMPTZ,
        UNIQUE (school_id, module_id)
    );

    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
        email VARCHAR(200) NOT NULL UNIQUE,
        password_hash VARCHAR(200) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        photo_url TEXT,
        user_type VARCHAR(20) NOT NULL DEFAULT 'staff',
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_login_at TIMESTAMPTZ,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS ix_users_school_id ON users(school_id);
    CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(200) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_system BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (school_id, name)
    );

    CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        module_key VARCHAR(50),
        description TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
    );

    CREATE TABLE IF NOT EXISTS user_roles (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
        PRIMARY KEY (user_id, role_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
        actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        actor_email VARCHAR(200),
        action VARCHAR(100),
        resource_type VARCHAR(100),
        resource_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS ix_audit_logs_school_created ON audit_logs(school_id, created_at DESC);
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS academic_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'inactive',
        is_current BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (school_id, name)
    );

    CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        name VARCHAR(20) NOT NULL,
        capacity INTEGER,
        room_number VARCHAR(20),
        class_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (school_id, class_id, name)
    );

    CREATE TABLE IF NOT EXISTS subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NOT NULL,
        subject_type VARCHAR(20) NOT NULL DEFAULT 'theory',
        max_marks NUMERIC(6,2),
        pass_marks NUMERIC(6,2),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (school_id, code)
    );

    CREATE TABLE IF NOT EXISTS class_subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE (class_id, subject_id, session_id)
    );
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        session_id UUID NOT NULL REFERENCES academic_sessions(id),
        class_id UUID NOT NULL REFERENCES classes(id),
        section_id UUID NOT NULL REFERENCES sections(id),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        admission_number VARCHAR(50) NOT NULL,
        admission_date DATE,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(10),
        blood_group VARCHAR(5),
        category VARCHAR(50),
        religion VARCHAR(50),
        nationality VARCHAR(50),
        roll_number VARCHAR(20),
        previous_school VARCHAR(200),
        transport_required BOOLEAN NOT NULL DEFAULT false,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        photo_url TEXT,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(10),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ,
        UNIQUE (school_id, admission_number)
    );
    CREATE INDEX IF NOT EXISTS ix_students_school_class_section ON students(school_id, class_id, section_id);

    CREATE TABLE IF NOT EXISTS parents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        relationship_type VARCHAR(20) NOT NULL DEFAULT 'father',
        phone VARCHAR(20),
        alternate_phone VARCHAR(20),
        email VARCHAR(200),
        occupation VARCHAR(100),
        photo_url TEXT,
        address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS student_parents (
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
        is_primary BOOLEAN NOT NULL DEFAULT false,
        PRIMARY KEY (student_id, parent_id)
    );
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS teachers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        employee_id VARCHAR(50) NOT NULL,
        designation VARCHAR(100),
        department VARCHAR(100),
        qualification VARCHAR(200),
        experience_years INTEGER,
        joining_date DATE,
        salary NUMERIC(12,2),
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ,
        UNIQUE (school_id, employee_id)
    );

    CREATE TABLE IF NOT EXISTS staff (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        employee_id VARCHAR(50) NOT NULL,
        designation VARCHAR(100),
        department VARCHAR(100),
        joining_date DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ,
        UNIQUE (school_id, employee_id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id),
        section_id UUID NOT NULL REFERENCES sections(id),
        session_id UUID NOT NULL REFERENCES academic_sessions(id),
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'present',
        marked_by UUID REFERENCES users(id),
        remarks TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (school_id, student_id, date)
    );
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS timetable_periods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
        session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL,
        period_number INTEGER NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
        teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
        room VARCHAR(20),
        is_break BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (school_id, section_id, session_id, day_of_week, period_number)
    );

    CREATE TABLE IF NOT EXISTS homework (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id),
        section_id UUID NOT NULL REFERENCES sections(id),
        subject_id UUID NOT NULL REFERENCES subjects(id),
        teacher_id UUID NOT NULL REFERENCES users(id),
        title VARCHAR(300) NOT NULL,
        description TEXT,
        assigned_date DATE NOT NULL,
        due_date DATE NOT NULL,
        attachment_url TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS notices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        title VARCHAR(300) NOT NULL,
        body TEXT NOT NULL,
        attachment_url TEXT,
        target_audience VARCHAR(30) NOT NULL DEFAULT 'all',
        class_id UUID REFERENCES classes(id),
        section_id UUID REFERENCES sections(id),
        publish_date DATE,
        expiry_date DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        title VARCHAR(300) NOT NULL,
        description TEXT,
        event_type VARCHAR(30) NOT NULL DEFAULT 'other',
        start_date DATE NOT NULL,
        end_date DATE,
        start_time TIME,
        target_audience VARCHAR(20) NOT NULL DEFAULT 'all',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS exam_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        exam_type_id UUID NOT NULL REFERENCES exam_types(id),
        session_id UUID NOT NULL REFERENCES academic_sessions(id),
        name VARCHAR(200) NOT NULL,
        class_id UUID NOT NULL REFERENCES classes(id),
        start_date DATE,
        end_date DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS exam_subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        subject_id UUID NOT NULL REFERENCES subjects(id),
        exam_date DATE,
        start_time TIME,
        max_marks NUMERIC(6,2) NOT NULL DEFAULT 100,
        pass_marks NUMERIC(6,2) NOT NULL DEFAULT 35,
        room VARCHAR(20),
        teacher_id UUID REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS grade_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        min_percent NUMERIC(5,2) NOT NULL,
        max_percent NUMERIC(5,2) NOT NULL,
        grade VARCHAR(5) NOT NULL,
        grade_point NUMERIC(4,2),
        is_pass BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS marks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        exam_subject_id UUID NOT NULL REFERENCES exam_subjects(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        marks_obtained NUMERIC(6,2),
        grade VARCHAR(5),
        is_absent BOOLEAN NOT NULL DEFAULT false,
        remarks TEXT,
        entered_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (exam_subject_id, student_id)
    );
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS fee_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS fee_structures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        session_id UUID NOT NULL REFERENCES academic_sessions(id),
        class_id UUID REFERENCES classes(id),
        category_id UUID NOT NULL REFERENCES fee_categories(id),
        amount NUMERIC(10,2) NOT NULL,
        frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
        due_day INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS student_fees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        fee_structure_id UUID NOT NULL REFERENCES fee_structures(id),
        amount_due NUMERIC(10,2) NOT NULL,
        discount NUMERIC(10,2) NOT NULL DEFAULT 0,
        fine NUMERIC(10,2) NOT NULL DEFAULT 0,
        amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
        due_date DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS fee_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
        receipt_number VARCHAR(50) NOT NULL UNIQUE,
        amount NUMERIC(10,2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_mode VARCHAR(20) NOT NULL DEFAULT 'cash',
        transaction_ref VARCHAR(200),
        collected_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS ix_fee_payments_school_date ON fee_payments(school_id, payment_date);
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS admission_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_name VARCHAR(200) NOT NULL,
        parent_name VARCHAR(200),
        phone VARCHAR(20),
        email VARCHAR(200),
        interested_class VARCHAR(100),
        source VARCHAR(30) NOT NULL DEFAULT 'walk_in',
        stage VARCHAR(30) NOT NULL DEFAULT 'new_enquiry',
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        follow_up_date DATE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL REFERENCES admission_leads(id) ON DELETE CASCADE,
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        follow_up_type VARCHAR(20) NOT NULL DEFAULT 'call',
        notes TEXT,
        follow_up_date DATE,
        next_follow_up DATE,
        done_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS books (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        title VARCHAR(300) NOT NULL,
        author VARCHAR(200),
        isbn VARCHAR(20),
        publisher VARCHAR(200),
        category VARCHAR(100),
        total_copies INTEGER NOT NULL DEFAULT 1,
        available_copies INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS book_issues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        return_date DATE,
        fine_amount NUMERIC(8,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'issued',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS website_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
        layout_template INTEGER NOT NULL DEFAULT 1,
        is_published BOOLEAN NOT NULL DEFAULT false,
        seo_title VARCHAR(300),
        seo_description TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS website_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        section_key VARCHAR(50) NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT true,
        heading VARCHAR(300),
        description TEXT,
        content JSONB,
        display_order INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (school_id, section_key)
    );
    """)


def downgrade() -> None:
    pass
