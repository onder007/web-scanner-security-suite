import React, { useState, useEffect } from 'react';
import { getScanHistory, clearScanHistory } from '../storage/historyDb.js';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
  info: '#94a3b8'
};

const SecurityHistory = ({ lang = 'tr', t }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getScanHistory();
    setHistory(data);
  };

  const handleClear = async () => {
    const confirmMsg = lang === 'tr' 
      ? 'Tüm güvenlik tarama geçmişini silmek istediğinize emin misiniz?' 
      : 'Are you sure you want to clear the entire security scan history?';
    if (confirm(confirmMsg)) {
      await clearScanHistory();
      setHistory([]);
    }
  };

  return (
    <div className="glass-panel animate-slide-up">
      <div className="dashboard-header" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {lang === 'tr' ? 'Tarama Geçmişi' : 'Scan History'}
        </h2>
        <button 
          className="btn btn-outline" 
          onClick={handleClear} 
          disabled={history.length === 0} 
          style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', fontSize: '0.72rem', padding: '4px 10px' }}
        >
          {lang === 'tr' ? 'Geçmişi Temizle' : 'Clear History'}
        </button>
      </div>

      {history.length === 0 ? (
        <div className="sec-empty-state">
          <div className="sec-empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
              <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
          </div>
          <p>{lang === 'tr' ? 'Henüz kaydedilmiş tarama geçmişi yok.' : 'No scan history yet.'}</p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            {lang === 'tr' ? 'Tamamlanan taramalar otomatik olarak buraya kaydedilecektir.' : 'Completed scans will be saved here automatically.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {history.map((scan) => (
            <div key={scan.id} style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{scan.domain}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(scan.date).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px', wordBreak: 'break-all' }}>
                {scan.url}
              </div>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
                  scan.summary[sev] > 0 && (
                    <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: color }}></div>
                      <span style={{ color: 'var(--text-secondary)' }}>{sev.toUpperCase()}: {scan.summary[sev]}</span>
                    </div>
                  )
                ))}
                {scan.summary.total === 0 && (
                  <span style={{ color: '#10b981', fontSize: '0.75rem' }}>{lang === 'tr' ? 'Zafiyet Bulunamadı (Güvenli)' : 'No findings (Safe)'}</span>
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
