import React, { useState, useEffect } from 'react';
import { getScanHistory, clearScanHistory } from '../storage/historyDb.js';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
  info: '#94a3b8'
};

const SecurityHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getScanHistory();
    setHistory(data);
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear the entire security scan history?')) {
      await clearScanHistory();
      setHistory([]);
    }
  };

  return (
    <div className="glass-panel animate-slide-up">
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <h2><span style={{ marginRight: '8px' }}>🗂️</span>Scan History</h2>
        <button className="btn btn-outline" onClick={handleClear} disabled={history.length === 0} style={{ borderColor: '#ef4444', color: '#ef4444' }}>
          Clear History
        </button>
      </div>

      {history.length === 0 ? (
        <div className="sec-empty-state">
          <div className="sec-empty-icon">📭</div>
          <p>No scan history yet.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Completed scans will be saved here automatically.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {history.map((scan) => (
            <div key={scan.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <strong style={{ fontSize: '1.1rem' }}>{scan.domain}</strong>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(scan.date).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px', wordBreak: 'break-all' }}>
                {scan.url}
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
                  scan.summary[sev] > 0 && (
                    <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }}></div>
                      <span>{sev.toUpperCase()}: {scan.summary[sev]}</span>
                    </div>
                  )
                ))}
                {scan.summary.total === 0 && (
                  <span style={{ color: '#10b981', fontSize: '0.85rem' }}>No findings (Safe)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SecurityHistory;
