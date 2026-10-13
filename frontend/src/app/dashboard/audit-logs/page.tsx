"use client";

import { useState } from "react";
import { Download, Search, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { useAuditLogs, buildAuditParams } from "@/hooks/useAuditLogs";
import type { AuditLog, AuditLogFilters } from "@/types/audit";
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
  EMPTY_AUDIT_FILTERS,
} from "@/types/audit";

// ── Action badge ──────────────────────────────────────────────────────────────

const ACTION_BADGE: Record<string, string> = {
  created: "bg-green-100 text-green-800 border-green-200",
  updated: "bg-blue-100 text-blue-800 border-blue-200",
  deleted: "bg-red-100 text-red-800 border-red-200",
  login: "bg-yellow-100 text-yellow-800 border-yellow-200",
  logout: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

function ActionBadge({ action }: { action: string }) {
  const base = "text-xs font-medium px-2 py-0.5 rounded-full border";
  const color =
    Object.entries(ACTION_BADGE).find(([k]) => action.includes(k))?.[1] ??
    "bg-slate-100 text-slate-700 border-slate-200";
  return <span className={`${base} ${color}`}>{action}</span>;
}

// ── Relative time ─────────────────────────────────────────────────────────────

function RelativeTime({ iso }: { iso: string }) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  let rel = "just now";
  if (mins >= 1 && mins < 60) rel = `${mins}m ago`;
  else if (hours >= 1 && hours < 24) rel = `${hours}h ago`;
  else if (days >= 1) rel = `${days}d ago`;

  return (
    <span title={d.toLocaleString()} className="text-xs text-muted-foreground whitespace-nowrap cursor-default">
      {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      <span className="ml-1 opacity-60">({rel})</span>
    </span>
  );
}

// ── JSON diff viewer ──────────────────────────────────────────────────────────

function JsonBlock({ label, data }: { label: string; data: Record<string, unknown> | null }) {
  if (!data) return null;
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{label}</p>
      <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto max-h-64">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

// ── Detail sheet ──────────────────────────────────────────────────────────────

function AuditDetailSheet({
  log,
  onClose,
}: {
  log: AuditLog | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!log} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {log && (
          <>
            <SheetHeader className="mb-4">
              <SheetTitle>Audit Detail</SheetTitle>
            </SheetHeader>

            <div className="space-y-2 text-sm mb-5">
              <div className="flex items-center gap-2">
                <ActionBadge action={log.action} />
              </div>
              <p className="text-muted-foreground">
                Actor: <span className="text-foreground font-medium">{log.actor_email}</span>
              </p>
              {log.resource_type && (
                <p className="text-muted-foreground">
                  Resource:{" "}
                  <span className="text-foreground font-medium">{log.resource_type}</span>
                  {log.resource_id && (
                    <span className="ml-1 font-mono text-xs text-muted-foreground">
                      #{log.resource_id}
                    </span>
                  )}
                </p>
              )}
              {log.ip_address && (
                <p className="text-muted-foreground">
                  IP: <span className="text-foreground font-mono">{log.ip_address}</span>
                </p>
              )}
              {log.description && (
                <p className="text-muted-foreground italic">"{log.description}"</p>
              )}
              <p className="text-muted-foreground">
                Timestamp: <span className="text-foreground">{new Date(log.created_at).toLocaleString()}</span>
              </p>
            </div>

            <div className="border-t pt-4">
              <JsonBlock label="Old Values" data={log.old_values} />
              <JsonBlock label="New Values" data={log.new_values} />
              {!log.old_values && !log.new_values && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No value changes recorded for this event.
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [applied, setApplied] = useState<AuditLogFilters>(EMPTY_AUDIT_FILTERS);
  const [draft, setDraft] = useState<AuditLogFilters>(EMPTY_AUDIT_FILTERS);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const { data, isLoading, isError, refetch } = useAuditLogs(applied, page, PAGE_SIZE);

  const handleApply = () => {
    setPage(1);
    setApplied({ ...draft });
  };

  const handleClear = () => {
    setDraft(EMPTY_AUDIT_FILTERS);
    setApplied(EMPTY_AUDIT_FILTERS);
    setPage(1);
  };

  const handleExport = () => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const qs = buildAuditParams(applied, 1, PAGE_SIZE);
    // Strip page/page_size — export endpoint doesn't paginate
    const params = new URLSearchParams(qs);
    params.delete("page");
    params.delete("page_size");
    window.open(`${base}/api/v1/audit/logs/export?${params.toString()}`, "_blank");
  };

  const hasFilters = Object.values(applied).some(Boolean);

  const columns: Column<AuditLog>[] = [
    {
      key: "created_at",
      header: "Timestamp",
      render: (row) => <RelativeTime iso={row.created_at} />,
    },
    {
      key: "actor_email",
      header: "Actor",
      className: "max-w-[180px] truncate",
      render: (row) => (
        <span className="text-sm font-medium">{row.actor_email}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => <ActionBadge action={row.action} />,
    },
    {
      key: "resource_type",
      header: "Resource",
      render: (row) =>
        row.resource_type ? (
          <span className="text-sm">
            <span className="font-medium">{row.resource_type}</span>
            {row.resource_id && (
              <span className="text-muted-foreground text-xs ml-1 font-mono">
                #{row.resource_id.slice(0, 8)}
              </span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      key: "ip_address",
      header: "IP Address",
      render: (row) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.ip_address || "—"}
        </span>
      ),
    },
    {
      key: "details",
      header: "",
      render: (row) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSelected(row)}
          aria-label="View details"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Track all significant actions performed in your school account."
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-5 items-end">
        {/* General search */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground mb-1 block">Search</label>
          <Input
            placeholder="Search by email or resource…"
            value={draft.search}
            onChange={(e) => setDraft((f) => ({ ...f, search: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
          />
        </div>

        {/* Action dropdown */}
        <div className="w-44">
          <label className="text-xs text-muted-foreground mb-1 block">Action</label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={draft.action}
            onChange={(e) => setDraft((f) => ({ ...f, action: e.target.value }))}
          >
            {AUDIT_ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {/* Resource type dropdown */}
        <div className="w-44">
          <label className="text-xs text-muted-foreground mb-1 block">Resource Type</label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={draft.resource_type}
            onChange={(e) => setDraft((f) => ({ ...f, resource_type: e.target.value }))}
          >
            {AUDIT_RESOURCE_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="w-36">
          <label className="text-xs text-muted-foreground mb-1 block">From date</label>
          <Input
            type="date"
            value={draft.date_from}
            onChange={(e) => setDraft((f) => ({ ...f, date_from: e.target.value }))}
          />
        </div>
        <div className="w-36">
          <label className="text-xs text-muted-foreground mb-1 block">To date</label>
          <Input
            type="date"
            value={draft.date_to}
            onChange={(e) => setDraft((f) => ({ ...f, date_to: e.target.value }))}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleApply}>
            <Search className="mr-2 h-4 w-4" />
            Apply
          </Button>
          {hasFilters && (
            <Button variant="ghost" onClick={handleClear}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        total={data?.total ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No audit log entries"
        emptyDescription="Actions performed in this school will appear here."
      />

      <AuditDetailSheet log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
