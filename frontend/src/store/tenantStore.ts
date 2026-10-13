import { create } from "zustand";
import type { TenantContext, Branding } from "@/types/school";
import { injectBranding } from "@/lib/theme";

interface TenantStore {
  tenant: TenantContext | null;
  setTenant: (tenant: TenantContext) => void;
  clearTenant: () => void;
  isModuleEnabled: (key: string) => boolean;
}

export const useTenantStore = create<TenantStore>((set, get) => ({
  tenant: null,

  setTenant: (tenant) => {
    // Inject branding CSS variables whenever tenant changes
    if (tenant.branding) {
      injectBranding(tenant.branding as Partial<Branding>);
    }
    set({ tenant });
  },

  clearTenant: () => set({ tenant: null }),

  isModuleEnabled: (key) => {
    const { tenant } = get();
    if (!tenant) return false;
    return tenant.enabled_modules.includes(key);
  },
}));
