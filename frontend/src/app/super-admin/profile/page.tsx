"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User, Lock, Building2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { useAuthStore } from "@/store/authStore";
import { getAccessToken } from "@/lib/auth";
import api from "@/lib/api";

// ── Schemas ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  user_type: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { setUser, user: storeUser } = useAuthStore();

  // Fetch current profile from server
  const profileQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get<{ data: UserProfile }>("/auth/me");
      return res.data.data;
    },
  });

  // Fetch school limit
  const limitQuery = useQuery({
    queryKey: ["school-limit"],
    queryFn: async () => {
      const res = await api.get<{ data: { max_schools: number; current_count: number; can_add_more: boolean } }>(
        "/platform/schools/limit"
      );
      return res.data.data;
    },
  });

  const [limitValue, setLimitValue] = React.useState<number>(1);
  React.useEffect(() => {
    if (limitQuery.data) setLimitValue(limitQuery.data.max_schools);
  }, [limitQuery.data]);

  const limitMutation = useMutation({
    mutationFn: async (max: number) => {
      const res = await api.patch<{ data: { max_schools: number } }>(
        `/platform/schools/limit?max_schools=${max}`
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-limit"] });
    },
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profileQuery.data
      ? {
          first_name: profileQuery.data.first_name,
          last_name: profileQuery.data.last_name,
          phone: profileQuery.data.phone ?? "",
        }
      : undefined,
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await api.patch<{ data: UserProfile }>("/auth/me", data);
      return res.data.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      // Keep the auth store in sync so the TopNav name updates immediately
      if (storeUser) {
        const token = getAccessToken() ?? "";
        setUser(
          {
            ...storeUser,
            first_name: updated.first_name,
            last_name: updated.last_name,
          },
          token,
        );
      }
    },
  });

  // Change password mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      await api.post("/auth/change-password", {
        current_password: data.current_password,
        new_password: data.new_password,
      });
    },
    onSuccess: () => {
      passwordForm.reset();
    },
  });

  const onProfileSubmit: SubmitHandler<ProfileForm> = (data) =>
    profileMutation.mutate(data);

  const onPasswordSubmit: SubmitHandler<PasswordForm> = (data) =>
    passwordMutation.mutate(data);

  return (
    <div>
      <PageHeader
        title="Profile Settings"
        description="Update your account information and password"
      />

      <Tabs defaultValue="profile" className="max-w-2xl">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="mr-2 h-4 w-4" />
            Password
          </TabsTrigger>
          <TabsTrigger value="platform">
            <Building2 className="mr-2 h-4 w-4" />
            Platform
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              {profileQuery.isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : (
                <form
                  onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                  className="space-y-5"
                >
                  {/* Read-only email */}
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input
                      value={profileQuery.data?.email ?? ""}
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        {...profileForm.register("first_name")}
                        placeholder="First name"
                      />
                      {profileForm.formState.errors.first_name && (
                        <p className="text-xs text-destructive">
                          {profileForm.formState.errors.first_name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        {...profileForm.register("last_name")}
                        placeholder="Last name"
                      />
                      {profileForm.formState.errors.last_name && (
                        <p className="text-xs text-destructive">
                          {profileForm.formState.errors.last_name.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      {...profileForm.register("phone")}
                      placeholder="+91-9876543210"
                    />
                  </div>

                  {profileMutation.isError && (
                    <p className="text-sm text-destructive">
                      {(
                        profileMutation.error as {
                          response?: { data?: { message?: string } };
                        }
                      )?.response?.data?.message ?? "Failed to update profile"}
                    </p>
                  )}
                  {profileMutation.isSuccess && (
                    <p className="text-sm text-green-600">Profile updated successfully.</p>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={profileMutation.isPending}>
                      {profileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Profile"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    {...passwordForm.register("current_password")}
                    placeholder="Enter current password"
                  />
                  {passwordForm.formState.errors.current_password && (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.current_password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    {...passwordForm.register("new_password")}
                    placeholder="At least 8 characters"
                  />
                  {passwordForm.formState.errors.new_password && (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.new_password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    {...passwordForm.register("confirm_password")}
                    placeholder="Repeat new password"
                  />
                  {passwordForm.formState.errors.confirm_password && (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.confirm_password.message}
                    </p>
                  )}
                </div>

                {passwordMutation.isError && (
                  <p className="text-sm text-destructive">
                    {(
                      passwordMutation.error as {
                        response?: { data?: { message?: string } };
                      }
                    )?.response?.data?.message ?? "Failed to change password"}
                  </p>
                )}
                {passwordMutation.isSuccess && (
                  <p className="text-sm text-green-600">Password changed successfully.</p>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={passwordMutation.isPending}>
                    {passwordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Settings Tab */}
        <TabsContent value="platform">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">School Limit</CardTitle>
              <CardDescription>
                Control how many schools can exist on this platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {limitQuery.isLoading ? (
                <LoadingSkeleton rows={2} />
              ) : (
                <div className="space-y-5">
                  {/* Usage summary */}
                  <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/40">
                    <div>
                      <p className="text-sm font-medium">Current Usage</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {limitQuery.data?.current_count ?? 0} of {limitQuery.data?.max_schools ?? 1} school(s) created
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {limitQuery.data?.current_count ?? 0}
                        <span className="text-base font-normal text-muted-foreground">
                          /{limitQuery.data?.max_schools ?? 1}
                        </span>
                      </p>
                      <p className={`text-xs font-medium ${limitQuery.data?.can_add_more ? "text-green-600" : "text-destructive"}`}>
                        {limitQuery.data?.can_add_more ? "Can add more" : "Limit reached"}
                      </p>
                    </div>
                  </div>

                  {/* Limit input with +/- controls */}
                  <div className="space-y-2">
                    <Label>Maximum Schools Allowed</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setLimitValue((v) => Math.max(1, v - 1))}
                        disabled={limitValue <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        max={1000}
                        value={limitValue}
                        onChange={(e) => setLimitValue(Math.max(1, Math.min(1000, Number(e.target.value))))}
                        className="w-24 text-center text-lg font-semibold"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setLimitValue((v) => Math.min(1000, v + 1))}
                        disabled={limitValue >= 1000}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">schools</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Setting this to 1 means only one school can exist at a time. Max 1000.
                    </p>
                  </div>

                  {limitMutation.isError && (
                    <p className="text-sm text-destructive">
                      {(limitMutation.error as { response?: { data?: { message?: string } } })
                        ?.response?.data?.message ?? "Failed to update limit"}
                    </p>
                  )}
                  {limitMutation.isSuccess && (
                    <p className="text-sm text-green-600">
                      School limit updated to {limitQuery.data?.max_schools}.
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={() => limitMutation.mutate(limitValue)}
                      disabled={limitMutation.isPending || limitValue === limitQuery.data?.max_schools}
                    >
                      {limitMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                      ) : (
                        "Save Limit"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
