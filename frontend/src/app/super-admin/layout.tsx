"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { SuperAdminSidebar } from "@/components/layout/SuperAdminSidebar";
import { TopNav } from "@/components/layout/TopNav";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import api from "@/lib/api";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, setUser, clearAuth, isSuperAdmin } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const res = await api.post("/auth/refresh");
        const { access_token, user } = res.data.data;
        setUser(user, access_token);
        if (user.user_type !== "super_admin") {
          router.replace("/dashboard");
        }
      } catch {
        clearAuth();
        router.replace("/login");
      }
    }
    if (!isAuthenticated) {
      init();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-64">
          <LoadingSkeleton rows={4} />
        </div>
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <SuperAdminSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopNav />
        <main className="flex-1 p-6 bg-slate-50 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
