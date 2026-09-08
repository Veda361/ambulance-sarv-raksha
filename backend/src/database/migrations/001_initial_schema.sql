-- Migration 001: Initial Production Schema for Sarv Raksha Platform
-- Includes multi-tenancy, deterministic domain entities, spatial calculations, and RLS

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE org_type AS ENUM (
  'PRIVATE_HOSPITAL',
  'HOSPITAL_NETWORK',
  'AMBULANCE_OPERATOR',
  'GOVERNMENT_EMS',
  'INDEPENDENT_FLEET'
);

CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'ORGANIZATION_ADMIN',
  'HOSPITAL_ADMIN',
  'DISPATCHER',
  'DRIVER',
  'EMT',
  'RECEIVING_HOSPITAL_USER',
  'GOVERNMENT_OPERATOR'
);

CREATE TYPE vehicle_capability AS ENUM (
  'BLS',
  'ALS',
  'NICU',
  'PTV'
);

CREATE TYPE vehicle_status AS ENUM (
  'AVAILABLE',
  'ASSIGNED',
  'EN_ROUTE',
  'ON_SCENE',
  'TRANSPORTING',
  'AT_HOSPITAL',
  'MAINTENANCE',
  'OFF_DUTY'
);

CREATE TYPE mission_state AS ENUM (
  'REQUESTED',
  'DISPATCHING',
  'ASSIGNED',
  'ACCEPTED',
  'EN_ROUTE_TO_PICKUP',
  'ARRIVED_PICKUP',
  'PATIENT_ONBOARD',
  'EN_ROUTE_TO_HOSPITAL',
  'ARRIVED_HOSPITAL',
  'HANDOVER',
  'COMPLETED',
  'CANCELLED',
  'REJECTED'
);

CREATE TYPE triage_acuity AS ENUM (
  'RED_CRITICAL',
  'YELLOW_URGENT',
  'GREEN_NON_URGENT',
  'BLACK_EXPECTANT'
);

CREATE TYPE alert_severity AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE device_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'REVOKED'
);

-- ============================================================
-- 1. ORGANIZATIONS (TENANTS)
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  type org_type NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. USERS & SESSIONS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  phone VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE user_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  device_id VARCHAR(255),
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON user_refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON user_refresh_tokens(token_hash);

-- ============================================================
-- 3. HOSPITALS (FACILITIES)
-- ============================================================
CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address VARCHAR(500) NOT NULL,
  diversion_status VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
  trauma_level VARCHAR(20) NOT NULL DEFAULT 'LEVEL_1',
  contact_phone VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_hospital_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX idx_hospitals_tenant ON hospitals(tenant_id);
CREATE INDEX idx_hospitals_location ON hospitals USING gist (ll_to_earth(latitude, longitude));

-- ============================================================
-- 4. AMBULANCES (VEHICLE FLEET)
-- ============================================================
CREATE TABLE ambulances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  call_sign VARCHAR(100) NOT NULL,
  registration_number VARCHAR(100) NOT NULL,
  capability vehicle_capability NOT NULL DEFAULT 'BLS',
  status vehicle_status NOT NULL DEFAULT 'AVAILABLE',
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ambulance_tenant_call_sign UNIQUE (tenant_id, call_sign),
  CONSTRAINT uq_ambulance_reg_number UNIQUE (registration_number)
);

CREATE INDEX idx_ambulances_tenant ON ambulances(tenant_id);
CREATE INDEX idx_ambulances_status ON ambulances(status);
CREATE INDEX idx_ambulances_location ON ambulances USING gist (ll_to_earth(current_latitude, current_longitude));

-- ============================================================
-- 5. CREW SHIFTS
-- ============================================================
CREATE TABLE crew_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  ambulance_id UUID NOT NULL REFERENCES ambulances(id) ON DELETE RESTRICT,
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  emt_id UUID REFERENCES users(id) ON DELETE SET NULL,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crew_shifts_tenant ON crew_shifts(tenant_id);
CREATE INDEX idx_crew_shifts_ambulance ON crew_shifts(ambulance_id);
CREATE INDEX idx_crew_shifts_driver ON crew_shifts(driver_id);

-- ============================================================
-- 6. PATIENTS (PHI)
-- ============================================================
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  age INTEGER CHECK (age >= 0 AND age <= 130),
  gender VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
  emergency_contact VARCHAR(100),
  chief_complaint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_tenant ON patients(tenant_id);

-- ============================================================
-- 7. DEVICES (IOT GATEWAYS)
-- ============================================================
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  ambulance_id UUID REFERENCES ambulances(id) ON DELETE SET NULL,
  device_identifier VARCHAR(100) NOT NULL UNIQUE,
  device_type VARCHAR(50) NOT NULL,
  api_key_hash VARCHAR(255) NOT NULL,
  status device_status NOT NULL DEFAULT 'ACTIVE',
  last_heartbeat_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_devices_tenant ON devices(tenant_id);
