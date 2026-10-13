"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { FieldWrapper } from "@/components/forms/FormSection";
import api from "@/lib/api";
import type { AcademicSession, Class } from "@/types/academic";
import type { ApiResponse } from "@/types/common";

const schema = z.object({
  name: z.string().min(1, "Class name required"),
  session_id: z.string().min(1, "Session required"),
  display_order: z.coerce.number(),
});
type FormData = z.infer<typeof schema>;

export default function ClassesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Class | undefined>(undefined);

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AcademicSession[]>>("/academics/sessions");
      return res.data.data;
    },
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Class[]>>("/academics/classes");
      return res.data.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { display_order: 0 },
  });

  const createMutation = useMutation({
    mutationFn: async (d: FormData) => { await api.post("/academics/classes", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["classes"] }); setOpen(false); reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/academics/classes/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["classes"] }); setDeleteTarget(undefined); },
  });

  const onSubmit: SubmitHandler<FormData> = (d) => createMutation.mutate(d);

  const sessionMap = Object.fromEntries((sessions ?? []).map((s) => [s.id, s.name]));

  const columns: Column<Class>[] = [
    { key: "name", header: "Class Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "session_id", header: "Session", render: (r) => sessionMap[r.session_id] ?? "—" },
    { key: "display_order", header: "Order" },
    {
      key: "actions", header: "",
      render: (r) => (
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
          onClick={() => setDeleteTarget(r)} aria-label="Delete class">
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Manage class structure — fully dynamic, no hardcoded names"
        actions={<Button onClick={() => setOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Class</Button>}
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="No classes yet"
        emptyDescription="Add your first class to build the academic structure."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldWrapper label="Class Name" error={errors.name?.message} required>
              <Input {...register("name")} placeholder="e.g. Class 10, Nursery, LKG" />
            </FieldWrapper>
            <FieldWrapper label="Academic Session" error={errors.session_id?.message} required>
              <select {...register("session_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Select session</option>
                {(sessions ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Display Order">
              <Input type="number" {...register("display_order")} defaultValue={0} />
            </FieldWrapper>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Class
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(undefined)}
        title="Delete Class"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will fail if students are enrolled.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
