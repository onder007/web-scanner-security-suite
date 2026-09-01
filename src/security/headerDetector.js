// src/security/headerDetector.js
// HTTP Security Header analizi — pure function, testable

import { createFinding } from './findingsModel.js';

/**
 * Kontrol edilecek security header tanımları.
 * name: header adı (küçük harf)
 * title: kullanıcıya gösterilecek başlık
 * severity: eksikse ne kadar önemli
 * recommendation: önerilen çözüm
 * validate: opsiyonel — header değerini analiz edip 'present'|'weak' döndürür
 */
const SECURITY_HEADERS = [
  {
    name: 'strict-transport-security',
    title: 'Strict-Transport-Security (HSTS)',
    severity: 'medium',
    recommendation: 'Add Strict-Transport-Security header with max-age of at least 31536000. Example: Strict-Transport-Security: max-age=31536000; includeSubDomains',
    validate: (value) => {
      if (!value) return 'missing';
      const maxAge = parseInt((value.match(/max-age=(\d+)/i) || [])[1] || '0', 10);
      if (maxAge < 86400) return 'weak'; // less than 1 day
      return 'present';
    },
  },
  {
    name: 'content-security-policy',
    title: 'Content-Security-Policy (CSP)',
    severity: 'medium',
    recommendation: 'Implement a Content Security Policy to prevent XSS and data injection attacks. Start with a restrictive policy and loosen as needed.',
    validate: (value) => {
      if (!value) return 'missing';
      if (value.includes("'unsafe-inline'") && value.includes("'unsafe-eval'")) return 'weak';
      return 'present';
    },
  },
  {
    name: 'x-content-type-options',
    title: 'X-Content-Type-Options',
    severity: 'low',
    recommendation: 'Add X-Content-Type-Options: nosniff to prevent MIME-type sniffing attacks.',
    validate: (value) => {
      if (!value) return 'missing';
      if (value.toLowerCase().trim() !== 'nosniff') return 'weak';
      return 'present';
    },
  },
  {
    name: 'x-frame-options',
    title: 'X-Frame-Options',
    severity: 'low',
    recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN to prevent clickjacking attacks.',
    validate: (value) => {
      if (!value) return 'missing';
      const v = value.toUpperCase().trim();
      if (v === 'DENY' || v === 'SAMEORIGIN') return 'present';
      return 'weak';
    },
  },
  {
    name: 'referrer-policy',
    title: 'Referrer-Policy',
    severity: 'low',
    recommendation: 'Add Referrer-Policy to control how much referrer information is sent with requests. Consider using no-referrer or strict-origin-when-cross-origin.',
    validate: (value) => {
      if (!value) return 'missing';
      return 'present';
    },
  },
  {
    name: 'permissions-policy',
    title: 'Permissions-Policy',
    severity: 'info',
    recommendation: 'Consider adding Permissions-Policy to control browser features. Example: Permissions-Policy: geolocation=(), microphone=()',
    validate: (value) => {
      if (!value) return 'missing';
      return 'present';
    },
  },
];

/**
 * Fetch response headers'ı analiz eder ve findings döndürür.
 * @param {Headers} headers - Fetch API Headers nesnesi
 * @param {string} pageUrl - Analiz edilen sayfa URL'si
 * @returns {Object[]} findings array
 */
export function analyzeSecurityHeaders(headers, pageUrl) {
  const findings = [];

  // Browser/CORS nedeniyle response header'lara erişilemeyebilir
  // headers null gelirse "unable to inspect" döndür
  if (!headers) {
    findings.push(createFinding({
      category: 'headers',
      title: 'Security Headers Could Not Be Inspected',
      severity: 'info',
      confidence: 'high',
      url: pageUrl,
      evidence: 'Browser or CORS policy prevented access to response headers.',
      recommendation: 'Manually inspect security headers using browser DevTools or an online header checker.',
    }));
    return findings;
  }

  for (const def of SECURITY_HEADERS) {
    let rawValue = null;
    try {
      rawValue = headers.get(def.name);
    } catch {
      // Header erişimi başarısız
    }

    const status = def.validate ? def.validate(rawValue) : (rawValue ? 'present' : 'missing');

    if (status === 'missing') {
      findings.push(createFinding({
        category: 'headers',
        title: `Missing Security Header: ${def.title}`,
        severity: def.severity,
        confidence: 'high',
        url: pageUrl,
        header: def.name,
        evidence: `The ${def.title} header was not found in the response.`,
        recommendation: def.recommendation,
      }));
    } else if (status === 'weak') {
      findings.push(createFinding({
        category: 'headers',
        title: `Weak Security Header: ${def.title}`,
        severity: 'low',
        confidence: 'high',
        url: pageUrl,
        header: def.name,
        evidence: `The ${def.title} header is present but may have a weak configuration.`,
        recommendation: def.recommendation,
      }));
    }
    // 'present' ise finding oluşturma
  }

  return findings;
}

/**
 * Header listesini özet tablo olarak döndürür (UI için).
 * @param {Headers} headers
 * @returns {Object[]} [{ name, title, status: 'present'|'missing'|'weak'|'unknown' }]
 */
export function getHeaderSummary(headers) {
  return SECURITY_HEADERS.map(def => {
    let rawValue = null;
    let status = 'unknown';
    try {
      if (headers) {
        rawValue = headers.get(def.name);
        status = def.validate ? def.validate(rawValue) : (rawValue ? 'present' : 'missing');
      }
    } catch {
      status = 'unknown';
    }
    return { name: def.name, title: def.title, status };
  });
}
