"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Pencil, Trash2, Puzzle, Check, School } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { ErrorState } from "@/components/data-display/ErrorState";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ModuleInfo {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_core: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: string;
  max_students: number;
  max_teachers: number;
  storage_mb: number;
  sms_limit: number;
  trial_days: number;
  is_active: boolean;
  display_order: number;
  modules: ModuleInfo[];
}

// All available module keys in the system
const ALL_MODULE_KEYS: { key: string; label: string }[] = [
  { key: "students",      label: "Students" },
  { key: "parents",       label: "Parents" },
  { key: "teachers",      label: "Teachers" },
  { key: "staff",         label: "Staff" },
  { key: "admissions",    label: "Admissions / CRM" },
  { key: "academics",     label: "Academics" },
  { key: "attendance",    label: "Attendance" },
  { key: "timetable",     label: "Timetable" },
  { key: "homework",      label: "Homework" },
  { key: "exams",         label: "Exams & Results" },
  { key: "fees",          label: "Fees" },
  { key: "transport",     label: "Transport" },
  { key: "library",       label: "Library" },
  { key: "certificates",  label: "Certificates" },
  { key: "notices",       label: "Notices" },
  { key: "events",        label: "Events" },
  { key: "communication", label: "Communication" },
  { key: "reports",       label: "Reports" },
  { key: "website",       label: "Website Builder" },
  { key: "white_label",   label: "White Label" },
];

// ── Form schema ───────────────────────────────────────────────────────────────

const planSchema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  billing_cycle: z.enum(["monthly", "annual"]),
  max_students: z.coerce.number().min(1),
  max_teachers: z.coerce.number().min(1),
  storage_mb: z.coerce.number().min(1),
  sms_limit: z.coerce.number().min(0),
  trial_days: z.coerce.number().min(0),
  display_order: z.coerce.number().min(0),
});

type PlanForm = z.infer<typeof planSchema>;

// ── Module management dialog ──────────────────────────────────────────────────

