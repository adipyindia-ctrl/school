# Comprehensive Test Plan — School ERP SaaS

**Project**: Multi-Tenant School CRM + School ERP  
**Test Scope**: Full-stack CRUD operations, API endpoints, UI flows, permissions  
**Test Environment**: Local (localhost:3000 frontend, localhost:8000 backend)

---

## Test Users

| Role | Email | Password | School | Purpose |
|------|-------|----------|--------|---------|
| Super Admin | admin@schoolerp.com | Admin@1234 | (none) | Platform management, all schools |
| Principal | principal@greenvalley.edu | Admin@1234 | Green Valley | School administration |
| Teacher | teacher1@greenvalley.edu | Teacher@123 | Green Valley | Teaching operations |
| Parent | parent@greenvalley.edu | Parent@123 | Green Valley | Student monitoring |

---

## Test Suite 1: Authentication & Authorization

### TC-AUTH-001: Super Admin Login
**Objective**: Verify super admin can log in and access platform dashboard  
**Steps**:
1. Navigate to `http://localhost:3000/login`
2. Enter `admin@schoolerp.com` / `Admin@1234`
3. Click "Sign in"

**Expected**:
- Redirected to `/super-admin/dashboard`
- Dashboard shows platform-wide stats (total schools, students, revenue)
- Sidebar shows: Dashboard, Schools, Plans, Audit Logs

**API**: `POST /api/v1/auth/login`

---

### TC-AUTH-002: Principal Login
**Objective**: Verify school admin can log in and access school dashboard  
**Steps**:
1. Navigate to `http://localhost:3000/login`
2. Enter `principal@greenvalley.edu` / `Admin@1234`
3. Click "Sign in"

**Expected**:
- Redirected to `/dashboard`
- Dashboard shows school-specific stats (students, teachers, attendance, fees)
- Sidebar shows all enabled modules for Green Valley school
- Branding (colors, logo) from Green Valley is applied

**API**: `POST /api/v1/auth/login`

---

### TC-AUTH-003: Session Refresh on Page Reload
**Objective**: Verify session persists after page refresh  
**Steps**:
1. Log in as principal
2. Navigate to `/dashboard/students`
3. Press F5 (page refresh)

**Expected**:
- Session is restored via refresh token cookie
- User stays on `/dashboard/students` without being redirected to login
- Sidebar modules are still visible (tenant store populated)

**API**: `POST /api/v1/auth/refresh`

---

### TC-AUTH-004: Logout
**Objective**: Verify logout clears session  
**Steps**:
1. Log in as principal
2. Click profile menu → Logout
3. Try to visit `/dashboard` directly

**Expected**:
- After logout, user is redirected to `/login`
- Attempting to visit `/dashboard` redirects to `/login`
- Refresh token is revoked server-side

**API**: `POST /api/v1/auth/logout`

---

## Test Suite 2: Super Admin — School Management

### TC-SA-001: View Schools List
**Objective**: Verify super admin can see all schools  
**Steps**:
1. Log in as super admin
2. Navigate to `/super-admin/schools`

**Expected**:
- Table shows all schools with: name, code, city/state, board, status
- Search and status filter (All/Active/Trial/Suspended/Expired) work
- Pagination works (25 per page)

**API**: `GET /api/v1/platform/schools?page=1&page_size=25`

---

### TC-SA-002: Create New School (Onboarding Wizard)
**Objective**: Verify 6-step school onboarding flow  
**Steps**:
1. Navigate to `/super-admin/schools`
2. Click "Add School"
3. Fill Step 1 (Basic Info): name, code, slug, school_type, contact details
4. Fill Step 2 (Branding): colors, logo URL, welcome message
5. Fill Step 3 (Academic Setup): create first session (2025-26), first class (Class 1)
6. Fill Step 4 (Admin Account): principal email, name, password
7. Select Step 5 (Modules): check all desired modules
8. Select Step 6 (Subscription): choose "Standard" plan
9. Click "Create School"

**Expected**:
- School is created with status "trial"
- Principal user is created with school_admin role
- Academic session, class, and branding are saved
- Modules are enabled per selection
- Success message: "School created successfully"
- Redirected to school detail page

**API**: `POST /api/v1/platform/schools`

---

