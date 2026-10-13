"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/data-display/EmptyState";
import { FieldWrapper } from "@/components/forms/FormSection";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { AcademicSession, Class, Section, Subject, Teacher } from "@/types/academic";
import type { TimetablePeriod } from "@/types/communication";
import type { ApiResponse } from "@/types/common";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const schema = z.object({
  class_id: z.string().min(1, "Required"),
  section_id: z.string().min(1, "Required"),
  session_id: z.string().min(1, "Required"),
  day_of_week: z.coerce.number().min(1).max(7),
  period_number: z.coerce.number().min(1),
  start_time: z.string().min(1, "Required"),
  end_time: z.string().min(1, "Required"),
  subject_id: z.string().optional(),
  teacher_id: z.string().optional(),
  room: z.string().optional(),
  is_break: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export default function TimetablePage() {
  const qc = useQueryClient();
  const [filterSection, setFilterSection] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [open, setOpen] = useState(false);

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await api.get<ApiResponse<AcademicSession[]>>("/academics/sessions")).data.data,
  });
  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await api.get<ApiResponse<Class[]>>("/academics/classes")).data.data,
  });
  const { data: sections } = useQuery({
    queryKey: ["sections", filterClass],
    queryFn: async () => {
      const p = filterClass ? `?class_id=${filterClass}` : "";
      return (await api.get<ApiResponse<Section[]>>(`/academics/sections${p}`)).data.data;
    },
    enabled: !!filterClass,
  });
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get<ApiResponse<Subject[]>>("/academics/subjects")).data.data,
  });

  const { data: periods, isLoading } = useQuery({
    queryKey: ["timetable", filterSection, filterSession],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filterSection) p.set("section_id", filterSection);
      if (filterSession) p.set("session_id", filterSession);
      const res = await api.get<ApiResponse<TimetablePeriod[]>>(`/timetable?${p}`);
      return res.data.data;
    },
    enabled: !!filterSection,
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { day_of_week: 1, period_number: 1, is_break: false },
  });

  const formClass = watch("class_id");
  const formSections = (sections ?? []).filter((s) => !formClass || s.class_id === formClass);

  const createMutation = useMutation({
    mutationFn: async (d: FormData) => { await api.post("/timetable", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["timetable"] }); setOpen(false); reset(); },
  });

  const onSubmit: SubmitHandler<FormData> = (d) => createMutation.mutate(d);

  // Organise periods into a day × period grid
  const subjectMap = Object.fromEntries((subjects ?? []).map((s) => [s.id, s.name]));
  const grid: Record<number, Record<number, TimetablePeriod>> = {};
  (periods ?? []).forEach((p) => {
    if (!grid[p.day_of_week]) grid[p.day_of_week] = {};
    grid[p.day_of_week][p.period_number] = p;
  });
  const maxPeriod = Math.max(0, ...(periods ?? []).map((p) => p.period_number));

  return (
    <div>
      <PageHeader
        title="Timetable"
        description="Weekly period schedule for classes"
        actions={
          <Button onClick={() => setOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />Add Period
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All Sessions</option>
          {(sessions ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setFilterSection(""); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Select Class</option>
          {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
          disabled={!filterClass}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50">
          <option value="">Select Section</option>
          {(sections ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {!filterSection && (
        <EmptyState title="Select a section" description="Choose a class and section to view the timetable." />
      )}

      {filterSection && !isLoading && (periods ?? []).length === 0 && (
        <EmptyState
          title="No timetable yet"
          description="Add periods to build the weekly timetable."
          action={{ label: "Add Period", onClick: () => setOpen(true) }}
        />
      )}

      {/* Weekly grid */}
      {filterSection && maxPeriod > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-muted text-left w-16">Period</th>
                {DAYS.map((d) => (
                  <th key={d} className="border p-2 bg-muted text-center">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((period) => (
                <tr key={period}>
                  <td className="border p-2 font-medium text-center bg-muted/30">{period}</td>
                  {[1, 2, 3, 4, 5, 6].map((day) => {
                    const slot = grid[day]?.[period];
                    return (
                      <td key={day} className="border p-2 text-center min-w-[100px]">
                        {slot ? (
                          <div className={cn(
                            "rounded p-1.5 text-xs",
                            slot.is_break
                              ? "bg-gray-100 text-gray-500"
                              : "bg-primary/10 text-primary"
                          )}>
                            {slot.is_break ? "Break" : (
                              <>
                                <p className="font-semibold">
                                  {subjectMap[slot.subject_id ?? ""] ?? "—"}
                                </p>
                                <p className="text-muted-foreground">
                                  {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                                </p>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add period dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Timetable Period</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="Session" error={errors.session_id?.message} required>
                <select {...register("session_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select</option>
                  {(sessions ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Class" error={errors.class_id?.message} required>
                <select {...register("class_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select</option>
                  {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Section" error={errors.section_id?.message} required>
                <select {...register("section_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select</option>
                  {formSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Day">
                <select {...register("day_of_week")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  {DAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Period No.">
                <Input type="number" {...register("period_number")} min={1} />
              </FieldWrapper>
              <FieldWrapper label="Start Time">
                <Input type="time" {...register("start_time")} />
              </FieldWrapper>
              <FieldWrapper label="End Time">
                <Input type="time" {...register("end_time")} />
              </FieldWrapper>
              <FieldWrapper label="Subject">
                <select {...register("subject_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">None</option>
                  {(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Room">
                <Input {...register("room")} placeholder="Room 101" />
              </FieldWrapper>
              <FieldWrapper label="Is Break">
                <div className="flex items-center gap-2 h-9">
                  <input type="checkbox" {...register("is_break")} id="is_break" className="h-4 w-4" />
                  <label htmlFor="is_break" className="text-sm">This is a break slot</label>
                </div>
              </FieldWrapper>
            </div>
            {createMutation.isError && (
              <p className="text-xs text-destructive">
                {(createMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Conflict or error"}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Period
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
