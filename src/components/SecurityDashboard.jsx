// src/components/SecurityDashboard.jsx
// Security Scanner kontrol paneli — başlatma, durdurma, progress ve özet

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateSecurityPdf } from '../utils/pdfGenerator.js';
import { calculateCompliance } from '../security/complianceEngine.js';
import ComplianceCard from './ComplianceCard.jsx';

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Critical' },
  high:     { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', label: 'High' },
  medium:   { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Medium' },
  low:      { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: 'Low' },
  info:     { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', label: 'Info' },
};

function isScannableUrl(url) {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

const SecurityDashboard = ({ status, stats, summary, findings = [], onStart, onStop, currentTabUrl, lang = 'tr', t }) => {
  const isRunning = status === 'running';
  const isIdle = status === 'idle';
  const isCompleted = status === 'completed' || status === 'cancelled' || status === 'error';
  const [targetInput, setTargetInput] = React.useState(currentTabUrl || '');

  const severityLabels = lang === 'tr' ? {
    critical: 'Kritik',
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük',
    info: 'Bilgi'
  } : {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    info: 'Info'
  };

  const dynamicSeverityConfig = {
    critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: severityLabels.critical },
    high:     { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', label: severityLabels.high },
    medium:   { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: severityLabels.medium },
    low:      { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: severityLabels.low },
    info:     { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', label: severityLabels.info },
  };

  React.useEffect(() => {
    if (currentTabUrl && currentTabUrl.startsWith('http') && !targetInput) {
      setTargetInput(currentTabUrl);
    }
  }, [currentTabUrl]);

  const cleanTarget = (targetInput || '').trim();
  const canScan = cleanTarget.length > 0 && !cleanTarget.startsWith('chrome://') && !cleanTarget.startsWith('chrome-extension://');

  let displayUrl = cleanTarget || currentTabUrl || '';
  try {
    const formatted = displayUrl.startsWith('http') ? displayUrl : 'https://' + displayUrl;
    const u = new URL(formatted);
    displayUrl = u.hostname + (u.pathname !== '/' ? u.pathname : '');
  } catch {}

  // ── Chart Data Calculations ───────────────────────────────────────────────
  const severityData = useMemo(() => {
    return [
      { name: severityLabels.critical, value: summary.critical || 0, color: '#ef4444' },
      { name: severityLabels.high, value: summary.high || 0, color: '#f97316' },
      { name: severityLabels.medium, value: summary.medium || 0, color: '#f59e0b' },
      { name: severityLabels.low, value: summary.low || 0, color: '#3b82f6' },
      { name: severityLabels.info, value: summary.info || 0, color: '#94a3b8' }
    ].filter(item => item.value > 0);
  }, [summary, lang]);

  const categoryData = useMemo(() => {
    const counts = {};
    findings.forEach(f => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      count
    })).sort((a, b) => b.count - a.count);
  }, [findings]);

  const securityScore = useMemo(() => {
    let score = 100;
    score -= (summary.critical || 0) * 25;
    score -= (summary.high || 0) * 15;
    score -= (summary.medium || 0) * 5;
    score -= (summary.low || 0) * 1;
    return Math.max(0, score);
  }, [summary]);

  const scoreColor = securityScore > 80 ? '#34d399' : securityScore > 50 ? '#fbbf24' : '#ef4444';

  const compliance = useMemo(() => {
    return calculateCompliance(findings, stats);
  }, [findings, stats]);

  const openFullTab = () => {
    if (chrome?.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    }
  };

  const statusLabel = {
    idle: lang === 'tr' ? 'HAZIR' : 'IDLE',
    running: lang === 'tr' ? 'ÇALIŞIYOR' : 'RUNNING',
    completed: lang === 'tr' ? 'TAMAMLANDI' : 'COMPLETED',
    cancelled: lang === 'tr' ? 'İPTAL EDİLDİ' : 'CANCELLED',
    error: lang === 'tr' ? 'HATA' : 'ERROR'
  }[status] || status;

  return (
    <div className="glass-panel animate-slide-up sec-dashboard">
      <div className="dashboard-header">
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          {lang === 'tr' ? 'Güvenlik Denetimi' : 'Security Scan'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn btn-outline" 
            style={{ padding: '4px 8px', fontSize: '0.72rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            onClick={openFullTab}
            title={lang === 'tr' ? 'Tam Sayfa Olarak Aç' : 'Open in Full Tab / Side View'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            {lang === 'tr' ? 'Genişlet' : 'Expand'}
          </button>
          <span
            className="status-badge"
            style={{
              background:
                isRunning ? 'rgba(59, 130, 246, 0.2)' :
                status === 'completed' ? 'rgba(16, 185, 129, 0.2)' :
                status === 'error' ? 'rgba(239, 68, 68, 0.2)' :
                'rgba(148, 163, 184, 0.2)',
              color:
                isRunning ? '#60a5fa' :
                status === 'completed' ? '#34d399' :
                status === 'error' ? '#f87171' :
                '#cbd5e1',
              textTransform: 'uppercase',
            }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Target URL Input Bar */}
      <div style={{ marginTop: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {lang === 'tr' ? 'Hedef İnternet Sitesi URL' : 'Target Website URL'}
          </span>
          {currentTabUrl && currentTabUrl.startsWith('http') && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.3)' }}
              onClick={() => setTargetInput(currentTabUrl)}
              disabled={isRunning}
              title="Auto-fill with current active tab URL"
            >
              {lang === 'tr' ? 'Aktif Sekmeyi Al' : 'Use Active Tab'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input-field"
            placeholder={lang === 'tr' ? 'örn. ornek.com veya https://ornek.com' : 'e.g. example.com or https://example.com'}
            value={targetInput}
            onChange={e => setTargetInput(e.target.value)}
            disabled={isRunning}
            style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
          />
        </div>
      </div>

      {/* Passive only disclaimer */}
      <div className="sec-disclaimer">
        <span>
          {lang === 'tr' 
            ? 'Yalnızca pasif denetim — saldırı payloadı veya exploit içermez. Bulgular geliştirici doğrulaması içindir.'
            : 'Passive scan only — no attack payloads, no exploits. Results require manual verification.'}
        </span>
      </div>

      {/* Start / Stop Controls */}
      <div style={{ marginTop: '16px' }}>
        {(isIdle || isCompleted) && (
          <button
            className={`btn ${canScan ? 'btn-security' : 'btn-outline'}`}
            id="sec-start-btn"
            onClick={canScan ? () => onStart(cleanTarget) : undefined}
            disabled={!canScan}
            title={canScan ? 'Start passive security assessment' : 'Please enter a valid website URL'}
            style={!canScan ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {canScan ? (lang === 'tr' ? 'Güvenlik Taramasını Başlat' : 'Start Security Scan') : (lang === 'tr' ? 'Taranacak Bir URL Girin' : 'Enter a Target URL to Scan')}
          </button>
        )}
        {isRunning && (
          <button className="btn btn-danger" id="sec-stop-btn" onClick={onStop}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
            </svg>
            {lang === 'tr' ? 'Taramayı Durdur' : 'Stop Scan'}
          </button>
        )}
      </div>

      {/* Progress */}
      {isRunning && (
        <div style={{ marginTop: '16px' }}>
          <div className="sec-progress-bar">
            <div className="sec-progress-fill sec-progress-animated" />
          </div>
          <div className="sec-progress-stats">
            <span>URLs: {stats.urlsAnalyzed}</span>
            <span>Params: {stats.paramsFound}</span>
            <span>Forms: {stats.formsFound}</span>
            <span>Findings: {stats.findingsCount}</span>
          </div>
        </div>
      )}

      {/* Summary — completed durumunda */}
      {(isCompleted || isRunning) && summary.total > 0 && (
        <div style={{ marginTop: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              {lang === 'tr' ? 'Güvenlik Skoru & Önem Dereceleri' : 'Security Score & Severities'}
            </h3>
            {isCompleted && (
              <button 
                className="btn btn-outline" 
                style={{ padding: '4px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                onClick={() => generateSecurityPdf(findings, summary, stats, displayUrl)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                {lang === 'tr' ? 'PDF Rapor İndir' : 'Export PDF'}
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '130px 100px 1fr', gap: '8px', marginBottom: '16px' }}>
            {/* Big Letter Grade Badge */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-surface-elevated)',
              borderRadius: '8px',
              border: `1px solid ${compliance.letterGrade.color}55`,
              padding: '10px 8px',
              position: 'relative'
            }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: compliance.letterGrade.color, lineHeight: 1 }}>
                {compliance.letterGrade.grade}
              </span>
              <span style={{ fontSize: '0.625rem', fontWeight: 600, color: compliance.letterGrade.color, marginTop: '4px', textAlign: 'center' }}>
                {lang === 'tr' ? ({
                  'Critical Risk Detected': 'Kritik Risk Tespit Edildi',
                  'High Exposure': 'Yüksek Güvenlik Riski',
                  'Needs Immediate Hardening': 'Acil Güçlendirme Gerekli',
                  'Good, Minor Hardening Needed': 'İyi, Küçük İyileştirmeler Gerekli',
                  'Strong Security Baseline': 'Güçlü Güvenlik Seviyesi',
                  'Exceptional Security': 'Mükemmel Güvenlik Seviyesi'
                }[compliance.letterGrade.label] || compliance.letterGrade.label) : compliance.letterGrade.label}
              </span>
              <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'tr' ? 'Güvenlik Notu' : 'Security Grade'}
              </span>
            </div>

            {/* Score Ring */}
            <div style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-subtle)',
              padding: '10px 8px', position: 'relative'
            }}>
              <svg width="52" height="52" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke={scoreColor} strokeWidth="3" 
                  strokeDasharray={`${securityScore}, 100`} strokeLinecap="round" />
              </svg>
              <div style={{ 
                position: 'absolute', fontSize: '1rem', fontWeight: 700, color: scoreColor,
                top: '23px', fontVariantNumeric: 'tabular-nums'
              }}>
                {securityScore}
              </div>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'tr' ? 'Skor' : 'Score'}
              </span>
            </div>

            {/* Severity Cards */}
            <div className="sec-severity-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {Object.entries(dynamicSeverityConfig).map(([key, cfg]) => (
                <div key={key} className="sec-severity-card" style={{ borderLeft: `2px solid ${cfg.color}`, padding: '8px 4px' }}>
                  <span className="sec-severity-count" style={{ color: cfg.color, fontSize: '1.15rem' }}>
                    {summary[key] || 0}
                  </span>
                  <span className="sec-severity-label" style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}>
                    {cfg.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <h3 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            {lang === 'tr' ? 'Görsel Raporlar' : 'Visual Reports'}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {/* Pie Chart */}
            <div style={{ height: '170px', background: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-subtle)', padding: '10px' }}>
              <h4 style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'tr' ? 'Önem Derecesine Göre' : 'By Severity'}
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="45%"
                    innerRadius={28}
                    outerRadius={48}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div style={{ height: '170px', background: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-subtle)', padding: '10px' }}>
              <h4 style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'tr' ? 'Kategoriye Göre' : 'By Category'}
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 3, 3, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats summary */}
          <div className="sec-stats-row" style={{ marginTop: '16px' }}>
            <div className="sec-stat-item">
              <span className="sec-stat-val">{stats.urlsAnalyzed}</span>
              <span className="sec-stat-key">{lang === 'tr' ? 'Taranan URL' : 'URLs Analyzed'}</span>
            </div>
            <div className="sec-stat-item">
              <span className="sec-stat-val">{stats.paramsFound}</span>
              <span className="sec-stat-key">{lang === 'tr' ? 'Parametreler' : 'Params Found'}</span>
            </div>
            <div className="sec-stat-item">
              <span className="sec-stat-val">{stats.formsFound}</span>
              <span className="sec-stat-key">{lang === 'tr' ? 'Formlar' : 'Forms Found'}</span>
            </div>
            <div className="sec-stat-item">
              <span className="sec-stat-val">{stats.headersChecked}</span>
              <span className="sec-stat-key">{lang === 'tr' ? 'Başlıklar' : 'Headers Checked'}</span>
            </div>
            <div className="sec-stat-item">
              <span className="sec-stat-val">{stats.cookiesChecked}</span>
              <span className="sec-stat-key">{lang === 'tr' ? 'Çerezler' : 'Cookies Checked'}</span>
            </div>
            <div className="sec-stat-item">
              <span className="sec-stat-val">{stats.mixedContent}</span>
              <span className="sec-stat-key">{lang === 'tr' ? 'Karma İçerik' : 'Mixed Content'}</span>
            </div>
          </div>

          {/* Compliance & Regulatory Readiness */}
          <ComplianceCard compliance={compliance} lang={lang} />
        </div>
      )}

      {/* Idle empty state */}
      {isIdle && (
        <div className="sec-empty-state">
          <div className="sec-empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <p>{lang === 'tr' ? 'Mevcut sayfada pasif bir güvenlik denetimi çalıştırın.' : 'Run a passive security assessment on the current page.'}</p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            {lang === 'tr' ? 'HTTP başlıkları, çerezler, HTTPS, karma içerik ve olası risk noktalarını denetler.' : 'Checks headers, cookies, HTTPS, mixed content, and potential input risk points.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
