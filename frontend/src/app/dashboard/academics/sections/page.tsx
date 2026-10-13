"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { FieldWrapper } from "@/components/forms/FormSection";
import api from "@/lib/api";
import type { Class, Section } from "@/types/academic";
import type { ApiResponse } from "@/types/common";

const schema = z.object({
  name: z.string().min(1, "Section name required"),
  class_id: z.string().min(1, "Class required"),
  capacity: z.coerce.number().optional(),
  room_number: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function SectionsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filterClass, setFilterClass] = useState("all");

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await api.get<ApiResponse<Class[]>>("/academics/classes")).data.data,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["sections", filterClass],
    queryFn: async () => {
      const params = filterClass !== "all" ? `?class_id=${filterClass}` : "";
      return (await api.get<ApiResponse<Section[]>>(`/academics/sections${params}`)).data.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: async (d: FormData) => { await api.post("/academics/sections", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sections"] }); setOpen(false); reset(); },
  });

  const onSubmit: SubmitHandler<FormData> = (d) => createMutation.mutate(d);
  const classMap = Object.fromEntries((classes ?? []).map((c) => [c.id, c.name]));

  const columns: Column<Section>[] = [
    { key: "name", header: "Section", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "class_id", header: "Class", render: (r) => classMap[r.class_id] ?? "—" },
    { key: "capacity", header: "Capacity", render: (r) => r.capacity ?? "—" },
    { key: "room_number", header: "Room", render: (r) => r.room_number ?? "—" },
  ];

  return (
    <div>
      <PageHeader
        title="Sections"
        description="Manage sections within each class"
        actions={<Button onClick={() => setOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Section</Button>}
      />

      <div className="mb-4">
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm w-48"
        >
          <option value="all">All Classes</option>
          {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="No sections yet"
        emptyDescription="Add sections to your classes."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Section</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldWrapper label="Class" error={errors.class_id?.message} required>
              <select {...register("class_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Select class</option>
                {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Section Name" error={errors.name?.message} required>
              <Input {...register("name")} placeholder="A" />
            </FieldWrapper>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="Capacity">
                <Input type="number" {...register("capacity")} placeholder="40" />
              </FieldWrapper>
              <FieldWrapper label="Room">
                <Input {...register("room_number")} placeholder="Room 101" />
              </FieldWrapper>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Section
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
