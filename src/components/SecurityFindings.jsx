// src/components/SecurityFindings.jsx
// Security Scanner bulgularını listeleyen, anlık arama, risk önceliği
// filtreleme ve tek tıkla çözüm kodları (Fix Snippets) sunan bileşen

import React, { useState, useMemo } from 'react';
import { getFixSnippets } from '../security/fixSnippetsEngine.js';

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

// ── Finding Card with 1-Click Fix Snippets ────────────────────────────────────
const FindingCard = ({ finding }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeServerIdx, setActiveServerIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const cfg = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info;
  const confCfg = CONFIDENCE_LABELS[finding.confidence] || CONFIDENCE_LABELS.low;
  const snippets = useMemo(() => getFixSnippets(finding), [finding]);

  let displayUrl = finding.url;
  try { displayUrl = new URL(finding.url).pathname + new URL(finding.url).search; } catch {}

  const handleCopy = (code) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

          {/* 1-Click Fix Snippets Section */}
          {snippets && snippets.length > 0 && (
            <div style={{
              marginTop: '14px',
              background: 'rgba(15, 23, 42, 0.7)',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🛠️</span> 1-Click Remediation Snippets
                </span>
                <button 
                  className="btn btn-outline" 
                  style={{
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    background: copied ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: copied ? '#34d399' : '#cbd5e1',
                    borderColor: copied ? '#34d399' : 'rgba(255,255,255,0.2)'
                  }}
                  onClick={() => handleCopy(snippets[activeServerIdx].code)}
                >
                  {copied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
              </div>

              {/* Server Selector Tabs */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {snippets.map((snip, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveServerIdx(idx)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.7rem',
                      borderRadius: '4px',
                      border: 'none',
                      background: activeServerIdx === idx ? '#2563eb' : 'rgba(255,255,255,0.08)',
                      color: activeServerIdx === idx ? '#ffffff' : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: activeServerIdx === idx ? 600 : 400
                    }}
                  >
                    {snip.server}
                  </button>
                ))}
              </div>

              {snippets[activeServerIdx]?.path && (
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '6px' }}>
                  Target: <code style={{ color: '#94a3b8' }}>{snippets[activeServerIdx].path}</code>
                </div>
              )}

              <pre style={{
                margin: 0,
                padding: '8px',
                background: 'rgba(0,0,0,0.4)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#e2e8f0',
                overflowX: 'auto',
                fontFamily: 'monospace',
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap'
              }}>
                {snippets[activeServerIdx]?.code}
              </pre>
            </div>
          )}

          <p className="sec-disclaimer-small" style={{ marginTop: '12px' }}>
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
  const [priorityTab, setPriorityTab] = useState('all'); // 'all' | 'urgent' | 'medium' | 'low_info'
  const [searchQuery, setSearchQuery] = useState('');
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
      // Priority filter
      if (priorityTab === 'urgent' && !(f.severity === 'critical' || f.severity === 'high')) return false;
      if (priorityTab === 'medium' && f.severity !== 'medium') return false;
      if (priorityTab === 'low_info' && !(f.severity === 'low' || f.severity === 'info')) return false;

      // Select filters
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;

      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (f.title || '').toLowerCase().includes(q);
        const matchCat = (f.category || '').toLowerCase().includes(q);
        const matchEv = (f.evidence || '').toLowerCase().includes(q);
        const matchRec = (f.recommendation || '').toLowerCase().includes(q);
        const matchUrl = (f.url || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchEv && !matchRec && !matchUrl) return false;
      }

      return true;
    });
  }, [findings, priorityTab, severityFilter, categoryFilter, searchQuery]);

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
          {findings.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              {/* Instant Search Bar */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="🔍 Search title, evidence, parameter, URL..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                />
                {searchQuery && (
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                    onClick={() => setSearchQuery('')}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Actionable Risk Priority Pills */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                  { id: 'all', label: `All (${findings.length})` },
                  { id: 'urgent', label: `🔥 Urgent (${findings.filter(f => f.severity === 'critical' || f.severity === 'high').length})`, color: '#ef4444' },
                  { id: 'medium', label: `⚠️ Medium (${findings.filter(f => f.severity === 'medium').length})`, color: '#f59e0b' },
                  { id: 'low_info', label: `ℹ️ Low & Info (${findings.filter(f => f.severity === 'low' || f.severity === 'info').length})`, color: '#3b82f6' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setPriorityTab(tab.id)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      borderRadius: '16px',
                      border: priorityTab === tab.id ? `1px solid ${tab.color || '#3b82f6'}` : '1px solid rgba(255,255,255,0.08)',
                      background: priorityTab === tab.id ? `${tab.color || '#3b82f6'}22` : 'rgba(0,0,0,0.2)',
                      color: priorityTab === tab.id ? (tab.color || '#60a5fa') : '#94a3b8',
                      fontWeight: priorityTab === tab.id ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Filters & Export */}
              <div className="sec-filters" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  className="input-field"
                  style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
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
                  style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  id="sec-category-filter"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                  <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.78rem' }} onClick={exportJSON} id="sec-export-json">
                    JSON
                  </button>
                  <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.78rem' }} onClick={exportCSV} id="sec-export-csv">
                    CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Finding list */}
          <div className="sec-findings-list">
            {filteredFindings.length === 0 ? (
              <div className="sec-empty-findings">
                {findings.length === 0
                  ? 'No findings yet. Run a security scan first.'
                  : 'No findings match the selected filters or search query.'}
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
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No log messages yet.</div>
          ) : (
            logs.map((l, i) => (
              <div key={i} className={`log-entry log-${l.type || 'info'}`}>
                <span className="log-timestamp">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                <span className="log-message">{l.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityFindings;
