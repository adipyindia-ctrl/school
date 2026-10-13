"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Loader2, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { EmptyState } from "@/components/data-display/EmptyState";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { FieldWrapper, FormSection } from "@/components/forms/FormSection";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { Class, Section, Subject } from "@/types/academic";
import type { Homework } from "@/types/communication";
import type { ApiResponse, PaginatedResponse } from "@/types/common";

const schema = z.object({
  class_id: z.string().min(1, "Required"),
  section_id: z.string().min(1, "Required"),
  subject_id: z.string().min(1, "Required"),
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  assigned_date: z.string().min(1, "Required"),
  due_date: z.string().min(1, "Required"),
});
type FormData = z.infer<typeof schema>;

export default function HomeworkPage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Homework | undefined>(undefined);
  const [filterClass, setFilterClass] = useState("all");
  const [page, setPage] = useState(1);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await api.get<ApiResponse<Class[]>>("/academics/classes")).data.data,
  });
  const { data: sections } = useQuery({
    queryKey: ["sections", filterClass],
    queryFn: async () => {
      const p = filterClass !== "all" ? `?class_id=${filterClass}` : "";
      return (await api.get<ApiResponse<Section[]>>(`/academics/sections${p}`)).data.data;
    },
  });
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get<ApiResponse<Subject[]>>("/academics/subjects")).data.data,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["homework", filterClass, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), page_size: "20" });
      if (filterClass !== "all") p.set("class_id", filterClass);
      const res = await api.get<PaginatedResponse<Homework>>(`/homework?${p}`);
      return res.data;
    },
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { assigned_date: today },
  });

  const watchClass = watch("class_id");
  const dialogSections = (sections ?? []).filter((s) => !watchClass || s.class_id === watchClass);

  const createMutation = useMutation({
    mutationFn: async (d: FormData) => { await api.post("/homework", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["homework"] }); setOpen(false); reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/homework/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["homework"] }); setDeleteTarget(undefined); },
  });

  const onSubmit: SubmitHandler<FormData> = (d) => createMutation.mutate(d);

  const subjectMap = Object.fromEntries((subjects ?? []).map((s) => [s.id, s.name]));
  const classMap = Object.fromEntries((classes ?? []).map((c) => [c.id, c.name]));
  const sectionMap = Object.fromEntries((sections ?? []).map((s) => [s.id, s.name]));

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date(today);

  return (
    <div>
      <PageHeader
        title="Homework"
        description="Assign and track homework for students"
        actions={<Button onClick={() => setOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Assign Homework</Button>}
      />

      <div className="flex gap-3 mb-5">
        <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setPage(1); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">All Classes</option>
          {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {isLoading && <LoadingSkeleton rows={4} />}
      {isError && <Button variant="outline" onClick={() => refetch()}>Retry</Button>}
      {!isLoading && !isError && (data?.data ?? []).length === 0 && (
        <EmptyState title="No homework" description="Assign homework to classes."
          action={{ label: "Assign Homework", onClick: () => setOpen(true) }} />
      )}

      <div className="space-y-3">
        {(data?.data ?? []).map((hw) => (
          <Card key={hw.id} className={cn(isOverdue(hw.due_date) ? "border-red-200" : "")}>
            <CardContent className="p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{hw.title}</p>
                  {isOverdue(hw.due_date) && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Overdue</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{hw.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{subjectMap[hw.subject_id] ?? "—"}</span>
                  <span>{classMap[hw.class_id] ?? "—"} — {sectionMap[hw.section_id] ?? "—"}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {hw.due_date}
                  </span>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0"
                onClick={() => setDeleteTarget(hw)} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {(data?.total_pages ?? 0) > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm px-3 py-1.5">{page} / {data?.total_pages}</span>
          <Button variant="outline" size="sm" disabled={page >= (data?.total_pages ?? 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Assign Homework</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormSection title="Assignment Details">
              <FieldWrapper label="Title" error={errors.title?.message} required className="col-span-2">
                <Input {...register("title")} placeholder="Chapter 5 Exercise" />
              </FieldWrapper>
              <FieldWrapper label="Class" error={errors.class_id?.message} required>
                <select {...register("class_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select class</option>
                  {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Section" error={errors.section_id?.message} required>
                <select {...register("section_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select section</option>
                  {dialogSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Subject" error={errors.subject_id?.message} required className="col-span-2">
                <select {...register("subject_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select subject</option>
                  {(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Assigned Date" error={errors.assigned_date?.message} required>
                <Input type="date" {...register("assigned_date")} />
              </FieldWrapper>
              <FieldWrapper label="Due Date" error={errors.due_date?.message} required>
                <Input type="date" {...register("due_date")} />
              </FieldWrapper>
              <FieldWrapper label="Description (optional)" className="col-span-2">
                <textarea {...register("description")} rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none"
                  placeholder="Instructions for students..." />
              </FieldWrapper>
            </FormSection>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(undefined)}
        title="Delete Homework"
        description={`Delete "${deleteTarget?.title}"?`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
