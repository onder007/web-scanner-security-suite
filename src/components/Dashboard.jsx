import React from 'react';

const Dashboard = ({ stats, status }) => {
  const progressPercent = stats.totalUrls > 0 
    ? Math.min(100, Math.round((stats.scannedUrls / stats.totalUrls) * 100)) 
    : 0;

  return (
    <div className="glass-panel dashboard animate-slide-up">
      <div className="dashboard-header">
        <h2>Scan Progress</h2>
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
          {status}
        </span>
      </div>

      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
        <div className="progress-text">
          {stats.scannedUrls} / {stats.totalUrls || 0} Pages ({progressPercent}%)
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Scanned</h3>
          <p>{stats.scannedUrls}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p>{Math.max(0, stats.totalUrls - stats.scannedUrls)}</p>
        </div>
        <div className="stat-card success">
          <h3>Success (200)</h3>
          <p>{stats.successes}</p>
        </div>
        <div className="stat-card error404">
          <h3>404 Not Found</h3>
          <p>{stats.error404}</p>
        </div>
        <div className="stat-card error500">
          <h3>Server Errors</h3>
          <p>{stats.error500}</p>
        </div>
        <div className="stat-card redirect">
          <h3>Redirects</h3>
          <p>{stats.redirects}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
