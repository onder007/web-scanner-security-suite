import React from 'react';

const Dashboard = ({ stats, status, t }) => {
  const progressPercent = stats.totalUrls > 0 
    ? Math.min(100, Math.round((stats.scannedUrls / stats.totalUrls) * 100)) 
    : 0;

  const statusLabel = {
    idle: 'HAZIR',
    running: 'ÇALIŞIYOR',
    paused: 'DURAKLATILDI',
    stopped: 'DURDURULDU',
    completed: 'TAMAMLANDI'
  }[status] || status;

  return (
    <div className="glass-panel dashboard animate-slide-up">
      <div className="dashboard-header">
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {t?.scanProgress || 'Scan Progress'}
        </h2>
        <span className="status-badge" style={{
          background: status === 'running' ? 'rgba(59, 130, 246, 0.2)' : 
                      status === 'paused' ? 'rgba(245, 158, 11, 0.2)' : 
                      status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 
                      'rgba(148, 163, 184, 0.2)',
          color: status === 'running' ? '#60a5fa' : 
                 status === 'paused' ? '#fbbf24' : 
                 status === 'completed' ? '#34d399' : 
                 '#cbd5e1',
          textTransform: 'uppercase'
        }}>
          {statusLabel}
        </span>
      </div>

      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
        <div className="progress-text">
          {stats.scannedUrls} / {stats.totalUrls || 0} {t?.pages || 'Pages'} ({progressPercent}%)
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{t?.scanned || 'Scanned'}</h3>
          <p>{stats.scannedUrls}</p>
        </div>
        <div className="stat-card">
          <h3>{t?.pending || 'Pending'}</h3>
          <p>{Math.max(0, stats.totalUrls - stats.scannedUrls)}</p>
        </div>
        <div className="stat-card success">
          <h3>{t?.success200 || 'Success (200)'}</h3>
          <p>{stats.successes}</p>
        </div>
        <div className="stat-card error404">
          <h3>{t?.error404 || '404 Not Found'}</h3>
          <p>{stats.error404}</p>
        </div>
        <div className="stat-card error500">
          <h3>{t?.error500 || 'Server Errors'}</h3>
          <p>{stats.error500}</p>
        </div>
        <div className="stat-card redirect">
          <h3>{t?.redirects || 'Redirects'}</h3>
          <p>{stats.redirects}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
