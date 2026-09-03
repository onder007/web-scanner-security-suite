// src/security/robotsTxtAnalyzer.js
// robots.txt ve security.txt dosyalarını fetch ederek analiz eder.

import { createFinding } from './findingsModel.js';

// Hassas path pattern'leri — robots.txt'te bunlar görünürse dikkat çeker
const SENSITIVE_PATH_PATTERNS = [
  { pattern: /\/(admin|administrator|wp-admin|panel|controlpanel|cpanel|backend)/i, category: 'Admin Panel', severity: 'medium' },
  { pattern: /\/(backup|backups|bak|dump|sql|db|database)/i, category: 'Backup/Database', severity: 'high' },
  { pattern: /\/(config|configuration|settings|setup|install|env|\.env)/i, category: 'Configuration', severity: 'high' },
  { pattern: /\/(api|api-docs|swagger|openapi|graphql|rest)/i, category: 'API Endpoint', severity: 'low' },
  { pattern: /\/(login|signin|auth|sso|oauth|token)/i, category: 'Authentication', severity: 'low' },
  { pattern: /\/(upload|uploads|files|media|assets|static)/i, category: 'File Storage', severity: 'low' },
  { pattern: /\/(test|testing|qa|staging|dev|development|debug)/i, category: 'Development Environment', severity: 'medium' },
  { pattern: /\/(phpinfo|info\.php|php-info)/i, category: 'PHP Info Page', severity: 'high' },
  { pattern: /\/(\.git|\.svn|\.env|\.htaccess|web\.config)/i, category: 'Sensitive File', severity: 'critical' },
  { pattern: /\/(private|secret|hidden|internal|restricted)/i, category: 'Restricted Area', severity: 'medium' },
];

/**
 * robots.txt fetch eder ve analiz eder.
 * @param {string} pageUrl
 * @returns {Object[]}
 */
