// src/security/passiveInputDetector.js
// Pasif SQL Injection ve XSS risk noktası tespiti.
//
// ÖNEMLİ KISITLAMALAR:
// - Hiçbir payload üretilmez.
// - Hiçbir ek HTTP request atılmaz.
// - Sadece "bu nokta manuel incelemeye değer" tespiti yapılır.
// - Sonuçlar kesin vulnerability iddiası değildir.

import { createFinding } from './findingsModel.js';

// ─── SQLi Risk Tespiti ───────────────────────────────────────────────────────

/**
 * SQLi açısından yüksek riskli parametre isim kalıpları.
 * Bu isimler numeric/ID/database-related değer almaya işaret eder.
 */
const HIGH_RISK_PARAM_PATTERNS = [
  /^id$/i, /^uid$/i, /^user_?id$/i, /^product_?id$/i, /^item_?id$/i,
  /^order_?id$/i, /^cat_?id$/i, /^category_?id$/i, /^post_?id$/i,
  /^record_?id$/i, /^entry_?id$/i, /^account_?id$/i,
];

const MEDIUM_RISK_PARAM_PATTERNS = [
  /^(user|username|login|email)$/i,
  /^(search|q|query|keyword|term|s)$/i,
  /^(filter|sort|order|by|direction)$/i,
  /^(page|offset|limit|count|num)$/i,
  /^(category|cat|type|group|tag)$/i,
  /^(name|title|slug|ref|code)$/i,
];

/**
 * Parametrelerin SQLi risk düzeyini belirler.
 * @param {string} name - Parametre adı
 * @returns {'high'|'medium'|'low'} risk
 */
function getSqliParamRisk(name) {
  if (HIGH_RISK_PARAM_PATTERNS.some(p => p.test(name))) return 'high';
  if (MEDIUM_RISK_PARAM_PATTERNS.some(p => p.test(name))) return 'medium';
  return 'low';
}

/**
 * URL parametrelerini SQLi risk açısından analiz eder.
 * @param {Array<{name: string, value: string, url: string, method: string}>} params
 * @param {string} pageUrl
 * @returns {Object[]} findings
 */
export function detectSqliRiskFromParams(params, pageUrl) {
  const findings = [];
  const reported = new Set();

  for (const param of params) {
    const dedupKey = `sqli::${param.url}::${param.name}`;
    if (reported.has(dedupKey)) continue;
    reported.add(dedupKey);

    const risk = getSqliParamRisk(param.name);

    // Tüm parametreler potansiyel noktadır, ama severity farkı var
    const severity = risk === 'high' ? 'low' : 'info';
    const confidence = risk === 'high' ? 'low' : 'info';

    findings.push(createFinding({
      category: 'sql-injection-risk',
      title: 'Potential SQL Injection Input Point',
      severity,
      confidence: 'low', // Pasif tespit — her zaman low confidence
      url: param.url,
      parameter: param.name,
      method: param.method || 'GET',
      evidence: `User-controlled query parameter "${param.name}" detected.${risk === 'high' ? ' Parameter name suggests it may be used in database queries.' : ''}`,
      recommendation: 'Manual verification required. If this parameter is used in SQL queries, ensure parameterized queries or prepared statements are used. This is NOT a confirmed vulnerability.',
    }));
  }

  return findings;
}

/**
 * Form input'larını SQLi risk açısından analiz eder.
 * @param {Array<{action: string, method: string, inputs: Array<{name: string, type: string}>}>} forms
 * @param {string} pageUrl
 * @returns {Object[]} findings
 */
export function detectSqliRiskFromForms(forms, pageUrl) {
  const findings = [];

  for (const form of forms) {
    for (const input of (form.inputs || [])) {
      // Password ve hidden alanları skip et
      if (input.type === 'password' || input.type === 'hidden' || input.type === 'submit' || input.type === 'button' || input.type === 'reset') continue;
      if (!input.name) continue;

      const risk = getSqliParamRisk(input.name);
      if (risk === 'low') continue; // Sadece medium ve high risk olanları raporla

      const dedupKey = `sqli-form::${form.action}::${input.name}`;
      const findings_set = new Set(findings.map(f => `${f.url}::${f.parameter}`));
      if (findings_set.has(`${form.action}::${input.name}`)) continue;

      findings.push(createFinding({
        category: 'sql-injection-risk',
        title: 'Potential SQL Injection Input Point (Form)',
        severity: 'info',
        confidence: 'low',
        url: form.action || pageUrl,
        parameter: input.name,
        method: (form.method || 'GET').toUpperCase(),
        evidence: `Form input field "${input.name}" (type: ${input.type || 'text'}) on form submitted to "${form.action || pageUrl}".`,
        recommendation: 'Manual verification required. Ensure all form inputs are sanitized and parameterized queries are used. This is NOT a confirmed vulnerability.',
      }));
    }
  }

  return findings;
}

