-- Migration 002: Phase 2 Hospital Operations Platform Schema Extensions
-- Adds hospital staff scoping, inbound receiving coordination, idempotency tracking, and operational indexes

-- 1. Link users explicitly to a facility if hospital-scoped
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_hospital ON users(hospital_id);

-- 2. Inbound Receiving Hospital Coordination on missions
ALTER TABLE missions
ADD COLUMN IF NOT EXISTS receiving_acknowledged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS receiving_acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS receiving_prepared_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS receiving_prepared_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 3. Idempotency Keys table for safe network retry protection
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key VARCHAR(255) PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_path VARCHAR(255) NOT NULL,
  params_hash VARCHAR(64) NOT NULL,
  response_status INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_tenant ON idempotency_keys(tenant_id);

-- 4. Operational Performance Indexes
CREATE INDEX IF NOT EXISTS idx_missions_dest_state ON missions(destination_hospital_id, state);
CREATE INDEX IF NOT EXISTS idx_alerts_ack ON alerts(tenant_id, is_acknowledged, created_at);
CREATE INDEX IF NOT EXISTS idx_ambulances_hospital ON ambulances(hospital_id);

-- 5. Row-Level Security for Idempotency
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_idempotency_tenant ON idempotency_keys
  FOR ALL USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);
