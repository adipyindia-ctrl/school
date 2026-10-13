"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

/**
 * On mount, attempt to restore the session via the refresh endpoint.
 * The refresh token lives in an HttpOnly cookie, so we just call /auth/refresh.
 */
export function useAuthInit() {
  const { setUser, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const res = await api.post("/auth/refresh");
        if (!cancelled) {
          const { access_token, user } = res.data.data;
          setUser(user, access_token);
        }
      } catch {
        if (!cancelled) clearAuth();
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useAuth() {
  return useAuthStore();
}
