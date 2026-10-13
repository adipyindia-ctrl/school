"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Pencil, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { ErrorState } from "@/components/data-display/ErrorState";
import { EmptyState } from "@/components/data-display/EmptyState";
import { FieldWrapper } from "@/components/forms/FormSection";
import api from "@/lib/api";
import type { AcademicSession } from "@/types/academic";
import type { ApiResponse } from "@/types/common";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  start_date: z.string().min(1, "Start date required"),
  end_date: z.string().min(1, "End date required"),
  status: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export default function SessionsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicSession | undefined>(undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AcademicSession[]>>("/academics/sessions");
      return res.data.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "inactive" },
  });

  const saveMutation = useMutation({
    mutationFn: async (d: FormData) => {
      if (editing) {
        await api.patch(`/academics/sessions/${editing.id}`, d);
      } else {
        await api.post("/academics/sessions", d);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sessions"] }); setOpen(false); reset(); setEditing(undefined); },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/academics/sessions/${id}`, { status: "active" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const openCreate = () => { setEditing(undefined); reset({ status: "inactive" }); setOpen(true); };
  const openEdit = (s: AcademicSession) => {
    setEditing(s);
    reset({ name: s.name, start_date: s.start_date, end_date: s.end_date, status: s.status });
    setOpen(true);
  };

  const onSubmit: SubmitHandler<FormData> = (d) => saveMutation.mutate(d);

  return (
    <div>
      <PageHeader
        title="Academic Sessions"
        description="Manage academic years and terms"
        actions={<Button onClick={openCreate}><PlusCircle className="mr-2 h-4 w-4" />New Session</Button>}
      />

      {isLoading && <LoadingSkeleton rows={3} />}
      {isError && <ErrorState onRetry={refetch} />}
      {!isLoading && !isError && !(data ?? []).length && (
        <EmptyState title="No sessions yet" description="Create your first academic session to get started." action={{ label: "New Session", onClick: openCreate }} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data ?? []).map((s) => (
          <Card key={s.id} className={s.is_current ? "border-primary" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{s.name}</CardTitle>
                <div className="flex gap-1">
                  <StatusBadge status={s.status} />
                  {s.is_current && <StatusBadge status="current" />}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="text-muted-foreground">
                {s.start_date} → {s.end_date}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />Edit
                </Button>
                {s.status !== "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600"
                    onClick={() => activateMutation.mutate(s.id)}
                    disabled={activateMutation.isPending}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Set Active
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Session" : "New Academic Session"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldWrapper label="Session Name" error={errors.name?.message} required>
              <Input {...register("name")} placeholder="2025-26" />
            </FieldWrapper>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="Start Date" error={errors.start_date?.message} required>
                <Input type="date" {...register("start_date")} />
              </FieldWrapper>
              <FieldWrapper label="End Date" error={errors.end_date?.message} required>
                <Input type="date" {...register("end_date")} />
              </FieldWrapper>
            </div>
            <FieldWrapper label="Status">
              <select {...register("status")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="inactive">Inactive</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </FieldWrapper>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Session"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