### TC-SA-003: Suspend School
**Objective**: Verify super admin can suspend a school  
**Steps**:
1. Navigate to `/super-admin/schools`
2. Find "ABC School" row
3. Click suspend icon (pause button)
4. Confirm suspension

**Expected**:
- School status changes to "suspended"
- Users from that school cannot log in (401 on login attempt)
- Super admin can see status badge shows "Suspended"

**API**: `POST /api/v1/platform/schools/{id}/suspend`

---

### TC-SA-004: Activate Suspended School
**Objective**: Verify suspended school can be reactivated  
**Steps**:
1. From schools list, find suspended "ABC School"
2. Click activate icon (play button)
3. Confirm activation

**Expected**:
- School status changes to "active"
- Users from that school can now log in again

**API**: `POST /api/v1/platform/schools/{id}/activate`

---

### TC-SA-005: Module Toggle
**Objective**: Verify super admin can enable/disable modules for a school  
**Steps**:
1. Navigate to `/super-admin/schools/{green-valley-id}`
2. Go to "Modules" tab
3. Disable "Transport" module
4. Save changes
5. Log in as principal from Green Valley
6. Check sidebar

**Expected**:
- "Transport" is removed from sidebar nav
- Attempting to visit `/dashboard/transport` returns 403 or redirects
- Re-enabling the module makes it visible again

**API**: `PATCH /api/v1/platform/schools/{id}/modules`

---

## Test Suite 3: Student Management (CRUD)

### TC-STU-001: View Students List
**Objective**: Verify students list page loads with filters  
**Steps**:
1. Log in as principal
2. Navigate to `/dashboard/students`

**Expected**:
- Table shows: name, admission number, class, section, gender, status
- Filters: class, section, gender, status, search by name/admission number
- Pagination works
- "Add Student" button visible

**API**: `GET /api/v1/students?page=1&page_size=25`

---

### TC-STU-002: Create New Student
**Objective**: Verify student creation form  
**Steps**:
1. Navigate to `/dashboard/students`
2. Click "Add Student"
3. Fill form:
   - Personal Info: First Name, Last Name, DOB, Gender, Blood Group
   - Academic Info: Admission Number (auto-generated), Class, Section, Roll Number
   - Address: City, State, Pincode
4. Click "Create"

**Expected**:
- Student is created successfully
- Admission number is auto-generated if left blank
- Redirected to student detail page
- Audit log entry is created

**API**: `POST /api/v1/students`

---

### TC-STU-003: View Student Detail
**Objective**: Verify student profile page  
**Steps**:
1. From students list, click on a student row
2. View `/dashboard/students/{id}`

**Expected**:
- Shows: personal info, academic info, address
- Shows assigned parent(s) if linked
- Shows attendance summary, fee status
- "Edit" and "Deactivate" buttons visible

**API**: `GET /api/v1/students/{id}`

---

### TC-STU-004: Update Student
**Objective**: Verify student edit form  
**Steps**:
1. From student detail page, click "Edit"
2. Update class from "Class 1" to "Class 2"
3. Update section from "A" to "B"
4. Click "Save"

**Expected**:
- Student record is updated
- Class and section reflect changes
- Audit log records the change (old value → new value)
- Redirected back to student detail page

**API**: `PATCH /api/v1/students/{id}`

---

### TC-STU-005: Deactivate Student (Soft Delete)
**Objective**: Verify student can be soft-deleted  
**Steps**:
1. From student detail page, click "Deactivate"
2. Confirm deactivation

**Expected**:
- Student status changes to "inactive"
- Student is excluded from active students list (default filter)
- Historical records (attendance, fees) remain intact
- Can be reactivated later

**API**: `DELETE /api/v1/students/{id}` (soft delete — sets `deleted_at` or `status=inactive`)

---

### TC-STU-006: Filter Students by Class
**Objective**: Verify class filter works  
**Steps**:
1. Navigate to `/dashboard/students`
2. Select "Class 1" from class dropdown

**Expected**:
- Table shows only students enrolled in Class 1
- Count matches the filtered result

**API**: `GET /api/v1/students?class_id={id}`

---

### TC-STU-007: Search Students by Name
**Objective**: Verify search functionality  
**Steps**:
1. Navigate to `/dashboard/students`
2. Enter "Rajesh" in search box

**Expected**:
- Table shows only students matching "Rajesh"
- Search is case-insensitive
- Works on first_name, last_name, and admission_number fields

