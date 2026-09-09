export type UserRole =
  | 'SUPER_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'HOSPITAL_ADMIN'
  | 'DISPATCHER'
  | 'DRIVER'
  | 'EMT'
  | 'RECEIVING_HOSPITAL_USER'
  | 'GOVERNMENT_OPERATOR';

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  hospitalId?: string;
}

export type VehicleCapability = 'BLS' | 'ALS' | 'NICU' | 'PTV';

export type VehicleStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'ON_SCENE'
  | 'TRANSPORTING'
  | 'AT_HOSPITAL'
  | 'MAINTENANCE'
  | 'OFF_DUTY';

export type LocationFreshness = 'LIVE' | 'RECENT' | 'STALE' | 'OFFLINE' | 'UNKNOWN';

export interface Ambulance {
  id: string;
  tenant_id: string;
  hospital_id?: string;
  call_sign: string;
  registration_number: string;
  capability: VehicleCapability;
  status: VehicleStatus;
  current_latitude?: number;
  current_longitude?: number;
  last_telemetry_at?: string;
  location_freshness?: LocationFreshness;
  home_hospital_name?: string;
  active_mission_id?: string;
  active_mission_code?: string;
  active_mission_state?: string;
  current_driver_name?: string;
}

export type MissionState =
  | 'REQUESTED'
  | 'DISPATCHING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'EN_ROUTE_TO_PICKUP'
  | 'ARRIVED_PICKUP'
  | 'PATIENT_ONBOARD'
  | 'EN_ROUTE_TO_HOSPITAL'
  | 'ARRIVED_HOSPITAL'
  | 'HANDOVER'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type TriageAcuity = 'RED_CRITICAL' | 'YELLOW_URGENT' | 'GREEN_NON_URGENT' | 'BLACK_EXPECTANT';

export interface Mission {
  id: string;
  tenant_id: string;
  mission_code: string;
  patient_id?: string;
  ambulance_id: string;
  driver_id: string;
  destination_hospital_id: string;
  destination_hospital_name?: string;
  state: MissionState;
  triage_acuity: TriageAcuity;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  current_eta_seconds?: number;
  cancellation_reason?: string;
  handover_notes?: string;
  receiving_acknowledged_at?: string;
  receiving_acknowledged_by?: string;
  receiving_prepared_at?: string;
  created_at: string;
  updated_at: string;
  ambulance_call_sign?: string;
  ambulance_capability?: VehicleCapability;
  ambulance_latitude?: number;
  ambulance_longitude?: number;
  driver_name?: string;
  driver_phone?: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  patient_complaint?: string;
}

export interface InboundMission extends Mission {
  heart_rate?: number;
  spo2_percent?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  respiratory_rate?: number;
  temperature_c?: number;
  news2_score?: number;
  vitals_recorded_at?: string;
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Alert {
  id: string;
  mission_id: string;
  mission_code?: string;
  mission_state?: string;
  triage_acuity?: TriageAcuity;
  ambulance_call_sign?: string;
  tenant_id: string;
  alert_type: string;
  severity: AlertSeverity;
  message: string;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_by_name?: string;
  acknowledged_at?: string;
  created_at: string;
}

export interface DashboardKPIs {
  fleet: {
    total: number;
    available: number;
    assigned: number;
    enRoute: number;
    onScene: number;
    transporting: number;
    atHospital: number;
    maintenance: number;
    offDuty: number;
    liveTelemetryCount: number;
  };
  missions: {
    totalActive: number;
    requested: number;
    enRoutePickup: number;
    patientOnboard: number;
    enRouteHospital: number;
    arrivedHospital: number;
    handover: number;
    completedToday: number;
  };
  alerts: {
    unacknowledgedTotal: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  activeMissions: Mission[];
  fleetStatus: Ambulance[];
  timestamp: string;
}

export interface Hospital {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  address: string;
  diversion_status: 'NORMAL' | 'ADVISORY' | 'DIVERT_ALL' | 'TRAUMA_BYPASS';
  trauma_level: string;
  contact_phone: string;
}
