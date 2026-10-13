export interface AttendanceRecord {
  id: string;
  school_id: string;
  student_id: string;
  class_id: string;
  section_id: string;
  session_id: string;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  marked_by: string | null;
  created_at: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "leave";

export interface AttendanceSummary {
  student_id: string;
  total_days: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  leave: number;
  percentage: number;
}

export interface TimetablePeriod {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string;
  session_id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  subject_id: string | null;
  teacher_id: string | null;
  room: string | null;
  is_break: boolean;
  created_at: string;
}

export interface Homework {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  assigned_date: string;
  due_date: string;
  attachment_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Notice {
  id: string;
  school_id: string;
  title: string;
  body: string | null;
  target_audience: string;
  publish_date: string;
  expiry_date: string | null;
  status: string;
  created_by: string;
  created_at: string;
}

export interface SchoolEvent {
  id: string;
  school_id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string;
  target_audience: string;
  created_by: string;
  created_at: string;
}
