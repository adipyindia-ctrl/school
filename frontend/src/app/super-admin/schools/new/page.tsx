"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronRight, ChevronLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { SubscriptionPlan } from "@/types/school";

// Local extended type to include modules field from the API
interface PlanWithModules extends SubscriptionPlan {
  modules: { key: string; name: string }[];
}

const STEPS = ["Basic Info", "Branding", "Admin Account", "Modules", "Subscription", "Review"];

const ALL_MODULES = [
  "students", "parents", "teachers", "staff", "admissions",
  "academics", "attendance", "timetable", "homework", "exams",
  "fees", "transport", "library", "certificates",
  "notices", "events", "communication", "reports", "website",
];

// Use required strings with no .default() so RHF infers them correctly
const basicSchema = z.object({
  name: z.string().min(2, "School name is required"),
  code: z.string().min(2, "School code is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, hyphens"),
  school_type: z.string().min(1),
  country: z.string().min(1),
  established_year: z.coerce.number().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

const adminSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  password: z.string().min(8, "Min 8 characters"),
});

type BasicForm = z.infer<typeof basicSchema>;
type AdminForm = z.infer<typeof adminSchema>;

interface BrandingState {
  primary_color: string;
  secondary_color: string;
  sidebar_color: string;
  accent_color: string;
}

