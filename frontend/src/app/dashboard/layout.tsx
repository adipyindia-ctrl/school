"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useTenantStore } from "@/store/tenantStore";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { TopNav } from "@/components/layout/TopNav";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { SubscriptionBanner } from "@/components/layout/SubscriptionBanner";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import { isRouteAllowedForUser } from "@/lib/roleAccess";
import api from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, setUser, clearAuth, user } = useAuthStore();
  const { setTenant, tenant, isModuleEnabled } = useTenantStore();
  const router = useRouter();
  const pathname = usePathname();

  // Route-level role guard: the sidebar hides links a role can't use, but a user
  // could still navigate directly by URL. If the current route isn't allowed for
  // this user's role, send them back to the dashboard home.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (!isRouteAllowedForUser(user, pathname)) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, user, pathname, router]);

  // Update page title: when white_label module is enabled, replace vendor name
  // with the school's own name so vendor branding doesn't appear in browser tabs.
  useEffect(() => {
    if (!tenant) return;
    if (isModuleEnabled("white_label")) {
      document.title = tenant.name;
    }
  }, [tenant, isModuleEnabled]);

  const { isImpersonating } = useAuthStore();

  useEffect(() => {
    async function loadTenant(access_token: string, school_id: string) {
      let brandingData: import("@/types/school").Branding | null = null;
      let enabledModules: string[] = [];

      try {
        const modulesRes = await api.get<{ data: { enabled_modules: string[] } }>(
          `/settings/modules`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        );
        enabledModules = modulesRes.data.data.enabled_modules;
      } catch {
        // sidebar degrades gracefully
      }

      try {
        const brandingRes = await api.get<{ data: import("@/types/school").Branding }>(
          `/settings/branding`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        );
        brandingData = brandingRes.data.data;
      } catch {
        // branding not configured yet — non-fatal
      }

      setTenant({
        school_id,
        name: brandingData?.welcome_message ?? "School Portal",
        slug: "",
        status: "active",
        custom_domain: null,
        branding: brandingData ?? {},
        enabled_modules: enabledModules,
      });
    }

    async function init() {
      try {
        if (isImpersonating) return;

        // Restore session from refresh token cookie
        const res = await api.post("/auth/refresh");
        const { access_token, user: u } = res.data.data;
        setUser(u, access_token);

        if (u.user_type === "super_admin") {
          router.replace("/super-admin/dashboard");
          return;
        }

        if (u.school_id) {
          await loadTenant(access_token, u.school_id);
        }
      } catch {
        clearAuth();
        router.replace("/login");
      }
    }

    if (!isAuthenticated) {
      // Page refresh — restore session then load tenant
      init();
    } else if (user?.school_id && !tenant) {
      // Fresh login — session already set, but tenant store is empty
      // Get the current access token from memory and load tenant
      import("@/lib/auth").then(({ getAccessToken }) => {
        const token = getAccessToken();
        if (token && user.school_id) {
          loadTenant(token, user.school_id);
        }
      });
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-64">
          <LoadingSkeleton rows={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav />
        <ImpersonationBanner />
        <SubscriptionBanner />
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
