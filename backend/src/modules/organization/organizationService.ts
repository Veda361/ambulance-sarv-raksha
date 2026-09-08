import { query } from '../../database/index.js';
import { NotFoundError, ConflictError } from '../../shared/errors.js';
import { AuditService } from '../audit/auditService.js';

export interface CreateOrganizationInput {
  name: string;
  code: string;
  type: 'PRIVATE_HOSPITAL' | 'HOSPITAL_NETWORK' | 'AMBULANCE_OPERATOR' | 'GOVERNMENT_EMS' | 'INDEPENDENT_FLEET';
  contactEmail: string;
  contactPhone?: string;
}

export interface CreateHospitalInput {
  tenantId: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  address: string;
  traumaLevel?: string;
  contactPhone: string;
}

export class OrganizationService {
  public static async createOrganization(input: CreateOrganizationInput, actorId?: string): Promise<any> {
    const existing = await query('SELECT id FROM organizations WHERE code = $1', [input.code]);
    if (existing.rows.length > 0) {
      throw new ConflictError(`Organization with code '${input.code}' already exists`);
    }

    const res = await query(
      `INSERT INTO organizations (name, code, type, contact_email, contact_phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.name, input.code, input.type, input.contactEmail, input.contactPhone || null]
    );

    const org = res.rows[0];

    await AuditService.record({
      tenantId: org.id,
      actorId,
      action: 'ORGANIZATION_CREATED',
      resourceType: 'organization',
      resourceId: org.id,
      details: { name: org.name, code: org.code, type: org.type },
    });

    return org;
  }

  public static async getOrganizationById(id: string): Promise<any> {
    const res = await query('SELECT * FROM organizations WHERE id = $1', [id]);
    if (res.rows.length === 0) {
      throw new NotFoundError(`Organization with ID '${id}' not found`);
    }
    return res.rows[0];
  }

  public static async listOrganizations(): Promise<any[]> {
    const res = await query('SELECT * FROM organizations WHERE is_active = true ORDER BY name ASC');
    return res.rows;
  }

  public static async createHospital(input: CreateHospitalInput, actorId?: string): Promise<any> {
    const existing = await query(
      'SELECT id FROM hospitals WHERE tenant_id = $1 AND code = $2',
      [input.tenantId, input.code]
    );
    if (existing.rows.length > 0) {
      throw new ConflictError(`Hospital with code '${input.code}' already exists in this tenant`);
    }

    const res = await query(
      `INSERT INTO hospitals (tenant_id, name, code, latitude, longitude, address, trauma_level, contact_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.tenantId,
        input.name,
        input.code,
        input.latitude,
        input.longitude,
        input.address,
        input.traumaLevel || 'LEVEL_1',
        input.contactPhone,
      ]
    );

    const hospital = res.rows[0];

    await AuditService.record({
      tenantId: input.tenantId,
      actorId,
      action: 'HOSPITAL_CREATED',
      resourceType: 'hospital',
      resourceId: hospital.id,
      details: { name: hospital.name, code: hospital.code },
    });

    return hospital;
  }

  public static async listHospitalsByTenant(tenantId: string): Promise<any[]> {
    const res = await query(
      'SELECT * FROM hospitals WHERE tenant_id = $1 AND is_active = true ORDER BY name ASC',
      [tenantId]
    );
    return res.rows;
  }
}
