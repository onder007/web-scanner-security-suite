import React, { useState } from 'react';
import { activateLicenseKey, deactivateLicense } from '../utils/licenseManager';
import { translations } from '../utils/i18n';
import { PAYMENT_CONFIG } from '../utils/paymentConfig';

const LicenseModal = ({ isOpen, onClose, licenseData, onLicenseUpdated, lang = 'tr' }) => {
  const [keyInput, setKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const t = translations[lang] || translations.tr;

  if (!isOpen) return null;

  const handleActivate = async (keyToUse) => {
    const key = keyToUse || keyInput;
    if (!key.trim()) {
      setErrorMsg(t.errorKeyRequired);
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const res = await activateLicenseKey(key, lang);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(t.successActivated);
      onLicenseUpdated(res.license);
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1500);
    } else {
      setErrorMsg(res.error || (lang === 'tr' ? 'Aktivasyon başarısız.' : 'Activation failed.'));
    }
  };

  const handleDeactivate = async () => {
    const msg = lang === 'tr' 
      ? 'Bu tarayıcıdaki lisansı kaldırmak istediğinize emin misiniz?' 
      : 'Are you sure you want to deactivate your license on this browser?';
    if (window.confirm(msg)) {
      const blank = await deactivateLicense();
      onLicenseUpdated(blank);
      setKeyInput('');
      setSuccessMsg(lang === 'tr' ? 'Lisans kaldırıldı.' : 'License deactivated.');
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
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t.licenseTitle} <span className="pro-gradient-text">PRO / ADMIN</span>
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t.licenseSubtitle}
              </p>
            </div>
          </div>
          <button className="license-close-btn" onClick={onClose} aria-label="Kapat">
            &times;
          </button>
        </div>

        {/* Current Status Pill */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: '8px',
          background: licenseData?.isPro ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.04)',
          border: licenseData?.isPro ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
          marginTop: '14px', marginBottom: '16px'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              {t.currentPlan}:{' '}
            </span>
            <strong style={{ fontSize: '0.85rem', color: licenseData?.isPro ? '#10b981' : 'var(--text-primary)' }}>
              {licenseData?.isAdmin ? (lang === 'tr' ? 'Yönetici (Admin)' : 'Admin Full Access') : licenseData?.isPro ? 'PRO' : t.freePlan}
            </strong>
          </div>
          {licenseData?.isPro && (
            <button className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '3px 8px' }} onClick={handleDeactivate}>
              {t.deactivate}
            </button>
          )}
        </div>

        {/* Comparison Features */}
        <div className="license-features-list">
          <div className="license-feature-item">
            <span className="check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></span>
            <div><strong>{t.featVulnerability}</strong></div>
          </div>
          <div className="license-feature-item">
            <span className="check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></span>
            <div><strong>{t.featFixSnippets}</strong></div>
          </div>
          <div className="license-feature-item">
            <span className="check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></span>
            <div><strong>{t.featNetwork}</strong></div>
          </div>
          <div className="license-feature-item">
            <span className="check-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></span>
            <div><strong>{t.featExport}</strong></div>
          </div>
        </div>

        {/* Action / Activation Section */}
        <div className="license-action-section">
          {licenseData?.isPro ? (
            <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#10b981', fontSize: '0.8125rem', fontWeight: 600 }}>
                {licenseData?.isAdmin 
                  ? (lang === 'tr' ? 'Yönetici (Admin) Erişimi Aktif — Tüm Özellikler Sınırsız Açık!' : 'Administrator Access Active — All Features Unrestricted!') 
                  : (lang === 'tr' ? 'Tüm Pro güvenlik ve tarama araçlarına sınırsız ömür boyu erişiminiz var!' : 'You have lifetime unrestricted access to all Pro audit tools!')}
              </p>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                Key: {licenseData.key?.slice(0, 8)}••••••••
              </p>
            </div>
          ) : (
            <>
              {/* Buy Link */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <a
                  href={PAYMENT_CONFIG.checkoutUrl}
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
                  {t.getLicenseKeyBtn}
                </a>
              </div>

              {/* Enter Key */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={t.licenseInputPlaceholder}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}
                  disabled={loading}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleActivate()}
                  disabled={loading}
                  style={{ minWidth: '95px' }}
                >
                  {loading ? t.verifying : t.activateBtn}
                </button>
              </div>
            </>
          )}

          {errorMsg && (
            <div style={{ marginTop: '10px', color: '#ef4444', fontSize: '0.75rem', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ marginTop: '10px', color: '#10b981', fontSize: '0.75rem', textAlign: 'center', fontWeight: 600 }}>
              {successMsg}
            </div>
          )}
        </div>

        {/* Footer info & About */}
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            {lang === 'tr' ? 'Web Scanner v1.1 — Çevrimdışı Güvenli Doğrulama' : 'Web Scanner v1.1 — Offline Local Validation'}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            {lang === 'tr' ? '0 Veritabanı, 0 Takipçi, %100 Pasif & Güvenli' : '0 Database, 0 Tracking, 100% Passive & Safe'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LicenseModal;
