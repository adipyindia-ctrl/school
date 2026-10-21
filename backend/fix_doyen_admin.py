import os
os.environ['DATABASE_URL'] = 'postgresql://neondb_owner:npg_boGq4wLnvQW0@ep-dry-snow-b453j28p-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

from sqlalchemy import create_engine, text
engine = create_engine(os.environ['DATABASE_URL'])

DOYEN_ID = 'cde78082-75dc-4e58-99ae-ce651e746009'

with engine.connect() as conn:
    # Check all school_admin users
    admins = conn.execute(text(
        "SELECT id, email, school_id, user_type, is_active FROM users WHERE user_type='school_admin'"
    )).fetchall()
    print("School admins:")
    for a in admins:
        print(f"  {a[1]} | school_id: {a[2]} | active: {a[3]}")
    
    # Check Doyen school users
    doyen_users = conn.execute(text(
        "SELECT id, email, user_type, is_active FROM users WHERE school_id=:sid"
    ), {'sid': DOYEN_ID}).fetchall()
    print(f"\nDoyen school users ({len(doyen_users)}):")
    for u in doyen_users:
        print(f"  {u[1]} | type: {u[2]} | active: {u[3]}")
    
    # Fix: assign admin@school.com to Doyen school
    result = conn.execute(text(
        "SELECT id FROM users WHERE email='admin@school.com'"
    )).fetchone()
    
    if result:
        conn.execute(text(
            "UPDATE users SET school_id=:sid WHERE email='admin@school.com'"
        ), {'sid': DOYEN_ID})
        conn.commit()
        print("\nFixed: admin@school.com assigned to Doyen school!")
    
    # Also fix principal@greenvalley.edu school_id  
    gv = conn.execute(text("SELECT id FROM schools WHERE slug='greenvalley'")).fetchone()
    if gv:
        conn.execute(text(
            "UPDATE users SET school_id=:sid WHERE email='principal@greenvalley.edu'"
        ), {'sid': gv[0]})
        conn.commit()
        print(f"Fixed: principal@greenvalley.edu assigned to Green Valley (id: {gv[0]})")
    
    print("\nDone!")
