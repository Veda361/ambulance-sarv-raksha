import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { InboundMission } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { realtimeClient } from '../services/websocket';

export const ReceivingPage: React.FC = () => {
  const { user } = useAuth();
  const [inboundMissions, setInboundMissions] = useState<InboundMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Handover Modal State
  const [selectedMission, setSelectedMission] = useState<InboundMission | null>(null);
  const [handoverNotes, setHandoverNotes] = useState('Patient handed over to emergency triage team. Vitals verified and stable.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInbound = async () => {
    try {
      const data = await api.listInboundMissions(user?.hospitalId);
      setInboundMissions(data);
    } catch (err) {
      console.error('Failed to load inbound radar', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInbound();

    // Subscribe to hospital radar
    if (user?.hospitalId) {
      const unsub = realtimeClient.subscribe(`hospital:${user.hospitalId}:radar`, (msg) => {
        console.log('Hospital radar update received:', msg);
        fetchInbound();
      });
      return unsub;
    }
  }, [user]);

  const handleAcknowledge = async (missionId: string) => {
    try {
      await api.acknowledgeInbound(missionId);
      await fetchInbound();
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge inbound ambulance');
    }
  };

  const handlePrepare = async (missionId: string) => {
    try {
      await api.markFacilityPrepared(missionId);
      await fetchInbound();
    } catch (err: any) {
      alert(err.message || 'Failed to update facility preparation status');
    }
  };

  const handleCompleteHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMission) return;
    setIsSubmitting(true);
    try {
      await api.completeHandover(selectedMission.id, handoverNotes);
      setSelectedMission(null);
      await fetchInbound();
    } catch (err: any) {
      alert(err.message || 'Handover transition failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.025em' }}>
            Inbound Emergency Ambulance Radar
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Pre-arrival patient notifications, live ETA countdown, and clinical handover workflow
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-info radar-pulse">
            ● RADAR ACTIVE
          </span>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Loading inbound radar cases...
        </div>
      ) : inboundMissions.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏥</div>
          <h3 style={{ color: '#f8fafc', fontSize: '1.125rem', marginBottom: '0.25rem' }}>
            No Inbound Ambulances Approaching Facility
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Emergency cases dispatched to this hospital will appear here with live ETA and pre-arrival vitals.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {inboundMissions.map((m) => {
            const etaMinutes = m.current_eta_seconds ? Math.max(1, Math.round(m.current_eta_seconds / 60)) : null;
            const isCritical = m.triage_acuity === 'RED_CRITICAL' || (m.news2_score && m.news2_score >= 7);

            return (
              <div
                key={m.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  borderLeft: `4px solid ${isCritical ? '#ef4444' : '#0284c7'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                      {m.mission_code}
                    </span>
                    <StatusBadge type="acuity" value={m.triage_acuity} />
                    <StatusBadge type="state" value={m.state} />
                  </div>

                  {/* ETA Counter */}
                  <div
                    style={{
                      padding: '0.375rem 0.875rem',
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      textAlign: 'right',
                    }}
                  >
                    <span style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Estimated Arrival
                    </span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isCritical ? '#ef4444' : '#38bdf8' }}>
                      {etaMinutes ? `~${etaMinutes} MINS` : 'IN TRANSIT'}
                    </div>
                  </div>
                </div>

                {/* Patient & Unit Summary Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ backgroundColor: '#1e293b', padding: '0.875rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PATIENT DEMOGRAPHICS</div>
                    <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.25rem' }}>
                      {m.patient_name || 'Emergency Patient'} {m.patient_age ? `(${m.patient_age}y, ${m.patient_gender || 'Unknown'})` : ''}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                      Complaint: <strong>{m.patient_complaint || 'Urgent transport requested'}</strong>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#1e293b', padding: '0.875rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>INBOUND AMBULANCE</div>
                    <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.25rem' }}>
                      🚑 {m.ambulance_call_sign} ({m.ambulance_capability})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                      Origin: {m.pickup_address}
                    </div>
                  </div>

                  {/* Pre-Arrival Telemetry & NEWS2 Score */}
                  <div style={{ backgroundColor: '#1e293b', padding: '0.875rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>LATEST VITALS / NEWS2 SCORE</div>
                    {m.news2_score !== undefined && m.news2_score !== null ? (
                      <div style={{ marginTop: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: m.news2_score >= 7 ? '#ef4444' : '#10b981' }}>
                            NEWS2: {m.news2_score}
                          </span>
                          {m.news2_score >= 7 && (
                            <span style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '4px', fontWeight: 700 }}>
                              HIGH RISK DETERIORATION
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                          HR: {m.heart_rate || '--'} bpm | SpO2: {m.spo2_percent || '--'}% | BP: {m.systolic_bp || '--'}/{m.diastolic_bp || '--'}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        No telemetry transmitted yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Bar for Receiving Staff */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1f293d', paddingTop: '0.875rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                    {m.receiving_acknowledged_at ? (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        ✓ Acknowledged ({new Date(m.receiving_acknowledged_at).toLocaleTimeString()})
                      </span>
                    ) : (
                      <span style={{ color: '#f97316' }}>⏳ Awaiting Triage Acknowledgment</span>
                    )}

                    {m.receiving_prepared_at && (
                      <span style={{ color: '#0284c7', fontWeight: 600 }}>
                        ✓ Resus Bay Prepared ({new Date(m.receiving_prepared_at).toLocaleTimeString()})
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!m.receiving_acknowledged_at && (
                      <button
                        onClick={() => handleAcknowledge(m.id)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                      >
                        Acknowledge Inbound
                      </button>
                    )}

                    {!m.receiving_prepared_at && (
                      <button
                        onClick={() => handlePrepare(m.id)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                      >
                        Mark Bay Prepared
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedMission(m)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                    >
                      Receive & Complete Handover
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Handover Dialog */}
      <Modal isOpen={!!selectedMission} onClose={() => setSelectedMission(null)} title="Complete Patient Clinical Handover">
        <form onSubmit={handleCompleteHandover}>
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#cbd5e1' }}>
            Confirming physical arrival and patient handover for mission: <strong>{selectedMission?.mission_code}</strong>.
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="notes">Clinical Handover Documentation / Notes</label>
            <textarea
              id="notes"
              className="form-textarea"
              rows={4}
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              placeholder="Record patient condition, handover physician/nurse name, and receiving ward details..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedMission(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Recording...' : 'Confirm Handover & Finalize Mission'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
