"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PlusCircle, Loader2, List, LayoutGrid, Phone,
  Calendar, User, ChevronRight, MessageSquare, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { EmptyState } from "@/components/data-display/EmptyState";
import { FieldWrapper, FormSection } from "@/components/forms/FormSection";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { Lead, LeadStage, FollowUp, FunnelStat } from "@/types/crm";
import { STAGES, STAGE_BADGE } from "@/types/crm";
import type { ApiResponse, PaginatedResponse } from "@/types/common";

// ── Schemas ───────────────────────────────────────────────────────────────────

const leadSchema = z.object({
  student_name: z.string().min(1, "Required"),
  parent_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  interested_class: z.string().optional(),
  source: z.string().min(1),
  stage: z.string().min(1),
  notes: z.string().optional(),
});
type LeadForm = z.infer<typeof leadSchema>;

const followUpSchema = z.object({
  follow_up_type: z.string().min(1),
  notes: z.string().optional(),
  follow_up_date: z.string().min(1, "Required"),
  next_follow_up: z.string().optional(),
});
type FollowUpForm = z.infer<typeof followUpSchema>;

// ── Stage Badge ───────────────────────────────────────────────────────────────

function StageBadge({ stage }: { stage: LeadStage }) {
  const label = STAGES.find((s) => s.value === stage)?.label ?? stage;
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STAGE_BADGE[stage])}>
      {label}
    </span>
  );
}

