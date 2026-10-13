"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Loader2, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingSkeleton } from "@/components/data-display/LoadingSkeleton";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/common";

interface ModuleOption {
  key: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
  is_system: boolean;
  module_keys: string[];
  user_count: number;
}

export default function RolesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const { data: modules } = useQuery({
    queryKey: ["assignable-modules"],
    queryFn: async () =>
      (await api.get<ApiResponse<ModuleOption[]>>("/settings/assignable-modules")).data.data,
  });

  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => (await api.get<ApiResponse<Role[]>>("/settings/roles")).data.data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/settings/roles/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      setDeleteTarget(null);
    },
  });

  return (
    <div>
      <PageHeader
        title="Roles & Access"
        description="Create roles and choose which modules each role can access"
        actions={
          <Button onClick={() => setCreating(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Role
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSkeleton rows={4} cols={3} />
      ) : !roles?.length ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No roles yet. Create one to control module access for your users.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="flex flex-col">
              <CardContent className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{role.name}</p>
                      {role.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {!role.is_system && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(role)}
                        aria-label="Edit role"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(role)}
                        aria-label="Delete role"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {role.module_keys.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No modules assigned</span>
                  ) : (
                    role.module_keys.map((k) => (
                      <span
                        key={k}
                        className="text-[11px] rounded-full bg-muted px-2 py-0.5 capitalize"
                      >
                        {modules?.find((m) => m.key === k)?.name ?? k}
                      </span>
                    ))
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-auto">
                  {role.user_count} user{role.user_count === 1 ? "" : "s"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <RoleFormDialog
          role={editing}
          modules={modules ?? []}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Role"
        description={
          deleteTarget
            ? `Delete role "${deleteTarget.name}"? This can't be undone.`
            : ""
        }
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function RoleFormDialog({
  role,
  modules,
  onClose,
}: {
  role: Role | null;
  modules: ModuleOption[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(role?.module_keys ?? [])
  );
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        module_keys: Array.from(selected),
      };
      if (role) {
        await api.patch(`/settings/roles/${role.id}`, body);
      } else {
        await api.post("/settings/roles", body);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      onClose();
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { detail?: string; message?: string } } })?.response
          ?.data?.detail ??
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to save role";
      setError(typeof msg === "string" ? msg : "Failed to save role");
    },
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{role ? "Edit Role" : "New Role"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Role name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Teacher, Class Parent, Accountant"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role-desc">Description (optional)</Label>
            <Input
              id="role-desc"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this role is for"
            />
          </div>

          <div className="space-y-2">
            <Label>Modules this role can access</Label>
            {modules.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No modules are enabled for this school.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-auto rounded-md border p-2">
                {modules.map((m) => (
                  <label
                    key={m.key}
                    className="flex items-center gap-2 text-sm rounded px-2 py-1 hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(m.key)}
                      onChange={() => toggle(m.key)}
                      className="h-4 w-4"
                    />
                    <span className="truncate">{m.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setError(null);
              if (!name.trim()) {
                setError("Role name is required");
                return;
              }
              mutation.mutate();
            }}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {role ? "Save Changes" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
