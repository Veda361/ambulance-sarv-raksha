import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardKPIs } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { HospitalMap } from '../components/map/HospitalMap';
import { realtimeClient } from '../services/websocket';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchKPIs = async () => {
    try {
      const data = await api.getDashboardKPIs();
      setKpis(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard KPIs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();

    // Subscribe to tenant-level real-time fleet events
    if (user?.tenantId) {
      const unsub = realtimeClient.subscribe(`tenant:${user.tenantId}:fleet`, (msg) => {
        console.log('Realtime fleet event received on dashboard:', msg);
        fetchKPIs();
      });
      return unsub;
    }
  }, [user]);

  if (isLoading || !kpis) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
        Loading operational telemetry...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner with Quick Actions & Sync Time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.025em' }}>
            Hospital Operations Center
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Live fleet readiness, mission dispatch progression, and pre-arrival radar
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Last sync: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={() => onNavigate('missions')}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            + New Emergency Dispatch
          </button>
        </div>
      </div>

      {/* Critical Alert Bar (if unacknowledged alerts exist) */}
      {kpis.alerts.unacknowledgedTotal > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            backgroundColor: kpis.alerts.critical > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)',
            border: `1px solid ${kpis.alerts.critical > 0 ? '#ef4444' : '#f97316'}`,
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🚨</span>
            <div>
              <strong style={{ color: kpis.alerts.critical > 0 ? '#ef4444' : '#f97316' }}>
                {kpis.alerts.unacknowledgedTotal} Unacknowledged Operational Alert{kpis.alerts.unacknowledgedTotal > 1 ? 's' : ''}
              </strong>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#e2e8f0' }}>
                ({kpis.alerts.critical} Critical, {kpis.alerts.high} High)
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="btn btn-secondary"
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
          >
            Review & Acknowledge
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="glass-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            Available Fleet
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.375rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
              {kpis.fleet.available}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>/ {kpis.fleet.total} total</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
            ● {kpis.fleet.liveTelemetryCount} GPS Live
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            Active Missions
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.375rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0284c7' }}>
              {kpis.missions.totalActive}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>in progress</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {kpis.missions.enRouteHospital + kpis.missions.arrivedHospital} inbound to facility
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            In Transit / Transporting
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.375rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f97316' }}>
              {kpis.fleet.transporting + kpis.fleet.enRoute}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>on road</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#f97316', marginTop: '0.25rem' }}>
            {kpis.missions.patientOnboard} patients onboard
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            Completed Today
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.375rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
              {kpis.missions.completedToday}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>missions</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            100% WORM audited
          </div>
        </div>
      </div>

      {/* Main Operations Split View: Live Map & Active Missions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        {/* Left: Live Hospital Fleet Map */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc' }}>
                Ambulance Radar & Spatial Tracking
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Real-time Haversine distance calculations and GPS freshness
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.6875rem' }}>
              <span style={{ color: '#10b981' }}>● Live (&lt;30s)</span>
              <span style={{ color: '#0284c7' }}>● Recent (&lt;2m)</span>
              <span style={{ color: '#f97316' }}>● Stale</span>
            </div>
          </div>

          <HospitalMap
            ambulances={kpis.fleetStatus}
            activeMissions={kpis.activeMissions}
            selectedAmbulanceId={selectedAmbulanceId}
            onSelectAmbulance={(id) => setSelectedAmbulanceId(id)}
            height="400px"
          />
        </div>

        {/* Right: Active Missions List */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc' }}>
              Active Emergency Dispatches
            </h2>
            <button
              onClick={() => onNavigate('missions')}
              style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
            >
              View All ({kpis.missions.totalActive}) &rarr;
            </button>
          </div>

          {kpis.activeMissions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              No active emergency missions currently dispatched.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '400px' }}>
              {kpis.activeMissions.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '0.875rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.875rem' }}>
                      {m.mission_code}
                    </span>
                    <StatusBadge type="acuity" value={m.triage_acuity} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.375rem' }}>
                    📍 {m.pickup_address}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                      🚑 {m.ambulance_call_sign} ({m.ambulance_capability})
                    </span>
                    <StatusBadge type="state" value={m.state} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