// ── Kanban Card ───────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  onView,
  onStageChange,
}: {
  lead: Lead;
  onView: (lead: Lead) => void;
  onStageChange: (lead: Lead, stage: LeadStage) => void;
}) {
  const nextStageIndex = STAGES.findIndex((s) => s.value === lead.stage) + 1;
  const nextStage = STAGES[nextStageIndex];

  return (
    <div className="bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(lead)}>
      <p className="font-semibold text-sm mb-1">{lead.student_name}</p>
      {lead.parent_name && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <User className="h-3 w-3" />{lead.parent_name}
        </p>
      )}
      {lead.phone && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Phone className="h-3 w-3" />{lead.phone}
        </p>
      )}
      {lead.interested_class && (
        <p className="text-xs text-muted-foreground mt-0.5">Class: {lead.interested_class}</p>
      )}
      {lead.follow_up_date && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <Calendar className="h-3 w-3" />Follow-up: {lead.follow_up_date}
        </p>
      )}
      {nextStage && lead.stage !== "admission_confirmed" && lead.stage !== "rejected" && (
        <button
          onClick={(e) => { e.stopPropagation(); onStageChange(lead, nextStage.value); }}
          className="mt-2 w-full text-xs text-primary font-medium flex items-center justify-center gap-1 py-1 rounded border border-primary/30 hover:bg-primary/5 transition-colors"
        >
          Move to {nextStage.label} <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdmissionsPage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [open, setOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // ── Queries ──

  const { data: kanban, isLoading: loadingKanban } = useQuery({
    queryKey: ["crm-kanban"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Record<string, Lead[]>>>("/crm/leads/kanban");
      return res.data.data;
    },
    enabled: view === "kanban",
  });

  const { data: listData, isLoading: loadingList } = useQuery({
    queryKey: ["crm-leads", search, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), page_size: "25" });
      if (search) p.set("search", search);
      return (await api.get<PaginatedResponse<Lead>>(`/crm/leads?${p}`)).data;
    },
    enabled: view === "list",
  });

  const { data: followUps } = useQuery({
    queryKey: ["crm-followups", selectedLead?.id],
    queryFn: async () =>
      (await api.get<ApiResponse<FollowUp[]>>(`/crm/leads/${selectedLead!.id}/follow-ups`)).data.data,
    enabled: !!selectedLead,
  });

  const { data: funnel } = useQuery({
    queryKey: ["crm-funnel"],
    queryFn: async () =>
      (await api.get<ApiResponse<FunnelStat[]>>("/crm/funnel")).data.data,
  });

  // ── Mutations ──

  const leadForm = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: { source: "walk_in", stage: "new_enquiry" },
  });

  const fuForm = useForm<FollowUpForm>({
    resolver: zodResolver(followUpSchema),
    defaultValues: { follow_up_type: "call", follow_up_date: today },
  });

  const createMutation = useMutation({
    mutationFn: async (d: LeadForm) => { await api.post("/crm/leads", d); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-kanban"] });
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-funnel"] });
      setOpen(false);
      leadForm.reset({ source: "walk_in", stage: "new_enquiry" });
    },
  });

  const stageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      await api.patch(`/crm/leads/${id}`, { stage });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-kanban"] });
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-funnel"] });
      if (selectedLead) {
        qc.invalidateQueries({ queryKey: ["crm-followups", selectedLead.id] });
      }
    },
  });

  const fuMutation = useMutation({
    mutationFn: async (d: FollowUpForm) => {
      await api.post(`/crm/leads/${selectedLead!.id}/follow-ups`, d);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-followups", selectedLead?.id] });
      qc.invalidateQueries({ queryKey: ["crm-kanban"] });
      fuForm.reset({ follow_up_type: "call", follow_up_date: today });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/crm/leads/${id}/convert`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-kanban"] });
      qc.invalidateQueries({ queryKey: ["crm-funnel"] });
      setDetailOpen(false);
    },
  });

  const onLeadSubmit: SubmitHandler<LeadForm> = (d) => createMutation.mutate(d);
  const onFuSubmit: SubmitHandler<FollowUpForm> = (d) => fuMutation.mutate(d);

  const openDetail = (lead: Lead) => { setSelectedLead(lead); setDetailOpen(true); };

  // ── List columns ──

  const listCols: Column<Lead>[] = [
    {
      key: "student_name", header: "Student",
      render: (r) => (
        <div>
          <p className="font-medium">{r.student_name}</p>
          {r.parent_name && <p className="text-xs text-muted-foreground">{r.parent_name}</p>}
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
    { key: "interested_class", header: "Class", render: (r) => r.interested_class ?? "—" },
    { key: "source", header: "Source", render: (r) => <span className="capitalize">{r.source.replace("_", " ")}</span> },
    { key: "stage", header: "Stage", render: (r) => <StageBadge stage={r.stage} /> },
    { key: "follow_up_date", header: "Follow-Up", render: (r) => r.follow_up_date ?? "—" },
    {
      key: "actions", header: "",
      render: (r) => (
        <Button size="sm" variant="ghost" onClick={() => openDetail(r)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admission CRM"
        description="Track and convert admission enquiries"
        actions={
          <div className="flex gap-2">
            <Button
              variant={view === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("kanban")}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />Kanban
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4 mr-1" />List
            </Button>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />New Enquiry
            </Button>
          </div>
        }
      />

      {/* Funnel summary */}
      {funnel && (
        <div className="flex flex-wrap gap-2 mb-5">
          {funnel.map((stat) => (
            <div key={stat.stage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-card text-sm">
              <span className="font-bold text-primary">{stat.count}</span>
              <span className="text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Kanban View */}
      {view === "kanban" && (
        <>
          {loadingKanban && <LoadingSkeleton rows={3} type="card" />}
          {!loadingKanban && (
            <div className="flex gap-3 overflow-x-auto pb-4">
              {STAGES.map((stage) => {
                const leads = (kanban ?? {})[stage.value] ?? [];
                return (
                  <div key={stage.value}
                    className={cn("rounded-xl border-2 p-3 min-w-[220px] w-[220px] shrink-0", stage.color)}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">{stage.label}</h3>
                      <span className="text-xs font-bold bg-white rounded-full w-5 h-5 flex items-center justify-center border">
                        {leads.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {leads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onView={openDetail}
                          onStageChange={(l, s) => stageMutation.mutate({ id: l.id, stage: s })}
                        />
                      ))}
                      {leads.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No leads</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* List View */}
      {view === "list" && (
        <>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Input placeholder="Search by name or phone..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
          <DataTable
            columns={listCols}
            data={listData?.data ?? []}
            isLoading={loadingList}
            total={listData?.total ?? 0}
            page={page}
            pageSize={25}
            onPageChange={setPage}
            emptyTitle="No leads"
            emptyDescription="Create your first enquiry lead."
          />
        </>
      )}

      {/* Create Lead Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Enquiry</DialogTitle></DialogHeader>
          <form onSubmit={leadForm.handleSubmit(onLeadSubmit)} className="space-y-5">
            <FormSection title="Enquiry Details">
              <FieldWrapper label="Student Name" error={leadForm.formState.errors.student_name?.message} required className="col-span-2">
                <Input {...leadForm.register("student_name")} placeholder="Aarav Sharma" />
              </FieldWrapper>
              <FieldWrapper label="Parent Name">
                <Input {...leadForm.register("parent_name")} placeholder="Rajesh Sharma" />
              </FieldWrapper>
              <FieldWrapper label="Phone">
                <Input {...leadForm.register("phone")} placeholder="+91-9876543210" />
              </FieldWrapper>
              <FieldWrapper label="Email" error={leadForm.formState.errors.email?.message}>
                <Input type="email" {...leadForm.register("email")} placeholder="parent@email.com" />
              </FieldWrapper>
              <FieldWrapper label="Interested Class">
                <Input {...leadForm.register("interested_class")} placeholder="Class 5" />
              </FieldWrapper>
              <FieldWrapper label="Source">
                <select {...leadForm.register("source")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="walk_in">Walk-In</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="social_media">Social Media</option>
                  <option value="other">Other</option>
                </select>
              </FieldWrapper>
              <FieldWrapper label="Initial Stage">
                <select {...leadForm.register("stage")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  {STAGES.slice(0, 4).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Notes" className="col-span-2">
                <textarea {...leadForm.register("notes")} rows={2}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none" />
              </FieldWrapper>
            </FormSection>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Enquiry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>{selectedLead.student_name}</SheetTitle>
              </SheetHeader>

              {/* Lead info */}
              <div className="space-y-2 text-sm mb-5">
                <div className="flex items-center gap-2">
                  <StageBadge stage={selectedLead.stage} />
                </div>
                {selectedLead.parent_name && (
                  <p className="text-muted-foreground">Parent: <span className="text-foreground">{selectedLead.parent_name}</span></p>
                )}
                {selectedLead.phone && (
                  <p className="text-muted-foreground">Phone: <span className="text-foreground">{selectedLead.phone}</span></p>
                )}
                {selectedLead.interested_class && (
                  <p className="text-muted-foreground">Interested in: <span className="text-foreground">{selectedLead.interested_class}</span></p>
                )}
                {selectedLead.notes && (
                  <p className="text-muted-foreground italic">"{selectedLead.notes}"</p>
                )}
              </div>

              {/* Stage change */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Move Stage</p>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => stageMutation.mutate({ id: selectedLead.id, stage: s.value })}
                      disabled={selectedLead.stage === s.value || stageMutation.isPending}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full border font-medium transition-colors",
                        selectedLead.stage === s.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted border-border"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Convert button */}
              {selectedLead.stage !== "admission_confirmed" && selectedLead.stage !== "rejected" && (
                <Button
                  className="w-full mb-5"
                  variant="outline"
                  onClick={() => convertMutation.mutate(selectedLead.id)}
                  disabled={convertMutation.isPending}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  {convertMutation.isPending ? "Converting…" : "Confirm Admission"}
                </Button>
              )}

              {/* Follow-up log */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />Follow-Ups ({(followUps ?? []).length})
                </p>

                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {(followUps ?? []).map((fu) => (
                    <div key={fu.id} className="rounded-lg border p-2.5 text-sm bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium capitalize">{fu.follow_up_type}</span>
                        <span className="text-xs text-muted-foreground">{fu.follow_up_date}</span>
                      </div>
                      {fu.notes && <p className="text-muted-foreground text-xs">{fu.notes}</p>}
                      {fu.next_follow_up && (
                        <p className="text-xs text-blue-600 mt-1">Next: {fu.next_follow_up}</p>
                      )}
                    </div>
                  ))}
                  {(followUps ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">No follow-ups logged yet</p>
                  )}
                </div>

                {/* Log follow-up form */}
                <form onSubmit={fuForm.handleSubmit(onFuSubmit)} className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Log Follow-Up</p>
                  <div className="grid grid-cols-2 gap-2">
                    <FieldWrapper label="Type">
                      <select {...fuForm.register("follow_up_type")} className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs">
                        <option value="call">Call</option>
                        <option value="email">Email</option>
                        <option value="visit">Visit</option>
                        <option value="message">Message</option>
                      </select>
                    </FieldWrapper>
                    <FieldWrapper label="Date" error={fuForm.formState.errors.follow_up_date?.message}>
                      <Input type="date" {...fuForm.register("follow_up_date")} className="h-8 text-xs" />
                    </FieldWrapper>
                    <FieldWrapper label="Next Follow-Up" className="col-span-2">
                      <Input type="date" {...fuForm.register("next_follow_up")} className="h-8 text-xs" />
                    </FieldWrapper>
                    <FieldWrapper label="Notes" className="col-span-2">
                      <textarea {...fuForm.register("notes")} rows={2}
                        className="flex w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs resize-none"
                        placeholder="What was discussed…" />
                    </FieldWrapper>
                  </div>
                  <Button type="submit" size="sm" disabled={fuMutation.isPending} className="w-full">
                    {fuMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Log Follow-Up
                  </Button>
                </form>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
