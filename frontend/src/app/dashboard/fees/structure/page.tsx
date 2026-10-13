"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Loader2, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { FieldWrapper, FormSection } from "@/components/forms/FormSection";
import api from "@/lib/api";
import type { FeeCategory, FeeStructure } from "@/types/finance";
import type { AcademicSession, Class } from "@/types/academic";
import type { ApiResponse } from "@/types/common";

const catSchema = z.object({ name: z.string().min(1, "Required"), description: z.string().optional() });
const structSchema = z.object({
  session_id: z.string().min(1, "Required"),
  class_id: z.string().optional(),
  category_id: z.string().min(1, "Required"),
  amount: z.coerce.number().min(1, "Required"),
  frequency: z.string().min(1),
  due_day: z.coerce.number().optional(),
});

type CatForm = z.infer<typeof catSchema>;
type StructForm = z.infer<typeof structSchema>;

export default function FeeStructurePage() {
  const qc = useQueryClient();
  const [catOpen, setCatOpen] = useState(false);
  const [structOpen, setStructOpen] = useState(false);
  const [deleteCat, setDeleteCat] = useState<FeeCategory | undefined>();

  const { data: categories } = useQuery({
    queryKey: ["fee-categories"],
    queryFn: async () => (await api.get<ApiResponse<FeeCategory[]>>("/fees/categories")).data.data,
  });
  const { data: structures, isLoading: loadingStructures } = useQuery({
    queryKey: ["fee-structures"],
    queryFn: async () => (await api.get<ApiResponse<FeeStructure[]>>("/fees/structures")).data.data,
  });
  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await api.get<ApiResponse<AcademicSession[]>>("/academics/sessions")).data.data,
  });
  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await api.get<ApiResponse<Class[]>>("/academics/classes")).data.data,
  });

  const catForm = useForm<CatForm>({ resolver: zodResolver(catSchema) });
  const structForm = useForm<StructForm>({
    resolver: zodResolver(structSchema),
    defaultValues: { frequency: "monthly" },
  });

  const catMutation = useMutation({
    mutationFn: async (d: CatForm) => { await api.post("/fees/categories", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-categories"] }); setCatOpen(false); catForm.reset(); },
  });
  const deleteCatMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/fees/categories/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-categories"] }); setDeleteCat(undefined); },
  });
  const structMutation = useMutation({
    mutationFn: async (d: StructForm) => { await api.post("/fees/structures", d); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fee-structures"] }); setStructOpen(false); structForm.reset(); },
  });

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c.name]));
  const classMap = Object.fromEntries((classes ?? []).map((c) => [c.id, c.name]));
  const sessionMap = Object.fromEntries((sessions ?? []).map((s) => [s.id, s.name]));

  const structCols: Column<FeeStructure>[] = [
    { key: "category_id", header: "Category", render: (r) => <span className="font-medium">{catMap[r.category_id] ?? "—"}</span> },
    { key: "class_id", header: "Class", render: (r) => r.class_id ? classMap[r.class_id] : "All Classes" },
    { key: "session_id", header: "Session", render: (r) => sessionMap[r.session_id] ?? "—" },
    { key: "amount", header: "Amount", render: (r) => <span className="font-semibold">₹{r.amount.toLocaleString()}</span> },
    { key: "frequency", header: "Frequency", render: (r) => <span className="capitalize">{r.frequency.replace("_", " ")}</span> },
  ];

  const onCatSubmit: SubmitHandler<CatForm> = (d) => catMutation.mutate(d);
  const onStructSubmit: SubmitHandler<StructForm> = (d) => structMutation.mutate(d);

  return (
    <div>
      <PageHeader title="Fee Structure" description="Manage fee categories and structures" />

      <Tabs defaultValue="categories">
        <TabsList className="mb-5">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
        </TabsList>

        {/* Categories */}
        <TabsContent value="categories">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setCatOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Category</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(categories ?? []).map((cat) => (
              <Card key={cat.id}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Tag className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cat.name}</p>
                      {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteCat(cat)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Structures */}
        <TabsContent value="structures">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setStructOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Structure</Button>
          </div>
          <DataTable columns={structCols} data={structures ?? []} isLoading={loadingStructures}
            emptyTitle="No fee structures" emptyDescription="Create fee structures to assign to students." />
        </TabsContent>
      </Tabs>

      {/* Add Category Dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Fee Category</DialogTitle></DialogHeader>
          <form onSubmit={catForm.handleSubmit(onCatSubmit)} className="space-y-4">
            <FieldWrapper label="Category Name" error={catForm.formState.errors.name?.message} required>
              <Input {...catForm.register("name")} placeholder="Tuition Fee" />
            </FieldWrapper>
            <FieldWrapper label="Description">
              <Input {...catForm.register("description")} placeholder="Optional description" />
            </FieldWrapper>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCatOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={catMutation.isPending}>
                {catMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Structure Dialog */}
      <Dialog open={structOpen} onOpenChange={setStructOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Fee Structure</DialogTitle></DialogHeader>
          <form onSubmit={structForm.handleSubmit(onStructSubmit)} className="space-y-4">
            <FormSection title="">
              <FieldWrapper label="Session" error={structForm.formState.errors.session_id?.message} required>
                <select {...structForm.register("session_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select</option>
                  {(sessions ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Class (optional)">
                <select {...structForm.register("class_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">All Classes</option>
                  {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Fee Category" error={structForm.formState.errors.category_id?.message} required>
                <select {...structForm.register("category_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Select category</option>
                  {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FieldWrapper>
              <FieldWrapper label="Amount (₹)" error={structForm.formState.errors.amount?.message} required>
                <Input type="number" {...structForm.register("amount")} placeholder="5000" />
              </FieldWrapper>
              <FieldWrapper label="Frequency">
                <select {...structForm.register("frequency")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half_yearly">Half-Yearly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one_time">One-Time</option>
                </select>
              </FieldWrapper>
              <FieldWrapper label="Due Day">
                <Input type="number" {...structForm.register("due_day")} placeholder="10" min={1} max={31} />
              </FieldWrapper>
            </FormSection>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStructOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={structMutation.isPending}>
                {structMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteCat} onOpenChange={(o) => !o && setDeleteCat(undefined)}
        title="Delete Category" description={`Delete fee category "${deleteCat?.name}"?`}
        variant="destructive" confirmLabel="Delete"
        onConfirm={() => deleteCat && deleteCatMutation.mutate(deleteCat.id)}
        isLoading={deleteCatMutation.isPending}
      />
    </div>
  );
}
