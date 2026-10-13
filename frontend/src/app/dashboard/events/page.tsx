"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Loader2, CalendarDays, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { EmptyState } from "@/components/data-display/EmptyState";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { FieldWrapper, FormSection } from "@/components/forms/FormSection";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { SchoolEvent } from "@/types/communication";
import type { PaginatedResponse } from "@/types/common";

const EVENT_TYPES = [
  { value: "holiday", label: "Holiday", color: "bg-green-100 text-green-700" },
  { value: "ptm", label: "PTM", color: "bg-blue-100 text-blue-700" },
  { value: "sports_day", label: "Sports Day", color: "bg-orange-100 text-orange-700" },
  { value: "annual_function", label: "Annual Function", color: "bg-purple-100 text-purple-700" },
  { value: "exam", label: "Examination", color: "bg-red-100 text-red-700" },
  { value: "meeting", label: "Meeting", color: "bg-gray-100 text-gray-700" },
  { value: "other", label: "Other", color: "bg-slate-100 text-slate-700" },
];

const schema = z.object({
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  event_type: z.string().min(1),
  start_date: z.string().min(1, "Required"),
  end_date: z.string().min(1, "Required"),
  target_audience: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

export default function EventsPage() {
  const qc = useQueryClient();
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SchoolEvent | undefined>(undefined);
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(1);
  const today = now.toISOString().split("T")[0];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["events", filterType, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), page_size: "20" });
      if (filterType !== "all") p.set("event_type", filterType);
      p.set("from_date", today);
      const res = await api.get<PaginatedResponse<SchoolEvent>>(`/events?${p}`);
      return res.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { event_type: "other", target_audience: "all" },
  });

  const createMutation = useMutation({
    mutationFn: async (d: FormData) => { await api.post("/events", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); setOpen(false); reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/events/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); setDeleteTarget(undefined); },
  });

  const onSubmit: SubmitHandler<FormData> = (d) => createMutation.mutate(d);

  const getTypeStyle = (type: string) =>
    EVENT_TYPES.find((t) => t.value === type)?.color ?? "bg-slate-100 text-slate-700";
  const getTypeLabel = (type: string) =>
    EVENT_TYPES.find((t) => t.value === type)?.label ?? type;

  return (
    <div>
      <PageHeader
        title="Events"
        description="School events, holidays, and activities"
        actions={<Button onClick={() => setOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />New Event</Button>}
      />

      <div className="flex gap-3 mb-5">
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">All Types</option>
          {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {isLoading && <LoadingSkeleton rows={4} />}
      {isError && <Button variant="outline" onClick={() => refetch()}>Retry</Button>}
      {!isLoading && !isError && (data?.data ?? []).length === 0 && (
        <EmptyState title="No upcoming events" description="Create school events and holidays."
          action={{ label: "New Event", onClick: () => setOpen(true) }} />
      )}

      <div className="space-y-3">
        {(data?.data ?? []).map((event) => (
          <Card key={event.id}>
            <CardContent className="p-4 flex items-start gap-4">
              <div className="shrink-0 text-center min-w-[52px]">
                <div className="bg-primary/10 rounded-lg p-2">
                  <CalendarDays className="h-5 w-5 text-primary mx-auto" />
                  <p className="text-xs font-bold text-primary mt-0.5">
                    {new Date(event.start_date).getDate()}
                  </p>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold">{event.title}</p>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", getTypeStyle(event.event_type))}>
                    {getTypeLabel(event.event_type)}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {event.start_date === event.end_date
                    ? event.start_date
                    : `${event.start_date} → ${event.end_date}`}
                  {" · "}
                  <span className="capitalize">{event.target_audience}</span>
                </p>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0"
                onClick={() => setDeleteTarget(event)} aria-label="Delete event">
                <Trash2 className="h-4 w-4" />
              </Button>
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
          <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormSection title="Event Details">
              <FieldWrapper label="Title" error={errors.title?.message} required className="col-span-2">
                <Input {...register("title")} placeholder="Annual Sports Day" />
              </FieldWrapper>
              <FieldWrapper label="Event Type">
                <select {...register("event_type")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Target Audience">
                <select {...register("target_audience")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="all">Everyone</option>
                  <option value="teachers">Teachers</option>
                  <option value="students">Students</option>
                  <option value="parents">Parents</option>
                </select>
              </FieldWrapper>
              <FieldWrapper label="Start Date" error={errors.start_date?.message} required>
                <Input type="date" {...register("start_date")} />
              </FieldWrapper>
              <FieldWrapper label="End Date" error={errors.end_date?.message} required>
                <Input type="date" {...register("end_date")} />
              </FieldWrapper>
              <FieldWrapper label="Description" className="col-span-2">
                <textarea {...register("description")} rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none"
                  placeholder="Event details..." />
              </FieldWrapper>
            </FormSection>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Event
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(undefined)}
        title="Delete Event"
        description={`Delete "${deleteTarget?.title}"?`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
