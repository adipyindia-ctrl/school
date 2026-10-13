"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Palette, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { useTenantStore } from "@/store/tenantStore";
import { injectBranding } from "@/lib/theme";
import api from "@/lib/api";
import type { Branding, SchoolSettings } from "@/types/school";

const brandingSchema = z.object({
  primary_color: z.string(),
  secondary_color: z.string(),
  sidebar_color: z.string(),
  accent_color: z.string(),
  font_family: z.string().optional(),
  welcome_message: z.string().optional(),
  footer_text: z.string().optional(),
  support_phone: z.string().optional(),
  support_email: z.string().optional(),
});

const settingsSchema = z.object({
  attendance_threshold: z.coerce.number().min(0).max(100),
  fee_due_day: z.coerce.number().min(1).max(31),
  timezone: z.string().min(1),
  currency: z.string().min(1),
  date_format: z.string().min(1),
});

type BrandingForm = z.infer<typeof brandingSchema>;
type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { setTenant, tenant } = useTenantStore();

  const brandingQuery = useQuery({
    queryKey: ["branding"],
    queryFn: async () => {
      const res = await api.get<{ data: Branding }>("/settings/branding");
      return res.data.data;
    },
  });

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await api.get<{ data: SchoolSettings }>("/settings/general");
      return res.data.data;
    },
  });

  const brandingForm = useForm<BrandingForm>({
    resolver: zodResolver(brandingSchema),
    values: brandingQuery.data
      ? {
          primary_color: brandingQuery.data.primary_color,
          secondary_color: brandingQuery.data.secondary_color,
          sidebar_color: brandingQuery.data.sidebar_color,
          accent_color: brandingQuery.data.accent_color,
          font_family: brandingQuery.data.font_family ?? "",
          welcome_message: brandingQuery.data.welcome_message ?? "",
          footer_text: brandingQuery.data.footer_text ?? "",
          support_phone: brandingQuery.data.support_phone ?? "",
          support_email: brandingQuery.data.support_email ?? "",
        }
      : undefined,
  });

  const settingsForm = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: settingsQuery.data
      ? {
          attendance_threshold: settingsQuery.data.attendance_threshold,
          fee_due_day: settingsQuery.data.fee_due_day,
          timezone: settingsQuery.data.timezone,
          currency: settingsQuery.data.currency,
          date_format: settingsQuery.data.date_format,
        }
      : undefined,
  });

  const brandingMutation = useMutation({
    mutationFn: async (data: BrandingForm) => {
      const res = await api.patch<{ data: Branding }>("/settings/branding", data);
      return res.data.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["branding"] });
      // Inject updated CSS vars immediately
      injectBranding(updated);
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      await api.patch("/settings/general", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const onBrandingSubmit: SubmitHandler<BrandingForm> = (data) =>
    brandingMutation.mutate(data);

  const onSettingsSubmit: SubmitHandler<SettingsForm> = (data) =>
    settingsMutation.mutate(data);

  return (
    <div>
      <PageHeader title="Settings" description="Configure your school portal" />

      <Tabs defaultValue="branding">
        <TabsList className="mb-6">
          <TabsTrigger value="branding">
            <Palette className="mr-2 h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="general">
            <SettingsIcon className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand Colors & Identity</CardTitle>
            </CardHeader>
            <CardContent>
              {brandingQuery.isLoading ? (
                <LoadingSkeleton rows={4} />
              ) : (
                <form
                  onSubmit={brandingForm.handleSubmit(onBrandingSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(
                      [
                        ["primary_color", "Primary Color"],
                        ["secondary_color", "Secondary Color"],
                        ["sidebar_color", "Sidebar Color"],
                        ["accent_color", "Accent Color"],
                      ] as const
                    ).map(([field, label]) => (
                      <div key={field} className="space-y-1.5">
                        <Label>{label}</Label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            {...brandingForm.register(field)}
                            className="h-9 w-10 rounded border cursor-pointer p-0.5"
                          />
                          <Input
                            {...brandingForm.register(field)}
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Welcome Message</Label>
                      <Input
                        {...brandingForm.register("welcome_message")}
                        placeholder="Welcome to our school portal"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Support Phone</Label>
                      <Input
                        {...brandingForm.register("support_phone")}
                        placeholder="+91-9876543210"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Support Email</Label>
                      <Input
                        {...brandingForm.register("support_email")}
                        placeholder="support@school.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Footer Text</Label>
                      <Input
                        {...brandingForm.register("footer_text")}
                        placeholder="© 2025 School Name"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={brandingMutation.isPending}
                    >
                      {brandingMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Branding"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Academic & System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {settingsQuery.isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : (
                <form
                  onSubmit={settingsForm.handleSubmit(onSettingsSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Attendance Threshold (%)</Label>
                      <Input
                        type="number"
                        {...settingsForm.register("attendance_threshold")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fee Due Day</Label>
                      <Input
                        type="number"
                        {...settingsForm.register("fee_due_day")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Timezone</Label>
                      <Input
                        {...settingsForm.register("timezone")}
                        placeholder="Asia/Kolkata"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Currency</Label>
                      <Input
                        {...settingsForm.register("currency")}
                        placeholder="INR"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date Format</Label>
                      <Input
                        {...settingsForm.register("date_format")}
                        placeholder="DD/MM/YYYY"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={settingsMutation.isPending}
                    >
                      {settingsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Settings"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
