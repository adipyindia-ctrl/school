"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PlusCircle, Search, Eye, Loader2, Users } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { FieldWrapper, FormSection } from "@/components/forms/FormSection";
import api from "@/lib/api";
import type { Parent } from "@/types/academic";
import type { PaginatedResponse } from "@/types/common";

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  relationship: z.string().min(1),
  phone: z.string().optional(),
  alternate_phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  occupation: z.string().optional(),
  address: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ParentsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["parents", search, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), page_size: "25" });
      if (search) p.set("search", search);
      const res = await api.get<PaginatedResponse<Parent>>(`/parents?${p}`);
      return res.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { relationship: "father" },
  });

  const createMutation = useMutation({
    mutationFn: async (d: FormData) => { await api.post("/parents", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parents"] }); setOpen(false); reset(); },
  });

  const onSubmit: SubmitHandler<FormData> = (d) => createMutation.mutate(d);

  const columns: Column<Parent>[] = [
    {
      key: "name",
      header: "Parent",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
              {r.first_name[0]}{r.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{r.first_name} {r.last_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{r.relationship_type}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
    { key: "email", header: "Email", render: (r) => r.email ?? "—" },
    {
      key: "students",
      header: "Children",
      render: (r) => {
        const count = r.students?.length ?? 0;
        return count > 0 ? (
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{count}</span>
            <span className="text-xs text-muted-foreground">child{count !== 1 ? "ren" : ""}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">No children linked</span>
        );
      },
    },
    {
      key: "is_active", header: "Status",
      render: (r) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {r.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push(`/dashboard/parents/${r.id}`)}
          aria-label="View parent"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Parents"
        description="Manage parent accounts and student links"
        actions={
          <Button onClick={() => setOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />Add Parent
          </Button>
        }
      />

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or phone..."
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
        emptyTitle="No parents yet"
        emptyDescription="Add parent records and link them to students."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Parent</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormSection title="Parent Information">
              <FieldWrapper label="First Name" error={errors.first_name?.message} required>
                <Input {...register("first_name")} placeholder="Rajesh" />
              </FieldWrapper>
              <FieldWrapper label="Last Name" error={errors.last_name?.message} required>
                <Input {...register("last_name")} placeholder="Sharma" />
              </FieldWrapper>
              <FieldWrapper label="Relationship">
                <select {...register("relationship")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
              </FieldWrapper>
              <FieldWrapper label="Occupation">
                <Input {...register("occupation")} placeholder="Business" />
              </FieldWrapper>
              <FieldWrapper label="Phone">
                <Input {...register("phone")} placeholder="+91-9876543210" />
              </FieldWrapper>
              <FieldWrapper label="Alternate Phone">
                <Input {...register("alternate_phone")} />
              </FieldWrapper>
              <FieldWrapper label="Email" error={errors.email?.message} className="col-span-2">
                <Input type="email" {...register("email")} placeholder="parent@email.com" />
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
                {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Add Parent"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
