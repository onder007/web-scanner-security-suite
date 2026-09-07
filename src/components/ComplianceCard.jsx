// src/components/ComplianceCard.jsx
import React from 'react';

const STATUS_TR = {
  'Compliant': 'Uyumlu',
  'Needs Review': 'İnceleme Gerekli',
  'Non-Compliant': 'Uyumsuz',
  'Ready': 'Hazır / Uyumlu',
  'Partial': 'Kısmi Uyumlu',
  'Fails Requirements': 'Gereksinimleri Karşılamıyor',
  'Pass': 'Başarılı',
  'Warning': 'Uyarı',
  'Fail': 'Başarısız'
};

const ComplianceCard = ({ compliance, lang = 'tr' }) => {
  if (!compliance) return null;
  const { kvkkGdpr, pciDss, owasp } = compliance;

  const isTr = lang === 'tr';

  const items = [
    {
      title: 'KVKK / GDPR',
      desc: isTr ? 'Veri Gizliliği & Çerezler' : 'Data Privacy & Cookies',
      score: kvkkGdpr.score,
      status: isTr ? (STATUS_TR[kvkkGdpr.status] || kvkkGdpr.status) : kvkkGdpr.status,
      color: kvkkGdpr.color,
      issuesCount: kvkkGdpr.issues.length
    },
    {
      title: 'PCI-DSS v4.0',
      desc: isTr ? 'Ödeme İletişim Güvenliği' : 'Payment Transport Security',
      score: pciDss.score,
      status: isTr ? (STATUS_TR[pciDss.status] || pciDss.status) : pciDss.status,
      color: pciDss.color,
      issuesCount: pciDss.issues.length
    },
    {
      title: 'OWASP Top 10',
      desc: isTr ? 'Uygulama Güvenlik Hijyeni' : 'Application Hygiene',
      score: owasp.score,
      status: isTr ? (STATUS_TR[owasp.status] || owasp.status) : owasp.status,
      color: owasp.color,
      issuesCount: owasp.issues.length
    }
  ];

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
        {isTr ? 'Uyum & Mevzuat Uyumluluğu' : 'Compliance & Regulatory Readiness'}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: item.color
            }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                {item.desc}
              </div>
            </div>
            
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: item.color }}>
                {item.score}%
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                color: item.color,
                background: `${item.color}15`,
                padding: '2px 6px',
                borderRadius: '4px',
                border: `1px solid ${item.color}30`
              }}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplianceCard;
