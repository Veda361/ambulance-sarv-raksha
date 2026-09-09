import { DashboardKPIs, Ambulance, Mission, InboundMission, Alert, Hospital } from '../types';

let currentAccessToken: string | null = localStorage.getItem('sr_access_token');
let currentRefreshToken: string | null = localStorage.getItem('sr_refresh_token');

export function setTokens(access: string | null, refresh: string | null) {
  currentAccessToken = access;
  currentRefreshToken = refresh;
  if (access) localStorage.setItem('sr_access_token', access);
  else localStorage.removeItem('sr_access_token');
  if (refresh) localStorage.setItem('sr_refresh_token', refresh);
  else localStorage.removeItem('sr_refresh_token');
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function getRefreshToken(): string | null {
  return currentRefreshToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (currentAccessToken) {
    headers.set('Authorization', `Bearer ${currentAccessToken}`);
  }

  // Idempotency key for mutating requests
  if (['POST', 'PATCH', 'PUT'].includes(options.method || 'GET') && !headers.has('Idempotency-Key')) {
    headers.set('Idempotency-Key', crypto.randomUUID());
  }

  // Request Correlation ID
  headers.set('X-Request-ID', crypto.randomUUID());

  const response = await fetch(path, { ...options, headers });

  // Handle 401 Unauthorized with token refresh
  if (response.status === 401 && !isRetry && currentRefreshToken) {
    try {
      const refreshRes = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setTokens(refreshData.data.accessToken, refreshData.data.refreshToken);
        return request<T>(path, options, true);
      } else {
        setTokens(null, null);
        window.dispatchEvent(new Event('auth:logout'));
      }
    } catch {
      setTokens(null, null);
      window.dispatchEvent(new Event('auth:logout'));
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `HTTP ${response.status}: Request failed`);
  }

  return data.data;
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    return request<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  getMe: async () => request<any>('/api/v1/auth/me'),
  logout: async () => {
    if (currentRefreshToken) {
      try {
        await request('/api/v1/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
        });
      } catch {
        // Silently discard
      }
    }
    setTokens(null, null);
  },

  // Dashboard & Hospital Ops
  getDashboardKPIs: (hospitalId?: string) => {
    const url = hospitalId ? `/api/v1/hospital-ops/dashboard?hospitalId=${hospitalId}` : '/api/v1/hospital-ops/dashboard';
    return request<DashboardKPIs>(url);
  },
  getHospital: (id: string) => request<Hospital>(`/api/v1/hospital-ops/hospitals/${id}`),
  updateDiversionStatus: (id: string, diversionStatus: string) =>
    request<Hospital>(`/api/v1/hospital-ops/hospitals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ diversionStatus }),
    }),

  // Fleet
  listAmbulances: () => request<Ambulance[]>('/api/v1/fleet/ambulances'),
  createAmbulance: (ambulance: { callSign: string; registrationNumber: string; capability?: string }) =>
    request<Ambulance>('/api/v1/fleet/ambulances', {
      method: 'POST',
      body: JSON.stringify(ambulance),
    }),
  findNearestAmbulances: (lat: number, lon: number, capability?: string) => {
    let url = `/api/v1/fleet/ambulances/nearest?lat=${lat}&lon=${lon}`;
    if (capability) url += `&capability=${capability}`;
    return request<any[]>(url);
  },
  updateAmbulanceStatus: (id: string, status: string) =>
    request<Ambulance>(`/api/v1/fleet/ambulances/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Missions
  listMissions: (params?: { state?: string; triageAcuity?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.state) q.set('state', params.state);
    if (params?.triageAcuity) q.set('triageAcuity', params.triageAcuity);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    return request<Mission[]>(`/api/v1/missions?${q.toString()}`);
  },
  getMissionById: (id: string) => request<Mission>(`/api/v1/missions/${id}`),
  createMission: (payload: {
    ambulanceId: string;
    driverId: string;
    destinationHospitalId: string;
    pickupLatitude: number;
    pickupLongitude: number;
    pickupAddress: string;
    triageAcuity?: string;
    patient?: {
      name: string;
      age?: number;
      gender?: string;
      chiefComplaint?: string;
      emergencyContact?: string;
    };
  }) =>
    request<Mission>('/api/v1/missions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  transitionMission: (id: string, targetState: string, metadata?: Record<string, any>) =>
    request<Mission>(`/api/v1/missions/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ targetState, metadata }),
    }),

  // Receiving Hospital Workflow
  listInboundMissions: (hospitalId?: string) => {
    const url = hospitalId ? `/api/v1/receiving/inbound?hospitalId=${hospitalId}` : '/api/v1/receiving/inbound';
    return request<InboundMission[]>(url);
  },
  acknowledgeInbound: (id: string) =>
    request<Mission>(`/api/v1/receiving/${id}/acknowledge`, { method: 'POST' }),
  markFacilityPrepared: (id: string) =>
    request<Mission>(`/api/v1/receiving/${id}/prepare`, { method: 'POST' }),
  completeHandover: (id: string, handoverNotes: string) =>
    request<Mission>(`/api/v1/receiving/${id}/handover`, {
      method: 'POST',
      body: JSON.stringify({ handoverNotes }),
    }),

  // Alerts
  listAlerts: (params?: { severity?: string; isAcknowledged?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.severity) q.set('severity', params.severity);
    if (params?.isAcknowledged !== undefined) q.set('isAcknowledged', String(params.isAcknowledged));
    return request<Alert[]>(`/api/v1/alerts?${q.toString()}`);
  },
  acknowledgeAlert: (id: string) =>
    request<Alert>(`/api/v1/alerts/${id}/acknowledge`, { method: 'POST' }),

  // Audit
  listAuditLogs: (params?: { resourceType?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.resourceType) q.set('resourceType', params.resourceType);
    if (params?.limit) q.set('limit', String(params.limit));
    return request<any[]>(`/api/v1/audit-logs?${q.toString()}`);
  },
  verifyAuditIntegrity: () =>
    request<{ valid: boolean; totalRecords: number; brokenAt?: string }>('/api/v1/audit-logs/verify-integrity'),
};
