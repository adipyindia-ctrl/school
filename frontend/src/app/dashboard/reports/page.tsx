"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Download, TrendingUp, Users, DollarSign, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { FieldWrapper } from "@/components/forms/FormSection";
import {
  getAttendanceReport,
  getFeesReport,
  getResultsReport,
  getAdmissionsReport,
  type AttendanceRow,
  type FeesRow,
  type ResultRow,
  type FunnelRow,
} from "@/lib/api/reports";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/common";
import type { AcademicSession, Class, Section } from "@/types/academic";

// ── CSV Export helper ─────────────────────────────────────────────────────────

function exportCSV(filename: string, headers: string[], rows: (string | number | boolean)[]) {
  const lines = [headers.join(","), ...rows as string[]].join("\n");
  const blob = new Blob([lines], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Attendance Report Tab ─────────────────────────────────────────────────────

function AttendanceTab() {
  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await api.get<ApiResponse<AcademicSession[]>>("/academics/sessions")).data.data,
  });
  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await api.get<ApiResponse<Class[]>>("/academics/classes")).data.data,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["report-attendance", sessionId, classId, fromDate, toDate],
    queryFn: () => getAttendanceReport({ sessionId, classId: classId || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined }),
    enabled: submitted && !!sessionId,
  });

  const columns: Column<AttendanceRow>[] = [
    { key: "name", header: "Student", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "admission_number", header: "Adm No." },
    { key: "total_days", header: "Total", render: (r) => String(r.total_days) },
    { key: "present", header: "Present", render: (r) => <span className="text-green-600 font-medium">{r.present}</span> },
    { key: "absent", header: "Absent", render: (r) => <span className="text-red-500 font-medium">{r.absent}</span> },
    { key: "late", header: "Late", render: (r) => String(r.late) },
    {
      key: "percentage", header: "Attendance %",
      render: (r) => (
        <Badge variant={r.low_attendance ? "destructive" : "default"}>
          {r.percentage}%
        </Badge>
      ),
    },
  ];

  const handleExport = () => {
    if (!data) return;
    const headers = ["Name", "Admission No", "Total Days", "Present", "Absent", "Late", "Half Day", "Leave", "Percentage"];
    const rows = data.rows.map((r) =>
      [r.name, r.admission_number, r.total_days, r.present, r.absent, r.late, r.half_day, r.leave, r.percentage].join(",")
    );
    exportCSV("attendance_report.csv", headers, rows);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FieldWrapper label="Session" required>
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="">Select session</option>
            {(sessions ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FieldWrapper>
        <FieldWrapper label="Class (optional)">
          <select value={classId} onChange={(e) => setClassId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="">All Classes</option>
            {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FieldWrapper>
        <FieldWrapper label="From Date">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </FieldWrapper>
        <FieldWrapper label="To Date">
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </FieldWrapper>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setSubmitted(true)} disabled={!sessionId}>Generate Report</Button>
        {data && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
        )}
      </div>
      {submitted && (
        <DataTable
          columns={columns} data={data?.rows ?? []}
          isLoading={isLoading} isError={isError}
          emptyTitle="No attendance data" emptyDescription="No records found for the selected filters."
        />
      )}
    </div>
  );
}

// ── Fees Report Tab ───────────────────────────────────────────────────────────

function FeesTab() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["report-fees", fromDate, toDate, page],
    queryFn: () => getFeesReport({ fromDate: fromDate || undefined, toDate: toDate || undefined, page, pageSize: 50 }),
    enabled: submitted,
  });

  const columns: Column<FeesRow>[] = [
    { key: "receipt_number", header: "Receipt No.", render: (r) => <span className="font-mono text-xs">{r.receipt_number}</span> },
    { key: "payment_date", header: "Date" },
    { key: "amount", header: "Amount", render: (r) => <span className="font-semibold text-green-700">₹{r.amount.toLocaleString()}</span> },
    { key: "payment_mode", header: "Mode", render: (r) => <span className="capitalize">{r.payment_mode.replace("_", " ")}</span> },
  ];

  const handleExport = () => {
    if (!data) return;
    const headers = ["Receipt No", "Date", "Amount", "Mode"];
    const rows = data.rows.map((r) => [r.receipt_number, r.payment_date, r.amount, r.payment_mode].join(","));
    exportCSV("fees_report.csv", headers, rows);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <FieldWrapper label="From Date">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </FieldWrapper>
        <FieldWrapper label="To Date">
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </FieldWrapper>
        <div className="flex items-end gap-2">
          <Button onClick={() => { setPage(1); setSubmitted(true); }}>Generate Report</Button>
          {data && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />CSV
            </Button>
          )}
        </div>
      </div>

      {submitted && data && (
        <div className="grid grid-cols-2 gap-3 mb-2">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-xl font-bold text-green-700">₹{data.summary.total_collected.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Collected</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="text-xl font-bold text-red-600">₹{data.summary.total_outstanding.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Outstanding Balance</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {submitted && (
        <DataTable
          columns={columns} data={data?.rows ?? []}
          isLoading={isLoading} isError={isError}
          total={data?.total_records} page={page} pageSize={50} onPageChange={setPage}
          emptyTitle="No payments found" emptyDescription="No fee payments match the selected filters."
        />
      )}
    </div>
  );
}

