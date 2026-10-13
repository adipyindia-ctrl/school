export interface AuditLog {
  id: string;
  school_id: string | null;
  actor_id: string | null;
  actor_email: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  description: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  search: string;
  actor_email: string;
  action: string;
  resource_type: string;
  date_from: string;
  date_to: string;
}

export const EMPTY_AUDIT_FILTERS: AuditLogFilters = {
  search: "",
  actor_email: "",
  action: "",
  resource_type: "",
  date_from: "",
  date_to: "",
};

export const AUDIT_ACTIONS = [
  { value: "", label: "All Actions" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
] as const;

export const AUDIT_RESOURCE_TYPES = [
  { value: "", label: "All Resources" },
  { value: "Student", label: "Student" },
  { value: "Teacher", label: "Teacher" },
  { value: "Staff", label: "Staff" },
  { value: "Fee", label: "Fee" },
  { value: "FeePayment", label: "Fee Payment" },
  { value: "Attendance", label: "Attendance" },
  { value: "Exam", label: "Exam" },
  { value: "Lead", label: "Lead" },
  { value: "Notice", label: "Notice" },
  { value: "Event", label: "Event" },
  { value: "School", label: "School" },
  { value: "User", label: "User" },
] as const;
