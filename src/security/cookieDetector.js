// src/security/cookieDetector.js
// Cookie güvenlik analizi — pure function, testable
// ÖNEMLİ: Cookie VALUE'ları asla loglanmaz, saklanmaz veya UI'a gönderilmez.

import { createFinding } from './findingsModel.js';

/**
 * Session/auth cookie olduğunu gösteren isim kalıpları.
 * Bu liste sadece severity yükseltmek için kullanılır.
 */
const SESSION_COOKIE_PATTERNS = [
  /^sess/i, /^session/i, /^auth/i, /^token/i, /^jwt/i,
  /^sid/i, /^user/i, /^login/i, /^access/i, /^refresh/i,
  /^PHPSESSID/i, /^JSESSIONID/i, /^ASP\.NET_SessionId/i, /^connect\.sid/i,
];

function isSessionLikeCookie(name) {
  return SESSION_COOKIE_PATTERNS.some(p => p.test(name));
}

/**
 * Set-Cookie header string'lerini parse eder.
 * @param {string[]} setCookieHeaders - Set-Cookie header değerleri (birden fazla olabilir)
 * @returns {Object[]} parsed cookie listesi (name, secure, httpOnly, sameSite)
 */
function parseCookies(setCookieHeaders) {
  return setCookieHeaders.map(header => {
    const parts = header.split(';').map(p => p.trim());
    // İlk part: name=value — değeri almıyoruz, sadece adı
    const nameRaw = parts[0] || '';
    const eqIdx = nameRaw.indexOf('=');
    const name = eqIdx >= 0 ? nameRaw.substring(0, eqIdx).trim() : nameRaw.trim();
    // VALUE hiçbir zaman saklanmıyor
    const flags = parts.slice(1).map(p => p.toLowerCase());

    const secure = flags.some(f => f === 'secure');
    const httpOnly = flags.some(f => f === 'httponly');

    let sameSite = 'none';
    const sameFlag = flags.find(f => f.startsWith('samesite='));
    if (sameFlag) {
      sameSite = sameFlag.split('=')[1] || 'none';
    }

    return { name, secure, httpOnly, sameSite };
  });
}

/**
 * Cookie listesini analiz eder ve findings döndürür.
 * @param {string[]} setCookieHeaders - Response'daki Set-Cookie header string'leri
 * @param {string} pageUrl
 * @param {boolean} isHttps - Sayfa HTTPS üzerinde mi?
 * @returns {Object[]} findings
 */
export function analyzeCookies(setCookieHeaders, pageUrl, isHttps) {
  if (!setCookieHeaders || setCookieHeaders.length === 0) return [];

  const cookies = parseCookies(setCookieHeaders);
  const findings = [];

  for (const cookie of cookies) {
    if (!cookie.name) continue;

    const isSession = isSessionLikeCookie(cookie.name);

    // Secure flag
    if (!cookie.secure && isHttps) {
      findings.push(createFinding({
        category: 'cookies',
        title: 'Cookie Missing Secure Flag',
        severity: isSession ? 'medium' : 'low',
        confidence: 'high',
        url: pageUrl,
        cookieName: cookie.name,
        evidence: `Cookie "${cookie.name}" is missing the Secure flag. It can be transmitted over unencrypted HTTP connections.${isSession ? ' This appears to be a session/auth cookie.' : ''}`,
        recommendation: 'Add the Secure flag to ensure the cookie is only sent over HTTPS connections.',
      }));
    }

    // HttpOnly flag
    if (!cookie.httpOnly) {
      findings.push(createFinding({
        category: 'cookies',
        title: 'Cookie Missing HttpOnly Flag',
        severity: isSession ? 'medium' : 'low',
        confidence: 'high',
        url: pageUrl,
        cookieName: cookie.name,
        evidence: `Cookie "${cookie.name}" is missing the HttpOnly flag. It can be accessed by JavaScript, increasing XSS risk.${isSession ? ' This appears to be a session/auth cookie.' : ''}`,
        recommendation: 'Add the HttpOnly flag to prevent JavaScript access to the cookie.',
      }));
    }

    // SameSite flag
    if (!cookie.sameSite || cookie.sameSite === 'none') {
      findings.push(createFinding({
        category: 'cookies',
        title: 'Cookie Missing or Weak SameSite Attribute',
        severity: isSession ? 'medium' : 'low',
        confidence: 'high',
        url: pageUrl,
        cookieName: cookie.name,
        evidence: `Cookie "${cookie.name}" has no SameSite attribute or is set to None, which may allow cross-site request forgery.`,
        recommendation: 'Set SameSite=Lax (recommended) or SameSite=Strict to prevent CSRF attacks.',
      }));
    }
  }

  return findings;
}

/**
 * Cookie özetini döndürür (UI için). Değerler dahil değil.
 * @param {string[]} setCookieHeaders
 * @param {boolean} isHttps
 * @returns {Object[]} [{ name, secure, httpOnly, sameSite, isSession }]
 */
export function getCookieSummary(setCookieHeaders, isHttps) {
  if (!setCookieHeaders || setCookieHeaders.length === 0) return [];
  const cookies = parseCookies(setCookieHeaders);
  return cookies
    .filter(c => c.name)
    .map(c => ({
      name: c.name,
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite,
      isSession: isSessionLikeCookie(c.name),
    }));
}
