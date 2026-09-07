import React, { useState } from 'react';

const SettingsPanel = ({ options, setOptions, disabled, t }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  return (
    <div className="glass-panel animate-slide-up settings-panel-container">
      <div 
        className="settings-panel-header" 
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8' }}>
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <h2 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {t?.crawlerSettings || 'Crawler Engine Settings'}
          </h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            ({options.maxConcurrency} threads, {options.timeout}ms)
          </span>
        </div>
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          style={{ 
            color: '#64748b', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s ease' 
          }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {isOpen && (
        <div className="settings-body animate-slide-up" style={{ marginTop: '14px' }}>
          <div className="settings-grid">
            <div className="settings-group">
              <label>{t?.maxConcurrency || 'Max Concurrency (Threads)'}</label>
              <input 
                type="number" 
                className="input-field" 
                name="maxConcurrency" 
                value={options.maxConcurrency} 
                onChange={handleChange}
                min="1" max="50"
                disabled={disabled}
              />
            </div>
            <div className="settings-group">
              <label>{t?.timeout || 'Request Timeout (ms)'}</label>
              <input 
                type="number" 
                className="input-field" 
                name="timeout" 
                value={options.timeout} 
                onChange={handleChange}
                min="1000"
                disabled={disabled}
              />
            </div>
            <div className="settings-group">
              <label>{t?.delay || 'Delay Between Requests (ms)'}</label>
              <input 
                type="number" 
                className="input-field" 
                name="delay" 
                value={options.delay} 
                onChange={handleChange}
                min="0"
                disabled={disabled}
              />
            </div>
            <div className="settings-group">
              <label>{t?.userAgent || 'Bot User-Agent Header'}</label>
              <input 
                type="text" 
                className="input-field" 
                name="userAgent" 
                value={options.userAgent} 
                onChange={handleChange}
                disabled={disabled}
              />
            </div>
          </div>
          
          <div className="settings-group" style={{ marginTop: '12px' }}>
            <label>{t?.excludePatterns || 'Exclude URL Patterns (comma-separated, e.g. /wp-admin, /cart)'}</label>
            <input 
              type="text" 
              className="input-field" 
              name="excludeFolders" 
              placeholder="/wp-admin, /cdn-cgi, /static"
              value={options.excludeFolders} 
              onChange={handleChange}
              disabled={disabled}
            />
          </div>

          <div className="settings-group checkbox-group" style={{ marginTop: '12px' }}>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                id="ignoreRobotsTxt"
                name="ignoreRobotsTxt" 
                checked={options.ignoreRobotsTxt} 
                onChange={handleChange}
                disabled={disabled}
              />
              <span>{t?.ignoreRobots || 'Ignore robots.txt directives during scan'}</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
