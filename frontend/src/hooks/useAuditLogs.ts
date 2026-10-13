import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { AuditLog, AuditLogFilters } from "@/types/audit";
import type { PaginatedResponse } from "@/types/common";

export function buildAuditParams(
  filters: AuditLogFilters,
  page: number,
  pageSize: number
): string {
  const p = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (filters.search) p.set("search", filters.search);
  if (filters.actor_email) p.set("actor_email", filters.actor_email);
  if (filters.action) p.set("action", filters.action);
  if (filters.resource_type) p.set("resource_type", filters.resource_type);
  if (filters.date_from) p.set("date_from", filters.date_from);
  if (filters.date_to) p.set("date_to", filters.date_to);
  return p.toString();
}

export function useAuditLogs(
  filters: AuditLogFilters,
  page: number,
  pageSize: number = 50
) {
  return useQuery({
    queryKey: ["audit-logs", filters, page, pageSize],
    queryFn: async () => {
      const qs = buildAuditParams(filters, page, pageSize);
      const res = await api.get<PaginatedResponse<AuditLog>>(`/audit/logs?${qs}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}
