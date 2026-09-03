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

const SecurityDashboard = ({ status, stats, summary, findings = [], onStart, onStop, currentTabUrl }) => {
  const isRunning = status === 'running';
  const isIdle = status === 'idle';
  const isCompleted = status === 'completed' || status === 'cancelled' || status === 'error';
  const canScan = isScannableUrl(currentTabUrl);

  // URL'yi kısalt — çok uzunsa
  let displayUrl = currentTabUrl || '';
  try {
    const u = new URL(currentTabUrl);
    displayUrl = u.hostname + (u.pathname !== '/' ? u.pathname : '');
  } catch {}

  // ── Chart Data Calculations ───────────────────────────────────────────────
  const severityData = useMemo(() => {
    return [
      { name: 'Critical', value: summary.critical || 0, color: SEVERITY_CONFIG.critical.color },
      { name: 'High', value: summary.high || 0, color: SEVERITY_CONFIG.high.color },
      { name: 'Medium', value: summary.medium || 0, color: SEVERITY_CONFIG.medium.color },
      { name: 'Low', value: summary.low || 0, color: SEVERITY_CONFIG.low.color },
      { name: 'Info', value: summary.info || 0, color: SEVERITY_CONFIG.info.color }
    ].filter(item => item.value > 0);
  }, [summary]);

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


  return (
    <div className="glass-panel animate-slide-up sec-dashboard">
      <div className="dashboard-header">
        <h2>
          <span style={{ marginRight: '8px' }}>🛡</span>
          Security Scan
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn btn-outline" 
            style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px' }}
            onClick={openFullTab}
            title="Open in Full Tab / Side View"
          >
            ⛶ Expand Tab
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
            {status}
          </span>
        </div>
      </div>

      {/* Taranabilir sayfa uyarısı */}
      {!canScan && !isRunning && (
        <div className="sec-not-scannable">
          <span style={{ fontSize: '1.4rem' }}>⚠️</span>
          <div>
            <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '4px' }}>
              Cannot scan this page
            </strong>
            <span>
              {currentTabUrl
                ? `"${currentTabUrl.substring(0, 40)}..." is not a web page.`
                : 'No active tab detected.'}
            </span>
            <span style={{ display: 'block', marginTop: '4px', color: '#94a3b8' }}>
              Navigate to an <strong>http://</strong> or <strong>https://</strong> website, then open this panel again.
            </span>
          </div>
        </div>
      )}

      {/* Hedef URL — taranabilirse göster */}
      {canScan && (
        <div className="sec-target-url">
          <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target</span>
          <span className="sec-url-value" style={{ marginLeft: '10px' }} title={currentTabUrl}>
            {displayUrl}
          </span>
        </div>
      )}

      {/* Passive only disclaimer */}
      <div className="sec-disclaimer">
        <span className="sec-disclaimer-icon">ℹ</span>
        <span>
          Passive scan only — no attack payloads, no exploits. Results require manual verification.
        </span>
      </div>

      {/* Start / Stop Controls */}
      <div style={{ marginTop: '16px' }}>
        {(isIdle || isCompleted) && (
          <button
            className={`btn ${canScan ? 'btn-security' : 'btn-outline'}`}
            id="sec-start-btn"
            onClick={canScan ? onStart : undefined}
            disabled={!canScan}
            title={canScan ? 'Start passive security assessment' : 'Navigate to an http/https page first'}
            style={!canScan ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {canScan ? 'Start Security Scan' : 'Navigate to a Website First'}
          </button>
        )}
        {isRunning && (
          <button className="btn btn-danger" id="sec-stop-btn" onClick={onStop}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
            </svg>
            Stop Scan
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
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              Security Score & Severities
            </h3>
            {isCompleted && (
              <button 
                className="btn btn-outline" 
                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                onClick={() => generateSecurityPdf(findings, summary, stats, displayUrl)}
              >
                📄 Export PDF
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '130px 100px 1fr', gap: '12px', marginBottom: '20px' }}>
            {/* Big Letter Grade Badge */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.65)',
              borderRadius: '12px',
              border: `1px solid ${compliance.letterGrade.color}44`,
              padding: '12px 8px',
              boxShadow: `0 0 20px ${compliance.letterGrade.color}15`,
              position: 'relative'
            }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 900, color: compliance.letterGrade.color, lineHeight: 1 }}>
                {compliance.letterGrade.grade}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: compliance.letterGrade.color, marginTop: '4px', textAlign: 'center' }}>
                {compliance.letterGrade.label}
              </span>
              <span style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '2px', textTransform: 'uppercase' }}>
                Security Grade
              </span>
            </div>

            {/* Score Ring */}
            <div style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
              padding: '12px 8px'
            }}>
              <svg width="56" height="56" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke={scoreColor} strokeWidth="3" 
                  strokeDasharray={`${securityScore}, 100`} strokeLinecap="round" />
              </svg>
              <div style={{ 
                position: 'absolute', fontSize: '1.05rem', fontWeight: 'bold', color: scoreColor,
                textShadow: '0 0 10px rgba(0,0,0,0.5)' 
              }}>
                {securityScore}
              </div>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '6px', textTransform: 'uppercase' }}>Score</span>
            </div>

            {/* Severity Cards */}
            <div className="sec-severity-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))' }}>
              {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
                <div key={key} className="sec-severity-card" style={{ borderColor: cfg.color + '44', background: cfg.bg, padding: '8px 4px' }}>
                  <span className="sec-severity-count" style={{ color: cfg.color, fontSize: '1.2rem' }}>
                    {summary[key] || 0}
                  </span>
                  <span className="sec-severity-label" style={{ color: cfg.color, fontSize: '0.65rem' }}>
                    {cfg.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Visual Reports
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Pie Chart */}
            <div style={{ height: '180px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px' }}>
              <h4 style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginBottom: '8px' }}>By Severity</h4>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div style={{ height: '180px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px' }}>
              <h4 style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginBottom: '8px' }}>By Category</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats summary */}
          <div className="sec-stats-row" style={{ marginTop: '16px' }}>
            <div className="sec-stat-item">
              <span className="sec-stat-val">{stats.urlsAnalyzed}</span>
              <span className="sec-stat-key">URLs Analyzed</span>
            </div>
            <div className="sec-stat-item">
              <span className="sec-stat-val">{stats.paramsFound}</span>
              <span className="sec-stat-key">Params Found</span>
            </div>
            <div className="sec-stat-item">
              <span className="sec-stat-val">{stats.formsFound}</span>
              <span className="sec-stat-key">Forms Found</span>
            </div>
            <div className="sec-stat-item">
              <span className="sec-stat-val">{stats.headersChecked}</span>
              <span className="sec-stat-key">Headers Checked</span>
            </div>
            <div className="sec-stat-item">
              <span className="sec-stat-val">{stats.cookiesChecked}</span>
              <span className="sec-stat-key">Cookies Checked</span>
            </div>
            <div className="sec-stat-item">
              <span className="sec-stat-val">{stats.mixedContent}</span>
              <span className="sec-stat-key">Mixed Content</span>
            </div>
          </div>

          {/* Compliance & Regulatory Readiness */}
          <ComplianceCard compliance={compliance} />

          {isCompleted && (
            <p style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Automated assessment only. Results do not confirm vulnerabilities and require manual verification.
            </p>
          )}
        </div>
      )}

      {/* Idle empty state */}
      {isIdle && (
        <div className="sec-empty-state">
          <div className="sec-empty-icon">🛡</div>
          <p>Run a passive security assessment on the current page.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            Checks headers, cookies, HTTPS, mixed content, and potential input risk points.
          </p>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
