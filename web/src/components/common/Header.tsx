import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { realtimeClient } from '../../services/websocket';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [wsStatus, setWsStatus] = useState(realtimeClient.getStatus());

  useEffect(() => {
    return realtimeClient.onStatusChange((status) => {
      setWsStatus(status);
    });
  }, []);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        backgroundColor: '#111827',
        borderBottom: '1px solid #1f293d',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '1rem',
            }}
          >
            +
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.025em', color: '#f8fafc' }}>
              SARV RAKSHA
            </span>
            <span
              style={{
                marginLeft: '0.5rem',
                fontSize: '0.75rem',
                backgroundColor: '#1e293b',
                padding: '0.125rem 0.375rem',
                borderRadius: '4px',
                color: '#38bdf8',
                fontWeight: 600,
              }}
            >
              HOSPITAL OPS
            </span>
          </div>
        </div>

        {/* Realtime Connection Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.625rem',
            borderRadius: '9999px',
            backgroundColor:
              wsStatus === 'CONNECTED'
                ? 'rgba(16, 185, 129, 0.1)'
                : wsStatus === 'RECONNECTING'
                ? 'rgba(249, 115, 22, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${
              wsStatus === 'CONNECTED'
                ? 'rgba(16, 185, 129, 0.3)'
                : wsStatus === 'RECONNECTING'
                ? 'rgba(249, 115, 22, 0.3)'
                : 'rgba(239, 68, 68, 0.3)'
            }`,
            fontSize: '0.75rem',
            fontWeight: 500,
            color:
              wsStatus === 'CONNECTED'
                ? '#10b981'
                : wsStatus === 'RECONNECTING'
                ? '#f97316'
                : '#ef4444',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor:
                wsStatus === 'CONNECTED'
                  ? '#10b981'
                  : wsStatus === 'RECONNECTING'
                  ? '#f97316'
                  : '#ef4444',
            }}
          />
          {wsStatus === 'CONNECTED' ? 'LIVE SYNC' : wsStatus}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: '#f8fafc' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {user.role.replace(/_/g, ' ')}
              </div>
            </div>
            <button
              onClick={logout}
              className="btn btn-secondary"
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
