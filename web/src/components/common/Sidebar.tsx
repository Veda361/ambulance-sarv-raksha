import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unacknowledgedAlertsCount?: number;
  inboundCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unacknowledgedAlertsCount = 0,
  inboundCount = 0,
}) => {
  const { hasRole } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Operations Dashboard', icon: '📊', alwaysShow: true },
    { id: 'fleet', label: 'Ambulance Fleet', icon: '🚑', alwaysShow: true },
    { id: 'missions', label: 'Mission Dispatch', icon: '🚨', alwaysShow: true },
    {
      id: 'receiving',
      label: 'Inbound Radar',
      icon: '🏥',
      badge: inboundCount > 0 ? inboundCount : undefined,
      badgeColor: '#0284c7',
      alwaysShow: true,
    },
    {
      id: 'alerts',
      label: 'Operational Alerts',
      icon: '🔔',
      badge: unacknowledgedAlertsCount > 0 ? unacknowledgedAlertsCount : undefined,
      badgeColor: '#ef4444',
      alwaysShow: true,
    },
    {
      id: 'audit',
      label: 'Audit Trail (WORM)',
      icon: '🛡️',
      roles: ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'HOSPITAL_ADMIN'],
    },
    {
      id: 'settings',
      label: 'Hospital & Diversion',
      icon: '⚙️',
      roles: ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'HOSPITAL_ADMIN'],
    },
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#111827',
        borderRight: '1px solid #1f293d',
        padding: '1.25rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', padding: '0 0.75rem 0.5rem', letterSpacing: '0.05em' }}>
        OPERATIONAL WORKSPACE
      </div>

      {navItems
        .filter((item) => item.alwaysShow || (item.roles && hasRole(...(item.roles as any))))
        .map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? '#1e293b' : 'transparent',
                color: isActive ? '#f8fafc' : '#94a3b8',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  style={{
                    backgroundColor: item.badgeColor || '#38bdf8',
                    color: 'white',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.125rem 0.4375rem',
                    borderRadius: '9999px',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
    </aside>
  );
};
