import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LiveLogs from './components/LiveLogs';
import ResultsTable from './components/ResultsTable';
import SettingsPanel from './components/SettingsPanel';
import './styles/App.css';

function App() {
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

  useEffect(() => {
    // Get initial state from background worker when popup opens
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'get_state' }, (response) => {
        if (response) {
          setStatus(response.status);
          setStats(response.stats);
          setResults(response.results);
        }
      });

      const listener = (message) => {
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
        }
      };

      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }, []);

  const handleStart = () => {
    if (!url) return alert('Please enter a valid URL');
    if (chrome && chrome.runtime) {
      const parsedOptions = { ...options, excludeFolders: options.excludeFolders.split(',').map(s => s.trim()).filter(Boolean) };
      chrome.runtime.sendMessage({ action: 'start_scan', url, options: parsedOptions });
      setStatus('running');
    }
  };

  const handlePause = () => {
    if (chrome && chrome.runtime) chrome.runtime.sendMessage({ action: 'pause_scan' });
    setStatus('paused');
  };

  const handleResume = () => {
    if (chrome && chrome.runtime) chrome.runtime.sendMessage({ action: 'resume_scan' });
    setStatus('running');
  };

  const handleStop = () => {
    if (chrome && chrome.runtime) chrome.runtime.sendMessage({ action: 'stop_scan' });
    setStatus('stopped');
  };

  return (
    <div className="app-container" style={{ padding: '16px' }}>
      <header className="glass-panel animate-slide-up header-panel">
        <div className="header-content">
          <h1>404 Error Scanner</h1>
          <p className="subtitle">Chrome Extension Crawler</p>
        </div>
        
        <div className="control-bar">
          <input 
            type="url" 
            className="input-field url-input" 
            placeholder="https://example.com" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={status === 'running' || status === 'paused'}
          />
          <div className="button-group">
            {status === 'idle' || status === 'completed' || status === 'stopped' ? (
              <button className="btn btn-primary" onClick={handleStart}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Start Scan
              </button>
            ) : status === 'running' ? (
              <>
                <button className="btn btn-warning" onClick={handlePause}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Pause
                </button>
                <button className="btn btn-danger" onClick={handleStop}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" /></svg>
                  Stop
                </button>
              </>
            ) : status === 'paused' ? (
               <>
                <button className="btn btn-success" onClick={handleResume} style={{backgroundColor: 'var(--success)', color: 'white', border:'none', boxShadow:'0 4px 14px 0 rgba(16, 185, 129, 0.39)'}}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                  Resume
                </button>
                <button className="btn btn-danger" onClick={handleStop}>Stop</button>
               </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="main-content" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <Dashboard stats={stats} status={status} />
        <SettingsPanel options={options} setOptions={setOptions} disabled={status === 'running' || status === 'paused'} />
        <LiveLogs logs={logs} />
      </div>

      <div className="results-container">
        <ResultsTable results={results} />
      </div>
    </div>
  );
}

export default App;