**API**: `GET /api/v1/students?search=Rajesh`

---

## Test Suite 4: Attendance Management

### TC-ATT-001: Mark Attendance
**Objective**: Verify attendance can be marked for a section  
**Steps**:
1. Log in as teacher
2. Navigate to `/dashboard/attendance`
3. Select date (today), class (Class 1), section (A)
4. Mark students: Present (P), Absent (A), Late (L)
5. Click "Save Attendance"

**Expected**:
- Attendance records are created/updated
- If attendance already exists for that date, records are updated (upsert)
- Live count shows P/A/L/Total
- Cannot mark attendance for future dates

**API**: `POST /api/v1/attendance/mark`

---

### TC-ATT-002: View Attendance Summary
**Objective**: Verify attendance summary report  
**Steps**:
1. Navigate to `/dashboard/reports`
2. Select "Attendance Report"
3. Choose class, section, date range (last 30 days)
4. Click "Generate"

**Expected**:
- Table shows: student name, present days, absent days, late days, %
- Students with < 75% are flagged as "low attendance"
- Export to CSV works

**API**: `GET /api/v1/reports/attendance?class_id={id}&from={date}&to={date}`

---

### TC-ATT-003: Edit Attendance (Upsert)
**Objective**: Verify attendance can be edited after submission  
**Steps**:
1. Navigate to `/dashboard/attendance`
2. Select a date where attendance was already marked
3. Change a student from "Present" to "Absent"
4. Click "Save Attendance"

**Expected**:
- Attendance record is updated (not duplicated)
- Audit log records the change

**API**: `POST /api/v1/attendance/mark` (upsert logic)

---

## Test Suite 5: Fees Management

### TC-FEE-001: Create Fee Structure
**Objective**: Verify fee structure creation  
**Steps**:
1. Log in as principal
2. Navigate to `/dashboard/fees/structure`
3. Create fee category: "Tuition Fee"
4. Create fee structure: Class 1, Tuition Fee, ₹5000/month
5. Save

**Expected**:
- Fee category is created
- Fee structure is created and linked to Class 1
- All students in Class 1 now have this fee assigned

**API**:
- `POST /api/v1/fees/categories`
- `POST /api/v1/fees/structures`

---

### TC-FEE-002: Collect Fee Payment
**Objective**: Verify fee payment collection  
**Steps**:
1. Navigate to `/dashboard/fees/collect`
2. Search for student "Rajesh Kumar" by admission number
3. View ledger (shows total due, amount paid, outstanding)
4. Click "Collect Fee"
5. Enter amount: ₹2500 (partial payment)
6. Select payment mode: UPI
7. Click "Submit"

**Expected**:
- Payment is recorded
- Receipt number is auto-generated
- Outstanding balance is updated (₹5000 - ₹2500 = ₹2500)
- Receipt can be printed/downloaded as PDF

**API**: `POST /api/v1/fees/payments`

---

### TC-FEE-003: View Fee Ledger
**Objective**: Verify student fee ledger shows all transactions  
**Steps**:
1. From fee collection page, search for a student
2. View their ledger

**Expected**:
- Shows: total fee due, discount, fine, amount paid, outstanding
- Shows payment history: date, amount, mode, receipt number
- Parent can also view this from parent portal

**API**: `GET /api/v1/students/{id}/fees`

---

### TC-FEE-004: Fee Report Export
**Objective**: Verify fee collection report export  
**Steps**:
1. Navigate to `/dashboard/fees/reports`
2. Select date range, class filter
3. Click "Export CSV"

**Expected**:
- CSV file downloads with columns: student name, admission no, total due, paid, outstanding, status

**API**: `GET /api/v1/reports/fees?format=csv`

---

## Test Suite 6: Examinations & Marks

### TC-EXM-001: Create Exam
**Objective**: Verify exam creation  
**Steps**:
1. Navigate to `/dashboard/exams`
2. Click "Create Exam"
3. Enter: Exam Name "Mid-Term", Exam Type "Mid-Term", Class "Class 1", Session "2025-26"
4. Set start and end dates
5. Click "Create"

**Expected**:
- Exam is created with status "draft"
- Can add subjects to the exam schedule

**API**: `POST /api/v1/exams`

---

