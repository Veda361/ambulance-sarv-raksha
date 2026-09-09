import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Mission, TriageAcuity, MissionState } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';

const FSM_MILESTONES: MissionState[] = [
  'REQUESTED',
  'ASSIGNED',
  'ACCEPTED',
  'EN_ROUTE_TO_PICKUP',
  'ARRIVED_PICKUP',
  'PATIENT_ONBOARD',
  'EN_ROUTE_TO_HOSPITAL',
  'ARRIVED_HOSPITAL',
  'HANDOVER',
  'COMPLETED',
];

export const MissionsPage: React.FC = () => {
  const { user, canViewPhi, hasRole } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  // Dispatch Modal State
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('Civil Lines, Jhansi, UP');
  const [pickupLat, setPickupLat] = useState(25.4484);
  const [pickupLon, setPickupLon] = useState(78.5685);
  const [triageAcuity, setTriageAcuity] = useState<TriageAcuity>('YELLOW_URGENT');
  const [destHospitalId, setDestHospitalId] = useState('');
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [nearestAmbulances, setNearestAmbulances] = useState<any[]>([]);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number | undefined>(45);
  const [patientComplaint, setPatientComplaint] = useState('Severe chest pain and shortness of breath');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const fetchMissions = async () => {
    try {
      const data = await api.listMissions();
      setMissions(data);
    } catch (err) {
      console.error('Failed to load missions', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      if (user?.tenantId) {
        const orgRes = await fetch(`/api/v1/organizations/${user.tenantId}/hospitals`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('sr_access_token')}` },
        });
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          setHospitals(orgData.data || []);
          if (orgData.data?.length > 0) {
            setDestHospitalId(orgData.data[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch hospitals', err);
    }
  };

  useEffect(() => {
    fetchMissions();
    loadInitialData();
  }, [user]);

  // Query nearest available ambulances when coordinates or acuity change
  useEffect(() => {
    if (!isDispatchOpen) return;
    const fetchNearest = async () => {
      try {
        const reqCapability = triageAcuity === 'RED_CRITICAL' ? 'ALS' : undefined;
        const list = await api.findNearestAmbulances(pickupLat, pickupLon, reqCapability);
        setNearestAmbulances(list);
        if (list.length > 0) {
          setSelectedAmbulanceId(list[0].id);
        }
      } catch (err) {
        console.warn('Failed to query nearest ambulances', err);
      }
    };
    fetchNearest();
  }, [isDispatchOpen, pickupLat, pickupLon, triageAcuity]);

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmbulanceId) {
      setDispatchError('Please select an eligible ambulance for assignment');
      return;
    }
    if (!destHospitalId) {
      setDispatchError('Please select a destination hospital');
      return;
    }

    setIsSubmitting(true);
    setDispatchError(null);

    try {
      // Create patient first if details provided
      let patientId: string | undefined;
      if (patientName.trim()) {
        const pRes = await fetch('/api/v1/missions/patient', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('sr_access_token')}`,
          },
          body: JSON.stringify({
            name: patientName,
            age: patientAge,
            chiefComplaint: patientComplaint,
          }),
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          patientId = pData.data.id;
        }
      }

      // Create mission with selected ambulance (default driver is current user or mock driver)
      const newMission = await api.createMission({
        ambulanceId: selectedAmbulanceId,
        driverId: user!.id,
        destinationHospitalId: destHospitalId,
        pickupAddress,
        pickupLatitude: pickupLat,
        pickupLongitude: pickupLon,
        triageAcuity,
        patient: patientId ? undefined : { name: patientName, age: patientAge, chiefComplaint: patientComplaint },
      });

      setIsDispatchOpen(false);
      await fetchMissions();
      setSelectedMission(newMission);
    } catch (err: any) {
      setDispatchError(err.message || 'Mission assignment failed. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransition = async (missionId: string, targetState: MissionState) => {
    try {
      const updated = await api.transitionMission(missionId, targetState);
      setSelectedMission(updated);
      await fetchMissions();
    } catch (err: any) {
      alert(err.message || 'Transition rejected by backend state machine.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.025em' }}>
            Mission Operations & Emergency Dispatch
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Deterministic 13-state lifecycle, spatial fleet assignment, and pre-arrival timeline
          </p>
        </div>
        {hasRole('DISPATCHER', 'HOSPITAL_ADMIN', 'ORGANIZATION_ADMIN') && (
          <button
            onClick={() => setIsDispatchOpen(true)}
            className="btn btn-primary"
            style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
          >
            + Create New Emergency Dispatch
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedMission ? '1.2fr 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Missions Table */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Code</th>
                <th style={{ padding: '0.875rem 1rem' }}>Acuity</th>
                <th style={{ padding: '0.875rem 1rem' }}>Ambulance</th>
                <th style={{ padding: '0.875rem 1rem' }}>State (FSM)</th>
                <th style={{ padding: '0.875rem 1rem' }}>Pickup</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading mission records...
                  </td>
                </tr>
              ) : missions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No missions found. Click 'Create New Emergency Dispatch' to begin.
                  </td>
                </tr>
              ) : (
                missions.map((m) => {
                  const isSelected = selectedMission?.id === m.id;
                  return (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: '1px solid #1f293d',
                        backgroundColor: isSelected ? '#1e293b' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedMission(m)}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#38bdf8' }}>
                        {m.mission_code}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <StatusBadge type="acuity" value={m.triage_acuity} />
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#f8fafc', fontWeight: 600 }}>
                        🚑 {m.ambulance_call_sign || 'Assigned'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <StatusBadge type="state" value={m.state} />
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#94a3b8', fontSize: '0.75rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.pickup_address}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMission(m);
                          }}
                        >
                          View Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mission Detail Drawer */}
        {selectedMission && (
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1f293d', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>MISSION DETAIL</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                  {selectedMission.mission_code}
                </h2>
              </div>
              <button
                onClick={() => setSelectedMission(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            {/* FSM Progress Milestones */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                FSM Lifecycle Progression
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {FSM_MILESTONES.map((step, idx) => {
                  const isCurrent = selectedMission.state === step;
                  const isPast = FSM_MILESTONES.indexOf(selectedMission.state) > idx;
                  return (
                    <span
                      key={step}
                      style={{
                        fontSize: '0.6875rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: isCurrent ? '#0284c7' : isPast ? '#065f46' : '#1e293b',
                        color: isCurrent ? '#ffffff' : isPast ? '#6ee7b7' : '#64748b',
                        fontWeight: isCurrent ? 700 : 500,
                        border: isCurrent ? '1px solid #38bdf8' : '1px solid #334155',
                      }}
                    >
                      {step.replace(/_/g, ' ')}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Operational Information Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Destination Hospital</span>
                <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.25rem' }}>
                  🏥 {selectedMission.destination_hospital_name || 'Hospital'}
                </div>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Assigned Ambulance</span>
                <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.25rem' }}>
                  🚑 {selectedMission.ambulance_call_sign || 'Unit Assigned'}
                </div>
              </div>

              {canViewPhi() && selectedMission.patient_name && (
                <div style={{ backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '6px', gridColumn: 'span 2' }}>
                  <span style={{ color: '#94a3b8' }}>Patient (Authorized Role View)</span>
                  <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.25rem' }}>
                    {selectedMission.patient_name} {selectedMission.patient_age ? `(${selectedMission.patient_age}y)` : ''}
                  </div>
                  {selectedMission.patient_complaint && (
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                      Complaint: {selectedMission.patient_complaint}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Workflow Action Buttons based on FSM */}
            <div style={{ borderTop: '1px solid #1f293d', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                Authorized Operational Actions
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedMission.state === 'ASSIGNED' && (
                  <button
                    onClick={() => handleTransition(selectedMission.id, 'ACCEPTED')}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                  >
                    Accept Assignment
                  </button>
                )}

                {selectedMission.state === 'ACCEPTED' && (
                  <button
                    onClick={() => handleTransition(selectedMission.id, 'EN_ROUTE_TO_PICKUP')}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                  >
                    Depart for Pickup
                  </button>
                )}

                {selectedMission.state === 'EN_ROUTE_TO_PICKUP' && (
                  <button
                    onClick={() => handleTransition(selectedMission.id, 'ARRIVED_PICKUP')}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                  >
                    Mark Arrived at Pickup
                  </button>
                )}

                {selectedMission.state === 'ARRIVED_PICKUP' && (
                  <button
                    onClick={() => handleTransition(selectedMission.id, 'PATIENT_ONBOARD')}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                  >
                    Confirm Patient Onboard
                  </button>
                )}

                {selectedMission.state === 'PATIENT_ONBOARD' && (
                  <button
                    onClick={() => handleTransition(selectedMission.id, 'EN_ROUTE_TO_HOSPITAL')}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                  >
                    Depart for Hospital
                  </button>
                )}

                {selectedMission.state === 'EN_ROUTE_TO_HOSPITAL' && (
                  <button
                    onClick={() => handleTransition(selectedMission.id, 'ARRIVED_HOSPITAL')}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                  >
                    Mark Arrived Hospital
                  </button>
                )}

                {['REQUESTED', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE_TO_PICKUP'].includes(selectedMission.state) && (
                  <button
                    onClick={() => handleTransition(selectedMission.id, 'CANCELLED')}
                    className="btn btn-danger"
                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                  >
                    Cancel Mission
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Emergency Dispatch Modal */}
      <Modal isOpen={isDispatchOpen} onClose={() => setIsDispatchOpen(false)} title="Create Emergency Ambulance Dispatch" maxWidth="640px">
        {dispatchError && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {dispatchError}
          </div>
        )}

        <form onSubmit={handleCreateDispatch}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Incident Pickup Address</label>
              <input
                className="form-input"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={pickupLat}
                onChange={(e) => setPickupLat(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={pickupLon}
                onChange={(e) => setPickupLon(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Triage Priority / Acuity</label>
              <select
                className="form-select"
                value={triageAcuity}
                onChange={(e) => setTriageAcuity(e.target.value as TriageAcuity)}
              >
                <option value="RED_CRITICAL">RED (Critical Life-Threatening - ALS)</option>
                <option value="YELLOW_URGENT">YELLOW (Urgent Serious - BLS/ALS)</option>
                <option value="GREEN_NON_URGENT">GREEN (Non-Urgent Standard)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Destination Hospital Facility</label>
              <select
                className="form-select"
                value={destHospitalId}
                onChange={(e) => setDestHospitalId(e.target.value)}
                required
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.trauma_level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Realtime Eligible Nearest Ambulances Selection */}
          <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
            <label className="form-label">
              Eligible Nearest Ambulances (Ranked via Spherical Haversine Distance)
            </label>
            {nearestAmbulances.length === 0 ? (
              <div style={{ padding: '0.75rem', backgroundColor: '#1e293b', borderRadius: '6px', fontSize: '0.8125rem', color: '#f97316' }}>
                ⚠️ No available ambulances found for this capability. Please review fleet status.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.375rem' }}>
                {nearestAmbulances.map((amb) => {
                  const isSelected = selectedAmbulanceId === amb.id;
                  const distKm = (amb.distance_meters / 1000).toFixed(1);
                  return (
                    <div
                      key={amb.id}
                      onClick={() => setSelectedAmbulanceId(amb.id)}
                      style={{
                        padding: '0.625rem 0.875rem',
                        backgroundColor: isSelected ? '#0369a1' : '#1e293b',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid #334155',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span>🚑 <strong>{amb.call_sign}</strong> ({amb.capability})</span>
                        <span style={{ fontSize: '0.75rem', color: isSelected ? '#e0f2fe' : '#94a3b8' }}>
                          Reg: {amb.registration_number}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, color: isSelected ? '#ffffff' : '#38bdf8' }}>
                        {distKm} km away
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional Patient Demographics */}
          <div style={{ borderTop: '1px solid #1f293d', paddingTop: '0.75rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Patient Name (Optional)</label>
              <input
                className="form-input"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                className="form-input"
                value={patientAge || ''}
                onChange={(e) => setPatientAge(parseInt(e.target.value) || undefined)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Chief Complaint</label>
              <input
                className="form-input"
                value={patientComplaint}
                onChange={(e) => setPatientComplaint(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDispatchOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || nearestAmbulances.length === 0}
            >
              {isSubmitting ? 'Assigning...' : 'Confirm Dispatch & Assign Ambulance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
