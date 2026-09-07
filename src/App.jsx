import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LiveLogs from './components/LiveLogs';
import ResultsTable from './components/ResultsTable';
import SettingsPanel from './components/SettingsPanel';
import SecurityDashboard from './components/SecurityDashboard.jsx';
import SecurityFindings from './components/SecurityFindings.jsx';
import SecurityHistory from './components/SecurityHistory.jsx';
import LicenseModal from './components/LicenseModal.jsx';
import { getLicenseData } from './utils/licenseManager';
import { translations } from './utils/i18n';
import './styles/App.css';

function App() {
  // ── Theme & Language State ──────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('web_scanner_theme') || 'dark';
  });
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('web_scanner_lang') || 'tr';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('web_scanner_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('web_scanner_lang', lang);
  }, [lang]);

  const t = translations[lang] || translations.tr;

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleLang = () => {
    setLang(prev => prev === 'tr' ? 'en' : 'tr');
  };

  // ── Main Tab State ──────────────────────────────────────────────────────────
  const [activeMainTab, setActiveMainTab] = useState('deadlinks'); // 'deadlinks' | 'security' | 'history'

  // ── Licensing / Pro Tier State ─────────────────────────────────────────────
  const [licenseData, setLicenseData] = useState({ isPro: false, isAdmin: false, key: null, plan: 'Free' });
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  useEffect(() => {
    getLicenseData().then(setLicenseData);
  }, []);

  // ── Dead Link Scanner State (unchanged) ────────────────────────────────────
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [stats, setStats] = useState({
    totalUrls: 0,
    scannedUrls: 0,
    error404: 0,
    error500: 0,
    redirects: 0,
    successes: 0,
  });
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState([]);
  const [options, setOptions] = useState({
    maxConcurrency: 10,
    timeout: 10000,
    delay: 0,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 404-Scanner-Bot',
    ignoreRobotsTxt: false,
    excludeFolders: '',
  });

  // ── Security Scanner State ──────────────────────────────────────────────────
  const [secStatus, setSecStatus] = useState('idle'); // 'idle'|'running'|'completed'|'cancelled'|'error'
  const [secStats, setSecStats] = useState({
    urlsAnalyzed: 0,
    paramsFound: 0,
    formsFound: 0,
    headersChecked: 0,
    cookiesChecked: 0,
    mixedContent: 0,
    findingsCount: 0,
  });
  const [secFindings, setSecFindings] = useState([]);
  const [secSummary, setSecSummary] = useState({ critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 });
  const [secLogs, setSecLogs] = useState([]);
  const [networkLogs, setNetworkLogs] = useState([]);
  const [isNetworkLoggingEnabled, setIsNetworkLoggingEnabled] = useState(false);
  const [networkTargetHost, setNetworkTargetHost] = useState('');
  const [currentTabUrl, setCurrentTabUrl] = useState('');

  // Read active tab URL when popup initializes
  useEffect(() => {
    if (!chrome?.tabs) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];
      if (tab?.url) setCurrentTabUrl(tab.url);
    });
  }, []);

  // ── Effect: Listen to background messages ──────────────────────────────────
  useEffect(() => {
    if (!chrome?.runtime) return;

    // Restore dead link scanner state on popup open
    chrome.runtime.sendMessage({ action: 'get_state' }, (response) => {
      if (response) {
        setStatus(response.status);
        setStats(response.stats);
        setResults(response.results);
      }
    });

    // Restore security scanner state on popup open
    chrome.runtime.sendMessage({ action: 'get_security_state' }, (response) => {
      if (response) {
        setSecStatus(response.isRunning ? 'running' : response.findings?.length ? 'completed' : 'idle');
        if (response.findings?.length) setSecFindings(response.findings);
        if (response.stats) setSecStats(response.stats);
        if (response.summary) setSecSummary(response.summary);
        if (response.networkLogs) setNetworkLogs(response.networkLogs);
        if (response.isNetworkLoggingEnabled !== undefined) setIsNetworkLoggingEnabled(response.isNetworkLoggingEnabled);
        if (response.networkTargetHost) setNetworkTargetHost(response.networkTargetHost);
      }
    });

    const listener = (message) => {
      // ── Dead Link Scanner events (unchanged) ──
      if (message.event === 'scan_started') {
        setStatus('running');
        setStats({ totalUrls: 0, scannedUrls: 0, error404: 0, error500: 0, redirects: 0, successes: 0 });
        setLogs([{ message: 'Scan started...', type: 'info', timestamp: new Date().toISOString() }]);
        setResults([]);
      } else if (message.event === 'stats') {
        setStats(message.data);
      } else if (message.event === 'log') {
        setLogs((prev) => {
          const newLogs = [...prev, message.data];
          return newLogs.slice(-200);
        });
      } else if (message.event === 'result') {
        setResults((prev) => [...prev, message.data]);
      } else if (message.event === 'scan_finished') {
        setStatus(message.data.status || 'completed');
        setStats(message.data);

      // ── Security Scanner events ──
      } else if (message.event === 'security_scan_started') {
        setSecStatus('running');
        setSecFindings([]);
        setSecSummary({ critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 });
        setSecStats({ urlsAnalyzed: 0, paramsFound: 0, formsFound: 0, headersChecked: 0, cookiesChecked: 0, mixedContent: 0, findingsCount: 0 });
        setSecLogs([]);
      } else if (message.event === 'security_log') {
        setSecLogs((prev) => [...prev, message.data].slice(-300));
      } else if (message.event === 'security_finding' || message.event === 'security_finding_added') {
        const item = message.data?.finding || message.data;
        if (item && item.id) {
          setSecFindings((prev) => {
            if (prev.some(f => f.id === item.id)) return prev;
            return [...prev, item];
          });
        }
      } else if (message.event === 'security_stats') {
        setSecStats(message.data.stats || message.data);
      } else if (message.event === 'security_scan_finished' || message.event === 'security_scan_completed') {
        setSecStatus(message.data.status || 'completed');
        if (message.data.summary) setSecSummary(message.data.summary);
        if (message.data.stats) setSecStats(message.data.stats);
        if (message.data.findings) setSecFindings(message.data.findings);
      } else if (message.event === 'network_request') {
        setNetworkLogs((prev) => [message.data, ...prev].slice(0, 200));
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // ── Dead Link Scanner Handlers (unchanged) ─────────────────────────────────
  const handleStart = () => {
    if (!url) return alert(t.pleaseEnterUrl);
    if (chrome?.runtime) {
      const parsedOptions = { ...options, excludeFolders: options.excludeFolders.split(',').map(s => s.trim()).filter(Boolean) };
      chrome.runtime.sendMessage({ action: 'start_scan', url, options: parsedOptions });
      setStatus('running');
    }
  };

  const handlePause = () => {
    if (chrome?.runtime) chrome.runtime.sendMessage({ action: 'pause_scan' });
    setStatus('paused');
  };

  const handleResume = () => {
    if (chrome?.runtime) chrome.runtime.sendMessage({ action: 'resume_scan' });
    setStatus('running');
  };

  const handleStop = () => {
    if (chrome?.runtime) chrome.runtime.sendMessage({ action: 'stop_scan' });
    setStatus('stopped');
  };

  // ── Security Scanner Handlers ───────────────────────────────────────────────
  const handleSecurityStart = (manualUrl) => {
    if (!chrome?.runtime) return;

    let target = (manualUrl || currentTabUrl || '').trim();
    if (!target) {
      alert(t.pleaseEnterUrl);
      return;
    }
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }

    // Reset logs so user sees fresh output immediately
    setSecLogs([{ message: lang === 'tr' ? `${target} için güvenlik denetimi başlatılıyor...` : `Initiating security scan for ${target}...`, type: 'info', timestamp: new Date().toISOString() }]);
    setSecStatus('running');

    if (chrome?.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs?.[0];
        const isWebTab = tab?.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'));
        chrome.runtime.sendMessage({
          action: 'start_security_scan',
          tabId: isWebTab ? tab.id : null,
          url: target,
        });
      });
    } else {
      chrome.runtime.sendMessage({
        action: 'start_security_scan',
        tabId: null,
        url: target,
      });
    }
  };

  const handleSecurityStop = () => {
    if (chrome?.runtime) chrome.runtime.sendMessage({ action: 'stop_security_scan' });
    setSecStatus('cancelled');
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      {/* Header */}
      <header className="header-panel">
        <div className="header-content">
          <div className="header-brand">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1>{t.appName}</h1>
                <span className="header-badge">v1.1</span>
              </div>
              <p className="subtitle">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Center: Main Tab Navigation */}
          <div className="main-tab-bar">
            <button
              id="tab-deadlinks"
              className={`main-tab ${activeMainTab === 'deadlinks' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('deadlinks')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              {t.tabBrokenLinks}
            </button>
            <button
              id="tab-security"
              className={`main-tab ${activeMainTab === 'security' ? 'active-security active' : ''}`}
              onClick={() => setActiveMainTab('security')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              {t.tabSecurity}
            </button>
            <button
              id="tab-history"
              className={`main-tab ${activeMainTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('history')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {t.tabHistory}
            </button>
          </div>

          {/* Far Right: Icon Buttons (Language, Theme, Pro/Admin) */}
          <div className="header-actions-right">
            {/* Language Switcher Icon */}
            <button 
              className="header-icon-action-btn" 
              onClick={toggleLang}
              title={lang === 'tr' ? 'Switch to English' : 'Türkçeye Geç'}
            >
              <span className="header-icon-badge">{lang === 'tr' ? 'TR' : 'EN'}</span>
            </button>

            {/* Theme Switcher Icon */}
            <button 
              className="header-icon-action-btn" 
              onClick={toggleTheme}
              title={theme === 'dark' ? t.themeLight : t.themeDark}
            >
              {theme === 'dark' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Pro / Admin Badge Button */}
            <button
              className={`pro-badge-btn ${licenseData?.isPro ? 'pro-badge-active' : ''}`}
              onClick={() => setIsLicenseModalOpen(true)}
              title={licenseData?.isPro ? 'Lisans Detayları' : 'Lisans Etkinleştir (onder123)'}
            >
              {licenseData?.isAdmin ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>{t.adminBadge}</span>
                </>
              ) : licenseData?.isPro ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3h12l4 6-10 13L2 9z"/>
                  </svg>
                  <span>{t.proBadgeActive}</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7.5" cy="15.5" r="4.5"/>
                    <path d="m21 2-9.6 9.6"/>
                    <path d="m15.5 7.5 3 3L21 8"/>
                  </svg>
                  <span>{t.getPro}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dead Links URL Input — only shown on deadlinks tab */}
        {activeMainTab === 'deadlinks' && (
          <div className="control-bar" style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="url"
              className="input-field url-input"
              placeholder={t.urlPlaceholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={status === 'running' || status === 'paused'}
              id="deadlinks-url-input"
              style={{ flex: 1 }}
            />
            <div className="button-group" style={{ display: 'flex', gap: '8px' }}>
              {status === 'idle' || status === 'completed' || status === 'stopped' ? (
                <button className="btn btn-primary" id="deadlinks-start-btn" onClick={handleStart}>
                  <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  {t.scanLinks}
                </button>
              ) : status === 'running' ? (
                <>
                  <button className="btn btn-warning" id="deadlinks-pause-btn" onClick={handlePause}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="4" width="4" height="16"/>
                      <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                    {t.pause}
                  </button>
                  <button className="btn btn-danger" id="deadlinks-stop-btn" onClick={handleStop}>
                    <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="5" y="5" width="14" height="14" rx="2"/>
                    </svg>
                    {t.stop}
                  </button>
                </>
              ) : status === 'paused' ? (
                <>
                  <button className="btn btn-success" id="deadlinks-resume-btn" onClick={handleResume}>
                    <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    {t.resume}
                  </button>
                  <button className="btn btn-danger" id="deadlinks-stop-btn-2" onClick={handleStop}>{t.stop}</button>
                </>
              ) : null}
            </div>
          </div>
        )}
      </header>

      {/* Prominent Key Gate Banner if not PRO */}
      {!licenseData?.isPro && (
        <div className="license-gate-banner animate-slide-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <div>
              <strong style={{ fontSize: '0.78rem', color: '#f59e0b' }}>{t.gateBannerTitle}: </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.gateBannerDesc}</span>
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ fontSize: '0.72rem', padding: '4px 12px', height: '26px' }}
            onClick={() => setIsLicenseModalOpen(true)}
          >
            {t.gateBannerBtn}
          </button>
        </div>
      )}

      {/* ── Dead Links Tab Content ─────────────────────────────────────────── */}
      {activeMainTab === 'deadlinks' && (
        <>
          <div className="main-content" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <Dashboard stats={stats} status={status} t={t} />
            <SettingsPanel options={options} setOptions={setOptions} disabled={status === 'running' || status === 'paused'} t={t} />
            <LiveLogs logs={logs} />
          </div>
          <div className="results-container">
            <ResultsTable results={results} t={t} />
          </div>
        </>
      )}

      {/* ── Security Tab Content ───────────────────────────────────────────── */}
      {activeMainTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <SecurityDashboard
            status={secStatus}
            stats={secStats}
            summary={secSummary}
            findings={secFindings}
            onStart={handleSecurityStart}
            onStop={handleSecurityStop}
            currentTabUrl={currentTabUrl}
            t={t}
            lang={lang}
          />
          <SecurityFindings
            findings={secFindings}
            logs={secLogs}
            networkLogs={networkLogs}
            isNetworkLoggingEnabled={isNetworkLoggingEnabled}
            networkTargetHost={networkTargetHost}
            targetUrl={currentTabUrl}
            onToggleNetworkLogging={(hint) => {
              const nextState = !isNetworkLoggingEnabled;
              setIsNetworkLoggingEnabled(nextState);
              const effectiveUrl = hint || currentTabUrl;
              if (chrome?.runtime) {
                chrome.runtime.sendMessage({
                  action: 'toggle_network_logging',
                  enabled: nextState,
                  targetUrl: effectiveUrl
                }, (res) => {
                  if (res?.networkTargetHost) setNetworkTargetHost(res.networkTargetHost);
                });
              }
            }}
            onClearNetwork={() => {
              if (chrome?.runtime) chrome.runtime.sendMessage({ action: 'clear_network_logs' });
              setNetworkLogs([]);
            }}
            isRunning={secStatus === 'running'}
            t={t}
            lang={lang}
          />
        </div>
      )}

      {/* ── History Tab Content ────────────────────────────────────────────── */}
      {activeMainTab === 'history' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <SecurityHistory t={t} lang={lang} />
        </div>
      )}

      {/* ── Pro License Modal ────────────────────────────────────────────── */}
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        licenseData={licenseData}
        onLicenseUpdated={setLicenseData}
        lang={lang}
      />
    </div>
  );
}

export default App;
