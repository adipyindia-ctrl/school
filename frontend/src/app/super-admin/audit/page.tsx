"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { ErrorState } from "@/components/data-display/ErrorState";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/common";

interface AuditEntry {
  id: string;
  school_id: string | null;
  actor_email: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  description: string | null;
  ip_address: string | null;
  created_at: string;
}

interface AuditPage {
  items: AuditEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

function actionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action === "login" || action === "logout") return "secondary";
  if (action.endsWith("_created") || action.endsWith("_onboarded")) return "default";
  if (action.endsWith("_deleted") || action.endsWith("_archived") || action.endsWith("_suspended")) return "destructive";
  return "outline";
}

interface Filters { actor_email: string; action: string; date_from: string; date_to: string; }
const EMPTY: Filters = { actor_email: "", action: "", date_from: "", date_to: "" };

export default function SuperAdminAuditPage() {
  const [page, setPage] = useState(1);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [draft, setDraft] = useState<Filters>(EMPTY);

  const buildParams = (f: Filters, pg: number) => {
    const p = new URLSearchParams({ page: String(pg), page_size: "50" });
    if (f.actor_email) p.set("actor_email", f.actor_email);
    if (f.action) p.set("action", f.action);
    if (f.date_from) p.set("date_from", f.date_from);
    if (f.date_to) p.set("date_to", f.date_to);
    return p.toString();
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["platform-audit", applied, page],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AuditPage>>(`/platform/audit?${buildParams(applied, page)}`);
      return res.data.data;
    },
  });

  const handleApply = () => { setPage(1); setApplied({ ...draft }); };
  const handleClear = () => { setDraft(EMPTY); setApplied(EMPTY); setPage(1); };
  const hasFilters = Object.values(applied).some(Boolean);

  const columns: { key: string; header: string; className?: string; render?: (row: AuditEntry) => React.ReactNode }[] = [
    {
      key: "created_at", header: "Timestamp",
      render: (row) => <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(row.created_at).toLocaleString()}</span>,
    },
    { key: "actor_email", header: "Actor", className: "max-w-[180px] truncate" },
    {
      key: "action", header: "Action",
      render: (row) => <Badge variant={actionVariant(row.action)} className="text-xs font-mono">{row.action}</Badge>,
    },
    {
      key: "resource_type", header: "Resource",
      render: (row) => row.resource_type
        ? <span className="text-sm"><span className="font-medium">{row.resource_type}</span>{row.resource_id && <span className="text-muted-foreground text-xs ml-1 font-mono">#{row.resource_id.slice(0, 8)}</span>}</span>
        : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: "description", header: "Description",
      render: (row) => <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{row.description || "—"}</span>,
    },
  ];

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 56px - 48px)" }}>
      {/* 56px = TopNav height, 48px ≈ p-6 top+bottom padding of main */}
      <PageHeader title="Platform Audit Logs" description="All actions across all schools." />

      {/* Filters — always visible, never scrolls away */}
      <div className="flex flex-wrap gap-3 mb-4 items-end shrink-0">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-muted-foreground mb-1 block">Actor email</label>
          <Input placeholder="user@school.com" value={draft.actor_email}
            onChange={(e) => setDraft((f) => ({ ...f, actor_email: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleApply()} />
        </div>
        <div className="w-44">
          <label className="text-xs text-muted-foreground mb-1 block">Action</label>
          <Input placeholder="e.g. school_created" value={draft.action}
            onChange={(e) => setDraft((f) => ({ ...f, action: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleApply()} />
        </div>
        <div className="w-36">
          <label className="text-xs text-muted-foreground mb-1 block">From date</label>
          <Input type="date" value={draft.date_from} onChange={(e) => setDraft((f) => ({ ...f, date_from: e.target.value }))} />
        </div>
        <div className="w-36">
          <label className="text-xs text-muted-foreground mb-1 block">To date</label>
          <Input type="date" value={draft.date_to} onChange={(e) => setDraft((f) => ({ ...f, date_to: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleApply}><Search className="mr-2 h-4 w-4" />Apply</Button>
          {hasFilters && <Button variant="ghost" onClick={handleClear}><X className="mr-2 h-4 w-4" />Clear</Button>}
        </div>
      </div>

      {/* Table area — only this scrolls */}
      <div className="flex flex-col min-h-0 flex-1 rounded-md border overflow-hidden">
        {/* Sticky column headers */}
        <div className="overflow-x-auto shrink-0 bg-muted/50 border-b">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable rows only */}
        <div className="overflow-y-auto overflow-x-auto flex-1">
          {isLoading ? (
            <div className="p-6"><LoadingSkeleton rows={8} cols={columns.length} /></div>
          ) : isError ? (
            <div className="p-6"><ErrorState onRetry={refetch} /></div>
          ) : !data?.items?.length ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No audit entries found.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 align-middle">
                        {col.render ? col.render(row) : String((row as unknown as Record<string, unknown>)[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination pinned at bottom */}
        {(data?.total ?? 0) > 50 && (
          <div className="shrink-0 border-t px-4 py-3 flex items-center justify-between bg-background">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * 50 + 1, data?.total ?? 0)}–{Math.min(page * 50, data?.total ?? 0)} of {data?.total ?? 0}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                ‹ Prev
              </Button>
              <span className="text-sm px-2">{page} / {data?.total_pages ?? 1}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= (data?.total_pages ?? 1)}>
                Next ›
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
