import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { pool } from '../../src/database/index.js';
import { runMigrations } from '../../src/database/migrate.js';
import { AuditService } from '../../src/modules/audit/auditService.js';

const app = createApp();

describe('Phase 1 Production Engineering Foundation — End-to-End Suite', () => {
  let orgA: any;
  let orgB: any;
  let hospitalA: any;
  let adminAToken: string;
  let dispatcherAToken: string;
  let driverAToken: string;
  let driverAUser: any;
  let emtAToken: string;
  let nurseAToken: string;
  let adminBToken: string;
  let driverBToken: string;
  let ambulanceA: any;
  let ambulanceB: any;
  let patientA: any;
  let missionA: any;

  beforeAll(async () => {
    // Ensure test database is migrated and clean
    await runMigrations();
    await pool.query('TRUNCATE TABLE audit_logs, alerts, vital_measurements, locations, mission_events, missions, devices, patients, crew_shifts, ambulances, hospitals, user_refresh_tokens, users, organizations CASCADE');
  });

  afterAll(async () => {
    await pool.end();
  });

  // ============================================================
  // 1. ORGANIZATIONS & HOSPITALS
  // ============================================================
  it('1. Creates Organization A (Hospital) and Organization B (Operator)', async () => {
    // We register directly via database for initial seed or auth
    const orgResA = await pool.query(
      `INSERT INTO organizations (name, code, type, contact_email) 
       VALUES ('Apex Healthcare Network', 'APEX-01', 'HOSPITAL_NETWORK', 'admin@apex.org') RETURNING *`
    );
    orgA = orgResA.rows[0];

    const orgResB = await pool.query(
      `INSERT INTO organizations (name, code, type, contact_email) 
       VALUES ('Metro Fleet Operators', 'METRO-02', 'AMBULANCE_OPERATOR', 'ops@metro.com') RETURNING *`
    );
    orgB = orgResB.rows[0];

    expect(orgA.id).toBeDefined();
    expect(orgB.id).toBeDefined();
  });

  it('2. Creates Hospital A under Organization A', async () => {
    const hospRes = await pool.query(
      `INSERT INTO hospitals (tenant_id, name, code, latitude, longitude, address, contact_phone)
       VALUES ($1, 'Apex Trauma Center', 'APEX-MAIN', 25.4484, 78.5685, 'Civil Lines, Jhansi', '+915102441111')
       RETURNING *`,
      [orgA.id]
    );
    hospitalA = hospRes.rows[0];
    expect(hospitalA.name).toBe('Apex Trauma Center');
  });

  // ============================================================
  // 2. USERS, ROLES & AUTHENTICATION
  // ============================================================
  it('3. Provisions Users across Org A and Org B and Authenticates', async () => {
    // Register Admin A
    const regAdminA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        tenantId: orgA.id,
        name: 'Dr. Ramesh Sharma',
        email: 'ramesh.admin@apex.org',
        password: 'Password@1234',
        role: 'ORGANIZATION_ADMIN',
      });
    expect(regAdminA.status).toBe(201);

    // Register Dispatcher A
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        tenantId: orgA.id,
        name: 'Suresh Dispatch',
        email: 'suresh.cad@apex.org',
        password: 'Password@1234',
        role: 'DISPATCHER',
      });

    // Register Driver A
    const regDriverA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        tenantId: orgA.id,
        name: 'Mahesh Driver',
        email: 'mahesh.driver@apex.org',
        password: 'Password@1234',
        role: 'DRIVER',
      });
    driverAUser = regDriverA.body.data;

    // Register EMT A
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        tenantId: orgA.id,
        name: 'Priya EMT',
        email: 'priya.emt@apex.org',
        password: 'Password@1234',
        role: 'EMT',
      });

    // Register Receiving Hospital Nurse A
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        tenantId: orgA.id,
        name: 'Sister Anita',
        email: 'anita.nurse@apex.org',
        password: 'Password@1234',
        role: 'RECEIVING_HOSPITAL_USER',
      });

    // Register Org B Admin
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        tenantId: orgB.id,
        name: 'Metro Admin',
        email: 'admin@metro.com',
        password: 'Password@1234',
        role: 'ORGANIZATION_ADMIN',
      });

    // Register Org B Driver
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        tenantId: orgB.id,
        name: 'Karan Driver B',
        email: 'karan@metro.com',
        password: 'Password@1234',
        role: 'DRIVER',
      });

    // Login Admin A
    const loginAdminA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ramesh.admin@apex.org', password: 'Password@1234' });
    expect(loginAdminA.status).toBe(200);
    adminAToken = loginAdminA.body.data.accessToken;

    // Login Dispatcher A
    const loginDispA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'suresh.cad@apex.org', password: 'Password@1234' });
    dispatcherAToken = loginDispA.body.data.accessToken;

    // Login Driver A
    const loginDriverA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'mahesh.driver@apex.org', password: 'Password@1234' });
    driverAToken = loginDriverA.body.data.accessToken;

    // Login EMT A
    const loginEmtA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'priya.emt@apex.org', password: 'Password@1234' });
    emtAToken = loginEmtA.body.data.accessToken;

    // Login Nurse A
    const loginNurseA = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'anita.nurse@apex.org', password: 'Password@1234' });
    nurseAToken = loginNurseA.body.data.accessToken;

    // Login Admin B
    const loginAdminB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@metro.com', password: 'Password@1234' });
    adminBToken = loginAdminB.body.data.accessToken;

    // Login Driver B
    const loginDriverB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'karan@metro.com', password: 'Password@1234' });
    driverBToken = loginDriverB.body.data.accessToken;

    expect(adminAToken).toBeDefined();
    expect(dispatcherAToken).toBeDefined();
    expect(driverAToken).toBeDefined();
    expect(adminBToken).toBeDefined();
  });

  // ============================================================
  // 3. FLEET & SPATIAL QUERIES
  // ============================================================
  it('4. Registers ambulances in Org A and Org B', async () => {
    const resA = await request(app)
      .post('/api/v1/fleet/ambulances')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        callSign: 'APEX-ALS-01',
        registrationNumber: 'UP-93-AM-0001',
        capability: 'ALS',
        latitude: 25.4480,
        longitude: 78.5680,
      });
    expect(resA.status).toBe(201);
    ambulanceA = resA.body.data;

    const resB = await request(app)
      .post('/api/v1/fleet/ambulances')
      .set('Authorization', `Bearer ${adminBToken}`)
      .send({
        callSign: 'METRO-BLS-10',
        registrationNumber: 'UP-93-BM-9999',
        capability: 'BLS',
        latitude: 25.4600,
        longitude: 78.5700,
      });
    expect(resB.status).toBe(201);
    ambulanceB = resB.body.data;
  });

  it('5. Queries nearest available ambulances using Haversine calculation', async () => {
    const res = await request(app)
      .get('/api/v1/fleet/ambulances/nearest?lat=25.4482&lon=78.5682')
      .set('Authorization', `Bearer ${dispatcherAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].call_sign).toBe('APEX-ALS-01');
    expect(res.body.data[0].distance_meters).toBeLessThan(100); // within 100 meters
  });

  // ============================================================
  // 4. PATIENT & MISSION CREATION
  // ============================================================
  it('6. Creates Patient record under Org A', async () => {
    const res = await request(app)
      .post('/api/v1/missions/patient')
      .set('Authorization', `Bearer ${dispatcherAToken}`)
      .send({
        name: 'Rajesh Kumar',
        age: 54,
        gender: 'MALE',
        emergencyContact: '+919876543210',
        chiefComplaint: 'Severe retrosternal chest pain radiating to left arm',
      });

    expect(res.status).toBe(201);
    patientA = res.body.data;
    expect(patientA.name).toBe('Rajesh Kumar');
  });

  it('7. Creates Mission A and assigns Ambulance A & Driver A', async () => {
    const res = await request(app)
      .post('/api/v1/missions')
      .set('Authorization', `Bearer ${dispatcherAToken}`)
      .send({
        patientId: patientA.id,
        ambulanceId: ambulanceA.id,
        driverId: driverAUser.id,
        destinationHospitalId: hospitalA.id,
        triageAcuity: 'RED_CRITICAL',
        pickupLatitude: 25.4400,
        pickupLongitude: 78.5600,
        pickupAddress: 'Sipri Bazar, Jhansi',
      });

    expect(res.status).toBe(201);
    missionA = res.body.data;
    expect(missionA.mission_code).toMatch(/^MSN-/);
    expect(missionA.state).toBe('ASSIGNED');
  });

  // ============================================================
  // 5. DETERMINISTIC FSM LIFECYCLE PROGRESSION
  // ============================================================
  it('8. Driver A accepts mission (ASSIGNED -> ACCEPTED)', async () => {
    const res = await request(app)
      .post(`/api/v1/missions/${missionA.id}/transition`)
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({ targetState: 'ACCEPTED' });

    expect(res.status).toBe(200);
    expect(res.body.data.state).toBe('ACCEPTED');
  });

  it('9. Progresses through milestones (ACCEPTED -> EN_ROUTE_TO_PICKUP -> ARRIVED_PICKUP -> PATIENT_ONBOARD)', async () => {
    // EN_ROUTE_TO_PICKUP
    const r1 = await request(app)
      .post(`/api/v1/missions/${missionA.id}/transition`)
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({ targetState: 'EN_ROUTE_TO_PICKUP' });
    expect(r1.status).toBe(200);

    // ARRIVED_PICKUP
    const r2 = await request(app)
      .post(`/api/v1/missions/${missionA.id}/transition`)
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({ targetState: 'ARRIVED_PICKUP' });
    expect(r2.status).toBe(200);

    // PATIENT_ONBOARD (Executed by EMT)
    const r3 = await request(app)
      .post(`/api/v1/missions/${missionA.id}/transition`)
      .set('Authorization', `Bearer ${emtAToken}`)
      .send({ targetState: 'PATIENT_ONBOARD' });
    expect(r3.status).toBe(200);
  });

  // ============================================================
  // 6. TELEMETRY, DEDUPLICATION & CLINICAL NEWS2 ALERTS
  // ============================================================
  it('10. Streams GPS Location telemetry with Deduplication validation', async () => {
    const locPayload = {
      ambulanceId: ambulanceA.id,
      latitude: 25.4420,
      longitude: 78.5620,
      speedMps: 13.5,
      bearingDeg: 45.0,
      accuracyMeters: 5.2,
      sequenceNumber: 101,
      recordedAt: new Date().toISOString(),
    };

    // First ingestion -> 201 Created
    const res1 = await request(app)
      .post(`/api/v1/missions/${missionA.id}/location`)
      .set('Authorization', `Bearer ${driverAToken}`)
      .send(locPayload);
    expect(res1.status).toBe(201);
    expect(res1.body.data.deduplicated).toBe(false);
    expect(res1.body.data.etaSeconds).toBeGreaterThan(0);

    // Replay duplicate packet -> 200 OK (deduplicated: true)
    const res2 = await request(app)
      .post(`/api/v1/missions/${missionA.id}/location`)
      .set('Authorization', `Bearer ${driverAToken}`)
      .send(locPayload);
    expect(res2.status).toBe(200);
    expect(res2.body.data.deduplicated).toBe(true);
  });

  it('11. Streams Acute Vitals & Triggers NEWS2 Critical Alert (SpO2: 88%)', async () => {
    const vitalsPayload = {
      patientId: patientA.id,
      heartRate: 128,
      spo2Percent: 88, // Critical hypoxia trigger
      systolicBp: 85,  // Severe hypotension
      diastolicBp: 55,
      respiratoryRate: 26, // Severe tachypnea
      temperatureC: 37.2,
      recordedAt: new Date().toISOString(),
    };

    const res = await request(app)
      .post(`/api/v1/missions/${missionA.id}/vitals`)
      .set('Authorization', `Bearer ${emtAToken}`)
      .send(vitalsPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.news2.totalScore).toBeGreaterThanOrEqual(8);
    expect(res.body.data.news2.isCriticalAlert).toBe(true);
    expect(res.body.data.alert).not.toBeNull();
    expect(res.body.data.alert.severity).toBe('CRITICAL');
  });

  // ============================================================
  // 7. TRANSIT TO HOSPITAL, ARRIVAL & HANDOVER
  // ============================================================
  it('12. Completes Hospital Handover (EN_ROUTE_TO_HOSPITAL -> ARRIVED_HOSPITAL -> HANDOVER -> COMPLETED)', async () => {
    // EN_ROUTE_TO_HOSPITAL
    await request(app)
      .post(`/api/v1/missions/${missionA.id}/transition`)
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({ targetState: 'EN_ROUTE_TO_HOSPITAL' });

    // ARRIVED_HOSPITAL
    await request(app)
      .post(`/api/v1/missions/${missionA.id}/transition`)
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({ targetState: 'ARRIVED_HOSPITAL' });

    // HANDOVER
    await request(app)
      .post(`/api/v1/missions/${missionA.id}/transition`)
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({ targetState: 'HANDOVER' });

    // COMPLETED (Signed by Hospital Triage Nurse)
    const completeRes = await request(app)
      .post(`/api/v1/missions/${missionA.id}/transition`)
      .set('Authorization', `Bearer ${nurseAToken}`)
      .send({
        targetState: 'COMPLETED',
        metadata: { handoverNotes: 'Admitted directly to Trauma Resuscitation Bay 1' },
      });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.state).toBe('COMPLETED');
    expect(completeRes.body.data.handover_notes).toContain('Trauma Resuscitation Bay 1');
  });

  // ============================================================
  // 8. SECURITY & MULTI-TENANT ISOLATION TESTS
  // ============================================================
  it('13. Enforces Multi-Tenant Isolation: User B cannot access Org A Mission', async () => {
    const res = await request(app)
      .get(`/api/v1/missions/${missionA.id}`)
      .set('Authorization', `Bearer ${adminBToken}`);

    // Must return 404 or 403, never Org A's data
    expect([403, 404]).toContain(res.status);
  });

  it('14. Enforces Driver Isolation: Driver B cannot transition Driver A Mission', async () => {
    const res = await request(app)
      .post(`/api/v1/missions/${missionA.id}/transition`)
      .set('Authorization', `Bearer ${driverBToken}`)
      .send({ targetState: 'COMPLETED' });

    expect([403, 404, 409]).toContain(res.status);
  });

  it('15. Enforces Zero-PHI: Driver A cannot read patient details in mission', async () => {
    const res = await request(app)
      .get(`/api/v1/missions/${missionA.id}`)
      .set('Authorization', `Bearer ${driverAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.patient_name).toBeUndefined();
    expect(res.body.data.patient_complaint).toBeUndefined();
  });

  // ============================================================
  // 9. AUDIT LOG & IMMUTABILITY INTEGRITY
  // ============================================================
  it('16. Verifies Cryptographic Audit Chain Integrity', async () => {
    const check = await AuditService.verifyChainIntegrity();
    expect(check.valid).toBe(true);
    expect(check.totalRecords).toBeGreaterThanOrEqual(5);
  });

  it('17. Verifies Audit Log Immutability: Block direct SQL UPDATE on audit_logs', async () => {
    // There are audit logs recorded from mission and user events
    await expect(
      pool.query("UPDATE audit_logs SET action = 'ALTERED' WHERE id IN (SELECT id FROM audit_logs LIMIT 1)")
    ).rejects.toThrow(/Audit records are immutable/);
  });

  // ============================================================
  // 10. OBSERVABILITY HEALTH CHECKS
  // ============================================================
  it('18. Verifies Health, Readiness and Metrics endpoints', async () => {
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('UP');

    const ready = await request(app).get('/ready');
    expect(ready.status).toBe(200);
    expect(ready.body.status).toBe('READY');

    const metrics = await request(app).get('/metrics');
    expect(metrics.status).toBe(200);
    expect(metrics.body.pool).toBeDefined();
  });
});
