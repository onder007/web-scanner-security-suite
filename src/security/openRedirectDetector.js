// src/security/openRedirectDetector.js
// URL parametrelerinde açık yönlendirme (open redirect) risk noktalarını tespit eder.
// Pasif — test URL'si gönderilmez, yalnızca parametre isimleri incelenir.

import { createFinding } from './findingsModel.js';

// Redirect için sıkça kullanılan parametre isimleri
const REDIRECT_PARAM_NAMES = new Set([
  'redirect', 'redirect_to', 'redirect_url', 'redirecturl', 'redirecturi',
  'return', 'return_to', 'returnurl', 'returnto', 'return_url',
  'next', 'next_url',
  'url', 'goto', 'go', 'dest', 'destination',
  'target', 'redir', 'r', 'u',
  'location', 'back', 'backurl',
  'continue', 'forward', 'link',
  'callback', 'callback_url', 'callbackurl',
  'success_url', 'failure_url', 'cancel_url',
  'success', 'error_url', 'after_login',
]);

// Değerin URL gibi göründüğünü kontrol eder
function looksLikeUrl(value) {
  if (!value) return false;
  return value.startsWith('http') || value.startsWith('//') || value.startsWith('/');
}

/**
 * URL parametrelerinden open redirect risk noktalarını tespit eder.
 * @param {Array<{name: string, value: string, source: string}>} params
 * @param {string} pageUrl
 * @returns {Object[]}
 */
export function detectOpenRedirect(params, pageUrl) {
  if (!params || params.length === 0) return [];
  const findings = [];
  const flagged = new Set();

  for (const param of params) {
    const name = (param.name || '').toLowerCase().trim();
    if (!name) continue;
    if (flagged.has(name)) continue;

    const isRedirectParam = REDIRECT_PARAM_NAMES.has(name);
    const valueLooksLikeUrl = looksLikeUrl(param.value);

    if (!isRedirectParam && !valueLooksLikeUrl) continue;

    const isHighConfidence = isRedirectParam && valueLooksLikeUrl;
    const isMediumConfidence = isRedirectParam || valueLooksLikeUrl;

    if (!isMediumConfidence) continue;

    flagged.add(name);
    findings.push(createFinding({
      category: 'open-redirect',
      title: `Potential Open Redirect Parameter: "${param.name}"`,
      severity: 'low',
      confidence: isHighConfidence ? 'medium' : 'low',
      url: pageUrl,
      parameter: param.name,
      evidence: `URL parameter "${param.name}" ${valueLooksLikeUrl ? `with a URL-like value "${param.value?.substring(0, 60)}"` : ''} is commonly used for redirect functionality. If user-controlled input is not validated against an allowlist, this could enable open redirect attacks.`,
      recommendation: 'Validate redirect destinations against a strict allowlist of permitted URLs or paths. Never redirect to arbitrary user-supplied URLs. Consider using relative paths only.',
    }));
  }

  return findings;
}

/**
 * HTML form action'larından open redirect pattern tespiti.
 * @param {Array<{action: string, method: string}>} forms
 * @param {string} pageUrl
 * @returns {Object[]}
 */
export function detectOpenRedirectInForms(forms, pageUrl) {
  if (!forms || forms.length === 0) return [];
  const findings = [];

  for (const form of forms) {
    if (!form.action) continue;
    const actionLower = form.action.toLowerCase();

    // Form action'ında redirect param var mı?
    try {
      const actionUrl = new URL(form.action, pageUrl);
      for (const [key] of actionUrl.searchParams) {
        if (REDIRECT_PARAM_NAMES.has(key.toLowerCase())) {
          findings.push(createFinding({
            category: 'open-redirect',
            title: `Open Redirect Parameter in Form Action: "${key}"`,
            severity: 'low',
            confidence: 'medium',
            url: pageUrl,
            parameter: key,
            evidence: `Form action URL contains redirect parameter "${key}": ${form.action.substring(0, 100)}`,
            recommendation: 'Validate form redirect destinations server-side against an allowlist.',
          }));
          break;
        }
      }
    } catch { /* geçersiz URL */ }
  }

  return findings;
}
