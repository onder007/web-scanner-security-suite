import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LiveLogs from './components/LiveLogs';
import ResultsTable from './components/ResultsTable';
import SettingsPanel from './components/SettingsPanel';
import SecurityDashboard from './components/SecurityDashboard.jsx';
import SecurityFindings from './components/SecurityFindings.jsx';
import SecurityHistory from './components/SecurityHistory.jsx';
import './styles/App.css';

function App() {
  // ── Main Tab State ──────────────────────────────────────────────────────────
  const [activeMainTab, setActiveMainTab] = useState('deadlinks'); // 'deadlinks' | 'security' | 'history'

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

  // Aktif tab URL'sini oku (popup açılınca)
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
    if (!url) return alert('Please enter a valid URL');
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
      alert('Please enter a website URL to scan.');
      return;
    }
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }

    // Reset logs so user sees fresh output immediately
    setSecLogs([{ message: `Initiating security scan for ${target}...`, type: 'info', timestamp: new Date().toISOString() }]);
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
    <div className="app-container" style={{ padding: '16px' }}>
      {/* Header */}
      <header className="glass-panel animate-slide-up header-panel">
        <div className="header-content">
          <h1>Web Scanner</h1>
          <p className="subtitle">Browser Extension — Dead Links &amp; Security</p>
        </div>

        {/* Main Tab Navigation */}
        <div className="main-tab-bar">
          <button
            id="tab-deadlinks"
            className={`main-tab ${activeMainTab === 'deadlinks' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('deadlinks')}
          >
            🔗 Dead Links
          </button>
          <button
            id="tab-security"
            className={`main-tab ${activeMainTab === 'security' ? 'active-security active' : ''}`}
            onClick={() => setActiveMainTab('security')}
          >
            🛡 Security
          </button>
          <button
            id="tab-history"
            className={`main-tab ${activeMainTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('history')}
          >
            🗂️ History
          </button>
        </div>

        {/* Dead Links URL Input — only shown on deadlinks tab */}
        {activeMainTab === 'deadlinks' && (
          <div className="control-bar">
            <input
              type="url"
              className="input-field url-input"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={status === 'running' || status === 'paused'}
              id="deadlinks-url-input"
            />
            <div className="button-group">
              {status === 'idle' || status === 'completed' || status === 'stopped' ? (
                <button className="btn btn-primary" id="deadlinks-start-btn" onClick={handleStart}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Start Scan
                </button>
              ) : status === 'running' ? (
                <>
                  <button className="btn btn-warning" id="deadlinks-pause-btn" onClick={handlePause}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Pause
                  </button>
                  <button className="btn btn-danger" id="deadlinks-stop-btn" onClick={handleStop}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" /></svg>
                    Stop
                  </button>
                </>
              ) : status === 'paused' ? (
                <>
                  <button className="btn btn-success" id="deadlinks-resume-btn" onClick={handleResume} style={{ backgroundColor: 'var(--success)', color: 'white', border: 'none', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                    Resume
                  </button>
                  <button className="btn btn-danger" id="deadlinks-stop-btn-2" onClick={handleStop}>Stop</button>
                </>
              ) : null}
            </div>
          </div>
        )}
      </header>

      {/* ── Dead Links Tab Content ─────────────────────────────────────────── */}
      {activeMainTab === 'deadlinks' && (
        <>
          <div className="main-content" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <Dashboard stats={stats} status={status} />
            <SettingsPanel options={options} setOptions={setOptions} disabled={status === 'running' || status === 'paused'} />
            <LiveLogs logs={logs} />
          </div>
          <div className="results-container">
            <ResultsTable results={results} />
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
          />
        </div>
      )}

      {/* ── History Tab Content ────────────────────────────────────────────── */}
      {activeMainTab === 'history' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <SecurityHistory />
        </div>
      )}
    </div>
  );
}

export default App;
