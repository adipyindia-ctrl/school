"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { FieldWrapper } from "@/components/forms/FormSection";
import api from "@/lib/api";
import type { Subject } from "@/types/academic";
import type { ApiResponse } from "@/types/common";

const schema = z.object({
  name: z.string().min(1, "Subject name required"),
  code: z.string().min(1, "Code required"),
  subject_type: z.string().min(1),
  max_marks: z.coerce.number().optional(),
  pass_marks: z.coerce.number().optional(),
});
type FormData = z.infer<typeof schema>;

export default function SubjectsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | undefined>(undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get<ApiResponse<Subject[]>>("/academics/subjects")).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { subject_type: "theory" },
  });

  const saveMutation = useMutation({
    mutationFn: async (d: FormData) => {
      if (editing) await api.patch(`/academics/subjects/${editing.id}`, d);
      else await api.post("/academics/subjects", d);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); setOpen(false); reset(); setEditing(undefined); },
  });

  const openCreate = () => { setEditing(undefined); reset({ subject_type: "theory" }); setOpen(true); };
  const openEdit = (s: Subject) => {
    setEditing(s);
    reset({ name: s.name, code: s.code, subject_type: s.subject_type, max_marks: s.max_marks ?? undefined, pass_marks: s.pass_marks ?? undefined });
    setOpen(true);
  };

  const onSubmit: SubmitHandler<FormData> = (d) => saveMutation.mutate(d);

  const columns: Column<Subject>[] = [
    { key: "name", header: "Subject", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "code", header: "Code", render: (r) => <code className="text-xs bg-muted px-1 py-0.5 rounded">{r.code}</code> },
    { key: "subject_type", header: "Type", render: (r) => <StatusBadge status={r.subject_type} /> },
    { key: "max_marks", header: "Max Marks", render: (r) => r.max_marks ?? "—" },
    { key: "pass_marks", header: "Pass Marks", render: (r) => r.pass_marks ?? "—" },
    {
      key: "actions", header: "",
      render: (r) => (
        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Define subjects — no hardcoded names"
        actions={<Button onClick={openCreate}><PlusCircle className="mr-2 h-4 w-4" />Add Subject</Button>}
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="No subjects yet"
        emptyDescription="Add subjects to assign to classes."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="Subject Name" error={errors.name?.message} required className="col-span-2 sm:col-span-1">
                <Input {...register("name")} placeholder="Mathematics" />
              </FieldWrapper>
              <FieldWrapper label="Code" error={errors.code?.message} required>
                <Input {...register("code")} placeholder="MATH" />
              </FieldWrapper>
              <FieldWrapper label="Type">
                <select {...register("subject_type")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="theory">Theory</option>
                  <option value="practical">Practical</option>
                </select>
              </FieldWrapper>
              <FieldWrapper label="Max Marks">
                <Input type="number" {...register("max_marks")} placeholder="100" />
              </FieldWrapper>
              <FieldWrapper label="Pass Marks">
                <Input type="number" {...register("pass_marks")} placeholder="35" />
              </FieldWrapper>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Update" : "Add Subject"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