function ModuleDialog({
  plan,
  open,
  onClose,
}: {
  plan: SubscriptionPlan;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  // Always read the live plan from the query cache so enabled state
  // updates immediately after each toggle without closing the dialog.
  const livePlan = (
    (queryClient.getQueryData(["plans"]) as SubscriptionPlan[] | undefined)?.find(
      (p) => p.id === plan.id
    ) ?? plan
  );
  const enabledKeys = new Set(livePlan.modules.map((m) => m.key));

  const toggleMutation = useMutation({
    mutationFn: async ({ key, enable }: { key: string; enable: boolean }) => {
      if (enable) {
        await api.post(`/platform/plans/${plan.id}/modules`, { module_key: key });
      } else {
        await api.delete(`/platform/plans/${plan.id}/modules/${key}`);
      }
    },
    onMutate: async ({ key, enable }) => {
      // Optimistic update — flip the module state in the cache immediately
      await queryClient.cancelQueries({ queryKey: ["plans"] });
      const prev = queryClient.getQueryData<SubscriptionPlan[]>(["plans"]);
      if (prev) {
        queryClient.setQueryData<SubscriptionPlan[]>(["plans"], (old) =>
          (old ?? []).map((p) => {
            if (p.id !== plan.id) return p;
            const modules = enable
              ? [...p.modules, { id: key, key, name: key, description: null, is_core: false }]
              : p.modules.filter((m) => m.key !== key);
            return { ...p, modules };
          })
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      // Roll back on error
      if (ctx?.prev) queryClient.setQueryData(["plans"], ctx.prev);
    },
    onSettled: () => {
      // Always re-sync with server
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-primary" />
            Modules for {livePlan.name}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2 mb-2">
          Toggle which modules are included in this subscription plan. Schools subscribing to this plan will get access to these modules.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {ALL_MODULE_KEYS.map(({ key, label }) => {
            const isEnabled = enabledKeys.has(key);
            const isPending = toggleMutation.isPending && toggleMutation.variables?.key === key;
            return (
              <button
                key={key}
                type="button"
                disabled={isPending}
                onClick={() => toggleMutation.mutate({ key, enable: !isEnabled })}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left",
                  isEnabled
                    ? "bg-primary/5 border-primary text-primary"
                    : "bg-background border-border text-muted-foreground hover:bg-muted",
                  isPending && "opacity-50 cursor-wait"
                )}
              >
                <span className="capitalize">{label}</span>
                {isEnabled && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Schools dialog ────────────────────────────────────────────────────────────

interface AttachedSchool {
  id: string;
  name: string;
  slug: string;
  code: string;
  city: string | null;
  state: string | null;
  status: string;
  subscription_status: string;
  subscription_end: string | null;
}

function PlanSchoolsDialog({
  plan,
  open,
  onClose,
}: {
  plan: SubscriptionPlan;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const { data: schools, isLoading } = useQuery({
    queryKey: ["plan-schools", plan.id],
    queryFn: async () => {
      const res = await api.get<{ data: AttachedSchool[] }>(`/platform/plans/${plan.id}/schools`);
      return res.data.data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-5 w-5 text-primary" />
            Schools on {plan.name}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          All schools currently subscribed to this plan.
        </p>

        <div className="flex-1 overflow-y-auto min-h-0 mt-2">
          {isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : !schools?.length ? (
            <div className="text-center py-10 text-muted-foreground">
              <School className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No schools are subscribed to this plan.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {schools.map((school) => (
                <div
                  key={school.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-background hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{school.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {school.code} · {[school.city, school.state].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <StatusBadge status={school.status} />
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sub: <span className="capitalize">{school.subscription_status}</span>
                        {school.subscription_end && (
                          <> · expires {new Date(school.subscription_end).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { onClose(); router.push(`/super-admin/schools/${school.id}`); }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t shrink-0">
          <p className="text-xs text-muted-foreground">
            {schools?.length ?? 0} school{(schools?.length ?? 0) !== 1 ? "s" : ""} on this plan
          </p>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | undefined>();
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | undefined>();
  const [modulePlan, setModulePlan] = useState<SubscriptionPlan | undefined>();
  const [schoolsPlan, setSchoolsPlan] = useState<SubscriptionPlan | undefined>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const res = await api.get<{ data: SubscriptionPlan[] }>("/platform/plans");
      return res.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      billing_cycle: "monthly",
      max_students: 500,
      max_teachers: 50,
      storage_mb: 1024,
      sms_limit: 0,
      trial_days: 30,
      display_order: 0,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: PlanForm) => {
      if (editing) {
        await api.patch(`/platform/plans/${editing.id}`, payload);
      } else {
        await api.post("/platform/plans", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setFormOpen(false);
      setEditing(undefined);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (planId: string) => {
      await api.delete(`/platform/plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setDeletingPlan(undefined);
    },
  });

  const openCreate = () => {
    setEditing(undefined);
    reset({
      billing_cycle: "monthly",
      max_students: 500,
      max_teachers: 50,
      storage_mb: 1024,
      sms_limit: 0,
      trial_days: 30,
      display_order: 0,
    });
    setFormOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditing(plan);
    reset({
      name: plan.name,
      description: plan.description ?? "",
      price: plan.price,
      billing_cycle: plan.billing_cycle as "monthly" | "annual",
      max_students: plan.max_students,
      max_teachers: plan.max_teachers,
      storage_mb: plan.storage_mb,
      sms_limit: plan.sms_limit,
      trial_days: plan.trial_days,
      display_order: plan.display_order,
    });
    setFormOpen(true);
  };

  const onSubmit: SubmitHandler<PlanForm> = (data) => saveMutation.mutate(data);

  if (isLoading) return <LoadingSkeleton type="card" rows={4} />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        description="Create plans with specific modules. Schools pick a plan during onboarding."
        actions={
          <Button onClick={openCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        }
      />

      {(data ?? []).length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Puzzle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No plans yet</p>
          <p className="text-sm mt-1">Create your first subscription plan to get started.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(data ?? []).map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg leading-tight">{plan.name}</CardTitle>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(plan)} aria-label="Edit plan">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSchoolsPlan(plan)} aria-label="View schools">
                    <School className="h-3.5 w-3.5 text-blue-500" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingPlan(plan)}
                    aria-label="Delete plan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {plan.description && (
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              )}
            </CardHeader>

            <CardContent className="flex flex-col flex-1 gap-3 text-sm">
              {/* Pricing */}
              <div>
                <span className="text-2xl font-bold">₹{plan.price.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">/{plan.billing_cycle}</span>
              </div>

              {/* Limits */}
              <div className="space-y-1 text-muted-foreground text-xs">
                <p>👥 Up to {plan.max_students.toLocaleString()} students</p>
                <p>🎓 Up to {plan.max_teachers.toLocaleString()} teachers</p>
                <p>💾 {plan.storage_mb >= 1024 ? `${plan.storage_mb / 1024} GB` : `${plan.storage_mb} MB`} storage</p>
                <p>🗓 {plan.trial_days}-day trial</p>
              </div>

              {/* Modules assigned to plan */}
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Modules ({plan.modules.length})
                </p>
                {plan.modules.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No modules assigned</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {plan.modules.slice(0, 6).map((m) => (
                      <Badge key={m.key} variant="secondary" className="text-xs capitalize">
                        {m.name || m.key}
                      </Badge>
                    ))}
                    {plan.modules.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{plan.modules.length - 6} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Manage modules button */}
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2"
                onClick={() => setModulePlan(plan)}
              >
                <Puzzle className="mr-2 h-3.5 w-3.5" />
                Manage Modules
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create / Edit Plan Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Plan" : "New Subscription Plan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Plan Name *</Label>
                <Input {...register("name")} placeholder="Standard" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Input {...register("description")} placeholder="Ideal for medium schools" />
              </div>
              <div className="space-y-1.5">
                <Label>Price (₹) *</Label>
                <Input type="number" {...register("price")} />
              </div>
              <div className="space-y-1.5">
                <Label>Billing Cycle</Label>
                <select
                  {...register("billing_cycle")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Max Students</Label>
                <Input type="number" {...register("max_students")} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Teachers</Label>
                <Input type="number" {...register("max_teachers")} />
              </div>
              <div className="space-y-1.5">
                <Label>Storage (MB)</Label>
                <Input type="number" {...register("storage_mb")} />
              </div>
              <div className="space-y-1.5">
                <Label>Trial Days</Label>
                <Input type="number" {...register("trial_days")} />
              </div>
              <div className="space-y-1.5">
                <Label>SMS Limit</Label>
                <Input type="number" {...register("sms_limit")} />
              </div>
              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input type="number" {...register("display_order")} />
              </div>
            </div>

            {saveMutation.isError && (
              <p className="text-xs text-destructive">
                {(saveMutation.error as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ?? "Failed to save plan"}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editing ? "Save Changes" : "Create Plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deletingPlan}
        onOpenChange={(open) => { if (!open) { deleteMutation.reset(); setDeletingPlan(undefined); } }}
        title="Delete Plan"
        description={
          deleteMutation.isError
            ? (deleteMutation.error as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? "Failed to delete plan"
            : `Delete "${deletingPlan?.name}"? This cannot be undone. Plans with active school subscriptions cannot be deleted.`
        }
        variant="destructive"
        confirmLabel={deleteMutation.isError ? "Close" : "Delete"}
        onConfirm={() => {
          if (deleteMutation.isError) {
            deleteMutation.reset();
            setDeletingPlan(undefined);
          } else if (deletingPlan) {
            deleteMutation.mutate(deletingPlan.id);
          }
        }}
        isLoading={deleteMutation.isPending}
      />

      {/* Module management dialog */}
      {modulePlan && (
        <ModuleDialog
          plan={modulePlan}
          open={!!modulePlan}
          onClose={() => setModulePlan(undefined)}
        />
      )}

      {/* Attached schools dialog */}
      {schoolsPlan && (
        <PlanSchoolsDialog
          plan={schoolsPlan}
          open={!!schoolsPlan}
          onClose={() => setSchoolsPlan(undefined)}
        />
      )}
    </div>
  );
}
