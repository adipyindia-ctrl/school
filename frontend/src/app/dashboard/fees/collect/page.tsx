"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, IndianRupee, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { EmptyState } from "@/components/data-display/EmptyState";
import { FieldWrapper } from "@/components/forms/FormSection";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { FeeStructure, LedgerEntry } from "@/types/finance";
import type { Student } from "@/types/academic";
import type { ApiResponse } from "@/types/common";

const paySchema = z.object({
  student_fee_id: z.string().min(1),
  amount: z.coerce.number().min(1, "Amount required"),
  payment_date: z.string().min(1, "Date required"),
  payment_mode: z.string().min(1),
  transaction_ref: z.string().optional(),
  remarks: z.string().optional(),
});
type PayForm = z.infer<typeof paySchema>;

export default function FeeCollectPage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>();
  const [payTarget, setPayTarget] = useState<LedgerEntry | undefined>();
  const [payOpen, setPayOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["student-search", search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      const res = await api.get<{ data: Student[] }>(`/students?search=${encodeURIComponent(search)}&page_size=10`);
      return res.data.data;
    },
    enabled: search.length >= 2,
  });

  const { data: ledger, isLoading: loadingLedger, refetch: refetchLedger } = useQuery({
    queryKey: ["fee-ledger", selectedStudent?.id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<LedgerEntry[]>>(
        `/fees/student-fees/${selectedStudent!.id}/ledger`
      );
      return res.data.data;
    },
    enabled: !!selectedStudent,
  });

  const payForm = useForm<PayForm>({
    resolver: zodResolver(paySchema),
    defaultValues: { payment_mode: "cash", payment_date: today },
  });

  const payMutation = useMutation({
    mutationFn: async (d: PayForm) => {
      const res = await api.post<{ message: string }>("/fees/payments", d);
      return res.data;
    },
    onSuccess: (data) => {
      setSuccessMsg(data.message ?? "Payment recorded");
      qc.invalidateQueries({ queryKey: ["fee-ledger", selectedStudent?.id] });
      setPayOpen(false);
      payForm.reset({ payment_mode: "cash", payment_date: today });
      setTimeout(() => setSuccessMsg(""), 4000);
    },
  });

  const openPay = (entry: LedgerEntry) => {
    setPayTarget(entry);
    payForm.setValue("student_fee_id", entry.student_fee_id);
    payForm.setValue("amount", entry.outstanding);
    setPayOpen(true);
  };

  const onPaySubmit: SubmitHandler<PayForm> = (d) => payMutation.mutate(d);

  const statusColor: Record<string, string> = {
    paid: "text-green-600", partial: "text-yellow-600",
    unpaid: "text-red-600", overdue: "text-red-700",
  };

  return (
    <div>
      <PageHeader title="Fee Collection" description="Search students and collect fees" />

      {/* Search */}
      <Card className="mb-5">
        <CardContent className="pt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search student by name or admission number..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedStudent(undefined); }}
            />
          </div>

          {search.length >= 2 && !selectedStudent && (
            <div className="mt-2 border rounded-md overflow-hidden divide-y max-h-60 overflow-y-auto">
              {searching && <div className="p-3 text-sm text-muted-foreground">Searching…</div>}
              {!searching && (searchResults ?? []).length === 0 && (
                <div className="p-3 text-sm text-muted-foreground">No students found</div>
              )}
              {(searchResults ?? []).map((s) => (
                <button key={s.id} onClick={() => { setSelectedStudent(s); setSearch(""); }}
                  className="w-full text-left p-3 hover:bg-muted text-sm flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-muted-foreground">{s.admission_number}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Fee Ledger */}
      {!selectedStudent && !search && (
        <EmptyState title="Search for a student" description="Enter a student name or admission number to view and collect fees." />
      )}

      {selectedStudent && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
              <p className="text-sm text-muted-foreground">{selectedStudent.admission_number}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedStudent(undefined)}>
              Clear
            </Button>
          </div>

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex items-center gap-2">
              <Receipt className="h-4 w-4" />{successMsg}
            </div>
          )}

          {loadingLedger && <LoadingSkeleton rows={3} />}
          {!loadingLedger && (ledger ?? []).length === 0 && (
            <EmptyState title="No fees assigned" description="Assign fee structures to this student first." />
          )}

          <div className="space-y-3">
            {(ledger ?? []).map((entry) => (
              <Card key={entry.student_fee_id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        <StatusBadge status={entry.status} />
                        {entry.due_date && (
                          <span className="text-xs text-muted-foreground">Due: {entry.due_date}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Amount Due</p>
                          <p className="font-medium">₹{entry.amount_due.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Discount</p>
                          <p className="font-medium text-green-600">-₹{entry.discount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Paid</p>
                          <p className="font-medium text-blue-600">₹{entry.amount_paid.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Outstanding</p>
                          <p className={cn("font-bold", statusColor[entry.status] ?? "")}>
                            ₹{entry.outstanding.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {entry.payments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {entry.payments.map((p) => (
                            <div key={p.receipt_number} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
                              <span>{p.receipt_number}</span>
                              <span>₹{p.amount} · {p.payment_mode} · {p.payment_date}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {entry.outstanding > 0 && (
                      <Button size="sm" onClick={() => openPay(entry)}>Collect</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Collect Fee Payment</DialogTitle></DialogHeader>
          <form onSubmit={payForm.handleSubmit(onPaySubmit)} className="space-y-4">
            <input type="hidden" {...payForm.register("student_fee_id")} />
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="Amount (₹)" error={payForm.formState.errors.amount?.message} required>
                <Input type="number" {...payForm.register("amount")} />
              </FieldWrapper>
              <FieldWrapper label="Payment Date" error={payForm.formState.errors.payment_date?.message} required>
                <Input type="date" {...payForm.register("payment_date")} max={today} />
              </FieldWrapper>
              <FieldWrapper label="Payment Mode" className="col-span-2">
                <select {...payForm.register("payment_mode")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online</option>
                </select>
              </FieldWrapper>
              <FieldWrapper label="Transaction Ref" className="col-span-2">
                <Input {...payForm.register("transaction_ref")} placeholder="Optional" />
              </FieldWrapper>
              <FieldWrapper label="Remarks" className="col-span-2">
                <Input {...payForm.register("remarks")} placeholder="Optional" />
              </FieldWrapper>
            </div>
            {payMutation.isError && (
              <p className="text-sm text-destructive">
                {(payMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Payment failed"}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={payMutation.isPending}>
                {payMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</> : "Collect Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
