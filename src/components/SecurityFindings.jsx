// src/components/SecurityFindings.jsx
// Security findings inspector featuring live search, severity filters,
// and actionable 1-click remediation code snippets.

import React, { useState, useMemo } from 'react';
import { getFixSnippets } from '../security/fixSnippetsEngine.js';

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', label: 'CRITICAL' },
  high:     { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)', label: 'HIGH' },
  medium:   { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', label: 'MEDIUM' },
  low:      { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', label: 'LOW' },
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
      style={{ borderLeft: `3px solid ${cfg.color}` }}
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> 1-Click Remediation Snippets
                </span>
                <button 
                  className="btn btn-outline" 
                  style={{
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    background: copied ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: copied ? '#34d399' : '#cbd5e1',
                    borderColor: copied ? '#34d399' : 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onClick={() => handleCopy(snippets[activeServerIdx].code)}
                >
                  {copied ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copy Code
                    </>
                  )}
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

          <p className="sec-disclaimer-small" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Manual verification required. This is not a confirmed vulnerability.
          </p>
        </div>
      )}
    </div>
  );
};

// ── Main SecurityFindings Component ──────────────────────────────────────────
const SecurityFindings = ({
  findings = [],
  logs = [],
  networkLogs = [],
  isNetworkLoggingEnabled = false,
  networkTargetHost = '',
  targetUrl = '',
  onToggleNetworkLogging,
  onClearNetwork,
  isRunning
}) => {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityTab, setPriorityTab] = useState('all'); // 'all' | 'urgent' | 'medium' | 'low_info'
  const [searchQuery, setSearchQuery] = useState('');
  const [netSearch, setNetSearch] = useState('');
  const [netTypeFilter, setNetTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' | 'network' | 'logs'

  // Switch to logs while scan is running; switch to findings when complete
  React.useEffect(() => {
    if (isRunning) setActiveTab('logs');
    else if (!isRunning && findings.length > 0) setActiveTab('findings');
  }, [isRunning, findings.length]);

  // Auto-scroll live log stream
  const logsRef = React.useRef(null);
  React.useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      if (priorityTab === 'urgent' && !(f.severity === 'critical' || f.severity === 'high')) return false;
      if (priorityTab === 'medium' && f.severity !== 'medium') return false;
      if (priorityTab === 'low_info' && !(f.severity === 'low' || f.severity === 'info')) return false;

      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;

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

  // Network logs filtering
  const filteredNetworkLogs = useMemo(() => {
    return networkLogs.filter(req => {
      if (netTypeFilter === 'xhr' && req.type !== 'xmlhttprequest' && req.type !== 'fetch') return false;
      if (netTypeFilter === 'script' && req.type !== 'script') return false;
      if (netTypeFilter === 'stylesheet' && req.type !== 'stylesheet') return false;
      if (netTypeFilter === 'image' && req.type !== 'image') return false;

      if (netSearch.trim()) {
        const q = netSearch.toLowerCase();
        if (!req.url.toLowerCase().includes(q) && !(req.method || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [networkLogs, netTypeFilter, netSearch]);

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

  const urgentCount = findings.filter(f => f.severity === 'critical' || f.severity === 'high').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;
  const lowCount = findings.filter(f => f.severity === 'low' || f.severity === 'info').length;

  return (
    <div className="glass-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
      {/* Subtab Navigation */}
      <div className="sec-subtab-bar">
        <button
          className={`sec-subtab ${activeTab === 'findings' ? 'active' : ''}`}
          onClick={() => setActiveTab('findings')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Findings ({findings.length})
        </button>
        <button
          className={`sec-subtab ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/>
            <line x1="6" y1="18" x2="6.01" y2="18"/>
          </svg>
          Network Inspector ({networkLogs.length})
        </button>
        <button
          className={`sec-subtab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5"/>
            <line x1="12" y1="19" x2="20" y2="19"/>
          </svg>
          Scan Logs
        </button>
      </div>

      {/* Findings Tab */}
      {activeTab === 'findings' && (
        <>
          {findings.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              {/* Instant Search Bar */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Filter findings by title, evidence, parameter, or URL..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, padding: '7px 12px', fontSize: '0.8125rem' }}
                />
                {searchQuery && (
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    onClick={() => setSearchQuery('')}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Actionable Risk Priority Pills */}
              <div style={{ display: 'flex', gap: '5px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { id: 'all', label: 'All', count: findings.length },
                  { id: 'urgent', label: 'Urgent', count: urgentCount, color: '#ef4444' },
                  { id: 'medium', label: 'Medium', count: mediumCount, color: '#f59e0b' },
                  { id: 'low_info', label: 'Low & Info', count: lowCount, color: '#3b82f6' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setPriorityTab(tab.id)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      borderRadius: '5px',
                      border: priorityTab === tab.id ? `1px solid ${tab.color || '#3b82f6'}` : '1px solid var(--border-subtle)',
                      background: priorityTab === tab.id ? (tab.color ? `${tab.color}18` : 'rgba(59, 130, 246, 0.15)') : '#090a0f',
                      color: priorityTab === tab.id ? (tab.color || '#93c5fd') : '#94a3b8',
                      fontWeight: priorityTab === tab.id ? 600 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <span>{tab.label}</span>
                    <span style={{
                      fontSize: '0.6875rem',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: 'rgba(255, 255, 255, 0.07)',
                      color: '#cbd5e1'
                    }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Filters & Export */}
              <div className="sec-filters" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  className="input-field"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '0.78rem' }}
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
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '0.78rem' }}
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

      {/* Network Traffic Inspector Tab */}
      {activeTab === 'network' && (
        <div style={{ marginTop: '12px' }}>
          {/* Status Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isNetworkLoggingEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: isNetworkLoggingEnabled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isNetworkLoggingEnabled ? '#10b981' : '#ef4444',
                  boxShadow: isNetworkLoggingEnabled ? '0 0 8px #10b981' : 'none',
                  display: 'inline-block'
                }} />
                <span style={{ color: isNetworkLoggingEnabled ? '#a7f3d0' : '#fca5a5', fontWeight: 600 }}>
                  {isNetworkLoggingEnabled ? 'Live Target Traffic Recording Active' : 'Target Traffic Recording Paused'}
                </span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.73rem', paddingLeft: '16px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                <strong>Isolated Scope:</strong>{' '}
                <span style={{ color: '#38bdf8' }}>
                  {networkTargetHost || (targetUrl ? (() => { try { return new URL(targetUrl).hostname; } catch { return targetUrl; } })() : 'Active Scanned Host')}
                </span>{' '}
                <span style={{ color: '#64748b' }}>(YouTube and unrelated tabs are strictly excluded)</span>
              </div>
            </div>

            {onToggleNetworkLogging && (
              <button
                onClick={() => onToggleNetworkLogging(targetUrl)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: isNetworkLoggingEnabled ? '#ef4444' : '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: isNetworkLoggingEnabled ? '0 2px 8px rgba(239, 68, 68, 0.4)' : '0 2px 8px rgba(16, 185, 129, 0.4)'
                }}
              >
                {isNetworkLoggingEnabled ? (
                  <>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                    Stop Recording
                  </>
                ) : (
                  <>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Start Recording
                  </>
                )}
              </button>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Filter network requests by URL, path or method..."
              value={netSearch}
              onChange={e => setNetSearch(e.target.value)}
              style={{ flex: 1, minWidth: '180px', padding: '6px 10px', fontSize: '0.8rem' }}
            />
            <select
              className="input-field"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
              value={netTypeFilter}
              onChange={e => setNetTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="xhr">Fetch / XHR</option>
              <option value="script">Scripts (JS)</option>
              <option value="stylesheet">Stylesheets (CSS)</option>
              <option value="image">Images</option>
            </select>
            {onClearNetwork && (
              <button
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                onClick={onClearNetwork}
                title="Clear network logs"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Clear
              </button>
            )}
          </div>

          {/* Network Table Container */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: '420px',
            overflowY: 'auto'
          }}>
            {filteredNetworkLogs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                {networkLogs.length === 0
                  ? 'No network traffic captured yet. Browse the page to observe live requests.'
                  : 'No requests match the filter.'}
              </div>
            ) : (
              filteredNetworkLogs.map(req => <NetworkRequestRow key={req.id} req={req} />)
            )}
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div ref={logsRef} className="logs-container" style={{ marginTop: '12px', maxHeight: '150px' }}>
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

// ── Network Request Row Component ─────────────────────────────────────────────
const NetworkRequestRow = ({ req }) => {
  const [expanded, setExpanded] = useState(false);

  let pathname = req.url;
  let host = '';
  try {
    const u = new URL(req.url);
    host = u.host;
    pathname = u.pathname + u.search;
  } catch {}

  const isSuccess = req.statusCode >= 200 && req.statusCode < 300;
  const isRedirect = req.statusCode >= 300 && req.statusCode < 400;
  const isError = req.statusCode >= 400 || req.statusCode === 'ERR';

  const statusColor = isSuccess ? '#10b981' : isRedirect ? '#3b82f6' : isError ? '#ef4444' : '#94a3b8';
  const methodColor = req.method === 'POST' ? '#f59e0b' : req.method === 'GET' ? '#3b82f6' : '#8b5cf6';

  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '7px 10px',
      fontSize: '0.78rem',
      background: expanded ? 'rgba(255,255,255,0.04)' : 'transparent',
      transition: 'background 0.2s'
    }}>
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status Code */}
        <span style={{
          minWidth: '40px',
          fontWeight: 700,
          color: statusColor,
          background: `${statusColor}18`,
          padding: '2px 4px',
          borderRadius: '4px',
          textAlign: 'center',
          fontSize: '0.72rem'
        }}>
          {req.statusCode}
        </span>

        {/* Method */}
        <span style={{
          fontWeight: 700,
          color: methodColor,
          fontSize: '0.72rem',
          minWidth: '36px'
        }}>
          {req.method}
        </span>

        {/* Type */}
        <span style={{
          color: '#94a3b8',
          fontSize: '0.66rem',
          background: 'rgba(255,255,255,0.05)',
          padding: '1px 5px',
          borderRadius: '3px',
          textTransform: 'uppercase'
        }}>
          {req.type || 'other'}
        </span>

        {/* Path & Host */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#64748b', marginRight: '4px' }}>{host}</span>
          <span style={{ color: '#f1f5f9' }} title={req.url}>{pathname}</span>
        </div>

        {/* Time */}
        <span style={{ color: '#64748b', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
          {new Date(req.timeStamp).toLocaleTimeString()}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', fontSize: '0.72rem' }}>
          <div style={{ marginBottom: '6px', wordBreak: 'break-all' }}>
            <strong style={{ color: '#94a3b8' }}>Full URL: </strong>
            <a href={req.url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>{req.url}</a>
          </div>
          {req.ip && (
            <div style={{ marginBottom: '6px', color: '#94a3b8' }}>
              <strong>Server IP: </strong>{req.ip} {req.fromCache ? '(from cache)' : ''}
            </div>
          )}
          {req.error && (
            <div style={{ marginBottom: '6px', color: '#ef4444' }}>
              <strong>Error: </strong>{req.error}
            </div>
          )}
          {req.responseHeaders && req.responseHeaders.length > 0 && (
            <div>
              <strong style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Response Headers:</strong>
              <div style={{ maxHeight: '160px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
                {req.responseHeaders.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '2px', wordBreak: 'break-all' }}>
                    <span style={{ color: '#38bdf8', minWidth: '130px', fontWeight: 600 }}>{h.name}:</span>
                    <span style={{ color: '#cbd5e1' }}>{h.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityFindings;
