// src/security/sensitiveResourceDetector.js
// Sayfada keşfedilen linklerde hassas/şüpheli path'leri tespit eder.
// ÖNEMLİ: Brute-force veya path tahmin yapmaz.
// Sadece sayfada zaten var olan link/resource'ları analiz eder.

import { createFinding } from './findingsModel.js';

/**
 * Hassas kaynak kategori tanımları.
 * Her kategori için: pattern (regex), title, severity, recommendation
 */
const SENSITIVE_PATTERNS = [
  {
    patterns: [/\/\.env(\b|$)/i, /\/\.env\./i],
    title: 'Potential Environment File Exposed',
    severity: 'high',
    confidence: 'medium',
    recommendation: 'Ensure .env files are not publicly accessible. Add them to .gitignore and configure your web server to deny access.',
  },
  {
    patterns: [/\/\.git\//i, /\/\.git$/i],
    title: 'Potential Git Repository Exposed',
    severity: 'high',
    confidence: 'medium',
    recommendation: 'Restrict access to .git directory via server configuration. Exposed git repositories can leak source code and credentials.',
  },
  {
    patterns: [/\/admin(\/|$)/i, /\/administrator(\/|$)/i, /\/wp-admin(\/|$)/i, /\/phpmyadmin(\/|$)/i],
    title: 'Potential Admin Panel Detected',
    severity: 'info',
    confidence: 'low',
    recommendation: 'Verify that admin interfaces are properly protected with authentication and not exposed to unauthorized users.',
  },
  {
    patterns: [/\/backup(s)?(\/|$|\.|_)/i, /\/(db|database)[-_.]backup/i, /\.bak$/i, /\.backup$/i],
    title: 'Potential Backup File or Directory',
    severity: 'medium',
    confidence: 'medium',
    recommendation: 'Backup files should not be publicly accessible. Move them outside the web root or restrict access via server configuration.',
  },
  {
    patterns: [/\/config(\/|$|\.|_)/i, /\/settings(\/|$|\.|_)/i, /\/configuration(\/|$)/i],
    title: 'Potential Configuration Resource',
    severity: 'low',
    confidence: 'low',
    recommendation: 'Verify that configuration files and directories are not publicly accessible or contain sensitive information.',
  },
  {
    patterns: [/\/debug(\/|$|\.|_)/i, /\/trace(\/|$|\.|_)/i, /\/phpinfo/i, /\/__debug/i],
    title: 'Potential Debug Endpoint',
    severity: 'medium',
    confidence: 'medium',
    recommendation: 'Debug endpoints should be disabled in production. Exposed debug interfaces can reveal sensitive system information.',
  },
  {
    patterns: [/\/test(\/|$|\.|_)/i, /\/tests(\/|$)/i, /\/dev(\/|$)/i, /\/staging(\/|$)/i],
    title: 'Potential Test or Development Resource',
    severity: 'info',
    confidence: 'low',
    recommendation: 'Test and development resources should not be accessible in production environments.',
  },
  {
    patterns: [/\/api[-_\/]?(docs?|swagger|openapi|redoc)(\/|$)/i],
    title: 'Potential API Documentation Exposed',
    severity: 'info',
    confidence: 'medium',
    recommendation: 'API documentation may reveal endpoint structures and parameters. Consider restricting access if not intended to be public.',
  },
  {
    patterns: [/\.(sql|db|sqlite|mdb)((\?.*)?$)/i],
    title: 'Potential Database File Link',
    severity: 'high',
    confidence: 'medium',
    recommendation: 'Database files should never be publicly accessible. Immediately restrict access and verify the file is not downloadable.',
  },
  {
    patterns: [/\/logs?(\/|$|\.|_)/i, /\/error[-_]?log/i, /\/access[-_]?log/i],
    title: 'Potential Log File or Directory',
    severity: 'medium',
    confidence: 'medium',
    recommendation: 'Log files can contain sensitive information including user data, errors, and system details. Restrict public access.',
  },
];

/**
 * Sayfada bulunan link/URL listesini analiz eder.
 * @param {string[]} links - Sayfada keşfedilen URL'ler (tam veya path)
 * @param {string} pageUrl - Analiz edilen sayfa URL'si
 * @param {string} origin - Scope: sadece bu origin'deki linkler analiz edilir
 * @returns {Object[]} findings
 */
export function detectSensitiveResources(links, pageUrl, origin) {
  if (!links || links.length === 0) return [];

  const findings = [];
  const reported = new Set(); // Aynı URL + pattern kombinasyonunu tekrar raporlama

  for (const link of links) {
    let pathname = link;
    let linkOrigin = null;

    try {
      const u = new URL(link, pageUrl);
      pathname = u.pathname + u.search;
      linkOrigin = u.origin;
    } catch { /* geçersiz URL — path olarak devam et */ }

    // Harici kaynakları analiz etme (sadece same-origin)
    if (linkOrigin && origin && linkOrigin !== origin) continue;

    for (const def of SENSITIVE_PATTERNS) {
      const matched = def.patterns.some(p => p.test(pathname));
      if (!matched) continue;

      const dedupKey = `${def.title}::${pathname}`;
      if (reported.has(dedupKey)) continue;
      reported.add(dedupKey);

      findings.push(createFinding({
        category: 'sensitive-resource',
        title: def.title,
        severity: def.severity,
        confidence: def.confidence,
        url: link,
        evidence: `A link to a potentially sensitive resource was found on the page: ${pathname}`,
        recommendation: def.recommendation,
      }));
    }
  }

  return findings;
}

/**
 * Dış kaynaklı script'lerde (third-party scripts) kırık link (404/NXDOMAIN) analizi yapar.
 * Bu durum Subdomain Takeover (Kırık Link Ele Geçirme) zafiyetine işaret edebilir.
 */
export async function detectBrokenLinkHijacking(scriptSrcs, pageUrl) {
  const findings = [];
  if (!scriptSrcs || scriptSrcs.length === 0) return findings;

  const pageOrigin = new URL(pageUrl).origin;

  for (const src of scriptSrcs) {
    if (!src.startsWith('http')) continue;
    
    try {
      const srcOrigin = new URL(src).origin;
      // Sadece external script'lere bak (Subdomain takeover riski)
      if (srcOrigin === pageOrigin) continue;

      // Hızlıca kaynak kontrolü yap
      // Background script'te olduğumuz için CORS sorun olmaz (host_permissions *://*/*).
      const response = await fetch(src, { method: 'HEAD' });
      
      if (!response.ok && response.status === 404) {
        findings.push(createFinding({
          category: 'Sensitive Resources',
          title: 'Potential Subdomain Takeover / Broken Link Hijacking',
          severity: 'critical',
          confidence: 'high',
          url: pageUrl,
          evidence: `The page loads an external script that returns a 404 Not Found: ${src}`,
          recommendation: `Remove the dead script reference immediately. An attacker could register the expired domain/subdomain and serve malicious JavaScript (XSS) to all your visitors.`
        }));
      }
    } catch (e) {
      // Eğer fetch tamamen başarısız olursa (DNS bulunamadıysa) bu yüksek ihtimalle bir subdomain takeover'dır.
      findings.push(createFinding({
        category: 'Sensitive Resources',
        title: 'Potential Subdomain Takeover / Broken Link Hijacking',
        severity: 'critical',
        confidence: 'high',
        url: pageUrl,
        evidence: `The page loads an external script from an unreachable domain/URL: ${src}\nError: ${e.message}`,
        recommendation: `Remove the dead script reference immediately. An attacker could register the expired domain/subdomain and serve malicious JavaScript (XSS) to all your visitors.`
      }));
    }
  }

  return findings;
}
