import type { Branding } from "@/types/school";

export function injectBranding(branding: Partial<Branding>): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const map: Record<string, string | null | undefined> = {
    "--color-primary": branding.primary_color,
    "--color-secondary": branding.secondary_color,
    "--color-sidebar": branding.sidebar_color,
    "--color-accent": branding.accent_color,
    "--font-family": branding.font_family,
  };

  for (const [variable, value] of Object.entries(map)) {
    if (value) {
      root.style.setProperty(variable, value);
    }
  }
}

export function resetBranding(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.removeProperty("--color-primary");
  root.style.removeProperty("--color-secondary");
  root.style.removeProperty("--color-sidebar");
  root.style.removeProperty("--color-accent");
  root.style.removeProperty("--font-family");
}

export const DEFAULT_BRANDING: Partial<Branding> = {
  primary_color: "#1a73e8",
  secondary_color: "#34a853",
  sidebar_color: "#0f172a",
  accent_color: "#f59e0b",
  font_family: "Inter",
};
