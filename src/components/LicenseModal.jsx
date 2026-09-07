import React, { useState } from 'react';
import { activateLicenseKey, deactivateLicense } from '../utils/licenseManager';

const GUMROAD_STORE_URL = 'https://gumroad.com'; // User can replace with their actual store link

const LicenseModal = ({ isOpen, onClose, licenseData, onLicenseUpdated }) => {
  const [keyInput, setKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleActivate = async (keyToUse) => {
    const key = keyToUse || keyInput;
    if (!key.trim()) {
      setErrorMsg('Please enter a license key.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const res = await activateLicenseKey(key);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('✨ Pro activated successfully! All premium security features unlocked.');
      onLicenseUpdated(res.license);
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1400);
    } else {
      setErrorMsg(res.error || 'Activation failed.');
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm('Are you sure you want to deactivate your PRO license on this browser?')) {
      const blank = await deactivateLicense();
      onLicenseUpdated(blank);
      setKeyInput('');
      setSuccessMsg('License deactivated.');
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  return (
    <div className="license-modal-overlay" onClick={onClose}>
      <div className="license-modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="license-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="license-crown-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Web Scanner <span className="pro-gradient-text">PRO</span>
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                Instant activation — No passwords, no sign-up hassle
              </p>
            </div>
          </div>
          <button className="license-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Current Status Pill */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: '8px',
          background: licenseData?.isPro ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.04)',
          border: licenseData?.isPro ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
          marginTop: '14px', marginBottom: '16px'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Current Plan: </span>
            <strong style={{ fontSize: '0.85rem', color: licenseData?.isPro ? '#34d399' : '#e2e8f0' }}>
              {licenseData?.isPro ? '💎 PRO Active' : 'Free Standard'}
            </strong>
          </div>
          {licenseData?.isPro && (
            <button className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '3px 8px' }} onClick={handleDeactivate}>
              Deactivate
            </button>
          )}
        </div>

        {/* Comparison Features */}
        <div className="license-features-list">
          <div className="license-feature-item">
            <span className="check-icon">✓</span>
            <div>
              <strong>Deep Vulnerability Engine:</strong> OWASP, XSS, CSRF &amp; Auth leak checks
            </div>
          </div>
          <div className="license-feature-item">
            <span className="check-icon">✓</span>
            <div>
              <strong>1-Click Fix Snippets:</strong> Ready-to-paste Nginx, Apache, Express &amp; Caddy configs
            </div>
          </div>
          <div className="license-feature-item">
            <span className="check-icon">✓</span>
            <div>
              <strong>Live Network Traffic Inspector:</strong> Packet capture, header tampering inspection
            </div>
          </div>
          <div className="license-feature-item">
            <span className="check-icon">✓</span>
            <div>
              <strong>Executive Export:</strong> Instant PDF security audit &amp; CSV reporting
            </div>
          </div>
        </div>

        {/* Action / Activation Section */}
        <div className="license-action-section">
          {licenseData?.isPro ? (
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#6ee7b7', fontSize: '0.8125rem', fontWeight: 600 }}>
                ✓ You have unrestricted lifetime access to all Pro security tools!
              </p>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                Key: {licenseData.key?.slice(0, 8)}••••••••
              </p>
            </div>
          ) : (
            <>
              {/* Buy Link */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <a
                  href={GUMROAD_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-pro-upgrade"
                  style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  Get License Key ($14 Lifetime)
                </a>
              </div>

              {/* Enter Key */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter license key (e.g. PRO-XXXX-XXXX)"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}
                  disabled={loading}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleActivate()}
                  disabled={loading}
                  style={{ minWidth: '90px' }}
                >
                  {loading ? 'Verifying...' : 'Activate'}
                </button>
              </div>

              {/* Demo test key helper */}
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Testing without buying?</span>
                <button
                  type="button"
                  onClick={() => handleActivate('PRO-TRIAL-2026')}
                  style={{
                    background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.7rem',
                    cursor: 'pointer', textDecoration: 'underline', padding: 0
                  }}
                >
                  Apply Test License (PRO-TRIAL-2026)
                </button>
              </div>
            </>
          )}

          {errorMsg && (
            <div style={{ marginTop: '10px', color: '#f87171', fontSize: '0.75rem', textAlign: 'center' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ marginTop: '10px', color: '#34d399', fontSize: '0.75rem', textAlign: 'center', fontWeight: 600 }}>
              {successMsg}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            🔒 Instant offline/online verification
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Zero cookies &amp; trackers
          </span>
        </div>
      </div>
    </div>
  );
};

export default LicenseModal;