### TC-EXM-002: Add Exam Subjects
**Objective**: Verify exam subject schedule  
**Steps**:
1. From exam detail page `/dashboard/exams/{id}`
2. Click "Add Subject"
3. Select subject: "Mathematics"
4. Enter date, start time, max marks (100), pass marks (33)
5. Save

**Expected**:
- Subject is added to exam schedule
- Teachers can now enter marks for this subject

**API**: `POST /api/v1/exams/{id}/subjects`

---

### TC-EXM-003: Publish Exam
**Objective**: Verify exam can be published  
**Steps**:
1. From exam detail page
2. Click "Publish"

**Expected**:
- Exam status changes to "published"
- Notification sent to all students/parents/teachers
- Marks entry is now enabled

**API**: `PATCH /api/v1/exams/{id}/publish`

---

### TC-EXM-004: Enter Marks
**Objective**: Verify marks entry for students  
**Steps**:
1. Navigate to `/dashboard/exams/{id}/marks`
2. Select subject: "Mathematics"
3. Enter marks for each student (0-100)
4. System auto-calculates grade (A+/A/B/C/D/F based on GradeRule)
5. Click "Save Marks"

**Expected**:
- Marks are saved
- Grades are auto-calculated
- Audit log records who entered marks

**API**: `POST /api/v1/exams/{id}/marks`

---

### TC-EXM-005: View Results & Generate Report Card
**Objective**: Verify result summary and report card generation  
**Steps**:
1. Navigate to `/dashboard/exams/{id}/results`
2. View ranked results table
3. Click "Generate Report Cards" for Class 1-A
4. Download PDF

**Expected**:
- Results show: rank, student name, total marks, percentage, grade
- Report card PDF includes school branding, student photo, all subject marks
- Can generate bulk PDFs for entire class

**API**:
- `GET /api/v1/exams/{id}/results`
- `POST /api/v1/exams/{id}/report-cards?class_id={id}&section_id={id}`

---

## Test Suite 7: CRM (Admission Enquiries)

### TC-CRM-001: Create Admission Lead
**Objective**: Verify lead creation in CRM  
**Steps**:
1. Navigate to `/dashboard/admissions`
2. Click "New Enquiry"
3. Fill form: Student Name, Parent Name, Phone, Email, Class Applying For, Source (Walk-in)
4. Set stage: "New Enquiry"
5. Click "Create"

**Expected**:
- Lead is created and appears in Kanban board under "New Enquiry" column
- Funnel stats update (count increases)

**API**: `POST /api/v1/crm/leads`

---

### TC-CRM-002: Move Lead Through Pipeline
**Objective**: Verify lead stage transitions  
**Steps**:
1. From Kanban view, drag a lead from "New Enquiry" to "Contacted"
2. Add follow-up notes
3. Move to "School Visit"
4. Move to "Admission Confirmed"

**Expected**:
- Lead moves across Kanban columns
- Stage is updated in database
- Funnel report reflects changes

**API**: `PATCH /api/v1/crm/leads/{id}` (update stage)

---

### TC-CRM-003: Log Follow-Up Activity
**Objective**: Verify follow-up logging  
**Steps**:
1. Open lead detail sheet
2. Click "Log Follow-Up"
3. Enter: Type (Call), Notes "Discussed fees", Next Follow-Up Date
4. Save

**Expected**:
- Follow-up is logged with timestamp
- Next follow-up date is set
- Notification reminder created

**API**: `POST /api/v1/crm/leads/{id}/follow-ups`

---

### TC-CRM-004: Convert Lead to Student
**Objective**: Verify lead-to-student conversion  
**Steps**:
1. From lead detail, click "Confirm Admission"
2. System pre-fills student form with lead data
3. Assign class, section, generate admission number
4. Click "Convert"

**Expected**:
- Student record is created
- Lead stage changes to "Admitted"
- Lead is archived from active pipeline

**API**: `POST /api/v1/crm/leads/{id}/convert`

---

## Test Suite 8: Website Builder

### TC-WEB-001: Configure Website Layout
**Objective**: Verify school website settings  
**Steps**:
1. Log in as principal
2. Navigate to `/dashboard/website`
3. Select Layout Template: "Modern"
4. Enable/disable sections: Hero, About, Gallery, Contact
5. Reorder sections by drag-drop
6. Click "Publish Website"

