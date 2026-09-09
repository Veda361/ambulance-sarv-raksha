import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Alert, AlertSeverity } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [ackFilter, setAckFilter] = useState<string>('UNACKNOWLEDGED');

  const fetchAlerts = async () => {
    try {
      const isAck = ackFilter === 'ALL' ? undefined : ackFilter === 'ACKNOWLEDGED';
      const sev = severityFilter === 'ALL' ? undefined : (severityFilter as AlertSeverity);
      const data = await api.listAlerts({ severity: sev, isAcknowledged: isAck });
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, ackFilter]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId);
      await fetchAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge alert');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.025em' }}>
          Operational & Clinical Alerts Center
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
          Actionable deterioration triggers, device disconnections, and dispatch delays
        </p>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem' }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>

          <select
            className="form-select"
            value={ackFilter}
            onChange={(e) => setAckFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem' }}
          >
            <option value="UNACKNOWLEDGED">Unacknowledged Only</option>
            <option value="ACKNOWLEDGED">Acknowledged Only</option>
            <option value="ALL">All Alerts</option>
          </select>
        </div>

        <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
          Total Alerts: <strong>{alerts.length}</strong>
        </div>
      </div>

      {/* Alerts List */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading alert logs...
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            No alerts found matching current filter criteria.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {alerts.map((al) => (
              <div
                key={al.id}
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid #1f293d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  backgroundColor: al.is_acknowledged ? 'transparent' : 'rgba(15, 23, 42, 0.5)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <StatusBadge type="severity" value={al.severity} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9375rem' }}>
                      {al.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'flex', gap: '1rem' }}>
                      <span>Type: <strong>{al.alert_type}</strong></span>
                      {al.mission_code && <span>Mission: <strong>{al.mission_code}</strong></span>}
                      {al.ambulance_call_sign && <span>Unit: <strong>{al.ambulance_call_sign}</strong></span>}
                      <span>Logged: {new Date(al.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {al.is_acknowledged ? (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                      ✓ Acknowledged by {al.acknowledged_by_name || 'Staff'}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(al.id)}
                      className="btn btn-primary"
                      style={{ padding: '0.375rem 0.875rem', fontSize: '0.75rem' }}
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
