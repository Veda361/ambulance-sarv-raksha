import { query } from '../../database/index.js';
import { NotFoundError } from '../../shared/errors.js';
import { AuditService } from '../audit/auditService.js';

export interface CreatePatientInput {
  tenantId: string;
  name: string;
  age?: number;
  gender?: string;
  emergencyContact?: string;
  chiefComplaint?: string;
}

export class PatientService {
  public static async createPatient(input: CreatePatientInput, actorId?: string): Promise<any> {
    const res = await query(
      `INSERT INTO patients (tenant_id, name, age, gender, emergency_contact, chief_complaint)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.tenantId,
        input.name,
        input.age || null,
        input.gender || 'UNKNOWN',
        input.emergencyContact || null,
        input.chiefComplaint || null,
      ]
    );

    const patient = res.rows[0];

    await AuditService.record({
      tenantId: input.tenantId,
      actorId,
      action: 'PATIENT_RECORD_CREATED',
      resourceType: 'patient',
      resourceId: patient.id,
      details: { age: patient.age, gender: patient.gender },
    });

    return patient;
  }

  public static async getPatientById(id: string, tenantId: string): Promise<any> {
    const res = await query(
      'SELECT * FROM patients WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (res.rows.length === 0) {
      throw new NotFoundError(`Patient '${id}' not found in this organization`);
    }
    return res.rows[0];
  }
}