**Expected**:
- Settings are saved
- Public website at `/greenvalley` reflects changes
- Selected layout template is applied

**API**:
- `GET /api/v1/website/settings`
- `PATCH /api/v1/website/settings`
- `PATCH /api/v1/website/sections`

---

### TC-WEB-002: Create CMS Page
**Objective**: Verify custom page creation  
**Steps**:
1. Navigate to `/dashboard/website`
2. Go to "Pages" tab
3. Click "New Page"
4. Enter: Title "About Us", Slug "about", Content (rich text)
5. Set status: "Published"
6. Save

**Expected**:
- Page is created
- Public URL: `/greenvalley/about` is accessible
- Page appears in nav menu if linked

**API**: `POST /api/v1/website/pages`

---

### TC-WEB-003: Upload Gallery Images
**Objective**: Verify gallery management  
**Steps**:
1. Navigate to `/dashboard/website/gallery`
2. Click "Add Image"
3. Upload image, enter title, select category
4. Save

**Expected**:
- Image is uploaded (local storage or S3)
- Image appears in gallery grid
- Public website gallery section shows the image

**API**: `POST /api/v1/website/gallery`

---

### TC-WEB-004: View Public Website
**Objective**: Verify public-facing school website  
**Steps**:
1. Open new incognito tab
2. Navigate to `http://localhost:3000/greenvalley`

**Expected**:
- Website loads with school branding (colors, logo)
- Selected layout template is rendered
- Enabled sections appear in correct order
- Nav menu works
- Gallery images are visible
- Custom CMS pages are accessible

**API**: `GET /api/v1/public/school/greenvalley`

---

## Test Suite 9: Audit Logs

### TC-AUD-001: View Audit Logs
**Objective**: Verify audit log UI  
**Steps**:
1. Log in as principal
2. Navigate to `/dashboard/audit-logs`

**Expected**:
- Table shows: timestamp, actor email, action, resource type, resource ID
- Filter by: action, resource type, actor, date range
- Pagination works

**API**: `GET /api/v1/settings/audit-logs?page=1&page_size=50`

---

### TC-AUD-002: Export Audit Logs
**Objective**: Verify audit log CSV export  
**Steps**:
1. From audit logs page, set filters (date range, action type)
2. Click "Export CSV"

**Expected**:
- CSV file downloads (max 5000 rows)
- Contains: timestamp, actor, action, resource type, resource ID, description, IP

**API**: `GET /api/v1/settings/audit-logs/export?date_from={}&date_to={}`

---

## Test Suite 10: Module Gating & Permissions

### TC-PERM-001: Module-Based Sidebar Visibility
**Objective**: Verify sidebar shows only enabled modules  
**Steps**:
1. Super admin disables "Transport" module for Green Valley
2. Log in as principal from Green Valley
3. Check sidebar

**Expected**:
- "Transport" nav item is not visible
- All other enabled modules are visible

**API**: `GET /api/v1/settings/modules`

---

### TC-PERM-002: Permission-Based Access Control
**Objective**: Verify RBAC enforcement  
**Steps**:
1. Log in as teacher (role: teacher)
2. Attempt to visit `/dashboard/settings` (requires `settings.manage` permission)

**Expected**:
- API returns 403 Forbidden
- Frontend shows "Access Denied" or redirects to dashboard

**API**: Backend checks `require_permission(Permissions.SETTINGS_MANAGE)`

---

### TC-PERM-003: Module API Gating
**Objective**: Verify disabled modules block API access  
**Steps**:
1. Super admin disables "Fees" module for Green Valley
2. Log in as principal
3. Attempt to call `GET /api/v1/fees/structure`

**Expected**:
- API returns 403 with message "Module not enabled"

**API**: Backend checks `require_module("fees")`

---

## Test Suite 11: Reports

### TC-REP-001: Attendance Report
- **Endpoint**: `GET /api/v1/reports/attendance`
- **Filters**: class, section, date range
- **Export**: CSV, Excel

### TC-REP-002: Fee Collection Report
- **Endpoint**: `GET /api/v1/reports/fees`
- **Filters**: class, payment status, date range
- **Export**: CSV, Excel, PDF

### TC-REP-003: Exam Results Report
- **Endpoint**: `GET /api/v1/reports/results`
- **Filters**: exam, class, section
- **Export**: PDF (bulk report cards)

