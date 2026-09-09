import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [integrityReport, setIntegrityReport] = useState<{ valid: boolean; totalRecords: number; brokenAt?: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchLogs = async () => {
    try {
      const data = await api.listAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const rep = await api.verifyAuditIntegrity();
      setIntegrityReport(rep);
    } catch (err: any) {
      alert(err.message || 'Integrity check failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.025em' }}>
            Immutable WORM Audit Trail
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Write-Once-Read-Many cryptographic SHA-256 hash chains with database tamper prevention triggers
          </p>
        </div>
        <button
          onClick={handleVerifyIntegrity}
          className="btn btn-primary"
          style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
          disabled={isVerifying}
        >
          {isVerifying ? 'Validating Blockchain...' : '🛡️ Verify Hash Chain Integrity'}
        </button>
      </div>

      {/* Verification Result Banner */}
      {integrityReport && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: integrityReport.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${integrityReport.valid ? '#10b981' : '#ef4444'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <strong style={{ color: integrityReport.valid ? '#10b981' : '#ef4444', fontSize: '1rem' }}>
              {integrityReport.valid ? '✓ CRYPTOGRAPHIC AUDIT INTEGRITY CONFIRMED' : '⚠️ AUDIT CHAIN INTEGRITY VIOLATION DETECTED'}
            </strong>
            <p style={{ fontSize: '0.8125rem', color: '#e2e8f0', marginTop: '0.25rem' }}>
              {integrityReport.valid
                ? `All ${integrityReport.totalRecords} sequential append-only audit entries verified via SHA-256 hash chaining. Zero tampering or deletion detected.`
                : `Hash chain broken at record ID: ${integrityReport.brokenAt}. Possible manual modification detected.`}
            </p>
          </div>
          <button
            onClick={() => setIntegrityReport(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Audit Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '0.875rem 1rem' }}>Timestamp</th>
              <th style={{ padding: '0.875rem 1rem' }}>Action</th>
              <th style={{ padding: '0.875rem 1rem' }}>Resource</th>
              <th style={{ padding: '0.875rem 1rem' }}>Actor</th>
              <th style={{ padding: '0.875rem 1rem' }}>IP Address</th>
              <th style={{ padding: '0.875rem 1rem' }}>Current SHA-256 Hash</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #1f293d' }}>
                  <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#38bdf8' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#e2e8f0' }}>
                    {log.resource_type} ({log.resource_id.slice(0, 8)}...)
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                    {log.actor_name ? `${log.actor_name} (${log.actor_role})` : 'System'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#64748b' }}>
                    {log.client_ip || '127.0.0.1'}
                  </td>
                  <td
                    style={{
                      padding: '0.75rem 1rem',
                      fontFamily: 'monospace',
                      color: '#a855f7',
                      fontSize: '0.6875rem',
                      maxWidth: '180px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={log.current_hash}
                  >
                    {log.current_hash}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
