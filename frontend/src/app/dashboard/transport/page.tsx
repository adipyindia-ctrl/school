"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PlusCircle,
  Loader2,
  Trash2,
  Pencil,
  Bus,
  ChevronDown,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/data-display/DataTable";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { FieldWrapper } from "@/components/forms/FormSection";
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  listRoutes,
  getRoute,
  createRoute,
  deleteRoute,
  createStop,
  deleteStop,
  listAssignments,
  assignTransport,
  unassignTransport,
} from "@/lib/api/transport";
import type {
  Vehicle,
  VehicleCreate,
  Route,
  RouteCreate,
  RouteStop,
  RouteStopCreate,
  TransportAssignment,
  TransportAssignmentCreate,
} from "@/types/transport";

// ── Schemas ───────────────────────────────────────────────────────────────────

const vehicleSchema = z.object({
  vehicle_number: z.string().min(1, "Required"),
  vehicle_type: z.enum(["BUS", "VAN", "AUTO", "OTHER"]).optional(),
  driver_name: z.string().optional(),
  driver_contact: z.string().optional(),
  seating_capacity: z.coerce.number().min(1).max(200),
});
type VehicleForm = z.infer<typeof vehicleSchema>;

const routeSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
});
type RouteForm = z.infer<typeof routeSchema>;

const stopSchema = z.object({
  stop_name: z.string().min(1, "Required"),
  stop_order: z.coerce.number().min(0),
  morning_pickup_time: z.string().optional(),
  evening_dropoff_time: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});
type StopForm = z.infer<typeof stopSchema>;

const assignSchema = z.object({
  student_id: z.string().uuid("Must be a valid UUID"),
  vehicle_id: z.string().min(1, "Required"),
  route_id: z.string().min(1, "Required"),
  stop_id: z.string().optional(),
  academic_session_id: z.string().uuid("Must be a valid UUID"),
});
type AssignForm = z.infer<typeof assignSchema>;

// ── Vehicles Tab ──────────────────────────────────────────────────────────────

function VehiclesTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["vehicles", page],
    queryFn: () => listVehicles(page, 50),
  });

  const form = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { seating_capacity: 40 },
  });
  const editForm = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { seating_capacity: 40 },
  });

  const createMutation = useMutation({
    mutationFn: (d: VehicleCreate) => createVehicle(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); setAddOpen(false); form.reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Partial<VehicleCreate> }) => updateVehicle(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); setEditVehicle(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); setDeleteTarget(null); },
  });

  const onAdd: SubmitHandler<VehicleForm> = (d) => createMutation.mutate(d);
  const onEdit: SubmitHandler<VehicleForm> = (d) => {
    if (editVehicle) updateMutation.mutate({ id: editVehicle.id, d });
  };

  const openEdit = (v: Vehicle) => {
    setEditVehicle(v);
    editForm.reset({
      vehicle_number: v.vehicle_number,
      vehicle_type: v.vehicle_type ?? undefined,
      driver_name: v.driver_name ?? undefined,
      driver_contact: v.driver_contact ?? undefined,
      seating_capacity: v.seating_capacity,
    });
  };

  const columns: Column<Vehicle>[] = [
    {
      key: "vehicle_number", header: "Vehicle Number",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Bus className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{r.vehicle_number}</span>
        </div>
      ),
    },
    { key: "vehicle_type", header: "Type", render: (r) => r.vehicle_type ?? "—" },
    { key: "driver_name", header: "Driver", render: (r) => r.driver_name ?? "—" },
    { key: "driver_contact", header: "Contact", render: (r) => r.driver_contact ?? "—" },
    { key: "seating_capacity", header: "Capacity", render: (r) => `${r.seating_capacity} seats` },
    {
      key: "is_active", header: "Status",
      render: (r) => (
        <Badge variant={r.is_active ? "default" : "secondary"}>
          {r.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions", header: "Actions",
      render: (r) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" aria-label="Edit" onClick={() => openEdit(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
            aria-label="Deactivate" onClick={() => setDeleteTarget(r)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setAddOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Vehicle</Button>
      </div>

      <DataTable
        columns={columns} data={data?.data ?? []}
        isLoading={isLoading} isError={isError} onRetry={refetch}
        total={data?.total ?? 0} page={page} pageSize={50} onPageChange={setPage}
        emptyTitle="No vehicles yet" emptyDescription="Add school vehicles to get started."
      />

      {/* Add Vehicle Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Vehicle</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onAdd)} className="space-y-4">
            <FieldWrapper label="Vehicle Number" error={form.formState.errors.vehicle_number?.message} required>
              <Input {...form.register("vehicle_number")} placeholder="KA01AB1234" />
            </FieldWrapper>
            <FieldWrapper label="Vehicle Type">
              <select {...form.register("vehicle_type")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Select type</option>
                {["BUS", "VAN", "AUTO", "OTHER"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Driver Name">
              <Input {...form.register("driver_name")} placeholder="Ramesh Kumar" />
            </FieldWrapper>
            <FieldWrapper label="Driver Contact">
              <Input {...form.register("driver_contact")} placeholder="+91-9876543210" />
            </FieldWrapper>
            <FieldWrapper label="Seating Capacity" error={form.formState.errors.seating_capacity?.message}>
              <Input type="number" {...form.register("seating_capacity")} min={1} max={200} />
            </FieldWrapper>
            {createMutation.isError && <p className="text-sm text-destructive">Failed to create vehicle</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Vehicle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={!!editVehicle} onOpenChange={(o) => !o && setEditVehicle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Vehicle</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <FieldWrapper label="Vehicle Number" error={editForm.formState.errors.vehicle_number?.message} required>
              <Input {...editForm.register("vehicle_number")} placeholder="KA01AB1234" />
            </FieldWrapper>
            <FieldWrapper label="Vehicle Type">
              <select {...editForm.register("vehicle_type")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Select type</option>
                {["BUS", "VAN", "AUTO", "OTHER"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Driver Name">
              <Input {...editForm.register("driver_name")} placeholder="Ramesh Kumar" />
            </FieldWrapper>
            <FieldWrapper label="Driver Contact">
              <Input {...editForm.register("driver_contact")} placeholder="+91-9876543210" />
            </FieldWrapper>
            <FieldWrapper label="Seating Capacity" error={editForm.formState.errors.seating_capacity?.message}>
              <Input type="number" {...editForm.register("seating_capacity")} min={1} max={200} />
            </FieldWrapper>
            {updateMutation.isError && <p className="text-sm text-destructive">Failed to update vehicle</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditVehicle(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Deactivate Vehicle"
        description={`Deactivate vehicle "${deleteTarget?.vehicle_number}"? It will no longer appear in active listings.`}
        variant="destructive" confirmLabel="Deactivate"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// ── Route Card with expandable stops ─────────────────────────────────────────

function RouteCard({
  route,
  onDelete,
}: {
  route: Route;
  onDelete: (r: Route) => void;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [addStopOpen, setAddStopOpen] = useState(false);

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ["route-detail", route.id],
    queryFn: () => getRoute(route.id),
    enabled: expanded,
  });

  const stopForm = useForm<StopForm>({ resolver: zodResolver(stopSchema) });

  const addStopMutation = useMutation({
    mutationFn: (d: RouteStopCreate) => createStop(route.id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["route-detail", route.id] });
      setAddStopOpen(false);
      stopForm.reset();
    },
  });

  const deleteStopMutation = useMutation({
    mutationFn: (stopId: string) => deleteStop(stopId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route-detail", route.id] }),
  });

  const onAddStop: SubmitHandler<StopForm> = (d) => addStopMutation.mutate(d);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{route.name}</p>
                <Badge variant={route.is_active ? "default" : "secondary"} className="text-xs">
                  {route.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {route.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{route.description}</p>
              )}
            </div>
          </div>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0"
            onClick={() => onDelete(route)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {expanded && (
          <div className="mt-3 pl-7">
            {loadingDetail ? (
              <p className="text-xs text-muted-foreground">Loading stops...</p>
            ) : (
              <>
                {(detail?.stops ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No stops yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(detail?.stops ?? []).map((stop: RouteStop) => (
                      <div key={stop.id} className="flex items-center justify-between gap-2 text-sm p-2 rounded-md bg-muted/40">
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">{stop.stop_order}.</span>
                          <span className="truncate">{stop.stop_name}</span>
                          {stop.morning_pickup_time && (
                            <span className="text-xs text-muted-foreground shrink-0">↑ {stop.morning_pickup_time}</span>
                          )}
                          {stop.evening_dropoff_time && (
                            <span className="text-xs text-muted-foreground shrink-0">↓ {stop.evening_dropoff_time}</span>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive shrink-0"
                          onClick={() => deleteStopMutation.mutate(stop.id)}
                          disabled={deleteStopMutation.isPending}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button size="sm" variant="outline" className="mt-2 h-7 text-xs"
                  onClick={() => setAddStopOpen(true)}>
                  <PlusCircle className="mr-1 h-3 w-3" />Add Stop
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>

      {/* Add Stop Dialog */}
      <Dialog open={addStopOpen} onOpenChange={setAddStopOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Stop to {route.name}</DialogTitle></DialogHeader>
          <form onSubmit={stopForm.handleSubmit(onAddStop)} className="space-y-4">
            <FieldWrapper label="Stop Name" error={stopForm.formState.errors.stop_name?.message} required>
              <Input {...stopForm.register("stop_name")} placeholder="Bus Stand, MG Road" />
            </FieldWrapper>
            <FieldWrapper label="Stop Order">
              <Input type="number" {...stopForm.register("stop_order")} min={0} />
            </FieldWrapper>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="Morning Pickup (HH:MM)">
                <Input {...stopForm.register("morning_pickup_time")} placeholder="07:30" />
              </FieldWrapper>
              <FieldWrapper label="Evening Dropoff (HH:MM)">
                <Input {...stopForm.register("evening_dropoff_time")} placeholder="15:00" />
              </FieldWrapper>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="Latitude (optional)">
                <Input type="number" step="any" {...stopForm.register("latitude")} placeholder="12.9716" />
              </FieldWrapper>
              <FieldWrapper label="Longitude (optional)">
                <Input type="number" step="any" {...stopForm.register("longitude")} placeholder="77.5946" />
              </FieldWrapper>
            </div>
            {addStopMutation.isError && <p className="text-sm text-destructive">Failed to add stop</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddStopOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addStopMutation.isPending}>
                {addStopMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Stop
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Routes Tab ────────────────────────────────────────────────────────────────

function RoutesTab() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Route | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["routes"],
    queryFn: () => listRoutes(1, 50),
  });

  const form = useForm<RouteForm>({ resolver: zodResolver(routeSchema) });

  const createMutation = useMutation({
    mutationFn: (d: RouteCreate) => createRoute(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["routes"] }); setAddOpen(false); form.reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRoute(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["routes"] }); setDeleteTarget(null); },
  });

  const onAdd: SubmitHandler<RouteForm> = (d) => createMutation.mutate(d);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setAddOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Route</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bus className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No routes yet</p>
          <p className="text-sm">Create your first transport route to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.data ?? []).map((route) => (
            <RouteCard key={route.id} route={route} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* Add Route Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Route</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onAdd)} className="space-y-4">
            <FieldWrapper label="Route Name" error={form.formState.errors.name?.message} required>
              <Input {...form.register("name")} placeholder="North Zone Route" />
            </FieldWrapper>
            <FieldWrapper label="Description">
              <Input {...form.register("description")} placeholder="Covers MG Road, Indiranagar..." />
            </FieldWrapper>
            {createMutation.isError && <p className="text-sm text-destructive">Failed to create route</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Route
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Deactivate Route"
        description={`Deactivate route "${deleteTarget?.name}"?`}
        variant="destructive" confirmLabel="Deactivate"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// ── Assignments Tab ───────────────────────────────────────────────────────────

function AssignmentsTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TransportAssignment | null>(null);
  const [filterRoute, setFilterRoute] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["assignments", page, filterRoute, filterVehicle],
    queryFn: () =>
      listAssignments({
        page,
        pageSize: 50,
        routeId: filterRoute || undefined,
        vehicleId: filterVehicle || undefined,
      }),
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles-all"],
    queryFn: () => listVehicles(1, 200),
  });

  const { data: routesData } = useQuery({
    queryKey: ["routes-all"],
    queryFn: () => listRoutes(1, 200),
  });

  const form = useForm<AssignForm>({ resolver: zodResolver(assignSchema) });
  const selectedRouteId = form.watch("route_id");

  const { data: routeDetail } = useQuery({
    queryKey: ["route-detail", selectedRouteId],
    queryFn: () => getRoute(selectedRouteId),
    enabled: !!selectedRouteId,
  });

  const assignMutation = useMutation({
    mutationFn: (d: TransportAssignmentCreate) => assignTransport(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      setAssignOpen(false);
      form.reset();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => unassignTransport(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assignments"] }); setDeleteTarget(null); },
  });

  const onAssign: SubmitHandler<AssignForm> = (d) =>
    assignMutation.mutate({
      student_id: d.student_id,
      vehicle_id: d.vehicle_id,
      route_id: d.route_id,
      stop_id: d.stop_id || undefined,
      academic_session_id: d.academic_session_id,
    });

  const vehicleMap = Object.fromEntries(
    (vehiclesData?.data ?? []).map((v) => [v.id, v])
  );
  const routeMap = Object.fromEntries(
    (routesData?.data ?? []).map((r) => [r.id, r])
  );

  const columns: Column<TransportAssignment>[] = [
    { key: "student_id", header: "Student ID", render: (r) => <span className="font-mono text-xs">{r.student_id.slice(0, 8)}…</span> },
    { key: "vehicle_id", header: "Vehicle", render: (r) => vehicleMap[r.vehicle_id]?.vehicle_number ?? r.vehicle_id.slice(0, 8) },
    { key: "route_id", header: "Route", render: (r) => routeMap[r.route_id]?.name ?? r.route_id.slice(0, 8) },
    { key: "academic_session_id", header: "Session", render: (r) => <span className="font-mono text-xs">{r.academic_session_id.slice(0, 8)}…</span> },
    {
      key: "is_active", header: "Status",
      render: (r) => <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Active" : "Inactive"}</Badge>,
    },
    {
      key: "actions", header: "Actions",
      render: (r) => (
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
          onClick={() => setDeleteTarget(r)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4 justify-between">
        <div className="flex gap-2 flex-wrap">
          <select value={filterRoute} onChange={(e) => { setFilterRoute(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="">All Routes</option>
            {(routesData?.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={filterVehicle} onChange={(e) => { setFilterVehicle(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="">All Vehicles</option>
            {(vehiclesData?.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
          </select>
        </div>
        <Button onClick={() => setAssignOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Assign Student</Button>
      </div>

      <DataTable
        columns={columns} data={data?.data ?? []}
        isLoading={isLoading} isError={isError} onRetry={refetch}
        total={data?.total ?? 0} page={page} pageSize={50} onPageChange={setPage}
        emptyTitle="No assignments yet" emptyDescription="Assign students to vehicles and routes."
      />

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Student to Transport</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onAssign)} className="space-y-4">
            <FieldWrapper label="Student ID (UUID)" error={form.formState.errors.student_id?.message} required>
              <Input {...form.register("student_id")} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </FieldWrapper>
            <FieldWrapper label="Vehicle" error={form.formState.errors.vehicle_id?.message} required>
              <select {...form.register("vehicle_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Select vehicle</option>
                {(vehiclesData?.data ?? []).filter((v) => v.is_active).map((v) => (
                  <option key={v.id} value={v.id}>{v.vehicle_number} ({v.seating_capacity} seats)</option>
                ))}
              </select>
            </FieldWrapper>
            <FieldWrapper label="Route" error={form.formState.errors.route_id?.message} required>
              <select {...form.register("route_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Select route</option>
                {(routesData?.data ?? []).filter((r) => r.is_active).map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </FieldWrapper>
            {selectedRouteId && (
              <FieldWrapper label="Stop (optional)">
                <select {...form.register("stop_id")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">No specific stop</option>
                  {(routeDetail?.stops ?? []).map((s: RouteStop) => (
                    <option key={s.id} value={s.id}>{s.stop_order}. {s.stop_name}</option>
                  ))}
                </select>
              </FieldWrapper>
            )}
            <FieldWrapper label="Academic Session ID (UUID)" error={form.formState.errors.academic_session_id?.message} required>
              <Input {...form.register("academic_session_id")} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </FieldWrapper>
            {assignMutation.isError && (
              <p className="text-sm text-destructive">
                {(assignMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to assign transport"}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={assignMutation.isPending}>
                {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Assign
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Remove Assignment"
        description="Remove this student's transport assignment?"
        variant="destructive" confirmLabel="Remove"
        onConfirm={() => deleteTarget && removeMutation.mutate(deleteTarget.id)}
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}

// ── Page Root ─────────────────────────────────────────────────────────────────

export default function TransportPage() {
  return (
    <div>
      <PageHeader
        title="Transport"
        description="Manage school vehicles, routes, and student transport assignments"
      />

      <Tabs defaultValue="vehicles">
        <TabsList className="mb-5">
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles">
          <VehiclesTab />
        </TabsContent>

        <TabsContent value="routes">
          <RoutesTab />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
