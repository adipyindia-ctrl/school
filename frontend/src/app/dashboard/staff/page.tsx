"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Search, Loader2 } from "lucide-react";
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
import { FieldWrapper, FormSection } from "@/components/forms/FormSection";
import api from "@/lib/api";
import type { Staff } from "@/types/academic";
import type { PaginatedResponse } from "@/types/common";

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  employee_id: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  joining_date: z.string().optional(),
  password: z.string().min(8),
});
type FormData = z.infer<typeof schema>;

export default function StaffPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["staff", search, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), page_size: "25" });
      if (search) p.set("search", search);
      return (await api.get<PaginatedResponse<Staff>>(`/staff?${p}`)).data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: "Staff@1234" },
  });

  const createMutation = useMutation({
    mutationFn: async (d: FormData) => { await api.post("/staff", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); setOpen(false); reset(); },
  });

  const onSubmit: SubmitHandler<FormData> = (d) => createMutation.mutate(d);

  const columns: Column<Staff>[] = [
    {
      key: "name", header: "Staff Member",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
              {r.first_name[0]}{r.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{r.first_name} {r.last_name}</p>
            <p className="text-xs text-muted-foreground">{r.employee_id}</p>
          </div>
        </div>
      ),
    },
    { key: "designation", header: "Designation", render: (r) => r.designation ?? "—" },
    { key: "department", header: "Department", render: (r) => r.department ?? "—" },
    { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Non-teaching staff management"
        actions={<Button onClick={() => setOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Staff</Button>}
      />

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search staff..." className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <DataTable
        columns={columns} data={data?.data ?? []}
        isLoading={isLoading} isError={isError} onRetry={refetch}
        total={data?.total ?? 0} page={page} pageSize={25} onPageChange={setPage}
        emptyTitle="No staff yet" emptyDescription="Add non-teaching staff members."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormSection title="Staff Information">
              <FieldWrapper label="First Name" error={errors.first_name?.message} required>
                <Input {...register("first_name")} />
              </FieldWrapper>
              <FieldWrapper label="Last Name" error={errors.last_name?.message} required>
                <Input {...register("last_name")} />
              </FieldWrapper>
              <FieldWrapper label="Email" error={errors.email?.message} required>
                <Input type="email" {...register("email")} />
              </FieldWrapper>
              <FieldWrapper label="Phone">
                <Input {...register("phone")} />
              </FieldWrapper>
              <FieldWrapper label="Designation">
                <Input {...register("designation")} placeholder="Accountant, Librarian…" />
              </FieldWrapper>
              <FieldWrapper label="Department">
                <Input {...register("department")} placeholder="Accounts, Admin…" />
              </FieldWrapper>
              <FieldWrapper label="Joining Date">
                <Input type="date" {...register("joining_date")} />
              </FieldWrapper>
              <FieldWrapper label="Password" error={errors.password?.message} required>
                <Input type="password" {...register("password")} />
              </FieldWrapper>
            </FormSection>
            {createMutation.isError && (
              <p className="text-sm text-destructive">
                {(createMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed"}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Add Staff"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
