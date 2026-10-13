import api from "@/lib/api";
import type { ApiResponse } from "@/types/common";

const BASE = "/reports";

export async function getAttendanceReport(params: {
  sessionId: string;
  classId?: string;
  sectionId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const q = new URLSearchParams({ session_id: params.sessionId });
  if (params.classId) q.set("class_id", params.classId);
  if (params.sectionId) q.set("section_id", params.sectionId);
  if (params.fromDate) q.set("from_date", params.fromDate);
  if (params.toDate) q.set("to_date", params.toDate);
  const res = await api.get<ApiResponse<AttendanceReportData>>(`${BASE}/attendance?${q}`);
  const d = res.data.data;
  return { ...d, rows: d.rows.map((r, i) => ({ ...r, id: r.student_id || String(i) })) };
}

export async function getFeesReport(params: {
  sessionId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const q = new URLSearchParams({ page: String(params.page ?? 1), page_size: String(params.pageSize ?? 50) });
  if (params.sessionId) q.set("session_id", params.sessionId);
  if (params.fromDate) q.set("from_date", params.fromDate);
  if (params.toDate) q.set("to_date", params.toDate);
  const res = await api.get<ApiResponse<FeesReportData>>(`${BASE}/fees?${q}`);
  const d = res.data.data;
  return { ...d, rows: d.rows.map((r, i) => ({ ...r, id: r.receipt_number || String(i) })) };
}

export async function getResultsReport(examId: string) {
  const res = await api.get<ApiResponse<ResultsReportData>>(`${BASE}/results?exam_id=${examId}`);
  const d = res.data.data;
  return { ...d, results: d.results.map((r, i) => ({ ...r, id: r.student_id || String(i) })) };
}

export async function getAdmissionsReport() {
  const res = await api.get<ApiResponse<AdmissionsReportData>>(`${BASE}/admissions`);
  const d = res.data.data;
  return { ...d, funnel: d.funnel.map((r) => ({ ...r, id: r.stage })) };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AttendanceRow {
  id: string;
  student_id: string;
  name: string;
  admission_number: string;
  total_days: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  leave: number;
  percentage: number;
  low_attendance: boolean;
}

export interface AttendanceReportData {
  rows: AttendanceRow[];
  total_students: number;
  filters: Record<string, string | null>;
}

export interface FeesRow {
  id: string;
  receipt_number: string;
  payment_date: string;
  amount: number;
  payment_mode: string;
  student_fee_id: string;
}

export interface FeesReportData {
  rows: FeesRow[];
  total_records: number;
  total_pages: number;
  page: number;
  page_size: number;
  summary: { total_collected: number; total_outstanding: number };
}

export interface ResultRow {
  id: string;
  student_id: string;
  student_name: string;
  admission_number?: string;
  total_marks: number;
  max_marks: number;
  percentage: number;
  rank: number;
  [key: string]: unknown;
}

export interface ResultsReportData {
  exam_id: string;
  results: ResultRow[];
  total_students: number;
}

export interface FunnelRow {
  id: string;
  stage: string;
  label: string;
  count: number;
  percentage_of_total: number;
  conversion_from_prev: number | null;
}

export interface AdmissionsReportData {
  funnel: FunnelRow[];
  total_leads: number;
}
