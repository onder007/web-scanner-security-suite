// src/security/mixedContentDetector.js
// HTTPS sayfasındaki HTTP kaynaklarını tespit eder — pure function, testable

import { createFinding } from './findingsModel.js';

/**
 * Mixed content kaynak türleri ve öncelik seviyeleri.
 * active: script/iframe/link → daha tehlikeli (high severity)
 * passive: img/audio/video → daha az tehlikeli (medium severity)
 */
const ACTIVE_MIXED_PATTERNS = [
  { attr: 'src', tags: ['script'], label: 'Script' },
  { attr: 'src', tags: ['iframe'], label: 'IFrame' },
  { attr: 'href', tags: ['link'], label: 'Stylesheet' },
  { attr: 'action', tags: ['form'], label: 'Form Action' },
];

const PASSIVE_MIXED_PATTERNS = [
  { attr: 'src', tags: ['img'], label: 'Image' },
  { attr: 'src', tags: ['audio', 'source'], label: 'Audio/Video' },
  { attr: 'src', tags: ['video'], label: 'Video' },
  { attr: 'data', tags: ['object'], label: 'Object' },
];

/**
 * HTML string içindeki HTTP kaynaklarını regex ile tespit eder.
 * (DOMParser extension context'te güvenilir olmayabilir, regex kullanıyoruz)
 */
function findHttpResources(html, patterns, pageUrl) {
  const found = [];
  for (const pattern of patterns) {
    for (const tag of pattern.tags) {
      // <tag ... attr="http://..."> veya attr='http://...'
      const regex = new RegExp(
        `<${tag}[^>]+${pattern.attr}\\s*=\\s*["'](http:\\/\\/[^"']+)["']`,
        'gi'
      );
      let match;
      while ((match = regex.exec(html)) !== null) {
        const resourceUrl = match[1];
        // Kendi origin'imiz değil mi?
        try {
          const origin = new URL(pageUrl).origin;
          const resOrigin = new URL(resourceUrl).origin;
          if (resOrigin === origin) continue; // same-origin HTTP değil mixed content
        } catch { /* geçersiz URL, devam et */ }

        found.push({
          label: pattern.label,
          url: resourceUrl,
        });
      }
    }
  }
  return found;
}

/**
 * HTML içeriğini analiz ederek mixed content findings üretir.
 * @param {string} html - Sayfa HTML içeriği
 * @param {string} pageUrl - Sayfa URL'si (HTTPS olmalı)
 * @returns {{ findings: Object[], summary: Object }}
 */
export function detectMixedContent(html, pageUrl) {
  const findings = [];

  let isHttps = false;
  try {
    isHttps = new URL(pageUrl).protocol === 'https:';
  } catch { /* geçersiz URL */ }

  if (!isHttps) {
    // HTTPS değilse mixed content mantıklı değil, sadece HTTPS finding ekle
    return { findings: [], summary: { active: 0, passive: 0, total: 0 } };
  }

  const activeResources = findHttpResources(html, ACTIVE_MIXED_PATTERNS, pageUrl);
  const passiveResources = findHttpResources(html, PASSIVE_MIXED_PATTERNS, pageUrl);

  // Aktif mixed content — daha tehlikeli
  for (const res of activeResources) {
    findings.push(createFinding({
      category: 'mixed-content',
      title: `Active Mixed Content: HTTP ${res.label}`,
      severity: 'medium',
      confidence: 'high',
      url: pageUrl,
      evidence: `HTTP ${res.label} resource loaded on an HTTPS page: ${res.url}`,
      recommendation: 'Update all resource URLs to use HTTPS. Active mixed content (scripts, stylesheets, iframes) is blocked by modern browsers and poses a security risk.',
    }));
  }

  // Pasif mixed content — daha az tehlikeli
  for (const res of passiveResources) {
    findings.push(createFinding({
      category: 'mixed-content',
      title: `Passive Mixed Content: HTTP ${res.label}`,
      severity: 'low',
      confidence: 'high',
      url: pageUrl,
      evidence: `HTTP ${res.label} resource on HTTPS page: ${res.url}`,
      recommendation: 'Update image and media URLs to HTTPS to avoid mixed content warnings.',
    }));
  }

  return {
    findings,
    summary: {
      active: activeResources.length,
      passive: passiveResources.length,
      total: activeResources.length + passiveResources.length,
      activeResources,
      passiveResources,
    },
  };
}
