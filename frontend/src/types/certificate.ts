export type CertificateType = "bonafide" | "transfer" | "character";

export interface CertificateData {
  cert_type: CertificateType;
  issue_date: string;
  reason: string;
  // School
  school_name: string;
  school_address: string;
  school_phone: string;
  school_email: string;
  school_code: string;
  logo_url: string | null;
  primary_color: string;
  // Student
  student_id: string;
  student_name: string;
  admission_number: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  religion: string;
  category: string;
  address: string;
  class_name: string;
  section_name: string;
  session_name: string;
  admission_date: string;
  // Parent
  parent_name: string;
  parent_relation: string;
  parent_phone: string;
}
