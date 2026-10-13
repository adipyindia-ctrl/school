"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { PageHeader } from "@/components/layout/PageHeader";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/common";

interface Role {
  id: string;
  name: string;
  module_keys: string[];
}

interface SchoolUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  user_type: string;
  is_active: boolean;
  role_id?: string | null;
  role_name?: string | null;
  created_at: string;
}

const USER_TYPES = [
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent" },
  { value: "teacher", label: "Teacher" },
  { value: "staff", label: "Staff" },
];

export default function UsersPage() {
  const [adding, setAdding] = useState(false);

  const { data: users, isLoading, isError, refetch } = useQuery({
    queryKey: ["school-users"],
    queryFn: async () =>
      (await api.get<ApiResponse<SchoolUser[]>>("/settings/users")).data.data,
  });

  const columns: Column<SchoolUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <div>
          <p className="font-medium text-sm">
            {u.first_name} {u.last_name}
          </p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
      ),
    },
    {
      key: "user_type",
      header: "Type",
      render: (u) => <span className="capitalize">{u.user_type}</span>,
    },
    { key: "role_name", header: "Role", render: (u) => u.role_name ?? "—" },
    {
      key: "is_active",
      header: "Status",
      render: (u) => (
        <span
          className={
            "text-xs rounded-full px-2 py-0.5 " +
            (u.is_active
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-600")
          }
        >
          {u.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Register students, parents, teachers, and staff and assign their role"
        actions={
          <Button onClick={() => setAdding(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={users ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="No users yet"
        emptyDescription="Add students, parents, teachers, or staff to give them login access."
      />

      {adding && <AddUserDialog onClose={() => setAdding(false)} />}
    </div>
  );
}

function AddUserDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    user_type: "student",
    role_id: "",
  });
  const [error, setError] = useState<string | null>(null);

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => (await api.get<ApiResponse<Role[]>>("/settings/roles")).data.data,
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post("/settings/users", {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
        user_type: form.user_type,
        role_id: form.role_id,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-users"] });
      onClose();
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { detail?: string; message?: string } } })?.response
          ?.data?.detail ??
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to create user";
      setError(typeof msg === "string" ? msg : "Failed to create user");
    },
  });

  const submit = () => {
    setError(null);
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First and last name are required");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!form.role_id) {
      setError("Please select a role");
      return;
    }
    mutation.mutate();
  };

  const inputClass =
    "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fn">First name</Label>
              <Input
                id="fn"
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ln">Last name</Label>
              <Input
                id="ln"
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email (login username)</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="type">User type</Label>
              <select
                id="type"
                className={inputClass}
                value={form.user_type}
                onChange={(e) => set("user_type", e.target.value)}
              >
                {USER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role (module access)</Label>
              <select
                id="role"
                className={inputClass}
                value={form.role_id}
                onChange={(e) => set("role_id", e.target.value)}
              >
                <option value="">Select a role…</option>
                {(roles ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!roles?.length && (
            <p className="text-xs text-muted-foreground">
              No roles exist yet. Create a role in Roles &amp; Access first.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
