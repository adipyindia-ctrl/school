export type LeadStage =
  | "new_enquiry"
  | "contacted"
  | "follow_up"
  | "school_visit"
  | "application_submitted"
  | "admission_confirmed"
  | "rejected";

export const STAGES: { value: LeadStage; label: string; color: string }[] = [
  { value: "new_enquiry",           label: "New Enquiry",           color: "bg-slate-100 border-slate-300" },
  { value: "contacted",             label: "Contacted",             color: "bg-blue-50 border-blue-300" },
  { value: "follow_up",             label: "Follow-Up",             color: "bg-yellow-50 border-yellow-300" },
  { value: "school_visit",          label: "School Visit",          color: "bg-orange-50 border-orange-300" },
  { value: "application_submitted", label: "Application Submitted", color: "bg-purple-50 border-purple-300" },
  { value: "admission_confirmed",   label: "Admitted",              color: "bg-green-50 border-green-300" },
  { value: "rejected",              label: "Rejected",              color: "bg-red-50 border-red-300" },
];

export const STAGE_BADGE: Record<LeadStage, string> = {
  new_enquiry:           "bg-slate-100 text-slate-700",
  contacted:             "bg-blue-100 text-blue-700",
  follow_up:             "bg-yellow-100 text-yellow-700",
  school_visit:          "bg-orange-100 text-orange-700",
  application_submitted: "bg-purple-100 text-purple-700",
  admission_confirmed:   "bg-green-100 text-green-700",
  rejected:              "bg-red-100 text-red-700",
};

export interface Lead {
  id: string;
  school_id: string;
  student_name: string;
  parent_name: string | null;
  phone: string | null;
  email: string | null;
  interested_class: string | null;
  source: string;
  stage: LeadStage;
  assigned_to: string | null;
  follow_up_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  school_id: string;
  follow_up_type: string;
  notes: string | null;
  follow_up_date: string;
  next_follow_up: string | null;
  done_by: string | null;
  created_at: string;
}

export interface FunnelStat {
  stage: string;
  count: number;
  label: string;
}
