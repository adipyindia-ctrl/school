"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, MinusCircle, AlertCircle, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { EmptyState } from "@/components/data-display/EmptyState";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { AcademicSession, Class, Section } from "@/types/academic";
import type { AttendanceRecord, AttendanceStatus } from "@/types/communication";
import type { ApiResponse } from "@/types/common";

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  color: string;
}[] = [
  { value: "present",  label: "P",  color: "bg-green-500 text-white hover:bg-green-600" },
  { value: "absent",   label: "A",  color: "bg-red-500 text-white hover:bg-red-600" },
  { value: "late",     label: "L",  color: "bg-yellow-500 text-white hover:bg-yellow-600" },
  { value: "half_day", label: "H",  color: "bg-orange-500 text-white hover:bg-orange-600" },
  { value: "leave",    label: "Le", color: "bg-blue-500 text-white hover:bg-blue-600" },
];

interface StudentRow {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  roll_number: string | null;
}

export default function AttendancePage() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [saved, setSaved] = useState(false);

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () =>
      (await api.get<ApiResponse<AcademicSession[]>>("/academics/sessions")).data.data,
  });

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () =>
      (await api.get<ApiResponse<Class[]>>("/academics/classes")).data.data,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections", selectedClass],
    queryFn: async () => {
      const p = selectedClass ? `?class_id=${selectedClass}` : "";
      return (await api.get<ApiResponse<Section[]>>(`/academics/sections${p}`)).data.data;
    },
    enabled: !!selectedClass,
  });

  // Students for the selected section
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["attendance-students", selectedSection],
    queryFn: async () =>
      (
        await api.get<ApiResponse<StudentRow[]>>(
          `/attendance/students?section_id=${selectedSection}`
        )
      ).data.data,
    enabled: !!selectedSection,
  });

  // Existing attendance for date
  const { data: existing } = useQuery({
    queryKey: ["attendance-existing", selectedSection, selectedDate],
    queryFn: async () =>
      (
        await api.get<ApiResponse<AttendanceRecord[]>>(
          `/attendance/section?section_id=${selectedSection}&attendance_date=${selectedDate}`
        )
      ).data.data,
    enabled: !!selectedSection && !!selectedDate,
  });

  // Pre-fill statuses when students load
  useEffect(() => {
    if (!students) return;
    const init: Record<string, AttendanceStatus> = {};
    students.forEach((s) => { init[s.id] = "present"; });
    setStatuses(init);
    setSaved(false);
  }, [students]);

  // Overlay existing records on top
  useEffect(() => {
    if (!existing || existing.length === 0) return;
    setStatuses((prev) => {
      const merged = { ...prev };
      existing.forEach((r) => { merged[r.student_id] = r.status; });
      return merged;
    });
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!students?.length || !selectedClass || !selectedSection || !selectedSession) return;
      await api.post("/attendance", {
        class_id: selectedClass,
        section_id: selectedSection,
        session_id: selectedSession,
        date: selectedDate,
        entries: students.map((s) => ({
          student_id: s.id,
          status: statuses[s.id] ?? "present",
          remarks: null,
        })),
      });
    },
    onSuccess: () => setSaved(true),
  });

  const setStatus = (id: string, status: AttendanceStatus) => {
    setStatuses((p) => ({ ...p, [id]: status }));
    setSaved(false);
  };

  const markAll = (status: AttendanceStatus) => {
    if (!students) return;
    const all: Record<string, AttendanceStatus> = {};
    students.forEach((s) => { all[s.id] = status; });
    setStatuses(all);
    setSaved(false);
  };

  const counts = Object.values(statuses).reduce<Record<string, number>>(
    (acc, s) => { acc[s] = (acc[s] ?? 0) + 1; return acc; },
    {}
  );

  return (
    <div>
      <PageHeader title="Attendance" description="Mark daily student attendance" />

      {/* Selectors */}
      <Card className="mb-5">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select Session</option>
              {(sessions ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select Class</option>
              {(classes ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
            >
              <option value="">Select Section</option>
              {(sections ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status summary + bulk actions */}
      {students && students.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex gap-3">
            {STATUS_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center gap-1.5 text-sm">
                <span className={cn("w-6 h-6 rounded text-xs font-bold flex items-center justify-center", opt.color)}>
                  {opt.label}
                </span>
                <span className="text-muted-foreground">{counts[opt.value] ?? 0}</span>
              </div>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => markAll("present")}>
              All Present
            </Button>
            <Button size="sm" variant="outline" onClick={() => markAll("absent")}>
              All Absent
            </Button>
          </div>
        </div>
      )}

      {/* Empty / loading states */}
      {!selectedSection && (
        <EmptyState
          title="Select a section"
          description="Choose session, class, and section to mark attendance."
        />
      )}
      {selectedSection && loadingStudents && <LoadingSkeleton rows={5} />}
      {selectedSection && !loadingStudents && students?.length === 0 && (
        <EmptyState title="No students" description="No active students in this section." />
      )}

      {/* Attendance rows */}
      {students && students.length > 0 && (
        <>
          <div className="space-y-2">
            {students.map((student, idx) => {
              const current = statuses[student.id] ?? "present";
              return (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <span className="text-sm text-muted-foreground w-6 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {student.admission_number}
                      {student.roll_number ? ` · Roll ${student.roll_number}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setStatus(student.id, opt.value)}
                        className={cn(
                          "w-8 h-8 rounded text-xs font-bold transition-all",
                          current === opt.value
                            ? opt.color + " ring-2 ring-offset-1 ring-current scale-110"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                        title={opt.value}
                        aria-label={`Mark ${student.first_name} ${opt.value}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end items-center gap-3 mt-5">
            {saved && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Attendance saved
              </p>
            )}
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !selectedSession}
            >
              {saveMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Save Attendance</>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
