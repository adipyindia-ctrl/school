// ── Vehicle ───────────────────────────────────────────────────────────────────

export type VehicleType = "BUS" | "VAN" | "AUTO" | "OTHER";

export interface Vehicle {
  id: string;
  school_id: string;
  vehicle_number: string;
  vehicle_type: VehicleType | null;
  driver_name: string | null;
  driver_contact: string | null;
  seating_capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleCreate {
  vehicle_number: string;
  vehicle_type?: VehicleType | null;
  driver_name?: string | null;
  driver_contact?: string | null;
  seating_capacity?: number;
}

export interface VehicleUpdate {
  vehicle_number?: string;
  vehicle_type?: VehicleType | null;
  driver_name?: string | null;
  driver_contact?: string | null;
  seating_capacity?: number;
  is_active?: boolean;
}

// ── RouteStop ─────────────────────────────────────────────────────────────────

export interface RouteStop {
  id: string;
  route_id: string;
  school_id: string;
  stop_name: string;
  stop_order: number;
  latitude: number | null;
  longitude: number | null;
  morning_pickup_time: string | null;
  evening_dropoff_time: string | null;
  created_at: string;
}

export interface RouteStopCreate {
  stop_name: string;
  stop_order?: number;
  latitude?: number | null;
  longitude?: number | null;
  morning_pickup_time?: string | null;
  evening_dropoff_time?: string | null;
}

export interface RouteStopUpdate {
  stop_name?: string;
  stop_order?: number;
  latitude?: number | null;
  longitude?: number | null;
  morning_pickup_time?: string | null;
  evening_dropoff_time?: string | null;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export interface Route {
  id: string;
  school_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RouteDetail extends Route {
  stops: RouteStop[];
}

export interface RouteCreate {
  name: string;
  description?: string | null;
  stops?: RouteStopCreate[];
}

export interface RouteUpdate {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

// ── TransportAssignment ───────────────────────────────────────────────────────

export interface TransportAssignment {
  id: string;
  school_id: string;
  student_id: string;
  vehicle_id: string;
  route_id: string;
  stop_id: string | null;
  academic_session_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransportAssignmentCreate {
  student_id: string;
  vehicle_id: string;
  route_id: string;
  stop_id?: string | null;
  academic_session_id: string;
}

// ── Parent portal info ────────────────────────────────────────────────────────

export interface StudentTransportInfo {
  assignment_id: string;
  vehicle_number: string;
  vehicle_type: VehicleType | null;
  driver_name: string | null;
  driver_contact: string | null;
  route_name: string;
  stop_name: string | null;
  morning_pickup_time: string | null;
  evening_dropoff_time: string | null;
}