export default function NewSchoolPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [basicData, setBasicData] = useState<BasicForm | undefined>(undefined);
  const [brandingData, setBrandingData] = useState<BrandingState>({
    primary_color: "#1a73e8",
    secondary_color: "#34a853",
    sidebar_color: "#0f172a",
    accent_color: "#f59e0b",
  });
  const [adminData, setAdminData] = useState<AdminForm | undefined>(undefined);
  const [selectedModules, setSelectedModules] = useState<string[]>(ALL_MODULES);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(undefined);

  // Email availability check state
  const [emailToCheck, setEmailToCheck] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const basicForm = useForm<BasicForm>({
    resolver: zodResolver(basicSchema),
    defaultValues: { school_type: "cbse", country: "India" },
  });

  const adminForm = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
  });

  // Debounced email availability check
  const handleEmailChange = (value: string) => {
    setEmailStatus("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    setEmailStatus("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get<{ data: { available: boolean } }>(
          `/auth/check-email?email=${encodeURIComponent(trimmed)}`
        );
        setEmailStatus(res.data.data.available ? "available" : "taken");
        if (!res.data.data.available) {
          adminForm.setError("email", { message: "This email is already registered" });
        } else {
          adminForm.clearErrors("email");
        }
      } catch {
        setEmailStatus("idle");
      }
    }, 500);
  };

  const { data: plansData } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const res = await api.get<{ data: PlanWithModules[] }>("/platform/plans");
      return res.data.data;
    },
    enabled: step >= 4,
  });

  // When a plan is selected, auto-populate the modules from that plan
  const handlePlanSelect = (plan: PlanWithModules | undefined) => {
    setSelectedPlanId(plan?.id);
    if (plan && plan.modules && plan.modules.length > 0) {
      setSelectedModules(plan.modules.map((m) => m.key));
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        school: basicData,
        branding: brandingData,
        admin: adminData,
        enabled_modules: selectedModules,
        plan_id: selectedPlanId ?? null,
      };
      await api.post("/platform/schools", payload);
    },
    onSuccess: () => router.push("/super-admin/schools"),
  });

  const toggleModule = (key: string) => {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  const onBasicSubmit: SubmitHandler<BasicForm> = (data) => {
    setBasicData(data);
    setStep(1);
  };

  const onAdminSubmit: SubmitHandler<AdminForm> = (data) => {
    if (emailStatus === "taken") return; // extra safety guard
    setAdminData(data);
    setStep(3);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Add New School"
        description="Complete the onboarding wizard to create a new school"
      />

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <div
              className={cn(
                "flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold transition-colors",
                i < step
                  ? "bg-green-500 text-white"
                  : i === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-sm hidden sm:block",
                i === step ? "font-semibold" : "text-muted-foreground"
              )}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px w-6 mx-1", i < step ? "bg-green-500" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Step 0 — Basic Info */}
          {step === 0 && (
            <form
              id="step-form"
              onSubmit={basicForm.handleSubmit(onBasicSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>School Name *</Label>
                  <Input {...basicForm.register("name")} placeholder="Green Valley Public School" />
                  {basicForm.formState.errors.name && (
                    <p className="text-xs text-destructive">{basicForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>School Code *</Label>
                  <Input {...basicForm.register("code")} placeholder="GVPS" />
                  {basicForm.formState.errors.code && (
                    <p className="text-xs text-destructive">{basicForm.formState.errors.code.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Subdomain Slug *</Label>
                  <Input {...basicForm.register("slug")} placeholder="greenvalley" />
                  {basicForm.formState.errors.slug && (
                    <p className="text-xs text-destructive">{basicForm.formState.errors.slug.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Board / Type</Label>
                  <select
                    {...basicForm.register("school_type")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="cbse">CBSE</option>
                    <option value="icse">ICSE</option>
                    <option value="state_board">State Board</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Established Year</Label>
                  <Input
                    type="number"
                    {...basicForm.register("established_year")}
                    placeholder="2001"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input {...basicForm.register("phone")} placeholder="+91-9876543210" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    {...basicForm.register("email")}
                    placeholder="info@school.com"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Address</Label>
                  <Input {...basicForm.register("address")} placeholder="123, School Road" />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input {...basicForm.register("city")} placeholder="Bengaluru" />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input {...basicForm.register("state")} placeholder="Karnataka" />
                </div>
              </div>
            </form>
          )}

          {/* Step 1 — Branding */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(brandingData) as Array<keyof BrandingState>).map((key) => (
                  <div key={key} className="space-y-1.5">
                    <Label>
                      {key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandingData[key]}
                        onChange={(e) =>
                          setBrandingData((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="h-9 w-12 rounded border cursor-pointer p-0.5"
                      />
                      <Input
                        value={brandingData[key]}
                        onChange={(e) =>
                          setBrandingData((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                {Object.values(brandingData).map((color, i) => (
                  <div
                    key={i}
                    className="h-10 flex-1 rounded-lg"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Admin Account */}
          {step === 2 && (
            <form
              id="step-form"
              onSubmit={adminForm.handleSubmit(onAdminSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name *</Label>
                  <Input {...adminForm.register("first_name")} placeholder="Rajesh" />
                  {adminForm.formState.errors.first_name && (
                    <p className="text-xs text-destructive">
                      {adminForm.formState.errors.first_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name *</Label>
                  <Input {...adminForm.register("last_name")} placeholder="Kumar" />
                </div>
                <div className="space-y-1.5">
                  <Label>Admin Email *</Label>
                  <div className="relative">
                    <Input
                      type="email"
                      {...adminForm.register("email")}
                      placeholder="admin@school.com"
                      onChange={(e) => {
                        adminForm.register("email").onChange(e);
                        handleEmailChange(e.target.value);
                      }}
                      className={cn(
                        "pr-9",
                        emailStatus === "taken" && "border-destructive focus-visible:ring-destructive",
                        emailStatus === "available" && "border-green-500 focus-visible:ring-green-500",
                      )}
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {emailStatus === "checking" && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {emailStatus === "available" && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {emailStatus === "taken" && (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  {adminForm.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {adminForm.formState.errors.email.message}
                    </p>
                  )}
                  {emailStatus === "available" && !adminForm.formState.errors.email && (
                    <p className="text-xs text-green-600">Email is available</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input {...adminForm.register("phone")} placeholder="+91-9876543210" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    {...adminForm.register("password")}
                    placeholder="Min 8 characters"
                  />
                  {adminForm.formState.errors.password && (
                    <p className="text-xs text-destructive">
                      {adminForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* Step 3 — Modules */}
          {step === 3 && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Select modules to enable for this school.
              </p>
              {selectedPlanId && (
                <p className="text-xs text-primary bg-primary/5 border border-primary/20 rounded-md px-3 py-2 mb-4">
                  ✓ Modules pre-selected based on your chosen subscription plan. You can customize further.
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_MODULES.map((mod) => {
                  const isSelected = selectedModules.includes(mod);
                  return (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => toggleModule(mod)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border"
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                      <span className="capitalize">{mod.replace(/_/g, " ")}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4 — Subscription */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select a subscription plan. The plan's modules will be automatically assigned to this school. You can customize modules in the previous step.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePlanSelect(undefined)}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-colors",
                    !selectedPlanId
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <p className="font-semibold">Trial (No Plan)</p>
                  <p className="text-xs text-muted-foreground mt-1">30-day free trial with all modules</p>
                </button>
                {(plansData ?? []).map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handlePlanSelect(plan)}
                    className={cn(
                      "p-4 rounded-lg border text-left transition-colors",
                      selectedPlanId === plan.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">{plan.name}</p>
                      {selectedPlanId === plan.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-lg font-bold">
                      ₹{plan.price}
                      <span className="text-xs font-normal text-muted-foreground">
                        /{plan.billing_cycle}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Up to {plan.max_students.toLocaleString()} students
                    </p>
                    {plan.modules && plan.modules.length > 0 && (
                      <p className="text-xs text-primary mt-1 font-medium">
                        ✓ Includes {plan.modules.length} modules
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 — Review */}
          {step === 5 && basicData && adminData && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <p className="font-semibold text-base">{basicData.name}</p>
                <p className="text-muted-foreground">{basicData.slug}.domain.com</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <span className="text-muted-foreground">Board: </span>
                    {basicData.school_type.toUpperCase()}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location: </span>
                    {basicData.city}, {basicData.state}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Admin: </span>
                    {adminData.first_name} {adminData.last_name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    {adminData.email}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modules: </span>
                    {selectedModules.length} enabled
                  </div>
                </div>
              </div>
              {createMutation.isError && (
                <p className="text-sm text-destructive">
                  {(
                    createMutation.error as {
                      response?: { data?: { message?: string } };
                    }
                  )?.response?.data?.message ?? "Failed to create school"}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          step === 0 || step === 2 ? (
            <Button
              form="step-form"
              type="submit"
              disabled={step === 2 && (emailStatus === "taken" || emailStatus === "checking")}
            >
              {step === 2 && emailStatus === "checking" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking...</>
              ) : (
                <>Next <ChevronRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )
        ) : (
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !basicData || !adminData}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create School"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