// ─── XSS Risk Tespiti ────────────────────────────────────────────────────────

/**
 * Tehlikeli DOM sink kalıpları — sayfa kaynak kodunda aranır.
 */
const DOM_SINK_PATTERNS = [
  { pattern: /innerHTML\s*=/gi, label: 'innerHTML assignment', severity: 'low' },
  { pattern: /outerHTML\s*=/gi, label: 'outerHTML assignment', severity: 'low' },
  { pattern: /insertAdjacentHTML\s*\(/gi, label: 'insertAdjacentHTML()', severity: 'low' },
  { pattern: /document\.write\s*\(/gi, label: 'document.write()', severity: 'low' },
  { pattern: /document\.writeln\s*\(/gi, label: 'document.writeln()', severity: 'low' },
  { pattern: /eval\s*\(/gi, label: 'eval()', severity: 'low' },
  { pattern: /setTimeout\s*\(\s*["'`]/gi, label: 'setTimeout with string', severity: 'low' },
  { pattern: /setInterval\s*\(\s*["'`]/gi, label: 'setInterval with string', severity: 'low' },
  { pattern: /location\s*\.\s*href\s*=/gi, label: 'location.href assignment', severity: 'info' },
  { pattern: /location\s*\.\s*hash\s*=/gi, label: 'location.hash assignment', severity: 'info' },
];

/**
 * Inline script'leri ve DOM sink'leri analiz eder.
 * @param {string[]} inlineScripts - Content script'in döndürdüğü inline script içerikleri
 * @param {string} pageUrl
 * @returns {Object[]} findings
 */
export function detectXssRiskFromScripts(inlineScripts, pageUrl) {
  if (!inlineScripts || inlineScripts.length === 0) return [];

  const findings = [];
  const reportedLabels = new Set();

  for (const scriptContent of inlineScripts) {
    if (!scriptContent) continue;

    for (const sinkDef of DOM_SINK_PATTERNS) {
      if (!sinkDef.pattern.test(scriptContent)) continue;
      sinkDef.pattern.lastIndex = 0; // regex'i resetle

      if (reportedLabels.has(sinkDef.label)) continue;
      reportedLabels.add(sinkDef.label);

      findings.push(createFinding({
        category: 'xss-risk',
        title: 'Potential XSS Sink Detected',
        severity: sinkDef.severity,
        confidence: 'low',
        url: pageUrl,
        evidence: `Potentially unsafe DOM manipulation pattern found: ${sinkDef.label}. If user-controlled data reaches this sink without sanitization, XSS may be possible.`,
        recommendation: 'Manual verification required. Review all data passed to DOM manipulation functions. Use textContent instead of innerHTML where possible. This is NOT a confirmed vulnerability.',
      }));
    }
  }

  return findings;
}

/**
 * URL parametrelerini XSS yansıma riski açısından işaretler.
 * @param {Array<{name: string, url: string}>} params
 * @param {string} pageUrl
 * @returns {Object[]} findings
 */
export function detectXssRiskFromParams(params, pageUrl) {
  if (!params || params.length === 0) return [];

  const findings = [];
  // Tüm query parametreler potansiyel reflected XSS noktasıdır
  // Sadece bir tane genel finding üret (spam önlemek için)
  if (params.length > 0) {
    const paramNames = params.map(p => p.name).slice(0, 5).join(', ');
    findings.push(createFinding({
      category: 'xss-risk',
      title: 'URL Parameters May Be Reflected in Page',
      severity: 'info',
      confidence: 'low',
      url: pageUrl,
      evidence: `URL query parameters detected (${paramNames}${params.length > 5 ? ', ...' : ''}). If these are reflected in the page without encoding, reflected XSS may be possible.`,
      recommendation: 'Manual verification required. Check if URL parameters appear in the rendered page. If so, ensure proper output encoding is applied. This is NOT a confirmed vulnerability.',
    }));
  }

  return findings;
}
