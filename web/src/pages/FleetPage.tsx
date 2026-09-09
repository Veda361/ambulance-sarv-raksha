import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Ambulance, VehicleCapability, VehicleStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';

export const FleetPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [capabilityFilter, setCapabilityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Register Ambulance Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [callSign, setCallSign] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [capability, setCapability] = useState<VehicleCapability>('BLS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchAmbulances = async () => {
    try {
      const data = await api.listAmbulances();
      setAmbulances(data);
    } catch (err) {
      console.error('Failed to load fleet', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const handleStatusChange = async (ambulanceId: string, newStatus: VehicleStatus) => {
    try {
      await api.updateAmbulanceStatus(ambulanceId, newStatus);
      await fetchAmbulances();
    } catch (err: any) {
      alert(err.message || 'Failed to update vehicle status');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    try {
      await api.createAmbulance({
        callSign,
        registrationNumber: regNumber,
        capability,
      });
      setIsModalOpen(false);
      setCallSign('');
      setRegNumber('');
      await fetchAmbulances();
    } catch (err: any) {
      setModalError(err.message || 'Failed to register ambulance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAmbulances = ambulances.filter((a) => {
    if (capabilityFilter !== 'ALL' && a.capability !== capabilityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        a.call_sign.toLowerCase().includes(query) ||
        a.registration_number.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.025em' }}>
            Hospital Ambulance Fleet Management
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Operational capability, vehicle status, and assigned emergency response units
          </p>
        </div>
        {hasRole('HOSPITAL_ADMIN', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
          >
            + Register New Ambulance
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1rem',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            style={{ width: '240px', padding: '0.5rem 0.75rem' }}
            placeholder="Search callsign / registration..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="form-select"
            value={capabilityFilter}
            onChange={(e) => setCapabilityFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem' }}
          >
            <option value="ALL">All Capabilities</option>
            <option value="BLS">Basic Life Support (BLS)</option>
            <option value="ALS">Advanced Life Support (ALS)</option>
            <option value="NICU">Neonatal ICU (NICU)</option>
            <option value="PTV">Patient Transport (PTV)</option>
          </select>

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="EN_ROUTE">EN_ROUTE</option>
            <option value="TRANSPORTING">TRANSPORTING</option>
            <option value="AT_HOSPITAL">AT_HOSPITAL</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
          </select>
        </div>

        <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
          Showing <strong>{filteredAmbulances.length}</strong> of {ambulances.length} ambulances
        </div>
      </div>

      {/* Fleet Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '0.875rem 1rem' }}>Call Sign</th>
              <th style={{ padding: '0.875rem 1rem' }}>Registration</th>
              <th style={{ padding: '0.875rem 1rem' }}>Capability</th>
              <th style={{ padding: '0.875rem 1rem' }}>Operational Status</th>
              <th style={{ padding: '0.875rem 1rem' }}>GPS Coordinates</th>
              <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Loading fleet data...
                </td>
              </tr>
            ) : filteredAmbulances.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No ambulances found matching current filter criteria.
                </td>
              </tr>
            ) : (
              filteredAmbulances.map((amb) => (
                <tr
                  key={amb.id}
                  style={{ borderBottom: '1px solid #1f293d', transition: 'background-color 0.15s ease' }}
                >
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#f8fafc' }}>
                    🚑 {amb.call_sign}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', color: '#cbd5e1' }}>
                    {amb.registration_number}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: amb.capability === 'ALS' || amb.capability === 'NICU' ? '#38bdf8' : '#e2e8f0',
                      }}
                    >
                      {amb.capability}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <StatusBadge type="status" value={amb.status} />
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {amb.current_latitude && amb.current_longitude
                      ? `${amb.current_latitude.toFixed(4)}, ${amb.current_longitude.toFixed(4)}`
                      : 'No GPS Fixed'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    {amb.status === 'AVAILABLE' ? (
                      <button
                        onClick={() => handleStatusChange(amb.id, 'MAINTENANCE')}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
                      >
                        Set Maintenance
                      </button>
                    ) : amb.status === 'MAINTENANCE' ? (
                      <button
                        onClick={() => handleStatusChange(amb.id, 'AVAILABLE')}
                        className="btn btn-success"
                        style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
                      >
                        Set Available
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Active on Mission</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Register Ambulance Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Hospital Ambulance">
        {modalError && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {modalError}
          </div>
        )}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label" htmlFor="callSign">Ambulance Call Sign</label>
            <input
              id="callSign"
              className="form-input"
              value={callSign}
              onChange={(e) => setCallSign(e.target.value)}
              placeholder="e.g. AMB-ALPHA-01"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="regNumber">Vehicle Registration Number</label>
            <input
              id="regNumber"
              className="form-input"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              placeholder="e.g. UP-93-AMB-1001"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="capability">Medical Capability</label>
            <select
              id="capability"
              className="form-select"
              value={capability}
              onChange={(e) => setCapability(e.target.value as VehicleCapability)}
            >
              <option value="BLS">Basic Life Support (BLS)</option>
              <option value="ALS">Advanced Life Support (ALS)</option>
              <option value="NICU">Neonatal ICU (NICU)</option>
              <option value="PTV">Patient Transport Vehicle (PTV)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
