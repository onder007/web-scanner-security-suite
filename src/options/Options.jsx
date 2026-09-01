import React, { useState, useEffect } from 'react';

const Options = () => {
  const [settings, setSettings] = useState({
    autoScanEnabled: false,
    enableDomXss: true,
    enableSecrets: true,
    enableWaf: true,
    enableTechStack: true,
    enableErrorTrace: true
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get(['securitySettings'], (result) => {
      if (result.securitySettings) {
        setSettings(result.securitySettings);
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: checked }));
    setSaved(false);
  };

  const handleSave = () => {
    chrome.storage.sync.set({ securitySettings: settings }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="options-container">
      <h1>Security Scanner Options</h1>
      <p className="subtitle">Customize your security assessment preferences.</p>

      <div className="card">
        <h2>General Settings</h2>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              name="autoScanEnabled" 
              checked={settings.autoScanEnabled} 
              onChange={handleChange} 
            />
            <div className="setting-text">
              <strong>Enable Background Auto-Scan (Real-Time Badge)</strong>
              <span>Automatically scan pages in the background as you browse and display the highest severity alert on the extension badge.</span>
            </div>
          </label>
        </div>
      </div>

      <div className="card">
        <h2>Enterprise Modules</h2>
        
        <div className="setting-item">
          <label>
            <input type="checkbox" name="enableSecrets" checked={settings.enableSecrets} onChange={handleChange} />
            <div className="setting-text">
              <strong>Secrets Leakage Detection</strong>
              <span>Scan for AWS, Github, Stripe, and other API tokens in page source.</span>
            </div>
          </label>
        </div>

        <div className="setting-item">
          <label>
            <input type="checkbox" name="enableWaf" checked={settings.enableWaf} onChange={handleChange} />
            <div className="setting-text">
              <strong>WAF Fingerprinting</strong>
              <span>Detect Web Application Firewalls (Cloudflare, Akamai, etc.).</span>
            </div>
          </label>
        </div>

        <div className="setting-item">
          <label>
            <input type="checkbox" name="enableTechStack" checked={settings.enableTechStack} onChange={handleChange} />
            <div className="setting-text">
              <strong>Technology Stack Fingerprinting</strong>
              <span>Identify frameworks and CMS (React, Next.js, WordPress).</span>
            </div>
          </label>
        </div>

        <div className="setting-item">
          <label>
            <input type="checkbox" name="enableErrorTrace" checked={settings.enableErrorTrace} onChange={handleChange} />
            <div className="setting-text">
              <strong>Passive Error Trace Detection</strong>
              <span>Search for SQL syntax errors and internal stack traces.</span>
            </div>
          </label>
        </div>

        <div className="setting-item">
          <label>
            <input type="checkbox" name="enableDomXss" checked={settings.enableDomXss} onChange={handleChange} />
            <div className="setting-text">
              <strong>DOM-XSS Taint Analyzer</strong>
              <span>Analyze inline scripts for dangerous sink functions like eval() or innerHTML.</span>
            </div>
          </label>
        </div>

      </div>

      <div className="actions">
        <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
        {saved && <span className="saved-msg">✓ Settings saved</span>}
      </div>
    </div>
  );
};

export default Options;
