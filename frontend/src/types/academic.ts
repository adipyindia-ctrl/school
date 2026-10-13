export interface AcademicSession {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "active" | "inactive" | "archived";
  is_current: boolean;
  created_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  session_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface Section {
  id: string;
  school_id: string;
  class_id: string;
  name: string;
  capacity: number | null;
  room_number: string | null;
  class_teacher_id: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code: string;
  subject_type: "theory" | "practical";
  max_marks: number | null;
  pass_marks: number | null;
  created_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  session_id: string;
  class_id: string;
  section_id: string;
  admission_number: string;
  admission_date: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  roll_number: string | null;
  transport_required: boolean;
  status: string;
  photo_url: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  // detail fields
  category?: string | null;
  religion?: string | null;
  nationality?: string | null;
  address?: string | null;
  pincode?: string | null;
  previous_school?: string | null;
  parents?: ParentSummary[];
}

export interface ParentSummary {
  id: string;
  first_name: string;
  last_name: string;
  relationship_type: string;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
}

export interface Parent {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  relationship_type: string;
  phone: string | null;
  alternate_phone?: string | null;
  email: string | null;
  occupation?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  // linked students (from build_parent_response)
  students?: LinkedStudentInfo[];
}

export interface LinkedStudentInfo {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_id: string;
  section_id: string;
  is_primary: boolean;
}

export interface Teacher {
  id: string;
  school_id: string;
  user_id: string;
  employee_id: string;
  designation: string | null;
  department: string | null;
  qualification: string | null;
  experience_years: number | null;
  joining_date: string | null;
  status: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
}

export interface Staff {
  id: string;
  school_id: string;
  user_id: string;
  employee_id: string;
  designation: string | null;
  department: string | null;
  status: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}
