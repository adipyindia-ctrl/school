"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

/**
 * Fixed banner shown inside the school dashboard layout whenever a Super Admin
 * is impersonating a school user.  Rendered above all other content so it is
 * always visible.
 */
export function ImpersonationBanner() {
  const { isImpersonating, impersonatedSchoolName, impersonatedSchoolId, endImpersonation } =
    useAuthStore();
  const router = useRouter();

  if (!isImpersonating) return null;

  async function handleExit() {
    // Best-effort: log end of impersonation on the backend.
    // We fire-and-forget since the impersonation token is about to be cleared.
    try {
      await api.post("/auth/impersonation/end");
    } catch {
      // Non-fatal — token may have already expired
    }
    const schoolId = impersonatedSchoolId;
    endImpersonation();
    if (schoolId) {
      router.push(`/super-admin/schools/${schoolId}`);
    } else {
      router.push("/super-admin/dashboard");
    }
  }

  return (
    <div className="flex items-center gap-3 bg-amber-50 border-b border-amber-300 px-4 py-2.5 text-sm text-amber-900 sticky top-0 z-50">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
      <span className="flex-1 font-medium">
        ⚠️ You are viewing as{" "}
        <span className="font-semibold">{impersonatedSchoolName ?? "a school"}</span>{" "}
        School Admin.
      </span>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-400 text-amber-800 hover:bg-amber-100 shrink-0"
        onClick={handleExit}
      >
        <LogOut className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        Exit Impersonation
      </Button>
    </div>
  );
}