export async function analyzeRobotsTxt(pageUrl) {
  const findings = [];

  let origin;
  try { origin = new URL(pageUrl).origin; } catch { return findings; }

  const robotsUrl = `${origin}/robots.txt`;
  let robotsContent = '';

  try {
    const response = await fetch(robotsUrl, {
      method: 'GET',
      credentials: 'omit',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      // robots.txt yok — bu bir bilgi
      findings.push(createFinding({
        category: 'configuration',
        title: 'No robots.txt Found',
        severity: 'info',
        confidence: 'high',
        url: robotsUrl,
        evidence: `HTTP ${response.status}: robots.txt not found at ${robotsUrl}`,
        recommendation: 'Consider creating a robots.txt file to control crawler access. This itself is not a security issue.',
      }));
      return findings;
    }

    robotsContent = await response.text();
  } catch (err) {
    return findings; // Fetch hatası — atla
  }

  // ── robots.txt'i parse et ────────────────────────────────────────────────
  const lines = robotsContent.split('\n').map(l => l.trim());
  const disallowedPaths = [];
  const allowedPaths = [];
  const sitemapUrls = [];

  for (const line of lines) {
    if (line.toLowerCase().startsWith('disallow:')) {
      const path = line.slice(9).trim().split('#')[0].trim();
      if (path) disallowedPaths.push(path);
    } else if (line.toLowerCase().startsWith('allow:')) {
      const path = line.slice(6).trim().split('#')[0].trim();
      if (path) allowedPaths.push(path);
    } else if (line.toLowerCase().startsWith('sitemap:')) {
      const url = line.slice(8).trim();
      if (url) sitemapUrls.push(url);
    }
  }

  // ── Hassas path tespiti ──────────────────────────────────────────────────
  const sensitiveFound = new Map(); // category → [paths]

  for (const disallowed of disallowedPaths) {
    if (disallowed === '/' || disallowed === '*') continue; // tüm site disallow normal

    for (const rule of SENSITIVE_PATH_PATTERNS) {
      if (rule.pattern.test(disallowed)) {
        if (!sensitiveFound.has(rule.category)) {
          sensitiveFound.set(rule.category, []);
        }
        sensitiveFound.get(rule.category).push(disallowed);
        break;
      }
    }
  }

  // Her hassas kategori için bir finding
  for (const [category, paths] of sensitiveFound) {
    const rule = SENSITIVE_PATH_PATTERNS.find(r => r.category === category);
    findings.push(createFinding({
      category: 'configuration',
      title: `Sensitive Path Disclosed in robots.txt: ${category}`,
      severity: rule?.severity || 'low',
      confidence: 'high',
      url: robotsUrl,
      evidence: `robots.txt Disallow entries reveal potentially sensitive paths:\n${paths.map(p => `  Disallow: ${p}`).join('\n')}\n\nNote: robots.txt is publicly readable. Disallowing a path does NOT prevent access — it only instructs crawlers.`,
      recommendation: 'robots.txt should not be relied upon as a security control. Sensitive paths should be protected by authentication and proper access controls. Consider whether these paths truly need to be listed.',
    }));
  }

  // ── Genel robots.txt bulgusu (bilgi) ────────────────────────────────────
  if (disallowedPaths.length > 0 && sensitiveFound.size === 0) {
    findings.push(createFinding({
      category: 'configuration',
      title: 'robots.txt Found — No Sensitive Paths Detected',
      severity: 'info',
      confidence: 'high',
      url: robotsUrl,
      evidence: `robots.txt found with ${disallowedPaths.length} Disallow rule(s). No obviously sensitive paths detected.`,
      recommendation: 'Review robots.txt periodically to ensure it does not inadvertently reveal sensitive application paths.',
    }));
  }

  return findings;
}

/**
 * /.well-known/security.txt dosyasını kontrol eder.
 * @param {string} pageUrl
 * @returns {Object[]}
 */
export async function checkSecurityTxt(pageUrl) {
  const findings = [];

  let origin;
  try { origin = new URL(pageUrl).origin; } catch { return findings; }

  const securityTxtUrl = `${origin}/.well-known/security.txt`;

  try {
    const response = await fetch(securityTxtUrl, {
      method: 'HEAD',
      credentials: 'omit',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      findings.push(createFinding({
        category: 'configuration',
        title: 'security.txt Found (RFC 9116 Compliant)',
        severity: 'info',
        confidence: 'high',
        url: securityTxtUrl,
        evidence: 'A security.txt file exists at the standard location. This indicates the organization has a vulnerability disclosure process.',
        recommendation: 'Good practice! Ensure security.txt contains current contact information and is kept up to date.',
      }));
    } else {
      findings.push(createFinding({
        category: 'configuration',
        title: 'No security.txt Found',
        severity: 'info',
        confidence: 'high',
        url: securityTxtUrl,
        evidence: 'No security.txt file found at /.well-known/security.txt. RFC 9116 recommends organizations publish a security.txt to provide vulnerability disclosure information.',
        recommendation: 'Consider creating a security.txt file at /.well-known/security.txt with contact information for reporting security vulnerabilities. See https://securitytxt.org',
      }));
    }
  } catch { /* ağ hatası */ }

  return findings;
}

/**
 * HTTP'den HTTPS'e yönlendirme kontrolü.
 * @param {string} pageUrl
 * @returns {Object[]}
 */
export async function checkHttpToHttpsRedirect(pageUrl) {
  const findings = [];

  let parsedUrl;
  try { parsedUrl = new URL(pageUrl); } catch { return findings; }

  if (parsedUrl.protocol !== 'https:') return findings; // zaten HTTP, zaten flag edildi

  const httpUrl = `http://${parsedUrl.host}${parsedUrl.pathname}`;

  try {
    const response = await fetch(httpUrl, {
      method: 'HEAD',
      credentials: 'omit',
      redirect: 'manual',
      signal: AbortSignal.timeout(5000)
    });

    if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
      // Yönlendiriyor — iyi
      findings.push(createFinding({
        category: 'https',
        title: 'HTTP to HTTPS Redirect Configured',
        severity: 'info',
        confidence: 'medium',
        url: httpUrl,
        evidence: 'The HTTP version of the site redirects to HTTPS. This is a good security practice.',
        recommendation: 'Ensure the redirect is a 301 (permanent) redirect and that HSTS is configured.',
      }));
    } else if (response.status === 200) {
      // HTTP'de çalışıyor — yönlendirme yok!
      findings.push(createFinding({
        category: 'https',
        title: 'HTTP Version Accessible — No Redirect to HTTPS',
        severity: 'medium',
        confidence: 'medium',
        url: httpUrl,
        evidence: 'The HTTP version of this site is accessible without redirecting to HTTPS. Users connecting over HTTP will not be automatically protected.',
        recommendation: 'Configure a permanent 301 redirect from HTTP to HTTPS at the web server level. Additionally, implement HSTS.',
      }));
    }
  } catch { /* ağ hatası veya opaque redirect */ }

  return findings;
}