CREATE INDEX idx_devices_identifier ON devices(device_identifier);

-- ============================================================
-- 8. MISSIONS (CENTRAL AGGREGATE ROOT)
-- ============================================================
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  mission_code VARCHAR(50) NOT NULL UNIQUE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  ambulance_id UUID REFERENCES ambulances(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  destination_hospital_id UUID REFERENCES hospitals(id) ON DELETE RESTRICT,
  state mission_state NOT NULL DEFAULT 'REQUESTED',
  triage_acuity triage_acuity NOT NULL DEFAULT 'YELLOW_URGENT',
  pickup_latitude DOUBLE PRECISION NOT NULL,
  pickup_longitude DOUBLE PRECISION NOT NULL,
  pickup_address VARCHAR(500) NOT NULL,
  current_eta_seconds INTEGER,
  cancellation_reason VARCHAR(255),
  handover_notes TEXT,
  handover_acknowledged_at TIMESTAMPTZ,
  handover_acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_missions_tenant ON missions(tenant_id);
CREATE INDEX idx_missions_state ON missions(state);
CREATE INDEX idx_missions_driver ON missions(driver_id);
CREATE INDEX idx_missions_ambulance ON missions(ambulance_id);
CREATE INDEX idx_missions_destination ON missions(destination_hospital_id);
CREATE INDEX idx_missions_code ON missions(mission_code);

-- ============================================================
-- 9. MISSION EVENTS (IMMUTABLE STATE JOURNAL)
-- ============================================================
CREATE TABLE mission_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  from_state mission_state,
  to_state mission_state,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mission_events_mission ON mission_events(mission_id);
CREATE INDEX idx_mission_events_created ON mission_events(created_at);

-- ============================================================
-- 10. LOCATIONS (TELEMETRY BREADCRUMBS)
-- ============================================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  ambulance_id UUID NOT NULL REFERENCES ambulances(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed_mps DOUBLE PRECISION DEFAULT 0.0,
  bearing_deg DOUBLE PRECISION DEFAULT 0.0,
  accuracy_meters DOUBLE PRECISION DEFAULT 0.0,
  sequence_number BIGINT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_location_mission_seq UNIQUE (mission_id, sequence_number)
);

CREATE INDEX idx_locations_mission_time ON locations(mission_id, recorded_at);

-- ============================================================
-- 11. VITAL MEASUREMENTS
-- ============================================================
CREATE TABLE vital_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  heart_rate INTEGER,
  spo2_percent INTEGER,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  respiratory_rate INTEGER,
  temperature_c DOUBLE PRECISION,
  news2_score INTEGER,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vitals_mission_time ON vital_measurements(mission_id, recorded_at);

-- ============================================================
-- 12. ALERTS
-- ============================================================
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  alert_type VARCHAR(100) NOT NULL,
  severity alert_severity NOT NULL,
  message TEXT NOT NULL,
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_mission ON alerts(mission_id);
CREATE INDEX idx_alerts_tenant_severity ON alerts(tenant_id, severity);

-- ============================================================
-- 13. AUDIT LOGS (WORM - APPEND ONLY WITH HASH CHAIN)
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  prev_hash VARCHAR(64) NOT NULL,
  current_hash VARCHAR(64) NOT NULL,
  client_ip VARCHAR(50),
  user_agent VARCHAR(255),
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_time ON audit_logs(tenant_id, created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Block UPDATE and DELETE on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit records are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();

-- ============================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Get current tenant setting
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Tenant Isolation Policies
CREATE POLICY rls_users_tenant ON users
  FOR ALL USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

CREATE POLICY rls_hospitals_tenant ON hospitals
  FOR ALL USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

CREATE POLICY rls_ambulances_tenant ON ambulances
  FOR ALL USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

CREATE POLICY rls_crew_shifts_tenant ON crew_shifts
  FOR ALL USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

CREATE POLICY rls_patients_tenant ON patients
  FOR ALL USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

CREATE POLICY rls_devices_tenant ON devices
  FOR ALL USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

-- Missions policy: Accessible if belonging to tenant OR if destination hospital belongs to tenant (Cross-tenant envelope)
CREATE POLICY rls_missions_tenant ON missions
  FOR ALL USING (
    tenant_id = get_current_tenant_id() 
    OR destination_hospital_id IN (SELECT id FROM hospitals WHERE tenant_id = get_current_tenant_id())
    OR get_current_tenant_id() IS NULL
  );

CREATE POLICY rls_mission_events_tenant ON mission_events
  FOR ALL USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

CREATE POLICY rls_locations_tenant ON locations
  FOR ALL USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

CREATE POLICY rls_vital_measurements_tenant ON vital_measurements
  FOR ALL USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

CREATE POLICY rls_alerts_tenant ON alerts
  FOR ALL USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

CREATE POLICY rls_audit_logs_tenant ON audit_logs
  FOR ALL USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);
