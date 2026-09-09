import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Hospital } from '../types';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [diversionStatus, setDiversionStatus] = useState<string>('NORMAL');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchHospital = async () => {
    try {
      if (user?.tenantId) {
        const res = await fetch(`/api/v1/organizations/${user.tenantId}/hospitals`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('sr_access_token')}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data?.length > 0) {
            setHospital(data.data[0]);
            setDiversionStatus(data.data[0].diversion_status || 'NORMAL');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load hospital settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHospital();
  }, [user]);

  const handleUpdateStatus = async (status: string) => {
    if (!hospital) return;
    setIsUpdating(true);
    setSuccessMessage(null);
    try {
      await api.updateDiversionStatus(hospital.id, status);
      setDiversionStatus(status);
      setSuccessMessage(`Hospital diversion status updated to ${status}. Real-time radar notified.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update diversion status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading facility settings...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.025em' }}>
          Hospital Facility & Diversion Settings
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
          Operational emergency receiving status, trauma classification, and facility coordinates
        </p>
      </div>

      {successMessage && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#10b981', fontSize: '0.875rem' }}>
          ✓ {successMessage}
        </div>
      )}

      {/* Diversion Status Controls */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.5rem' }}>
          Emergency Receiving & Diversion Status
        </h2>
        <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
          Controls whether regional dispatch centers and inbound ambulances can select this facility for transport.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {[
            { id: 'NORMAL', label: 'NORMAL', desc: 'Accepting all emergency transports', color: '#10b981' },
            { id: 'ADVISORY', label: 'ADVISORY', desc: 'High ED capacity warning', color: '#f97316' },
            { id: 'DIVERT_ALL', label: 'DIVERT ALL', desc: 'Full emergency diversion active', color: '#ef4444' },
            { id: 'TRAUMA_BYPASS', label: 'TRAUMA BYPASS', desc: 'Trauma bay at capacity', color: '#a855f7' },
          ].map((item) => {
            const isCurrent = diversionStatus === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleUpdateStatus(item.id)}
                disabled={isUpdating}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: isCurrent ? `2px solid ${item.color}` : '1px solid #334155',
                  backgroundColor: isCurrent ? 'rgba(30, 41, 59, 0.9)' : '#1e293b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: item.color }}>
                    {item.label}
                  </span>
                  {isCurrent && <span style={{ color: item.color, fontSize: '0.75rem' }}>● ACTIVE</span>}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Facility Profile Overview */}
      {hospital && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>
            Facility Profile Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Hospital Facility Name</span>
              <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.25rem' }}>{hospital.name}</div>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Facility Code</span>
              <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.25rem' }}>{hospital.code}</div>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Trauma Classification</span>
              <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.25rem' }}>{hospital.trauma_level}</div>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Emergency Dispatch Line</span>
              <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.25rem' }}>{hospital.contact_phone}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Physical Address</span>
              <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '0.25rem' }}>{hospital.address}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
