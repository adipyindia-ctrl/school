"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { EmptyState } from "@/components/data-display/EmptyState";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Exam, ExamSubject, Mark } from "@/types/finance";
import type { Student, Subject } from "@/types/academic";
import type { ApiResponse } from "@/types/common";

export default function MarksEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [marksData, setMarksData] = useState<Record<string, { marks: string; absent: boolean }>>({});
  const [saved, setSaved] = useState(false);

  const { data: exam } = useQuery({
    queryKey: ["exam", examId],
    queryFn: async () => (await api.get<ApiResponse<Exam>>(`/exams/${examId}`)).data.data,
  });
  const { data: examSubjects } = useQuery({
    queryKey: ["exam-subjects", examId],
    queryFn: async () => (await api.get<ApiResponse<ExamSubject[]>>(`/exams/${examId}/subjects`)).data.data,
  });
  const { data: allSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get<ApiResponse<Subject[]>>("/academics/subjects")).data.data,
  });

  // Get students for the exam's class
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["students-for-marks", exam?.class_id, exam?.session_id],
    queryFn: async () => {
      const res = await api.get<{ data: Student[] }>(
        `/students?class_id=${exam!.class_id}&session_id=${exam!.session_id}&page_size=200`
      );
      return res.data.data;
    },
    enabled: !!exam?.class_id,
  });

  const selectedEs = (examSubjects ?? []).find((es) => es.id === selectedSubjectId);
  const subjectMap = Object.fromEntries((allSubjects ?? []).map((s) => [s.id, s.name]));

  // Load existing marks when subject changes
  useQuery({
    queryKey: ["marks-existing", selectedSubjectId],
    queryFn: async () => {
      // Marks are returned in the exam results — load from there
      return [];
    },
    enabled: !!selectedSubjectId,
  });

  const initMarks = () => {
    if (!students) return;
    const init: Record<string, { marks: string; absent: boolean }> = {};
    students.forEach((s) => { init[s.id] = { marks: "", absent: false }; });
    setMarksData(init);
    setSaved(false);
  };

  // Init when subject changes
  useState(() => { if (selectedSubjectId && students) initMarks(); });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubjectId || !students) return;
      const entries = students.map((s) => {
        const d = marksData[s.id] ?? { marks: "", absent: false };
        return {
          student_id: s.id,
          marks_obtained: d.absent ? null : (d.marks ? parseFloat(d.marks) : null),
          is_absent: d.absent,
        };
      });
      await api.post("/exams/marks", { exam_subject_id: selectedSubjectId, entries });
    },
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  const setMark = (studentId: string, marks: string) => {
    setMarksData((p) => ({ ...p, [studentId]: { ...p[studentId], marks } }));
    setSaved(false);
  };
  const toggleAbsent = (studentId: string) => {
    setMarksData((p) => ({ ...p, [studentId]: { marks: "", absent: !p[studentId]?.absent } }));
    setSaved(false);
  };

  return (
    <div>
      <PageHeader
        title="Marks Entry"
        description={exam?.name ?? "Loading…"}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />Back
          </Button>
        }
      />

      {/* Subject selector */}
      <Card className="mb-5">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={selectedSubjectId}
              onChange={(e) => { setSelectedSubjectId(e.target.value); initMarks(); }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select Subject</option>
              {(examSubjects ?? []).map((es) => (
                <option key={es.id} value={es.id}>
                  {subjectMap[es.subject_id] ?? "—"} ({es.exam_date}) · Max: {es.max_marks}
                </option>
              ))}
            </select>
            {selectedEs && (
              <span className="text-sm text-muted-foreground">
                Max: <strong>{selectedEs.max_marks}</strong> · Pass: <strong>{selectedEs.pass_marks}</strong>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedSubjectId && (
        <EmptyState title="Select a subject" description="Choose a subject to enter marks." />
      )}

      {selectedSubjectId && loadingStudents && <LoadingSkeleton rows={5} />}
      {selectedSubjectId && !loadingStudents && (students ?? []).length === 0 && (
        <EmptyState title="No students" description="No active students found in this class." />
      )}

      {selectedSubjectId && students && students.length > 0 && (
        <>
          <div className="space-y-2">
            {students.map((student, idx) => {
              const d = marksData[student.id] ?? { marks: "", absent: false };
              return (
                <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <span className="text-sm text-muted-foreground w-6 text-right shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{student.first_name} {student.last_name}</p>
                    <p className="text-xs text-muted-foreground">{student.admission_number}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={d.absent}
                        onChange={() => toggleAbsent(student.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-muted-foreground">Absent</span>
                    </label>
                    <Input
                      type="number"
                      value={d.marks}
                      onChange={(e) => setMark(student.id, e.target.value)}
                      disabled={d.absent}
                      min={0}
                      max={selectedEs?.max_marks}
                      className="w-24 text-center disabled:opacity-40"
                      placeholder="Marks"
                    />
                    {!d.absent && d.marks && selectedEs && (
                      <span className={`text-xs font-medium w-8 ${parseFloat(d.marks) >= selectedEs.pass_marks ? "text-green-600" : "text-red-600"}`}>
                        {parseFloat(d.marks) >= selectedEs.pass_marks ? "P" : "F"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end items-center gap-3 mt-5">
            {saved && <p className="text-sm text-green-600">✓ Marks saved</p>}
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : <><Save className="mr-2 h-4 w-4" />Save Marks</>}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
