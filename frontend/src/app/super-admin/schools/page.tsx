"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  PlusCircle, Search, Eye, PauseCircle, PlayCircle, Trash2,
  FlaskConical, Loader2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import api from "@/lib/api";
import type { School } from "@/types/school";
import type { PaginatedResponse } from "@/types/common";

export default function SchoolsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  type ConfirmType = "suspend" | "activate" | "delete";
  const [confirmAction, setConfirmAction] = useState<{
    school: School;
    action: ConfirmType;
  } | undefined>(undefined);

  const [seedingSchoolId, setSeedingSchoolId] = useState<string | null>(null);
  const [seedResult, setSeedResult] = useState<{ schoolName: string; message: string } | null>(null);

  // Fetch school limit / usage
  const { data: limitData } = useQuery({
    queryKey: ["school-limit"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await api.get<{ data: { max_schools: number; current_count: number; can_add_more: boolean } }>(
        "/platform/schools/limit"
      );
      return res.data.data;
    },
  });

  const canAddMore = limitData?.can_add_more ?? true;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["schools", search, status, page],
    enabled: isAuthenticated,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: "25" });
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      const res = await api.get<PaginatedResponse<School>>(`/platform/schools?${params}`);
      return res.data;
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ school, action }: { school: School; action: ConfirmType }) => {
      if (action === "delete") {
        await api.delete(`/platform/schools/${school.id}`);
      } else {
        await api.post(`/platform/schools/${school.id}/${action}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      queryClient.invalidateQueries({ queryKey: ["school-limit"] });
      setConfirmAction(undefined);
    },
  });

  const seedMutation = useMutation({
    mutationFn: async (school: School) => {
      setSeedingSchoolId(school.id);
      const res = await api.post<{ message: string }>(`/platform/schools/${school.id}/seed-demo`);
      return { schoolName: school.name, message: res.data.message };
    },
    onSuccess: (result) => {
      setSeedingSchoolId(null);
      setSeedResult(result);
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
    onError: () => setSeedingSchoolId(null),
  });

  const columns: Column<School>[] = [
    {
      key: "name",
      header: "School Name",
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.slug}.domain.com</p>
        </div>
      ),
    },
    { key: "code", header: "Code" },
    {
      key: "city",
      header: "Location",
      render: (row) => `${row.city ?? "—"}, ${row.state ?? "—"}`,
    },
    {
      key: "school_type",
      header: "Board",
      render: (row) => (
        <span className="uppercase text-xs font-medium">{row.school_type}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <TooltipProvider>
          <div className="flex items-center gap-1">
            {/* View */}
            <Tooltip>
              <TooltipTrigger>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(`/super-admin/schools/${row.id}`)}
                  aria-label="View school"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View / Edit</TooltipContent>
            </Tooltip>

            {/* Suspend / Activate */}
            {row.status !== "suspended" ? (
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-yellow-600 hover:text-yellow-700"
                    onClick={() => setConfirmAction({ school: row, action: "suspend" })}
                    aria-label="Suspend school"
                    disabled={row.status === "archived"}
                  >
                    <PauseCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Suspend</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => setConfirmAction({ school: row, action: "activate" })}
                    aria-label="Activate school"
                  >
                    <PlayCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Activate</TooltipContent>
              </Tooltip>
            )}

            {/* Seed Demo Data */}
            <Tooltip>
              <TooltipTrigger>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-violet-600 hover:text-violet-700"
                  onClick={() => seedMutation.mutate(row)}
                  aria-label="Seed demo data"
                  disabled={seedingSchoolId === row.id}
                >
                  {seedingSchoolId === row.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FlaskConical className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Seed Demo Data</TooltipContent>
            </Tooltip>

            {/* Delete */}
            <Tooltip>
              <TooltipTrigger>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmAction({ school: row, action: "delete" })}
                  aria-label="Delete school"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Schools"
        description="Manage all schools on the platform"
        actions={
          <div className="flex items-center gap-3">
            {/* Usage pill */}
            {limitData && (
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
                canAddMore
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-destructive"
              }`}>
                {!canAddMore && <AlertCircle className="h-3.5 w-3.5" />}
                {limitData.current_count} / {limitData.max_schools} schools
              </div>
            )}
            <Tooltip>
              <TooltipTrigger>
                <span>
                  <Button
                    onClick={() => router.push("/super-admin/schools/new")}
                    disabled={!canAddMore}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add School
                  </Button>
                </span>
              </TooltipTrigger>
              {!canAddMore && (
                <TooltipContent>
                  School limit reached ({limitData?.max_schools}). Update in Profile → Platform settings.
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schools..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm w-40"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        total={data?.total ?? 0}
        page={page}
        pageSize={25}
        onPageChange={setPage}
        emptyTitle="No schools found"
        emptyDescription="Create your first school to get started."
      />

      {/* Suspend / Activate / Delete confirmation */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(undefined)}
        title={
          confirmAction?.action === "suspend"
            ? "Suspend School"
            : confirmAction?.action === "activate"
            ? "Activate School"
            : "Delete School"
        }
        description={
          confirmAction?.action === "delete"
            ? `Permanently delete "${confirmAction?.school.name}"? All school data will be removed and this cannot be undone.`
            : `Are you sure you want to ${confirmAction?.action} "${confirmAction?.school.name}"?`
        }
        variant={
          confirmAction?.action === "suspend" || confirmAction?.action === "delete"
            ? "destructive"
            : "default"
        }
        confirmLabel={
          confirmAction?.action === "suspend"
            ? "Suspend"
            : confirmAction?.action === "activate"
            ? "Activate"
            : "Delete"
        }
        onConfirm={() => confirmAction && actionMutation.mutate(confirmAction)}
        isLoading={actionMutation.isPending}
      />

      {/* Seed demo success dialog */}
      <ConfirmDialog
        open={!!seedResult}
        onOpenChange={(open) => !open && setSeedResult(null)}
        title="Demo Data Seeded"
        description={`${seedResult?.schoolName}: ${seedResult?.message}`}
        variant="default"
        confirmLabel="OK"
        onConfirm={() => setSeedResult(null)}
        isLoading={false}
      />
    </div>
  );
}
