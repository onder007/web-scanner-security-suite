// src/security/formSecurityDetector.js
// Gelişmiş form güvenlik analizi:
// CSRF token eksikliği, autocomplete şifre alanı, HTTP action, GET+password.

import { createFinding } from './findingsModel.js';

// CSRF token için kullanılan yaygın alan isimleri
const CSRF_TOKEN_NAMES = new Set([
  '_token', 'csrf_token', 'csrftoken', 'csrf', '_csrf', 'xsrf_token',
  'xsrftoken', '__requestverificationtoken', 'authenticity_token',
  '_method', 'form_key', 'nonce', 'wp_nonce', '_wpnonce',
  'antiforgerytoken', 'form_token', 'token',
]);

const PASSWORD_FIELD_NAMES = /password|passwd|pass|pwd|secret/i;

/**
 * @param {Array} forms - content_security.js'den gelen form listesi
 * @param {string} pageUrl
 * @param {boolean} isHttps
 * @returns {Object[]}
 */
export function analyzeFormSecurity(forms, pageUrl, isHttps) {
  if (!forms || forms.length === 0) return [];
  const findings = [];

  for (const form of forms) {
    const action = form.action || pageUrl;
    const method = (form.method || 'get').toLowerCase();
    const inputs = form.inputs || [];
    const hasPasswordField = inputs.some(inp => PASSWORD_FIELD_NAMES.test(inp.name || '') || inp.type === 'password');

    // ── 1. CSRF Token Eksikliği ───────────────────────────────────────────
    if (method === 'post') {
      const hiddenInputs = inputs.filter(inp => inp.type === 'hidden');
      const hasCsrfToken = hiddenInputs.some(inp => CSRF_TOKEN_NAMES.has((inp.name || '').toLowerCase()));

      if (!hasCsrfToken) {
        findings.push(createFinding({
          category: 'form-security',
          title: 'POST Form Missing CSRF Token',
          severity: 'medium',
          confidence: 'low',
          url: action,
          evidence: `A POST form${action !== pageUrl ? ` submitting to "${action.substring(0, 80)}"` : ''} does not appear to contain a CSRF token hidden field. Without CSRF protection, authenticated users may be tricked into submitting unintended requests.`,
          recommendation: 'Implement CSRF tokens on all state-changing forms. Use framework-provided CSRF protection mechanisms (Laravel: @csrf, Django: {% csrf_token %}, Rails: protect_from_forgery).',
        }));
      }
    }

    // ── 2. Şifre Alanında autocomplete="on" ──────────────────────────────
    if (hasPasswordField) {
      const passwordInputs = inputs.filter(inp => inp.type === 'password' || PASSWORD_FIELD_NAMES.test(inp.name || ''));
      const autocompleteOnPass = passwordInputs.some(inp => {
        const ac = (inp.autocomplete || '').toLowerCase();
        return ac === 'on' || ac === ''; // varsayılan 'on'dur
      });

      if (autocompleteOnPass) {
        findings.push(createFinding({
          category: 'form-security',
          title: 'Password Field Allows Browser Autocomplete',
          severity: 'low',
          confidence: 'medium',
          url: action,
          evidence: 'Password input field does not have autocomplete="off" or autocomplete="new-password". On shared/public computers, the browser may offer to save or auto-fill the password.',
          recommendation: 'Add autocomplete="off" or autocomplete="current-password"/"new-password" to password fields based on context. Note: some security policies recommend allowing password manager autocomplete.',
        }));
      }
    }

    // ── 3. HTTPS sayfasında HTTP action ──────────────────────────────────
    if (isHttps && action && action.startsWith('http://')) {
      findings.push(createFinding({
        category: 'form-security',
        title: 'Form Submits Over HTTP from HTTPS Page (Mixed Form)',
        severity: 'high',
        confidence: 'high',
        url: pageUrl,
        evidence: `A form on this HTTPS page submits data to an HTTP endpoint: "${action.substring(0, 100)}". Form data will be transmitted in plaintext and may be intercepted.`,
        recommendation: 'Update the form action to use HTTPS. Never submit sensitive data over HTTP.',
      }));
    }

    // ── 4. GET method'lu şifre formu ────────────────────────────────────
    if (method === 'get' && hasPasswordField) {
      findings.push(createFinding({
        category: 'form-security',
        title: 'Password Form Using GET Method — Credentials in URL',
        severity: 'high',
        confidence: 'high',
        url: action,
        evidence: 'A form containing a password field uses the GET method. This will append credentials to the URL, exposing them in browser history, server logs, and Referer headers.',
        recommendation: 'Change the form method to POST for any form containing passwords or sensitive data.',
      }));
    }

    // ── 5. Action URL parametresinde şifre var mı ─────────────────────
    if (action && action !== pageUrl) {
      try {
        const actionUrl = new URL(action, pageUrl);
        for (const [key, value] of actionUrl.searchParams) {
          if (PASSWORD_FIELD_NAMES.test(key)) {
            findings.push(createFinding({
              category: 'form-security',
              title: 'Password-Related Parameter in Form Action URL',
              severity: 'medium',
              confidence: 'medium',
              url: pageUrl,
              parameter: key,
              evidence: `Form action URL contains a parameter named "${key}" which may carry sensitive data in the URL.`,
              recommendation: 'Remove sensitive parameters from form action URLs. Use POST body for credential transmission.',
            }));
          }
        }
      } catch { /* ignore */ }
    }
  }

  return findings;
}
