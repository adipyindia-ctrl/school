"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Phone, Mail, Briefcase, MapPin, Pencil, Save, X,
  Loader2, UserPlus, UserMinus, GraduationCap, Star, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { ErrorState } from "@/components/data-display/ErrorState";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import api from "@/lib/api";
import type { Parent, Student, LinkedStudentInfo } from "@/types/academic";
import type { PaginatedResponse, ApiResponse } from "@/types/common";

// ── Edit schema ───────────────────────────────────────────────────────────────
const editSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  relationship: z.string().min(1),
  phone: z.string().optional(),
  alternate_phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  occupation: z.string().optional(),
  address: z.string().optional(),
});
type EditForm = z.infer<typeof editSchema>;

export default function ParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [unlinkTarget, setUnlinkTarget] = useState<LinkedStudentInfo | null>(null);

  // ── Fetch parent ──────────────────────────────────────────────────────────
  const { data: parent, isLoading, isError, refetch } = useQuery({
    queryKey: ["parent", id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Parent>>(`/parents/${id}`);
      return res.data.data;
    },
  });

  // ── Edit form ─────────────────────────────────────────────────────────────
  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    values: parent ? {
      first_name: parent.first_name,
      last_name: parent.last_name,
      relationship: parent.relationship_type,
      phone: parent.phone ?? "",
      alternate_phone: parent.alternate_phone ?? "",
      email: parent.email ?? "",
      occupation: parent.occupation ?? "",
      address: parent.address ?? "",
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (d: EditForm) => {
      const res = await api.patch<ApiResponse<Parent>>(`/parents/${id}`, d);
      return res.data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parent", id] }); setEditing(false); },
  });

  // ── Link/unlink students ──────────────────────────────────────────────────
  const { data: studentsData } = useQuery({
    queryKey: ["students-search", studentSearch],
    queryFn: async () => {
      const p = new URLSearchParams({ page: "1", page_size: "20", status: "active" });
      if (studentSearch) p.set("search", studentSearch);
      const res = await api.get<PaginatedResponse<Student>>(`/students?${p}`);
      return res.data.data;
    },
    enabled: linkOpen,
  });

  const linkMutation = useMutation({
    mutationFn: async ({ studentId, isPrimary }: { studentId: string; isPrimary: boolean }) => {
      await api.post(`/parents/${id}/students/${studentId}`, { is_primary: isPrimary });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parent", id] }); setLinkOpen(false); setStudentSearch(""); },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await api.delete(`/parents/${id}/students/${studentId}`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parent", id] }); setUnlinkTarget(null); },
  });

  const onSubmit: SubmitHandler<EditForm> = (d) => updateMutation.mutate(d);

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!parent) return null;

  const linkedIds = new Set((parent.students ?? []).map((s) => s.id));

  return (
    <div>
      <PageHeader
        title={`${parent.first_name} ${parent.last_name}`}
        description={`${parent.relationship_type.charAt(0).toUpperCase() + parent.relationship_type.slice(1)} · ${(parent.students ?? []).length} child${(parent.students ?? []).length !== 1 ? "ren" : ""} linked`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Button>
            {!editing && (
              <Button onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />Edit
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile card */}
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-purple-100 text-purple-700">
                {parent.first_name[0]}{parent.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{parent.first_name} {parent.last_name}</p>
              <p className="text-sm text-muted-foreground capitalize">{parent.relationship_type}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${parent.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {parent.is_active ? "Active" : "Inactive"}
            </span>
            <div className="w-full pt-2 space-y-2 text-sm text-left">
              {parent.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{parent.phone}</span>
                </div>
              )}
              {parent.alternate_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{parent.alternate_phone}</span>
                </div>
              )}
              {parent.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{parent.email}</span>
                </div>
              )}
              {parent.occupation && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{parent.occupation}</span>
                </div>
              )}
              {parent.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{parent.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit form or children cards */}
        <div className="lg:col-span-2 space-y-4">
          {editing && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Edit Parent Info</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>First Name *</Label>
                      <Input {...form.register("first_name")} />
                      {form.formState.errors.first_name && <p className="text-xs text-destructive">{form.formState.errors.first_name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last Name *</Label>
                      <Input {...form.register("last_name")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Relationship</Label>
                      <select {...form.register("relationship")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="guardian">Guardian</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Occupation</Label>
                      <Input {...form.register("occupation")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input {...form.register("phone")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Alternate Phone</Label>
                      <Input {...form.register("alternate_phone")} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" {...form.register("email")} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Address</Label>
                      <Input {...form.register("address")} />
                    </div>
                  </div>
                  {updateMutation.isError && <p className="text-xs text-destructive">Failed to update</p>}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(false); form.reset(); }}>
                      <X className="h-3.5 w-3.5 mr-1" />Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Linked Children */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Linked Children ({(parent.students ?? []).length})
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setLinkOpen(true)}>
                <UserPlus className="h-3.5 w-3.5 mr-1" />Link Student
              </Button>
            </CardHeader>
            <CardContent>
              {(parent.students ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No students linked yet.</p>
              ) : (
                <div className="space-y-2">
                  {(parent.students ?? []).map((student) => (
                    <div key={student.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {student.first_name[0]}{student.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{student.first_name} {student.last_name}</p>
                          <p className="text-xs text-muted-foreground">{student.admission_number}</p>
                        </div>
                        {student.is_primary && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            <Star className="h-2.5 w-2.5 mr-0.5" />Primary
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/parents/${id}/child/${student.id}`)}>
                          <FileText className="h-3.5 w-3.5" />
                          <span className="ml-1 text-xs hidden sm:inline">Report</span>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/students/${student.id}`)}>
                          View
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                          onClick={() => setUnlinkTarget(student)}>
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Link Student Dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Link a Student</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search student by name or admission number..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
            <div className="max-h-72 overflow-y-auto space-y-1">
              {(studentsData ?? []).map((s) => {
                const alreadyLinked = linkedIds.has(s.id);
                return (
                  <div key={s.id} className={`flex items-center justify-between p-2.5 rounded-lg border ${alreadyLinked ? "opacity-50" : "hover:bg-muted/40"}`}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {s.first_name[0]}{s.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-muted-foreground">{s.admission_number}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" disabled={alreadyLinked || linkMutation.isPending}
                      onClick={() => linkMutation.mutate({ studentId: s.id, isPrimary: false })}>
                      {alreadyLinked ? "Linked" : "Link"}
                    </Button>
                  </div>
                );
              })}
              {(studentsData ?? []).length === 0 && studentSearch && (
                <p className="text-sm text-muted-foreground text-center py-4">No students found.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unlink confirmation */}
      <ConfirmDialog
        open={!!unlinkTarget}
        onOpenChange={(o) => !o && setUnlinkTarget(null)}
        title="Unlink Student"
        description={`Remove the link between ${parent.first_name} and ${unlinkTarget?.first_name} ${unlinkTarget?.last_name}?`}
        variant="destructive"
        confirmLabel="Unlink"
        onConfirm={() => unlinkTarget && unlinkMutation.mutate(unlinkTarget.id)}
        isLoading={unlinkMutation.isPending}
      />
    </div>
  );
}
