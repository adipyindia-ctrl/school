import { create } from "zustand";
import type { User } from "@/types/auth";
import { getAccessToken, setAccessToken, clearTokens } from "@/lib/auth";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Impersonation state
  isImpersonating: boolean;
  impersonatedSchoolId: string | null;
  impersonatedSchoolName: string | null;

  /**
   * Stores the Super Admin's own token so it can be restored after impersonation ends.
   * Never exposed to the impersonated school's API calls.
   */
  superAdminToken: string | null;
  superAdminUser: User | null;

  setUser: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (perm: string) => boolean;
  isSuperAdmin: () => boolean;

  /** Called when a Super Admin starts an impersonation session. */
  startImpersonation: (token: string, schoolId: string, schoolName: string, user: User) => void;
  /** Called when the Super Admin exits the impersonation session. */
  endImpersonation: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  isImpersonating: false,
  impersonatedSchoolId: null,
  impersonatedSchoolName: null,
  superAdminToken: null,
  superAdminUser: null,

  setUser: (user, token) => {
    setAccessToken(token);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    clearTokens();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isImpersonating: false,
      impersonatedSchoolId: null,
      impersonatedSchoolName: null,
      superAdminToken: null,
      superAdminUser: null,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  hasPermission: (perm) => {
    const { user } = get();
    if (!user) return false;
    if (user.user_type === "super_admin") return true;
    return user.permissions.includes(perm);
  },

  isSuperAdmin: () => get().user?.user_type === "super_admin",

  startImpersonation: (token, schoolId, schoolName, impersonatedUser) => {
    // Snapshot the current super-admin session before switching tokens
    const { user: currentUser } = get();
    const currentToken = getAccessToken();

    setAccessToken(token);
    set({
      user: impersonatedUser,
      isAuthenticated: true,
      isLoading: false,
      isImpersonating: true,
      impersonatedSchoolId: schoolId,
      impersonatedSchoolName: schoolName,
      superAdminToken: currentToken,
      superAdminUser: currentUser,
    });
  },

  endImpersonation: () => {
    const { superAdminToken, superAdminUser } = get();

    if (superAdminToken && superAdminUser) {
      // Restore the super-admin session
      setAccessToken(superAdminToken);
      set({
        user: superAdminUser,
        isAuthenticated: true,
        isLoading: false,
        isImpersonating: false,
        impersonatedSchoolId: null,
        impersonatedSchoolName: null,
        superAdminToken: null,
        superAdminUser: null,
      });
    } else {
      // Fallback: no saved super-admin token → full logout
      clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isImpersonating: false,
        impersonatedSchoolId: null,
        impersonatedSchoolName: null,
        superAdminToken: null,
        superAdminUser: null,
      });
    }
  },
}));
