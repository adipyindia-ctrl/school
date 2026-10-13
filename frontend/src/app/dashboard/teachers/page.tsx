"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PlusCircle, Search, Eye, Pencil, UserX, Loader2 } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormSection, FieldWrapper } from "@/components/forms/FormSection";
import api from "@/lib/api";
import type { Teacher } from "@/types/academic";
import type { PaginatedResponse } from "@/types/common";

const teacherSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  employee_id: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  qualification: z.string().optional(),
  experience_years: z.coerce.number().optional(),
  joining_date: z.string().optional(),
  password: z.string().min(8, "Min 8 characters"),
});
type TeacherForm = z.infer<typeof teacherSchema>;

export default function TeachersPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["teachers", search, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), page_size: "25" });
      if (search) p.set("search", search);
      const res = await api.get<PaginatedResponse<Teacher>>(`/teachers?${p}`);
      return res.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeacherForm>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { password: "Teacher@1234" },
  });

  const createMutation = useMutation({
    mutationFn: async (d: TeacherForm) => { await api.post("/teachers", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teachers"] }); setOpen(false); reset(); },
  });

  const onSubmit: SubmitHandler<TeacherForm> = (d) => createMutation.mutate(d);

  const columns: Column<Teacher>[] = [
    {
      key: "name",
      header: "Teacher",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-green-100 text-green-700">
              {r.first_name[0]}{r.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{r.first_name} {r.last_name}</p>
            <p className="text-xs text-muted-foreground">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: "employee_id", header: "Employee ID" },
    { key: "designation", header: "Designation", render: (r) => r.designation ?? "—" },
    { key: "department", header: "Department", render: (r) => r.department ?? "—" },
    { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions", header: "Actions",
      render: (r) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" aria-label="View"
            onClick={() => router.push(`/dashboard/teachers/${r.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Manage teaching staff profiles and assignments"
        actions={
          <Button onClick={() => setOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />Add Teacher
          </Button>
        }
      />

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search teachers..."
            className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
        pageSize={25}
        onPageChange={setPage}
        emptyTitle="No teachers yet"
        emptyDescription="Add your first teacher to get started."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Teacher</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormSection title="Personal Information">
              <FieldWrapper label="First Name" error={errors.first_name?.message} required>
                <Input {...register("first_name")} placeholder="Priya" />
              </FieldWrapper>
              <FieldWrapper label="Last Name" error={errors.last_name?.message} required>
                <Input {...register("last_name")} placeholder="Sharma" />
              </FieldWrapper>
              <FieldWrapper label="Email" error={errors.email?.message} required>
                <Input type="email" {...register("email")} placeholder="teacher@school.com" />
              </FieldWrapper>
              <FieldWrapper label="Phone">
                <Input {...register("phone")} placeholder="+91-9876543210" />
              </FieldWrapper>
            </FormSection>
            <FormSection title="Employment Details">
              <FieldWrapper label="Employee ID">
                <Input {...register("employee_id")} placeholder="Auto-generated if blank" />
              </FieldWrapper>
              <FieldWrapper label="Designation">
                <Input {...register("designation")} placeholder="Senior Teacher" />
              </FieldWrapper>
              <FieldWrapper label="Department">
                <Input {...register("department")} placeholder="Science" />
              </FieldWrapper>
              <FieldWrapper label="Joining Date">
                <Input type="date" {...register("joining_date")} />
              </FieldWrapper>
              <FieldWrapper label="Qualification">
                <Input {...register("qualification")} placeholder="B.Ed, M.Sc" />
              </FieldWrapper>
              <FieldWrapper label="Experience (years)">
                <Input type="number" {...register("experience_years")} />
              </FieldWrapper>
            </FormSection>
            <FieldWrapper label="Portal Password" error={errors.password?.message} required>
              <Input type="password" {...register("password")} />
            </FieldWrapper>
            {createMutation.isError && (
              <p className="text-sm text-destructive">
                {(createMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed"}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Add Teacher"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
