export interface FeeCategory {
  id: string;
  school_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface FeeStructure {
  id: string;
  school_id: string;
  session_id: string;
  class_id: string | null;
  category_id: string;
  amount: number;
  frequency: string;
  due_day: number | null;
  created_at: string;
}

export interface StudentFee {
  id: string;
  school_id: string;
  student_id: string;
  fee_structure_id: string;
  amount_due: number;
  discount: number;
  fine: number;
  amount_paid: number;
  due_date: string | null;
  status: string;
  created_at: string;
}

export interface FeePayment {
  id: string;
  school_id: string;
  student_fee_id: string;
  receipt_number: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  transaction_ref: string | null;
  collected_by: string | null;
  created_at: string;
}

export interface LedgerEntry {
  student_fee_id: string;
  fee_structure_id: string;
  amount_due: number;
  discount: number;
  fine: number;
  amount_paid: number;
  outstanding: number;
  status: string;
  due_date: string | null;
  payments: {
    receipt_number: string;
    amount: number;
    payment_date: string;
    payment_mode: string;
  }[];
}

export interface ExamType {
  id: string;
  school_id: string;
  name: string;
  created_at: string;
}

export interface Exam {
  id: string;
  school_id: string;
  exam_type_id: string;
  session_id: string;
  class_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "draft" | "published" | "completed";
  created_at: string;
}

export interface ExamSubject {
  id: string;
  exam_id: string;
  subject_id: string;
  exam_date: string;
  max_marks: number;
  pass_marks: number;
  room: string | null;
  teacher_id: string | null;
  created_at: string;
}

export interface GradeRule {
  id: string;
  school_id: string;
  min_percent: number;
  max_percent: number;
  grade: string;
  grade_point: number;
  is_pass: boolean;
}

export interface Mark {
  id: string;
  exam_subject_id: string;
  student_id: string;
  marks_obtained: number | null;
  grade: string | null;
  is_absent: boolean;
  remarks: string | null;
}

export interface StudentResult {
  student_id: string;
  student_name: string;
  admission_number: string;
  subjects: {
    subject_id: string;
    exam_date: string;
    marks_obtained: number | null;
    max_marks: number;
    pass_marks: number;
    grade: string;
    is_absent: boolean;
  }[];
  total_marks: number;
  max_marks: number;
  percentage: number;
  grade: string | null;
  is_pass: boolean;
  rank: number | null;
}
