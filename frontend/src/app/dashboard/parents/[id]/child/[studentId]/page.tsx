"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, GraduationCap, TrendingUp, Award, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { ErrorState } from "@/components/data-display/ErrorState";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import api from "@/lib/api";
import type { Student } from "@/types/academic";
import type { ApiResponse } from "@/types/common";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubjectResult {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  marks_obtained: number | null;
  max_marks: number;
  pass_marks: number;
  grade: string | null;
  is_absent: boolean;
  remarks: string | null;
  percentage: number | null;
}

interface ExamResult {
  exam_id: string;
  exam_name: string;
  exam_type: string;
  start_date: string;
  end_date: string;
  status: string;
  subjects: SubjectResult[];
  total_obtained: number;
  total_max: number;
  percentage: number;
}

// ── Helper: grade colour ──────────────────────────────────────────────────────

function gradeColor(grade: string | null) {
  if (!grade) return "secondary";
  if (grade.startsWith("A")) return "default";
  if (grade.startsWith("B")) return "secondary";
  if (grade === "F") return "destructive";
  return "outline";
}

function percentColor(pct: number) {
  if (pct >= 75) return "text-green-600";
  if (pct >= 50) return "text-yellow-600";
  return "text-destructive";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChildReportCardPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id: parentId, studentId } = use(params);
  const router = useRouter();

  const { data: student, isLoading: sLoading, isError: sError, refetch: sRefetch } = useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Student>>(`/students/${studentId}`);
      return res.data.data;
    },
  });

  const { data: results, isLoading: rLoading, isError: rError, refetch: rRefetch } = useQuery({
    queryKey: ["student-results", studentId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ExamResult[]>>(`/students/${studentId}/results`);
      return res.data.data;
    },
    enabled: !!studentId,
  });

  if (sLoading || rLoading) return <LoadingSkeleton rows={6} />;
  if (sError) return <ErrorState onRetry={sRefetch} />;
  if (!student) return null;

  const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");

  return (
    <div>
      <PageHeader
        title={`${fullName} — Report Card`}
        description={`Admission: ${student.admission_number}`}
        actions={
          <Button variant="outline" onClick={() => router.push(`/dashboard/parents/${parentId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />Back to Parent
          </Button>
        }
      />

      {/* Student profile strip */}
      <Card className="mb-5">
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback className="text-xl bg-primary/10 text-primary">
              {student.first_name[0]}{student.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Admission No.</p>
              <p className="font-medium">{student.admission_number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="font-medium capitalize">{student.gender ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{student.date_of_birth ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <StatusBadge status={student.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam results */}
      {rError ? (
        <ErrorState onRetry={rRefetch} />
      ) : !results?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No exam results yet</p>
          <p className="text-sm mt-1">Results will appear here once exams are completed and published.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {results.map((exam) => (
            <Card key={exam.exam_id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      {exam.exam_name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {exam.exam_type} · {new Date(exam.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      {exam.end_date !== exam.start_date && ` — ${new Date(exam.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-bold ${percentColor(exam.percentage)}`}>
                      {exam.percentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {exam.total_obtained.toFixed(0)} / {exam.total_max.toFixed(0)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Subject</th>
                        <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Marks</th>
                        <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Max</th>
                        <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">%</th>
                        <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Grade</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.subjects.map((sub) => (
                        <tr key={sub.subject_id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-medium">
                            {sub.subject_name}
                            <span className="text-xs text-muted-foreground ml-1">({sub.subject_code})</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {sub.is_absent ? (
                              <span className="text-xs text-muted-foreground italic">Absent</span>
                            ) : sub.marks_obtained !== null ? (
                              <span className={sub.marks_obtained < sub.pass_marks ? "text-destructive font-semibold" : "font-medium"}>
                                {sub.marks_obtained}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center text-muted-foreground">{sub.max_marks}</td>
                          <td className={`py-2.5 px-3 text-center ${sub.percentage !== null ? percentColor(sub.percentage) : ""}`}>
                            {sub.percentage !== null ? `${sub.percentage}%` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {sub.grade ? (
                              <Badge variant={gradeColor(sub.grade) as "default" | "secondary" | "destructive" | "outline"} className="text-xs">
                                {sub.grade}
                              </Badge>
                            ) : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">{sub.remarks ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/40">
                        <td className="py-2 px-3 font-semibold text-sm">Total</td>
                        <td className="py-2 px-3 text-center font-bold">{exam.total_obtained.toFixed(0)}</td>
                        <td className="py-2 px-3 text-center font-medium text-muted-foreground">{exam.total_max.toFixed(0)}</td>
                        <td className={`py-2 px-3 text-center font-bold ${percentColor(exam.percentage)}`}>
                          {exam.percentage.toFixed(1)}%
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
