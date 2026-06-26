import React from 'react';

const SettingsPanel = ({ options, setOptions, disabled }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ animationDelay: '0.3s', marginTop: '24px' }}>
      <h2>Scan Settings</h2>
      <div className="settings-grid">
        <div className="settings-group">
          <label>Max Concurrency (Threads)</label>
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
          <label>Timeout (ms)</label>
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
          <label>Delay Between Requests (ms)</label>
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
          <label>User-Agent</label>
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
      
      <div className="settings-group" style={{ marginTop: '16px' }}>
        <label>Exclude Folders (comma separated, e.g. /wp-admin, /images)</label>
        <input 
          type="text" 
          className="input-field" 
          name="excludeFolders" 
          value={options.excludeFolders} 
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      <div className="settings-group checkbox-group">
        <input 
          type="checkbox" 
          id="ignoreRobotsTxt"
          name="ignoreRobotsTxt" 
          checked={options.ignoreRobotsTxt} 
          onChange={handleChange}
          disabled={disabled}
        />
        <label htmlFor="ignoreRobotsTxt" style={{ fontSize: '1rem', color: 'var(--text-main)', cursor: 'pointer' }}>
          Ignore robots.txt
        </label>
      </div>
    </div>
  );
};

export default SettingsPanel;
