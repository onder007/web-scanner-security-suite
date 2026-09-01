// src/security/infoDisclosureDetector.js
// Sunucu/teknoloji bilgisi sızdıran response header ve meta tag'leri tespit eder.

import { createFinding } from './findingsModel.js';

// ── Bilgi sızdıran response header'lar ───────────────────────────────────────
const DISCLOSURE_HEADERS = [
  {
    header: 'server',
    pattern: /(.+\/[\d.]+)/i, // Apache/2.4.51, nginx/1.18.0
    title: 'Server Version Disclosed',
    recommendation: 'Configure the server to suppress version information. In Apache: "ServerTokens Prod". In Nginx: "server_tokens off".',
  },
  {
    header: 'x-powered-by',
    pattern: /.+/,
    title: 'Backend Technology Disclosed via X-Powered-By',
    recommendation: 'Remove the X-Powered-By header. In PHP: "expose_php = Off". In Express.js: app.disable("x-powered-by").',
  },
  {
    header: 'x-generator',
    pattern: /.+/,
    title: 'CMS/Generator Disclosed via X-Generator',
    recommendation: 'Remove or suppress the X-Generator header from your CMS configuration.',
  },
  {
    header: 'x-aspnet-version',
    pattern: /.+/,
    title: '.NET Framework Version Disclosed',
    recommendation: 'Add <httpRuntime enableVersionHeader="false" /> to Web.config.',
  },
  {
    header: 'x-aspnetmvc-version',
    pattern: /.+/,
    title: 'ASP.NET MVC Version Disclosed',
    recommendation: 'In Application_Start: MvcHandler.DisableMvcResponseHeader = true.',
  },
  {
    header: 'x-drupal-cache',
    pattern: /.+/,
    title: 'Drupal CMS Detected via Response Header',
    recommendation: 'Consider suppressing CMS-specific headers. Keep Drupal updated.',
  },
  {
    header: 'x-wordpress-cache',
    pattern: /.+/,
    title: 'WordPress Detected via Response Header',
    recommendation: 'Keep WordPress and all plugins updated. Consider using a security plugin.',
  },
  {
    header: 'x-runtime',
    pattern: /ruby/i,
    title: 'Ruby on Rails Application Detected',
    recommendation: 'Suppress the X-Runtime header in production (config.middleware.delete ActionDispatch::RequestId).',
  },
  {
    header: 'x-debug-token',
    pattern: /.+/,
    title: 'Symfony Debug Token Exposed',
    severity: 'high',
    recommendation: 'Disable the Symfony Profiler in production. Set APP_ENV=prod.',
  },
  {
    header: 'x-debug-token-link',
    pattern: /.+/,
    title: 'Symfony Debug Profiler Link Exposed',
    severity: 'high',
    recommendation: 'Disable the Symfony Profiler in production. Set APP_ENV=prod.',
  },
];

// ── Meta tag bilgi sızıntısı pattern'leri ────────────────────────────────────
const META_DISCLOSURE_PATTERNS = [
  {
    // <meta name="generator" content="WordPress 6.1.1">
    pattern: /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/gi,
    title: 'CMS/Generator Version Disclosed in Meta Tag',
    getEvidence: (m) => `Generator meta tag found: "${m[1]}"`,
    recommendation: 'Remove or suppress the generator meta tag. In WordPress: remove_action("wp_head", "wp_generator").',
    severity: 'low',
  },
  {
    // <meta name="author" content="John Doe">
    pattern: /<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/gi,
    title: 'Author Name Disclosed in Meta Tag',
    getEvidence: (m) => `Author meta tag found: "${m[1]}"`,
    recommendation: 'Consider removing the author meta tag from public-facing pages to reduce personal information exposure.',
    severity: 'info',
  },
  {
    // <meta http-equiv="X-UA-Compatible" content="IE=EmulateIE7">
    pattern: /<meta[^>]+http-equiv=["']X-UA-Compatible["'][^>]+content=["']IE=(?:Emulate)?IE[5-9]["']/gi,
    title: 'Legacy Internet Explorer Compatibility Mode Enabled',
    getEvidence: () => 'X-UA-Compatible meta tag forces old IE rendering mode, which may bypass modern security controls.',
    recommendation: 'Remove legacy X-UA-Compatible meta tags. Modern browsers do not require this.',
    severity: 'low',
  },
];

// ── DNS Prefetch hostname sızıntısı ──────────────────────────────────────────
const DNS_PREFETCH_PATTERN = /<link[^>]+rel=["']dns-prefetch["'][^>]+href=["']([^"']+)["']/gi;
const INTERNAL_HOSTNAME_PATTERN = /\.(internal|local|corp|intranet|lan|dev|staging|test|uat)\b/i;

// ── Ana Detectors ──────────────────────────────────────────────────────────

/**
 * Response header'lardan bilgi sızıntısını tespit eder.
 * @param {Headers|null} headers
 * @param {string} pageUrl
 * @returns {Object[]}
 */
export function detectHeaderDisclosure(headers, pageUrl) {
  if (!headers) return [];
  const findings = [];

  for (const rule of DISCLOSURE_HEADERS) {
    const value = headers.get(rule.header);
    if (!value) continue;
    if (!rule.pattern.test(value)) continue;

    findings.push(createFinding({
      category: 'information-disclosure',
      title: rule.title,
      severity: rule.severity || 'low',
      confidence: 'high',
      url: pageUrl,
      header: rule.header,
      evidence: `Response header "${rule.header}: ${value.substring(0, 100)}" reveals technology information that attackers can use to target known vulnerabilities.`,
      recommendation: rule.recommendation,
    }));
  }

  return findings;
}

/**
 * HTML meta tag'lerinden bilgi sızıntısını tespit eder.
 * @param {string} html
 * @param {string} pageUrl
 * @returns {Object[]}
 */
export function detectMetaDisclosure(html, pageUrl) {
  if (!html) return [];
  const findings = [];

  for (const rule of META_DISCLOSURE_PATTERNS) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;
    while ((match = regex.exec(html)) !== null) {
      findings.push(createFinding({
        category: 'information-disclosure',
        title: rule.title,
        severity: rule.severity || 'low',
        confidence: 'high',
        url: pageUrl,
        evidence: rule.getEvidence(match),
        recommendation: rule.recommendation,
      }));
      break; // Her rule için bir tane yeterli
    }
  }

  return findings;
}

/**
 * DNS prefetch tag'lerinden iç hostname sızıntısını tespit eder.
 * @param {string} html
 * @param {string} pageUrl
 * @returns {Object[]}
 */
export function detectDnsPrefetchLeakage(html, pageUrl) {
  if (!html) return [];
  const findings = [];
  const regex = new RegExp(DNS_PREFETCH_PATTERN.source, DNS_PREFETCH_PATTERN.flags);
  let match;
  const internalHostnames = new Set();

  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    if (INTERNAL_HOSTNAME_PATTERN.test(href)) {
      internalHostnames.add(href);
    }
  }

  if (internalHostnames.size > 0) {
    findings.push(createFinding({
      category: 'information-disclosure',
      title: 'Internal Hostname Leaked via DNS Prefetch',
      severity: 'low',
      confidence: 'high',
      url: pageUrl,
      evidence: `DNS prefetch hints reveal potentially internal hostnames: ${[...internalHostnames].join(', ')}`,
      recommendation: 'Review dns-prefetch link tags and remove references to internal infrastructure hostnames.',
    }));
  }

  return findings;
}