### TC-REP-004: Admission Funnel Report
- **Endpoint**: `GET /api/v1/crm/funnel`
- **Shows**: leads per stage, conversion rates

---

## Test Suite 12: Transport, Library, Certificates

### TC-TRA-001: Create Vehicle
- **Endpoint**: `POST /api/v1/transport/vehicles`
- **Fields**: vehicle number, type, driver name, driver phone, capacity

### TC-TRA-002: Create Route with Stops
- **Endpoint**: `POST /api/v1/transport/routes`
- **Fields**: route name, vehicle, ordered stops with timings

### TC-TRA-003: Assign Student to Route
- **Endpoint**: `POST /api/v1/transport/assignments`
- **Validation**: Cannot exceed vehicle capacity

### TC-LIB-001: Add Book to Catalog
- **Endpoint**: `POST /api/v1/library/books`
- **Fields**: title, author, ISBN, category, total copies

### TC-LIB-002: Issue Book
- **Endpoint**: `POST /api/v1/library/issues`
- **Validation**: Cannot issue if available_copies = 0

### TC-LIB-003: Return Book with Fine
- **Endpoint**: `PATCH /api/v1/library/issues/{id}/return`
- **Logic**: Calculate fine if returned after due date

### TC-CERT-001: Generate Bonafide Certificate
- **Endpoint**: `POST /api/v1/certificates/generate`
- **Output**: PDF with school branding, student details, principal signature

---

## Test Suite 13: Edge Cases & Error Handling

### TC-ERR-001: Duplicate Admission Number
- **Action**: Create student with existing admission number
- **Expected**: 400 Bad Request "Admission number already exists"

### TC-ERR-002: Future Date Attendance
- **Action**: Mark attendance for tomorrow
- **Expected**: 400 Bad Request "Cannot mark attendance for future dates"

### TC-ERR-003: Timetable Conflict
- **Action**: Assign same teacher to two overlapping periods
- **Expected**: 400 Bad Request "Teacher conflict detected"

### TC-ERR-004: Subscription Limit Exceeded
- **Action**: School on "Starter" plan (max 100 students) tries to add 101st student
- **Expected**: 403 Forbidden "Student limit exceeded for current plan"

### TC-ERR-005: Expired Subscription
- **Action**: School subscription expires, users try to log in
- **Expected**: 401 Unauthorized "Subscription expired"

---

## Test Suite 14: Performance & Load

### TC-PERF-001: Students List Load Time
- **Setup**: 500 students in database
- **Action**: Load `/dashboard/students`
- **Expected**: Page loads in < 2 seconds

### TC-PERF-002: Bulk Report Card Generation
- **Setup**: Class with 50 students
- **Action**: Generate all report cards as PDF
- **Expected**: Completes in < 30 seconds

---

## Test Execution Checklist

For each test case, record:
- [ ] Test ID
- [ ] Status (Pass/Fail/Blocked)
- [ ] Date Tested
- [ ] Tester Name
- [ ] Notes / Screenshots
- [ ] Bug ID (if failed)

---

## Test Environments

| Environment | Frontend URL | Backend URL | Database | Purpose |
|-------------|--------------|-------------|----------|---------|
| Local Dev | http://localhost:3000 | http://localhost:8000 | PostgreSQL (local) | Development testing |
| Staging | https://staging.schoolerp.com | https://api-staging.schoolerp.com | PostgreSQL (RDS) | Pre-production validation |
| Production | https://schoolerp.com | https://api.schoolerp.com | PostgreSQL (RDS) | Live system |

---

## Automated Testing

Recommended tools:
- **Backend API**: pytest + requests
- **Frontend E2E**: Playwright or Cypress
- **Load Testing**: Locust or k6
- **Security**: OWASP ZAP scan

---

## Bug Reporting Template

```
**Bug ID**: BUG-001
**Test Case**: TC-STU-002
**Severity**: High/Medium/Low
**Summary**: Brief description
**Steps to Reproduce**:
1. Step 1
2. Step 2
**Expected**: What should happen
**Actual**: What actually happened
**Screenshots**: Attach
**Environment**: Local Dev / Staging
**Browser/OS**: Chrome 120 / macOS
```

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Dev Lead | | | |
| Product Owner | | | |
