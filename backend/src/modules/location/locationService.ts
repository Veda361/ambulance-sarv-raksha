import { query, withTransaction } from '../../database/index.js';
import { NotFoundError } from '../../shared/errors.js';
import { realtimeGateway } from '../../realtime/wsGateway.js';
import { logger } from '../../shared/logger.js';

export interface RecordLocationInput {
  missionId: string;
  ambulanceId: string;
  tenantId: string;
  latitude: number;
  longitude: number;
  speedMps?: number;
  bearingDeg?: number;
  accuracyMeters?: number;
  sequenceNumber: number;
  recordedAt: string;
}

export class LocationService {
  public static async recordLocation(input: RecordLocationInput): Promise<any> {
    return await withTransaction(async (client) => {
      // 1. Deduplication check on (mission_id, sequence_number)
      const existing = await client.query(
        'SELECT id FROM locations WHERE mission_id = $1 AND sequence_number = $2',
        [input.missionId, input.sequenceNumber]
      );

      if (existing.rows.length > 0) {
        logger.debug(
          { missionId: input.missionId, sequenceNumber: input.sequenceNumber },
          'Deduplicated incoming telemetry packet'
        );
        return { deduplicated: true, id: existing.rows[0].id };
      }

      // 2. Insert Location breadcrumb
      const res = await client.query(
        `INSERT INTO locations 
          (mission_id, ambulance_id, tenant_id, latitude, longitude, speed_mps, bearing_deg, accuracy_meters, sequence_number, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          input.missionId,
          input.ambulanceId,
          input.tenantId,
          input.latitude,
          input.longitude,
          input.speedMps || 0.0,
          input.bearingDeg || 0.0,
          input.accuracyMeters || 0.0,
          input.sequenceNumber,
          input.recordedAt,
        ]
      );

      const location = res.rows[0];

      // 3. Update ambulance latest coordinates
      await client.query(
        `UPDATE ambulances 
         SET current_latitude = $1, current_longitude = $2, updated_at = NOW() 
         WHERE id = $3`,
        [input.latitude, input.longitude, input.ambulanceId]
      );

      // 4. Calculate dynamic ETA to destination hospital
      const missionRes = await client.query(
        `SELECT m.destination_hospital_id, h.latitude as dest_lat, h.longitude as dest_lon
         FROM missions m
         JOIN hospitals h ON h.id = m.destination_hospital_id
         WHERE m.id = $1`,
        [input.missionId]
      );

      let etaSeconds = 600; // default fallback 10m
      if (missionRes.rows.length > 0) {
        const dest = missionRes.rows[0];
        // Calculate distance via earthdistance
        const distRes = await client.query(
          `SELECT earth_distance(ll_to_earth($1, $2), ll_to_earth($3, $4)) as distance_meters`,
          [input.latitude, input.longitude, dest.dest_lat, dest.dest_lon]
        );
        const distanceMeters = distRes.rows[0]?.distance_meters || 5000;
        const averageSpeedMps = Math.max(input.speedMps || 11.1, 8.33); // at least ~30 km/h
        etaSeconds = Math.round(distanceMeters / averageSpeedMps);

        // Update ETA on mission
        await client.query('UPDATE missions SET current_eta_seconds = $1 WHERE id = $2', [
          etaSeconds,
          input.missionId,
        ]);
      }

      // 5. Broadcast to WebSocket Subscribers
      realtimeGateway.broadcast(
        `mission:${input.missionId}:telemetry`,
        'LOCATION_UPDATED',
        {
          missionId: input.missionId,
          latitude: input.latitude,
          longitude: input.longitude,
          speedMps: input.speedMps,
          bearingDeg: input.bearingDeg,
          etaSeconds,
          recordedAt: input.recordedAt,
        }
      );

      return {
        deduplicated: false,
        location,
        etaSeconds,
      };
    });
  }

  public static async getLatestLocation(missionId: string): Promise<any> {
    const res = await query(
      'SELECT * FROM locations WHERE mission_id = $1 ORDER BY recorded_at DESC, sequence_number DESC LIMIT 1',
      [missionId]
    );
    if (res.rows.length === 0) {
      throw new NotFoundError(`No location history for mission '${missionId}'`);
    }
    return res.rows[0];
  }
}
