// src/security/supplyChainDetector.js
// Sayfaya dışarıdan dahil edilen üçüncü parti script, iframe ve tracker kaynaklarını
// (Google Tag Manager, Facebook Pixel, Yandex Metrika, Hotjar vb.) haritalandırıp risk değerlendirmesi yapar.

import { createFinding } from './findingsModel.js';

// Bilinen üçüncü parti takipçi ve pazarlama sağlayıcıları
const KNOWN_TRACKERS = [
  { name: 'Google Tag Manager', domain: 'googletagmanager.com', risk: 'Can inject arbitrary external JS into the page DOM without code review.' },
  { name: 'Facebook / Meta Pixel', domain: 'connect.facebook.net', risk: 'Exfiltrates page metadata and tracking IDs to third-party endpoints.' },
  { name: 'Hotjar Session Recorder', domain: 'static.hotjar.com', risk: 'May record and transmit sensitive user keystrokes/form inputs if masking is not strictly configured.' },
  { name: 'Yandex Metrika', domain: 'mc.yandex.ru', risk: 'Full-session replay recording and cross-border analytics transmission.' },
  { name: 'TikTok Pixel', domain: 'analytics.tiktok.com', risk: 'Third-party behavioral ad tracking.' }
];

/**
 * Harici script ve kaynakları analiz ederek tedarik zinciri haritasını çıkarır.
 * @param {string[]} scriptSrcs - Sayfada yüklenen harici script URL'leri
 * @param {string} pageUrl - Hedef URL
 * @returns {Object[]} findings
 */
export function analyzeSupplyChainTrackers(scriptSrcs, pageUrl) {
  const findings = [];
  if (!scriptSrcs || scriptSrcs.length === 0) return findings;

  let pageOrigin = '';
  try { pageOrigin = new URL(pageUrl).origin; } catch { return findings; }

  const thirdPartyDomains = new Set();
  const matchedTrackers = [];

  for (const src of scriptSrcs) {
    try {
      const u = new URL(src);
      if (u.origin !== pageOrigin) {
        thirdPartyDomains.add(u.hostname);

        for (const tracker of KNOWN_TRACKERS) {
          if (u.hostname.includes(tracker.domain)) {
            matchedTrackers.push(tracker);
          }
        }
      }
    } catch {}
  }

  // Seans Kaydedici (Session Replay) Uyarısı (Hotjar, Yandex Webvisor vb.)
  const sessionRecorders = matchedTrackers.filter(t => t.name.includes('Hotjar') || t.name.includes('Yandex'));
  if (sessionRecorders.length > 0) {
    findings.push(createFinding({
      category: 'configuration',
      title: 'Session Replay / Keystroke Tracker Script Active',
      severity: 'medium',
      confidence: 'high',
      url: pageUrl,
      evidence: `Active session recorders detected:\n${sessionRecorders.map(s => `  • ${s.name}: ${s.risk}`).join('\n')}`,
      recommendation: 'Ensure strict input field masking (e.g. `data-hj-suppress`) is applied to all sensitive form fields (passwords, credit cards, PII) so keystrokes are not sent to third-party recording servers.'
    }));
  }

  // Tedarik Zinciri Özeti
  if (thirdPartyDomains.size > 0) {
    findings.push(createFinding({
      category: 'configuration',
      title: `Third-Party Script Supply Chain Map (${thirdPartyDomains.size} External Hosts)`,
      severity: 'info',
      confidence: 'high',
      url: pageUrl,
      evidence: `The page relies on ${thirdPartyDomains.size} external hosts to execute JavaScript in the user's browser context:\n${Array.from(thirdPartyDomains).slice(0, 10).map(d => `  • ${d}`).join('\n')}`,
      recommendation: 'Periodically review third-party scripts. Every external script possesses full DOM access and could potentially compromise site integrity if the vendor is compromised.'
    }));
  }

  return findings;
}
