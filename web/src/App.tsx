import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FleetPage } from './pages/FleetPage';
import { MissionsPage } from './pages/MissionsPage';
import { ReceivingPage } from './pages/ReceivingPage';
import { AlertsPage } from './pages/AlertsPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [unackAlertsCount, setUnackAlertsCount] = useState<number>(0);
  const [inboundCount, setInboundCount] = useState<number>(0);

  // Poll / refresh badges periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshBadges = async () => {
      try {
        const kpis = await api.getDashboardKPIs();
        setUnackAlertsCount(kpis.alerts.unacknowledgedTotal);
        const inbound = await api.listInboundMissions();
        setInboundCount(inbound.length);
      } catch {
        // Silently tolerate during startup
      }
    };

    refreshBadges();
    const interval = setInterval(refreshBadges, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0b0f19',
          color: '#94a3b8',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Initializing Sarv Raksha Hospital Operations...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unacknowledgedAlertsCount={unackAlertsCount}
          inboundCount={inboundCount}
        />
        <main
          style={{
            flex: 1,
            padding: '1.75rem',
            overflowY: 'auto',
            backgroundColor: '#0b0f19',
          }}
        >
          {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
          {activeTab === 'fleet' && <FleetPage />}
          {activeTab === 'missions' && <MissionsPage />}
          {activeTab === 'receiving' && <ReceivingPage />}
          {activeTab === 'alerts' && <AlertsPage />}
          {activeTab === 'audit' && <AuditPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
