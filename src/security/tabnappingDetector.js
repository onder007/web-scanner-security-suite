// src/security/tabnappingDetector.js
// target="_blank" linklerde rel="noopener noreferrer" eksikliği — Reverse Tabnapping.

import { createFinding } from './findingsModel.js';

/**
 * HTML'deki target="_blank" linkleri analiz eder.
 * @param {string} html
 * @param {string} pageUrl
 * @param {string} pageOrigin
 * @returns {Object[]}
 */
export function detectTabnapping(html, pageUrl, pageOrigin) {
  if (!html) return [];

  // target="_blank" olan tüm anchor tag'leri bul
  const anchorPattern = /<a\s[^>]*target=["']_blank["'][^>]*>/gi;
  const hrefPattern = /href=["']([^"']+)["']/i;
  const relPattern = /rel=["']([^"']+)["']/i;

  const vulnerable = [];
  const externalVulnerable = [];
  let match;

  while ((match = anchorPattern.exec(html)) !== null) {
    const tag = match[0];
    const hrefMatch = tag.match(hrefPattern);
    const href = hrefMatch ? hrefMatch[1] : null;

    // rel attribute'u al
    const relMatch = tag.match(relPattern);
    const rel = relMatch ? relMatch[1].toLowerCase() : '';

    // noopener ve noreferrer kontrolü
    const hasNoopener = rel.includes('noopener');
    const hasNoreferrer = rel.includes('noreferrer'); // noreferrer implies noopener

    if (!hasNoopener && !hasNoreferrer) {
      // External mi kontrol et
      let isExternal = false;
      if (href) {
        try {
          const linkOrigin = new URL(href, pageUrl).origin;
          isExternal = linkOrigin !== pageOrigin;
        } catch { /* relative link */ }
      }
      if (isExternal) {
        externalVulnerable.push(href);
      } else {
        vulnerable.push(href || '#');
      }
    }
  }

  const findings = [];
  const total = externalVulnerable.length + vulnerable.length;

  if (total === 0) return findings;

  // Dışarıya giden açık linkler daha kritik
  if (externalVulnerable.length > 0) {
    findings.push(createFinding({
      category: 'tabnapping',
      title: `Reverse Tabnapping Risk: ${externalVulnerable.length} External Link${externalVulnerable.length > 1 ? 's' : ''} Missing rel="noopener"`,
      severity: 'low',
      confidence: 'high',
      url: pageUrl,
      evidence: `${externalVulnerable.length} external link(s) use target="_blank" without rel="noopener noreferrer". The opened page can access window.opener and redirect the original tab.\nSample links:\n${externalVulnerable.slice(0, 5).map(u => `  ${u?.substring(0, 80)}`).join('\n')}`,
      recommendation: 'Add rel="noopener noreferrer" to all target="_blank" links, especially those pointing to external domains. Modern browsers partially mitigate this but explicit protection is recommended.',
    }));
  }

  if (vulnerable.length > 0) {
    findings.push(createFinding({
      category: 'tabnapping',
      title: `${vulnerable.length} Same-Origin Link${vulnerable.length > 1 ? 's' : ''} Missing rel="noopener"`,
      severity: 'info',
      confidence: 'medium',
      url: pageUrl,
      evidence: `${vulnerable.length} same-origin link(s) use target="_blank" without rel="noopener". Lower risk for same-origin, but best practice is to always add noopener.`,
      recommendation: 'As a best practice, add rel="noopener" to all target="_blank" links regardless of origin.',
    }));
  }

  return findings;
}
