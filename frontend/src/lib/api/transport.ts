import api from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/types/common";
import type {
  Vehicle,
  VehicleCreate,
  VehicleUpdate,
  Route,
  RouteDetail,
  RouteCreate,
  RouteUpdate,
  RouteStop,
  RouteStopCreate,
  RouteStopUpdate,
  TransportAssignment,
  TransportAssignmentCreate,
  StudentTransportInfo,
} from "@/types/transport";

const BASE = "/transport";

// ── Vehicles ──────────────────────────────────────────────────────────────────

export async function listVehicles(page = 1, pageSize = 50) {
  const response = await api.get<PaginatedResponse<Vehicle>>(
    `${BASE}/vehicles?page=${page}&page_size=${pageSize}`
  );
  return response.data;
}

export async function getVehicle(id: string) {
  const response = await api.get<ApiResponse<Vehicle>>(`${BASE}/vehicles/${id}`);
  return response.data.data;
}

export async function createVehicle(payload: VehicleCreate) {
  const response = await api.post<ApiResponse<Vehicle>>(`${BASE}/vehicles`, payload);
  return response.data.data;
}

export async function updateVehicle(id: string, payload: VehicleUpdate) {
  const response = await api.patch<ApiResponse<Vehicle>>(`${BASE}/vehicles/${id}`, payload);
  return response.data.data;
}

export async function deleteVehicle(id: string) {
  const response = await api.delete<ApiResponse<Record<string, never>>>(`${BASE}/vehicles/${id}`);
  return response.data;
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function listRoutes(page = 1, pageSize = 50) {
  const response = await api.get<PaginatedResponse<Route>>(
    `${BASE}/routes?page=${page}&page_size=${pageSize}`
  );
  return response.data;
}

export async function getRoute(id: string) {
  const response = await api.get<ApiResponse<RouteDetail>>(`${BASE}/routes/${id}`);
  return response.data.data;
}

export async function createRoute(payload: RouteCreate) {
  const response = await api.post<ApiResponse<Route>>(`${BASE}/routes`, payload);
  return response.data.data;
}

export async function updateRoute(id: string, payload: RouteUpdate) {
  const response = await api.patch<ApiResponse<Route>>(`${BASE}/routes/${id}`, payload);
  return response.data.data;
}

export async function deleteRoute(id: string) {
  const response = await api.delete<ApiResponse<Record<string, never>>>(`${BASE}/routes/${id}`);
  return response.data;
}

// ── Route Stops ───────────────────────────────────────────────────────────────

export async function listStops(routeId: string) {
  const response = await api.get<ApiResponse<RouteStop[]>>(`${BASE}/routes/${routeId}/stops`);
  return response.data.data;
}

export async function createStop(routeId: string, payload: RouteStopCreate) {
  const response = await api.post<ApiResponse<RouteStop>>(
    `${BASE}/routes/${routeId}/stops`,
    payload
  );
  return response.data.data;
}

export async function updateStop(stopId: string, payload: RouteStopUpdate) {
  const response = await api.patch<ApiResponse<RouteStop>>(`${BASE}/stops/${stopId}`, payload);
  return response.data.data;
}

export async function deleteStop(stopId: string) {
  const response = await api.delete<ApiResponse<Record<string, never>>>(`${BASE}/stops/${stopId}`);
  return response.data;
}

// ── Assignments ───────────────────────────────────────────────────────────────

export async function listAssignments(params: {
  studentId?: string;
  routeId?: string;
  vehicleId?: string;
  sessionId?: string;
  page?: number;
  pageSize?: number;
}) {
  const {
    studentId,
    routeId,
    vehicleId,
    sessionId,
    page = 1,
    pageSize = 50,
  } = params;

  const queryParams = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (studentId) queryParams.append("student_id", studentId);
  if (routeId) queryParams.append("route_id", routeId);
  if (vehicleId) queryParams.append("vehicle_id", vehicleId);
  if (sessionId) queryParams.append("session_id", sessionId);

  const response = await api.get<PaginatedResponse<TransportAssignment>>(
    `${BASE}/assignments?${queryParams.toString()}`
  );
  return response.data;
}

export async function assignTransport(payload: TransportAssignmentCreate) {
  const response = await api.post<ApiResponse<TransportAssignment>>(
    `${BASE}/assignments`,
    payload
  );
  return response.data.data;
}

export async function unassignTransport(assignmentId: string) {
  const response = await api.delete<ApiResponse<Record<string, never>>>(
    `${BASE}/assignments/${assignmentId}`
  );
  return response.data;
}

// ── Parent portal ─────────────────────────────────────────────────────────────

export async function getStudentTransportInfo(studentId: string, sessionId: string) {
  const response = await api.get<ApiResponse<StudentTransportInfo | null>>(
    `${BASE}/student/${studentId}/info?session_id=${sessionId}`
  );
  return response.data.data;
}