// ── Results Report Tab ────────────────────────────────────────────────────────

function ResultsTab() {
  const [examId, setExamId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["report-results", examId],
    queryFn: () => getResultsReport(examId),
    enabled: submitted && !!examId,
  });

  const columns: Column<ResultRow>[] = [
    { key: "rank", header: "Rank", render: (r) => (
      <span className={`font-bold ${r.rank <= 3 ? "text-amber-600" : ""}`}>#{r.rank}</span>
    )},
    { key: "student_name", header: "Student", render: (r) => <span className="font-medium">{String(r.student_name ?? "—")}</span> },
    { key: "admission_number", header: "Adm No.", render: (r) => String(r.admission_number ?? "—") },
    { key: "total_marks", header: "Marks", render: (r) => `${r.total_marks} / ${r.max_marks}` },
    {
      key: "percentage", header: "Percentage",
      render: (r) => (
        <Badge variant={r.percentage >= 35 ? "default" : "destructive"}>
          {r.percentage}%
        </Badge>
      ),
    },
  ];

  const handleExport = () => {
    if (!data) return;
    const headers = ["Rank", "Name", "Admission No", "Total Marks", "Max Marks", "Percentage"];
    const rows = data.results.map((r) =>
      [r.rank, r.student_name, r.admission_number ?? "", r.total_marks, r.max_marks, r.percentage].join(",")
    );
    exportCSV("results_report.csv", headers, rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-60">
          <FieldWrapper label="Exam ID (UUID)" required>
            <Input
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="font-mono text-xs"
            />
          </FieldWrapper>
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={() => setSubmitted(true)} disabled={!examId}>Generate Report</Button>
          {data && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />CSV
            </Button>
          )}
        </div>
      </div>

      {submitted && data && (
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{data.total_students} students in this exam</span>
        </div>
      )}

      {submitted && (
        <DataTable
          columns={columns} data={data?.results ?? []}
          isLoading={isLoading} isError={isError}
          emptyTitle="No results found" emptyDescription="No marks entered for this exam yet."
        />
      )}
    </div>
  );
}

// ── Admissions Funnel Tab ─────────────────────────────────────────────────────

const FUNNEL_COLORS = ["#6366f1","#8b5cf6","#a78bfa","#3b82f6","#22c55e","#f59e0b","#ef4444"];

function AdmissionsTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["report-admissions"],
    queryFn: getAdmissionsReport,
  });

  const columns: Column<FunnelRow>[] = [
    { key: "label", header: "Stage", render: (r) => <span className="font-medium">{r.label}</span> },
    { key: "count", header: "Leads", render: (r) => <span className="font-bold text-lg">{r.count}</span> },
    {
      key: "percentage_of_total", header: "% of Total",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-full h-2 max-w-24">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${r.percentage_of_total}%` }} />
          </div>
          <span className="text-sm">{r.percentage_of_total}%</span>
        </div>
      ),
    },
    {
      key: "conversion_from_prev", header: "Conversion",
      render: (r) => r.conversion_from_prev != null
        ? <Badge variant="secondary">{r.conversion_from_prev}%</Badge>
        : <span className="text-muted-foreground text-xs">—</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {data && (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Total leads: <span className="font-semibold text-foreground">{data.total_leads}</span>
          </span>
        </div>
      )}

      {data && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Funnel Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.funnel} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, "Leads"]} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(data.funnel).map((_, i) => (
                    <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns} data={data?.funnel ?? []}
        isLoading={isLoading} isError={isError}
        emptyTitle="No admission data" emptyDescription="No leads in the CRM pipeline yet."
      />
    </div>
  );
}

// ── Page Root ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Attendance, fee collection, exam results, and admission funnel reports"
      />

      <Tabs defaultValue="attendance">
        <TabsList className="mb-5">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fees Collection</TabsTrigger>
          <TabsTrigger value="results">Exam Results</TabsTrigger>
          <TabsTrigger value="admissions">Admission Funnel</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance"><AttendanceTab /></TabsContent>
        <TabsContent value="fees"><FeesTab /></TabsContent>
        <TabsContent value="results"><ResultsTab /></TabsContent>
        <TabsContent value="admissions"><AdmissionsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
