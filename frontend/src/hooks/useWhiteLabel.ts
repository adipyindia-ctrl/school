"use client";

import { useTenantStore } from "@/store/tenantStore";

/**
 * Returns `true` when the `white_label` module is enabled for the current
 * school tenant. When true, all vendor branding (name, logo, "Powered by"
 * footers) should be suppressed from the UI.
 *
 * Validates: Requirements 3.6
 */
export function useWhiteLabel(): boolean {
  return useTenantStore((state) => state.isModuleEnabled("white_label"));
}
