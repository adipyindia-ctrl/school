"use client";

import { useAuthStore } from "@/store/authStore";

export function usePermission(perm: string): boolean {
  return useAuthStore((s) => s.hasPermission(perm));
}

export function useHasAnyPermission(perms: string[]): boolean {
  return useAuthStore((s) => perms.some((p) => s.hasPermission(p)));
}
