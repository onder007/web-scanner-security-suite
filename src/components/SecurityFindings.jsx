// src/components/SecurityFindings.jsx
// Security Scanner bulgularını listeleyen ve filtreleyen component

import React, { useState, useMemo } from 'react';

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', label: 'CRITICAL' },
  high:     { color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.3)', label: 'HIGH' },
  medium:   { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', label: 'MEDIUM' },
  low:      { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', label: 'LOW' },
  info:     { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.08)', border: 'rgba(148, 163, 184, 0.2)', label: 'INFO' },
};

const CATEGORY_LABELS = {
  'headers': 'Headers',
  'cookies': 'Cookies',
  'https': 'HTTPS',
  'mixed-content': 'Mixed Content',
  'sql-injection-risk': 'SQLi Risk',
  'xss-risk': 'XSS Risk',
  'sensitive-resource': 'Sensitive Resources',
  'configuration': 'Configuration',
  'input': 'Input',
};

const CONFIDENCE_LABELS = {
  high: { label: 'High', color: '#10b981' },
  medium: { label: 'Medium', color: '#f59e0b' },
  low: { label: 'Low', color: '#94a3b8' },
  info: { label: 'Info', color: '#94a3b8' },
};

// ── Finding Card ─────────────────────────────────────────────────────────────
const FindingCard = ({ finding }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info;
  const confCfg = CONFIDENCE_LABELS[finding.confidence] || CONFIDENCE_LABELS.low;

  let displayUrl = finding.url;
  try { displayUrl = new URL(finding.url).pathname + new URL(finding.url).search; } catch {}

  return (
    <div
      className="sec-finding-card"
      style={{ borderLeft: `3px solid ${cfg.color}`, background: cfg.bg }}
    >
      <div
        className="sec-finding-header"
        onClick={() => setExpanded(e => !e)}
        role="button"
        aria-expanded={expanded}
      >
        <div className="sec-finding-title-row">
          <span className="sec-severity-badge" style={{ color: cfg.color, background: cfg.border }}>
            {cfg.label}
          </span>
          <span className="sec-finding-title">{finding.title}</span>
        </div>
        <div className="sec-finding-meta">
          <span className="sec-cat-badge">{CATEGORY_LABELS[finding.category] || finding.category}</span>
          <svg
            className={`sec-chevron ${expanded ? 'sec-chevron-up' : ''}`}
            width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="sec-finding-body">
          {/* URL */}
          {finding.url && (
            <div className="sec-finding-row">
              <span className="sec-field-label">URL</span>
              <span className="sec-field-value sec-url-value" title={finding.url}>{displayUrl}</span>
            </div>
          )}

          {/* Parameter */}
          {finding.parameter && (
            <div className="sec-finding-row">
              <span className="sec-field-label">Parameter</span>
              <code className="sec-code">{finding.parameter}</code>
            </div>
          )}

          {/* Method */}
          {finding.method && (
            <div className="sec-finding-row">
              <span className="sec-field-label">Method</span>
              <code className="sec-code">{finding.method}</code>
            </div>
          )}

          {/* Header */}
          {finding.header && (
            <div className="sec-finding-row">
              <span className="sec-field-label">Header</span>
              <code className="sec-code">{finding.header}</code>
            </div>
          )}

          {/* Cookie Name */}
          {finding.cookieName && (
            <div className="sec-finding-row">
              <span className="sec-field-label">Cookie</span>
              <code className="sec-code">{finding.cookieName}</code>
            </div>
          )}

          {/* Confidence */}
          <div className="sec-finding-row">
            <span className="sec-field-label">Confidence</span>
            <span style={{ color: confCfg.color, fontWeight: 600 }}>{confCfg.label}</span>
          </div>

          {/* Evidence */}
          {finding.evidence && (
            <div className="sec-finding-section">
              <span className="sec-field-label">Evidence</span>
              <p className="sec-field-text">{finding.evidence}</p>
            </div>
          )}

          {/* Recommendation */}
          {finding.recommendation && (
            <div className="sec-finding-section">
              <span className="sec-field-label">Recommendation</span>
              <p className="sec-field-text">{finding.recommendation}</p>
            </div>
          )}

          <p className="sec-disclaimer-small">
            ⚠ Manual verification required. This is not a confirmed vulnerability.
          </p>
        </div>
      )}
    </div>
  );
};

// ── Main SecurityFindings Component ──────────────────────────────────────────
const SecurityFindings = ({ findings, logs, isRunning }) => {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' | 'logs'

  // Scan başlayınca Logs'a, bitince Findings'e geç
  React.useEffect(() => {
    if (isRunning) setActiveTab('logs');
    else if (!isRunning && findings.length > 0) setActiveTab('findings');
  }, [isRunning, findings.length]);

  // Logs otomatik scroll
  const logsRef = React.useRef(null);
  React.useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
      return true;
    });
  }, [findings, severityFilter, categoryFilter]);

  const exportJSON = () => {
    if (findings.length === 0) return;
    const exportData = filteredFindings.map(f => ({
      category: f.category,
      title: f.title,
      severity: f.severity,
      confidence: f.confidence,
      url: f.url,
      parameter: f.parameter,
      header: f.header,
      cookieName: f.cookieName,
      evidence: f.evidence,
      recommendation: f.recommendation,
    }));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', 'security_findings.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCSV = () => {
    if (findings.length === 0) return;
    const headers = ['Category', 'Title', 'Severity', 'Confidence', 'URL', 'Parameter', 'Header', 'Cookie', 'Evidence', 'Recommendation'];
    const rows = filteredFindings.map(f => [
      f.category, f.title, f.severity, f.confidence,
      f.url, f.parameter || '', f.header || '', f.cookieName || '',
      f.evidence, f.recommendation,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,'
      + headers.join(',') + '\n'
      + rows.map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'security_findings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
      {/* Tab bar */}
      <div className="sec-subtab-bar">
        <button
          className={`sec-subtab ${activeTab === 'findings' ? 'active' : ''}`}
          onClick={() => setActiveTab('findings')}
        >
          Findings ({findings.length})
        </button>
        <button
          className={`sec-subtab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
      </div>

      {/* Findings Tab */}
      {activeTab === 'findings' && (
        <>
          {/* Filters */}
          {findings.length > 0 && (
            <div className="sec-filters">
              <select
                className="input-field"
                style={{ width: 'auto', padding: '8px 12px' }}
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                id="sec-severity-filter"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>

              <select
                className="input-field"
                style={{ width: 'auto', padding: '8px 12px' }}
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                id="sec-category-filter"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              <button className="btn btn-outline" onClick={exportJSON} id="sec-export-json">
                Export JSON
              </button>
              <button className="btn btn-outline" onClick={exportCSV} id="sec-export-csv">
                Export CSV
              </button>
            </div>
          )}

          {/* Finding list */}
          <div className="sec-findings-list">
            {filteredFindings.length === 0 ? (
              <div className="sec-empty-findings">
                {findings.length === 0
                  ? 'No findings yet. Run a security scan first.'
                  : 'No findings match the selected filters.'}
              </div>
            ) : (
              filteredFindings.map(f => <FindingCard key={f.id} finding={f} />)
            )}
          </div>
        </>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div ref={logsRef} className="logs-container" style={{ marginTop: '12px', maxHeight: '400px' }}>
          {logs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
              No security scan logs yet.
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`log-line log-${log.type}`}>
                <span className="log-time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                {log.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityFindings;
