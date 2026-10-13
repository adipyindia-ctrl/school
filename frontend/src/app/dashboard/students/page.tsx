"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PlusCircle, Search, Eye, Pencil, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import api from "@/lib/api";
import type { Class, Section, Student } from "@/types/academic";
import type { PaginatedResponse, ApiResponse } from "@/types/common";

export default function StudentsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [page, setPage] = useState(1);
  const [deactivateTarget, setDeactivateTarget] = useState<Student | undefined>(undefined);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await api.get<ApiResponse<Class[]>>("/academics/classes")).data.data,
  });

  const { data: sections } = useQuery({
    queryKey: ["sections", classFilter],
    queryFn: async () => {
      const params = classFilter !== "all" ? `?class_id=${classFilter}` : "";
      return (await api.get<ApiResponse<Section[]>>(`/academics/sections${params}`)).data.data;
    },
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["students", search, classFilter, sectionFilter, statusFilter, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), page_size: "25" });
      if (search) p.set("search", search);
      if (classFilter !== "all") p.set("class_id", classFilter);
      if (sectionFilter !== "all") p.set("section_id", sectionFilter);
      if (statusFilter !== "all") p.set("status", statusFilter);
      const res = await api.get<PaginatedResponse<Student>>(`/students?${p}`);
      return res.data;
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/students/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); setDeactivateTarget(undefined); },
  });

  const classMap = Object.fromEntries((classes ?? []).map((c) => [c.id, c.name]));
  const sectionMap = Object.fromEntries((sections ?? []).map((s) => [s.id, s.name]));

  const columns: Column<Student>[] = [
    {
      key: "name",
      header: "Student",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {r.first_name[0]}{r.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{r.first_name} {r.last_name}</p>
            <p className="text-xs text-muted-foreground">{r.admission_number}</p>
          </div>
        </div>
      ),
    },
    { key: "class_id", header: "Class", render: (r) => classMap[r.class_id] ?? "—" },
    { key: "section_id", header: "Section", render: (r) => sectionMap[r.section_id] ?? "—" },
    { key: "roll_number", header: "Roll No.", render: (r) => r.roll_number ?? "—" },
    { key: "gender", header: "Gender", render: (r) => <span className="capitalize">{r.gender ?? "—"}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions", header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/students/${r.id}`)} aria-label="View">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/students/${r.id}/edit`)} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          {r.status === "active" && (
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
              onClick={() => setDeactivateTarget(r)} aria-label="Deactivate">
              <UserX className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <PageHeader
        title="Students"
        description="Manage student enrollments and profiles"
        actions={
          <Button onClick={() => router.push("/dashboard/students/new")}>
            <PlusCircle className="mr-2 h-4 w-4" />Add Student
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or admission number..."
            className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setSectionFilter("all"); setPage(1); }}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
          <option value="all">All Classes</option>
          {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={sectionFilter} onChange={(e) => { setSectionFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
          <option value="all">All Sections</option>
          {(sections ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm w-36">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
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
        emptyTitle="No students found"
        emptyDescription="Add students or adjust your filters."
        fillHeight
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => !o && setDeactivateTarget(undefined)}
        title="Deactivate Student"
        description={`Deactivate ${deactivateTarget?.first_name} ${deactivateTarget?.last_name}? The record will be retained.`}
        variant="destructive"
        confirmLabel="Deactivate"
        onConfirm={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
        isLoading={deactivateMutation.isPending}
      />
    </div>
  );
}
