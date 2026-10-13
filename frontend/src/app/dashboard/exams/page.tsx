"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Loader2, Eye, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { FieldWrapper, FormSection } from "@/components/forms/FormSection";
import api from "@/lib/api";
import type { Exam, ExamType } from "@/types/finance";
import type { AcademicSession, Class } from "@/types/academic";
import type { ApiResponse, PaginatedResponse } from "@/types/common";

const schema = z.object({
  exam_type_id: z.string().min(1, "Required"),
  session_id: z.string().min(1, "Required"),
  class_id: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
  start_date: z.string().min(1, "Required"),
  end_date: z.string().min(1, "Required"),
});
type FormData = z.infer<typeof schema>;

const typeSchema = z.object({ name: z.string().min(1, "Required") });
type TypeForm = z.infer<typeof typeSchema>;

export default function ExamsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: examTypes } = useQuery({
    queryKey: ["exam-types"],
    queryFn: async () => (await api.get<ApiResponse<ExamType[]>>("/exams/types")).data.data,
  });
  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await api.get<ApiResponse<AcademicSession[]>>("/academics/sessions")).data.data,
  });
  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await api.get<ApiResponse<Class[]>>("/academics/classes")).data.data,
  });
  const { data, isLoading } = useQuery({
    queryKey: ["exams", page],
    queryFn: async () => (await api.get<PaginatedResponse<Exam>>(`/exams?page=${page}&page_size=25`)).data,
  });

  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const typeForm = useForm<TypeForm>({ resolver: zodResolver(typeSchema) });

  const createMutation = useMutation({
    mutationFn: async (d: FormData) => { await api.post("/exams", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exams"] }); setOpen(false); form.reset(); },
  });
  const createTypeMutation = useMutation({
    mutationFn: async (d: TypeForm) => { await api.post("/exams/types", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exam-types"] }); setTypeOpen(false); typeForm.reset(); },
  });

  const typeMap = Object.fromEntries((examTypes ?? []).map((t) => [t.id, t.name]));
  const classMap = Object.fromEntries((classes ?? []).map((c) => [c.id, c.name]));
  const sessionMap = Object.fromEntries((sessions ?? []).map((s) => [s.id, s.name]));

  const onSubmit: SubmitHandler<FormData> = (d) => createMutation.mutate(d);
  const onTypeSubmit: SubmitHandler<TypeForm> = (d) => createTypeMutation.mutate(d);

  const cols: Column<Exam>[] = [
    { key: "name", header: "Exam Name", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "exam_type_id", header: "Type", render: (r) => typeMap[r.exam_type_id] ?? "—" },
    { key: "class_id", header: "Class", render: (r) => classMap[r.class_id] ?? "—" },
    { key: "session_id", header: "Session", render: (r) => sessionMap[r.session_id] ?? "—" },
    { key: "start_date", header: "Date", render: (r) => `${r.start_date} → ${r.end_date}` },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions", header: "",
      render: (r) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/exams/${r.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/exams/${r.id}/marks`)}>
            <BookOpen className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Examinations"
        description="Manage exams and enter marks"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTypeOpen(true)}>Exam Types</Button>
            <Button onClick={() => setOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Create Exam</Button>
          </div>
        }
      />

      <DataTable columns={cols} data={data?.data ?? []} isLoading={isLoading}
        total={data?.total ?? 0} page={page} pageSize={25} onPageChange={setPage}
        emptyTitle="No exams yet" emptyDescription="Create your first exam to get started." />

      {/* Create Exam */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Exam</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormSection title="">
              <FieldWrapper label="Exam Name" error={form.formState.errors.name?.message} required className="col-span-2">
                <Input {...form.register("name")} placeholder="Annual Examination 2025" />
              </FieldWrapper>
              <FieldWrapper label="Exam Type" error={form.formState.errors.exam_type_id?.message} required>
                <select {...form.register("exam_type_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select type</option>
                  {(examTypes ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Session" error={form.formState.errors.session_id?.message} required>
                <select {...form.register("session_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select session</option>
                  {(sessions ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Class" error={form.formState.errors.class_id?.message} required>
                <select {...form.register("class_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select class</option>
                  {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Start Date" error={form.formState.errors.start_date?.message} required>
                <Input type="date" {...form.register("start_date")} />
              </FieldWrapper>
              <FieldWrapper label="End Date" error={form.formState.errors.end_date?.message} required>
                <Input type="date" {...form.register("end_date")} />
              </FieldWrapper>
            </FormSection>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Exam Types Dialog */}
      <Dialog open={typeOpen} onOpenChange={setTypeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Exam Types</DialogTitle></DialogHeader>
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {(examTypes ?? []).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded border text-sm">
                <span>{t.name}</span>
              </div>
            ))}
          </div>
          <form onSubmit={typeForm.handleSubmit(onTypeSubmit)} className="flex gap-2">
            <Input {...typeForm.register("name")} placeholder="Unit Test, Mid-Term…" className="flex-1" />
            <Button type="submit" disabled={createTypeMutation.isPending}>
              {createTypeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
