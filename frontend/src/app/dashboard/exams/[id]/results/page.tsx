"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trophy, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { EmptyState } from "@/components/data-display/EmptyState";
import { ErrorState } from "@/components/data-display/ErrorState";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Exam, ExamSubject, StudentResult } from "@/types/finance";
import type { Subject } from "@/types/academic";
import type { ApiResponse } from "@/types/common";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params);
  const router = useRouter();

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

  const { data: results, isLoading, isError, refetch } = useQuery({
    queryKey: ["exam-results", examId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<StudentResult[]>>(`/exams/${examId}/results`);
      return res.data.data;
    },
  });

  const subjectMap = Object.fromEntries((allSubjects ?? []).map((s) => [s.id, s.name]));
  const subjectIds = (examSubjects ?? []).map((es) => es.subject_id);

  // Summary stats
  const passed = (results ?? []).filter((r) => r.is_pass).length;
  const total = (results ?? []).length;
  const avgPct = total
    ? Math.round((results ?? []).reduce((sum, r) => sum + r.percentage, 0) / total)
    : 0;
  const topResult = (results ?? [])[0];

  return (
    <div>
      <PageHeader
        title="Exam Results"
        description={exam?.name ?? "Loading…"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/dashboard/exams/${examId}/marks`)}>
              Edit Marks
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Button>
          </div>
        }
      />

      {isLoading && <LoadingSkeleton rows={6} />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {results && results.length === 0 && (
        <EmptyState
          title="No results yet"
          description="Enter marks to generate results."
          action={{ label: "Enter Marks", onClick: () => router.push(`/dashboard/exams/${examId}/marks`) }}
        />
      )}

      {results && results.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Students</p>
                  <p className="text-2xl font-bold">{total}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pass Rate</p>
                  <p className="text-2xl font-bold">
                    {total ? Math.round((passed / total) * 100) : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Class Average</p>
                  <p className="text-2xl font-bold">{avgPct}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Top Score</p>
                  <p className="text-2xl font-bold">{topResult?.percentage ?? 0}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Table */}
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-3 text-left font-medium w-10">#</th>
                  <th className="p-3 text-left font-medium">Student</th>
                  {subjectIds.map((sid) => (
                    <th key={sid} className="p-3 text-center font-medium min-w-[90px]">
                      {subjectMap[sid] ?? "—"}
                    </th>
                  ))}
                  <th className="p-3 text-center font-medium">Total</th>
                  <th className="p-3 text-center font-medium">%</th>
                  <th className="p-3 text-center font-medium">Grade</th>
                  <th className="p-3 text-center font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((result) => (
                  <tr key={result.student_id} className="hover:bg-muted/20">
                    <td className="p-3 text-muted-foreground text-center">{result.rank}</td>
                    <td className="p-3">
                      <p className="font-medium">{result.student_name}</p>
                      <p className="text-xs text-muted-foreground">{result.admission_number}</p>
                    </td>
                    {subjectIds.map((sid) => {
                      const subRes = result.subjects.find((s) => s.subject_id === sid);
                      return (
                        <td key={sid} className="p-3 text-center">
                          {subRes ? (
                            subRes.is_absent ? (
                              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">AB</span>
                            ) : (
                              <div>
                                <p className={cn(
                                  "font-semibold",
                                  (subRes.marks_obtained ?? 0) >= subRes.pass_marks
                                    ? "text-green-600"
                                    : "text-red-600"
                                )}>
                                  {subRes.marks_obtained ?? "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">/{subRes.max_marks}</p>
                              </div>
                            )
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-semibold">
                      {result.total_marks}/{result.max_marks}
                    </td>
                    <td className="p-3 text-center font-bold">{result.percentage}%</td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-primary">{result.grade}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        result.is_pass
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      )}>
                        {result.is_pass ? "PASS" : "FAIL"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
