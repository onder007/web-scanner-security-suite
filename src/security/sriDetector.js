// src/security/sriDetector.js
// Subresource Integrity (SRI) eksikliğini tespit eder.
// Dışarıdan yüklenen JS/CSS dosyalarında integrity attribute kontrolü.

import { createFinding } from './findingsModel.js';

// Bilinen güvenli CDN'ler — bunlarda SRI yoksa daha yüksek risk
const HIGH_RISK_CDNS = [
  'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com',
  'code.jquery.com', 'maxcdn.bootstrapcdn.com', 'stackpath.bootstrapcdn.com',
  'ajax.googleapis.com', 'ajax.microsoft.com',
];

/**
 * HTML'deki external script ve link tag'lerini SRI açısından analiz eder.
 * @param {string} html
 * @param {string} pageUrl
 * @param {string} pageOrigin
 * @returns {Object[]}
 */
export function detectMissingSri(html, pageUrl, pageOrigin) {
  if (!html || !pageOrigin) return [];
  const findings = [];

  // External script'ler
  const scriptPattern = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
  // External stylesheet'ler
  const linkPattern = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>|<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["'][^>]*>/gi;

  const violations = [];

  // Script analizi
  let match;
  while ((match = scriptPattern.exec(html)) !== null) {
    const tag = match[0];
    const src = match[1];
    if (!src || src.startsWith('data:') || src.startsWith('javascript:')) continue;

    let resolvedOrigin;
    try { resolvedOrigin = new URL(src, pageUrl).origin; } catch { continue; }

    if (resolvedOrigin === pageOrigin) continue; // same-origin, SRI gerekmez

    const hasIntegrity = /integrity=["'][^"']+["']/i.test(tag);
    if (!hasIntegrity) {
      const isHighRisk = HIGH_RISK_CDNS.some(cdn => src.includes(cdn));
      violations.push({ type: 'script', url: src, isHighRisk });
    }
  }

  // Link/stylesheet analizi
  while ((match = linkPattern.exec(html)) !== null) {
    const tag = match[0];
    const href = match[1] || match[2];
    if (!href) continue;

    let resolvedOrigin;
    try { resolvedOrigin = new URL(href, pageUrl).origin; } catch { continue; }

    if (resolvedOrigin === pageOrigin) continue;

    const hasIntegrity = /integrity=["'][^"']+["']/i.test(tag);
    if (!hasIntegrity) {
      const isHighRisk = HIGH_RISK_CDNS.some(cdn => href.includes(cdn));
      violations.push({ type: 'stylesheet', url: href, isHighRisk });
    }
  }

  if (violations.length === 0) return findings;

  const highRisk = violations.filter(v => v.isHighRisk);
  const normalRisk = violations.filter(v => !v.isHighRisk);

  // Yüksek riskli CDN'ler için ayrı bulgu
  if (highRisk.length > 0) {
    findings.push(createFinding({
      category: 'sri',
      title: `Missing Subresource Integrity on ${highRisk.length} CDN Resource${highRisk.length > 1 ? 's' : ''}`,
      severity: 'medium',
      confidence: 'high',
      url: pageUrl,
      evidence: `${highRisk.length} external resource(s) from known CDNs lack integrity attributes:\n${highRisk.slice(0, 5).map(v => `  [${v.type}] ${v.url.substring(0, 80)}`).join('\n')}${highRisk.length > 5 ? `\n  ...and ${highRisk.length - 5} more` : ''}`,
      recommendation: 'Add integrity and crossorigin attributes to external scripts and stylesheets. Use https://www.srihash.org to generate integrity hashes.',
    }));
  }

  // Diğer external kaynaklar için
  if (normalRisk.length > 0) {
    findings.push(createFinding({
      category: 'sri',
      title: `Missing Subresource Integrity on ${normalRisk.length} External Resource${normalRisk.length > 1 ? 's' : ''}`,
      severity: 'low',
      confidence: 'high',
      url: pageUrl,
      evidence: `${normalRisk.length} external resource(s) lack SRI integrity attributes:\n${normalRisk.slice(0, 5).map(v => `  [${v.type}] ${v.url.substring(0, 80)}`).join('\n')}${normalRisk.length > 5 ? `\n  ...and ${normalRisk.length - 5} more` : ''}`,
      recommendation: 'Consider adding integrity attributes to external resources. This prevents execution of tampered files if the CDN is compromised.',
    }));
  }

  return findings;
}
