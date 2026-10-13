"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Globe, Link2, LogIn, Mail, Phone, Save, Pencil,
  Puzzle, Lock, CalendarDays, CreditCard, CheckCircle2,
  FlaskConical, Loader2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { ErrorState } from "@/components/data-display/ErrorState";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { School } from "@/types/school";
import type { ApiResponse } from "@/types/common";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImpersonateResponse {
  access_token: string; token_type: string; expires_in: number;
  impersonated_user: { id: string; email: string; name: string };
  school: { id: string; name: string; slug: string };
}
interface SchoolModule {
  key: string; name: string; description: string | null;
  is_core: boolean; is_enabled: boolean;
}
interface Subscription {
  id: string; plan_name: string | null; plan_id: string; status: string;
  start_date: string; end_date: string; amount: number; payment_status: string;
}

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "yourdomain.com";

// ── Edit form schema ──────────────────────────────────────────────────────────

const editSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().optional(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  school_type: z.string().min(1),
  established_year: z.coerce.number().optional(),
});
type EditForm = z.infer<typeof editSchema>;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { startImpersonation } = useAuthStore();
  const queryClient = useQueryClient();

  const [confirmImpersonate, setConfirmImpersonate] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState<string>("");
  const [editingDomain, setEditingDomain] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["school", id],
    queryFn: async () => {
      const res = await api.get<{ data: School }>(`/platform/schools/${id}`);
      const school = res.data.data;
      setCustomDomainInput(school.custom_domain ?? "");
      // Populate edit form with current values
      editForm.reset({
        name: school.name,
        phone: school.phone ?? "",
        email: school.email ?? "",
        website: school.website ?? "",
        address: school.address ?? "",
        city: school.city ?? "",
        state: school.state ?? "",
        country: school.country ?? "India",
        pincode: school.pincode ?? "",
        school_type: school.school_type,
        established_year: school.established_year ?? undefined,
      });
      return school;
    },
  });

  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: ["school-modules", id],
    queryFn: async () => {
      const res = await api.get<{ data: SchoolModule[] }>(`/platform/schools/${id}/modules`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: subData } = useQuery({
    queryKey: ["school-subscription", id],
    queryFn: async () => {
      const res = await api.get<{ data: { subscription: Subscription | null } }>(
        `/platform/schools/${id}/subscription`
      );
      return res.data.data.subscription;
    },
    enabled: !!id,
  });

  // Mutations
  const updateInfoMutation = useMutation({
    mutationFn: async (formData: EditForm) => {
      const res = await api.patch<{ data: School }>(`/platform/schools/${id}`, formData);
      return res.data.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["school", id], updated);
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setEditingInfo(false);
    },
  });

  const toggleModuleMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      await api.patch(`/platform/schools/${id}/modules/${key}?enabled=${enabled}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["school-modules", id] }),
  });

  const impersonateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<ImpersonateResponse>>(
        `/platform/schools/${id}/impersonate`
      );
      return res.data.data;
    },
    onSuccess: (result) => {
      startImpersonation(result.access_token, result.school.id, result.school.name, {
        id: result.impersonated_user.id,
        email: result.impersonated_user.email,
        first_name: result.impersonated_user.name.split(" ")[0] ?? "",
        last_name: result.impersonated_user.name.split(" ").slice(1).join(" "),
        user_type: "school_admin",
        school_id: result.school.id,
        permissions: [],
      });
      router.push("/dashboard");
    },
  });

  const updateDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      const res = await api.patch<{ data: School }>(`/platform/schools/${id}`, {
        custom_domain: domain.trim() === "" ? null : domain.trim().toLowerCase(),
      });
      return res.data.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["school", id], updated);
      setCustomDomainInput(updated.custom_domain ?? "");
      setEditingDomain(false);
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ message: string }>(`/platform/schools/${id}/seed-demo`);
      return res.data.message;
    },
    onSuccess: (msg) => setSeedResult(msg),
  });

  const onEditSubmit: SubmitHandler<EditForm> = (formData) => updateInfoMutation.mutate(formData);

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        title={data.name}
        description={`${data.slug} · ${data.school_type.toUpperCase()}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              className="text-violet-600 border-violet-300 hover:bg-violet-50"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              {seedMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="mr-2 h-4 w-4" />
              )}
              Seed Demo Data
            </Button>
            <Button
              variant="outline"
              className="text-amber-600 border-amber-300 hover:bg-amber-50"
              onClick={() => setConfirmImpersonate(true)}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Login as School Admin
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Basic Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">School Information</CardTitle>
            {!editingInfo && (
              <Button size="sm" variant="outline" onClick={() => setEditingInfo(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingInfo ? (
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label>School Name *</Label>
                    <Input {...editForm.register("name")} />
                    {editForm.formState.errors.name && (
                      <p className="text-xs text-destructive">{editForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Board / Type</Label>
                    <select {...editForm.register("school_type")}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                      <option value="cbse">CBSE</option>
                      <option value="icse">ICSE</option>
                      <option value="state_board">State Board</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Established Year</Label>
                    <Input type="number" {...editForm.register("established_year")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input {...editForm.register("phone")} placeholder="+91-..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" {...editForm.register("email")} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Website</Label>
                    <Input {...editForm.register("website")} placeholder="https://..." />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Address</Label>
                    <Input {...editForm.register("address")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input {...editForm.register("city")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>State</Label>
                    <Input {...editForm.register("state")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Input {...editForm.register("country")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pincode</Label>
                    <Input {...editForm.register("pincode")} />
                  </div>
                </div>
                {updateInfoMutation.isError && (
                  <p className="text-xs text-destructive">Failed to save changes.</p>
                )}
                <div className="flex gap-2 justify-end pt-1">
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => { setEditingInfo(false); editForm.reset(); }}>
                    <X className="h-3.5 w-3.5 mr-1" /> Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={updateInfoMutation.isPending}>
                    {updateInfoMutation.isPending ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3.5 w-3.5" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Status</p>
                  <StatusBadge status={data.status} />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Code</p>
                  <p className="font-medium">{data.code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Established</p>
                  <p className="font-medium">{data.established_year ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Board</p>
                  <p className="font-medium uppercase">{data.school_type}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs mb-0.5">Address</p>
                  <p className="font-medium">
                    {[data.address, data.city, data.state, data.pincode].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{data.phone ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{data.email ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>{data.website ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Custom Domain */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" /> Custom Domain
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {editingDomain ? (
              <div className="space-y-2">
                <Label htmlFor="custom-domain">Custom Domain</Label>
                <div className="flex gap-2">
                  <Input id="custom-domain" placeholder="school.customdomain.com"
                    value={customDomainInput} onChange={(e) => setCustomDomainInput(e.target.value)}
                    className="max-w-sm" />
                  <Button size="sm" onClick={() => updateDomainMutation.mutate(customDomainInput)}
                    disabled={updateDomainMutation.isPending}>
                    <Save className="h-4 w-4 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline"
                    onClick={() => { setEditingDomain(false); setCustomDomainInput(data.custom_domain ?? ""); }}>
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave blank to remove the custom domain.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {data.custom_domain ? (
                    <p className="text-sm font-medium">{data.custom_domain}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No custom domain set</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Default URL:{" "}
                    <code className="bg-muted px-1 rounded text-xs">{data.slug}.{APP_DOMAIN}</code>
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditingDomain(true)}>
                  {data.custom_domain ? "Change" : "Set Domain"}
                </Button>
              </div>
            )}
            {updateDomainMutation.isError && (
              <p className="text-xs text-destructive">Failed to update domain. It may already be in use.</p>
            )}
          </CardContent>
        </Card>

        {/* Branding preview */}
        {data.branding && (
          <Card>
            <CardHeader><CardTitle className="text-base">Branding</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              {[data.branding.primary_color, data.branding.secondary_color, data.branding.sidebar_color].map(
                (color, i) => (
                  <div key={i} className="h-10 w-10 rounded-lg border"
                    style={{ backgroundColor: color ?? "#ccc" }} title={color ?? ""} />
                )
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Subscription */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Subscription</h3>
        {subData ? (
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Plan</p>
                  <p className="font-semibold flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-primary" /> {subData.plan_name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                  <StatusBadge status={subData.status} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Start</p>
                  <p className="font-medium flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {new Date(subData.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">End</p>
                  <p className="font-medium flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {new Date(subData.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
                  <p className="font-semibold">₹{subData.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Payment</p>
                  <Badge variant={subData.payment_status === "paid" ? "default" : "secondary"} className="capitalize">
                    {subData.payment_status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              No subscription assigned yet.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modules */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Module Access</h3>
        {modulesLoading ? (
          <LoadingSkeleton rows={3} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {(modulesData ?? []).map((mod) => {
              const isPending =
                toggleModuleMutation.isPending &&
                (toggleModuleMutation.variables as { key: string })?.key === mod.key;
              return (
                <button key={mod.key} type="button"
                  disabled={mod.is_core || isPending}
                  onClick={() => !mod.is_core && toggleModuleMutation.mutate({ key: mod.key, enabled: !mod.is_enabled })}
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left",
                    mod.is_enabled ? "bg-primary/5 border-primary text-primary" : "bg-background border-border text-muted-foreground hover:bg-muted",
                    mod.is_core && "cursor-default opacity-80",
                    isPending && "opacity-50 cursor-wait"
                  )}
                  title={mod.is_core ? "Core module — cannot be disabled" : mod.description ?? ""}
                >
                  <span className="capitalize leading-tight">{mod.name || mod.key}</span>
                  {mod.is_core ? (
                    <Lock className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  ) : mod.is_enabled ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
        {toggleModuleMutation.isError && (
          <p className="text-xs text-destructive mt-2">
            {(toggleModuleMutation.error as { response?: { data?: { message?: string } } })
              ?.response?.data?.message ?? "Failed to update module"}
          </p>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={confirmImpersonate}
        onOpenChange={setConfirmImpersonate}
        title="Login as School Admin"
        description={`You will be logged into "${data.name}" as the School Admin. This session is logged in the audit trail.`}
        confirmLabel="Proceed"
        variant="default"
        isLoading={impersonateMutation.isPending}
        onConfirm={() => impersonateMutation.mutate()}
      />

      <ConfirmDialog
        open={!!seedResult}
        onOpenChange={(open) => !open && setSeedResult(null)}
        title="Demo Data Seeded"
        description={seedResult ?? ""}
        variant="default"
        confirmLabel="OK"
        onConfirm={() => setSeedResult(null)}
        isLoading={false}
      />
    </div>
  );
}
