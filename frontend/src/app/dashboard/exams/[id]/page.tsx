"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, PlusCircle, Loader2, BookOpen, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { FieldWrapper } from "@/components/forms/FormSection";
import api from "@/lib/api";
import type { Exam, ExamSubject } from "@/types/finance";
import type { Subject } from "@/types/academic";
import type { ApiResponse } from "@/types/common";

const subjectSchema = z.object({
  subject_id: z.string().min(1, "Required"),
  exam_date: z.string().min(1, "Required"),
  max_marks: z.coerce.number().min(1),
  pass_marks: z.coerce.number().min(1),
  room: z.string().optional(),
});
type SubjectForm = z.infer<typeof subjectSchema>;

export default function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: exam, isLoading } = useQuery({
    queryKey: ["exam", examId],
    queryFn: async () => (await api.get<ApiResponse<Exam>>(`/exams/${examId}`)).data.data,
  });

  const { data: examSubjects } = useQuery({
    queryKey: ["exam-subjects", examId],
    queryFn: async () =>
      (await api.get<ApiResponse<ExamSubject[]>>(`/exams/${examId}/subjects`)).data.data,
  });

  const { data: allSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () =>
      (await api.get<ApiResponse<Subject[]>>("/academics/subjects")).data.data,
  });

  const form = useForm<SubjectForm>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { max_marks: 100, pass_marks: 35 },
  });

  const addSubjectMutation = useMutation({
    mutationFn: async (d: SubjectForm) => {
      await api.post(`/exams/${examId}/subjects`, d);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-subjects", examId] });
      setOpen(false);
      form.reset({ max_marks: 100, pass_marks: 35 });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/exams/${examId}`, { status: "published" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exam", examId] }),
  });

  const subjectMap = Object.fromEntries((allSubjects ?? []).map((s) => [s.id, s.name]));
  const addedSubjectIds = new Set((examSubjects ?? []).map((es) => es.subject_id));
  const availableSubjects = (allSubjects ?? []).filter((s) => !addedSubjectIds.has(s.id));

  const onSubmit: SubmitHandler<SubjectForm> = (d) => addSubjectMutation.mutate(d);

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (!exam) return null;

  return (
    <div>
      <PageHeader
        title={exam.name}
        description={`${exam.start_date} → ${exam.end_date}`}
        actions={
          <div className="flex gap-2">
            {exam.status === "draft" && (
              <Button
                variant="outline"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/exams/${examId}/marks`)}
            >
              <BookOpen className="mr-2 h-4 w-4" />Enter Marks
            </Button>
            <Button onClick={() => router.push(`/dashboard/exams/${examId}/results`)}>
              <BarChart3 className="mr-2 h-4 w-4" />Results
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Button>
          </div>
        }
      />

      {/* Info */}
      <Card className="mb-5">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <StatusBadge status={exam.status} />
            <span className="text-muted-foreground">Subjects: <strong>{(examSubjects ?? []).length}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Subjects */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Exam Schedule</h2>
        <Button size="sm" onClick={() => setOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />Add Subject
        </Button>
      </div>

      {(examSubjects ?? []).length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No subjects added yet. Add subjects to build the exam schedule.
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-3 text-left font-medium">Subject</th>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-center font-medium">Max Marks</th>
                <th className="p-3 text-center font-medium">Pass Marks</th>
                <th className="p-3 text-left font-medium">Room</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(examSubjects ?? []).map((es) => (
                <tr key={es.id} className="hover:bg-muted/20">
                  <td className="p-3 font-medium">{subjectMap[es.subject_id] ?? "—"}</td>
                  <td className="p-3">{es.exam_date}</td>
                  <td className="p-3 text-center">{es.max_marks}</td>
                  <td className="p-3 text-center">{es.pass_marks}</td>
                  <td className="p-3 text-muted-foreground">{es.room ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Subject Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Subject to Exam</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FieldWrapper label="Subject" error={form.formState.errors.subject_id?.message} required>
              <select
                {...form.register("subject_id")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Select subject</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Exam Date" error={form.formState.errors.exam_date?.message} required>
              <Input type="date" {...form.register("exam_date")} />
            </FieldWrapper>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="Max Marks">
                <Input type="number" {...form.register("max_marks")} />
              </FieldWrapper>
              <FieldWrapper label="Pass Marks">
                <Input type="number" {...form.register("pass_marks")} />
              </FieldWrapper>
            </div>
            <FieldWrapper label="Room">
              <Input {...form.register("room")} placeholder="Room 101" />
            </FieldWrapper>
            {addSubjectMutation.isError && (
              <p className="text-xs text-destructive">
                {(addSubjectMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error adding subject"}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addSubjectMutation.isPending}>
                {addSubjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Subject
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
