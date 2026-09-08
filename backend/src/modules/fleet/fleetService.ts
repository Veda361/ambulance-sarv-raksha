import { query } from '../../database/index.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { AuditService } from '../audit/auditService.js';

export interface CreateAmbulanceInput {
  tenantId: string;
  hospitalId?: string;
  callSign: string;
  registrationNumber: string;
  capability?: 'BLS' | 'ALS' | 'NICU' | 'PTV';
  latitude?: number;
  longitude?: number;
}

export interface CreateCrewShiftInput {
  tenantId: string;
  ambulanceId: string;
  driverId: string;
  emtId?: string;
  shiftStart: string;
  shiftEnd?: string;
}

export class FleetService {
  public static async createAmbulance(input: CreateAmbulanceInput, actorId?: string): Promise<any> {
    const existing = await query(
      'SELECT id FROM ambulances WHERE registration_number = $1',
      [input.registrationNumber.toUpperCase()]
    );
    if (existing.rows.length > 0) {
      throw new ConflictError(`Ambulance with registration '${input.registrationNumber}' already exists`);
    }

    const res = await query(
      `INSERT INTO ambulances 
        (tenant_id, hospital_id, call_sign, registration_number, capability, current_latitude, current_longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.tenantId,
        input.hospitalId || null,
        input.callSign,
        input.registrationNumber.toUpperCase(),
        input.capability || 'BLS',
        input.latitude || null,
        input.longitude || null,
      ]
    );

    const ambulance = res.rows[0];

    await AuditService.record({
      tenantId: input.tenantId,
      actorId,
      action: 'AMBULANCE_REGISTERED',
      resourceType: 'ambulance',
      resourceId: ambulance.id,
      details: { callSign: ambulance.call_sign, capability: ambulance.capability },
    });

    return ambulance;
  }

  public static async updateVehicleStatus(id: string, tenantId: string, status: string, actorId?: string): Promise<any> {
    const res = await query(
      `UPDATE ambulances 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND tenant_id = $3 
       RETURNING *`,
      [status, id, tenantId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`Ambulance '${id}' not found in this tenant`);
    }

    const ambulance = res.rows[0];

    await AuditService.record({
      tenantId,
      actorId,
      action: 'AMBULANCE_STATUS_UPDATED',
      resourceType: 'ambulance',
      resourceId: ambulance.id,
      details: { newStatus: status },
    });

    return ambulance;
  }

  public static async findNearestAvailableAmbulances(
    tenantId: string,
    latitude: number,
    longitude: number,
    requiredCapability?: string,
    limit: number = 5
  ): Promise<any[]> {
    let sql = `
      SELECT id, tenant_id, call_sign, registration_number, capability, status,
             current_latitude, current_longitude,
             earth_distance(
               ll_to_earth(current_latitude, current_longitude),
               ll_to_earth($1, $2)
             ) AS distance_meters
      FROM ambulances
      WHERE tenant_id = $3
        AND status = 'AVAILABLE'
        AND is_active = true
        AND current_latitude IS NOT NULL
        AND current_longitude IS NOT NULL
    `;
    const params: any[] = [latitude, longitude, tenantId];

    if (requiredCapability) {
      params.push(requiredCapability);
      sql += ` AND capability = $${params.length}`;
    }

    params.push(limit);
    sql += ` ORDER BY distance_meters ASC LIMIT $${params.length}`;

    const res = await query(sql, params);
    return res.rows;
  }

  public static async createCrewShift(input: CreateCrewShiftInput, actorId?: string): Promise<any> {
    const res = await query(
      `INSERT INTO crew_shifts (tenant_id, ambulance_id, driver_id, emt_id, shift_start, shift_end)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.tenantId,
        input.ambulanceId,
        input.driverId,
        input.emtId || null,
        input.shiftStart,
        input.shiftEnd || null,
      ]
    );

    const shift = res.rows[0];

    await AuditService.record({
      tenantId: input.tenantId,
      actorId,
      action: 'CREW_SHIFT_ASSIGNED',
      resourceType: 'crew_shift',
      resourceId: shift.id,
      details: { ambulanceId: shift.ambulance_id, driverId: shift.driver_id },
    });

    return shift;
  }

  public static async listAmbulances(tenantId: string): Promise<any[]> {
    const res = await query(
      'SELECT * FROM ambulances WHERE tenant_id = $1 AND is_active = true ORDER BY call_sign ASC',
      [tenantId]
    );
    return res.rows;
  }
}
