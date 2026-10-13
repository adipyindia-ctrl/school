"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Loader2, Bell, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { EmptyState } from "@/components/data-display/EmptyState";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { FieldWrapper, FormSection } from "@/components/forms/FormSection";
import api from "@/lib/api";
import type { Notice } from "@/types/communication";
import type { PaginatedResponse } from "@/types/common";

const schema = z.object({
  title: z.string().min(1, "Title required"),
  body: z.string().optional(),
  target_audience: z.string().min(1),
  publish_date: z.string().min(1, "Required"),
  expiry_date: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const AUDIENCE_LABELS: Record<string, string> = {
  all: "Everyone",
  teachers: "Teachers",
  students: "Students",
  parents: "Parents",
  specific_class: "Specific Class",
  specific_section: "Specific Section",
};

export default function NoticesPage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notices", statusFilter, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), page_size: "20" });
      p.set("status", statusFilter);
      const res = await api.get<PaginatedResponse<Notice>>(`/notices?${p}`);
      return res.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { target_audience: "all", publish_date: today },
  });

  const createMutation = useMutation({
    mutationFn: async (d: FormData) => { await api.post("/notices", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notices"] }); setOpen(false); reset(); },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/notices/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notices"] }),
  });

  const onSubmit: SubmitHandler<FormData> = (d) => createMutation.mutate(d);

  return (
    <div>
      <PageHeader
        title="Notice Board"
        description="Publish notices to the school community"
        actions={<Button onClick={() => setOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />New Notice</Button>}
      />

      <div className="flex gap-3 mb-5">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="">All</option>
        </select>
      </div>

      {isLoading && <LoadingSkeleton rows={4} />}
      {isError && <Button variant="outline" onClick={() => refetch()}>Retry</Button>}
      {!isLoading && !isError && (data?.data ?? []).length === 0 && (
        <EmptyState title="No notices" description="Publish a notice to the school community."
          action={{ label: "New Notice", onClick: () => setOpen(true) }} />
      )}

      <div className="space-y-3">
        {(data?.data ?? []).map((notice) => (
          <Card key={notice.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="font-semibold">{notice.title}</p>
                    <StatusBadge status={notice.status} />
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      {AUDIENCE_LABELS[notice.target_audience] ?? notice.target_audience}
                    </span>
                  </div>
                  {notice.body && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{notice.body}</p>}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Published: {notice.publish_date}</span>
                    {notice.expiry_date && <span>Expires: {notice.expiry_date}</span>}
                  </div>
                </div>
                {notice.status === "active" && (
                  <Button size="sm" variant="ghost" className="text-muted-foreground shrink-0"
                    onClick={() => archiveMutation.mutate(notice.id)} aria-label="Archive notice">
                    <Archive className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(data?.total_pages ?? 0) > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm px-3 py-1.5">{page} / {data?.total_pages}</span>
          <Button variant="outline" size="sm" disabled={page >= (data?.total_pages ?? 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Notice</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormSection title="Notice Details">
              <FieldWrapper label="Title" error={errors.title?.message} required className="col-span-2">
                <Input {...register("title")} placeholder="Annual Sports Day Announcement" />
              </FieldWrapper>
              <FieldWrapper label="Target Audience" className="col-span-2">
                <select {...register("target_audience")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  {Object.entries(AUDIENCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Publish Date" error={errors.publish_date?.message} required>
                <Input type="date" {...register("publish_date")} />
              </FieldWrapper>
              <FieldWrapper label="Expiry Date">
                <Input type="date" {...register("expiry_date")} />
              </FieldWrapper>
              <FieldWrapper label="Notice Body" className="col-span-2">
                <textarea {...register("body")} rows={4}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none"
                  placeholder="Notice details..." />
              </FieldWrapper>
            </FormSection>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
