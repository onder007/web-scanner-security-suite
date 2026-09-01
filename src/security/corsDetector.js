// src/security/corsDetector.js
// CORS response header'larını analiz eder — aşırı permissive config tespiti.

import { createFinding } from './findingsModel.js';

/**
 * @param {Headers|null} headers
 * @param {string} pageUrl
 * @returns {Object[]}
 */
export function analyzeCors(headers, pageUrl) {
  if (!headers) return [];
  const findings = [];

  const acao = headers.get('access-control-allow-origin');
  const acac = headers.get('access-control-allow-credentials');
  const acam = headers.get('access-control-allow-methods');
  const acah = headers.get('access-control-allow-headers');

  if (!acao) return []; // CORS header yok — sorun değil

  // ── Wildcard + Credentials kombinasyonu (Kritik) ────────────────────────
  if (acao === '*' && acac?.toLowerCase() === 'true') {
    findings.push(createFinding({
      category: 'cors',
      title: 'Critical CORS Misconfiguration: Wildcard with Credentials',
      severity: 'critical',
      confidence: 'high',
      url: pageUrl,
      header: 'access-control-allow-origin',
      evidence: 'Access-Control-Allow-Origin: * combined with Access-Control-Allow-Credentials: true. This combination is rejected by browsers per spec but indicates a severe misconfiguration intent.',
      recommendation: 'Never combine wildcard ACAO with ACAC: true. Specify explicit allowed origins instead.',
    }));
    return findings; // En büyük hatayı bulduk, daha fazla kontrol gereksiz
  }

  // ── Wildcard Origin ─────────────────────────────────────────────────────
  if (acao === '*') {
    findings.push(createFinding({
      category: 'cors',
      title: 'Overly Permissive CORS: Wildcard Origin Allowed',
      severity: 'medium',
      confidence: 'high',
      url: pageUrl,
      header: 'access-control-allow-origin',
      evidence: 'Access-Control-Allow-Origin: * allows any website to make cross-origin requests to this resource. Acceptable for public APIs, but risky for authenticated endpoints.',
      recommendation: 'If this endpoint serves authenticated users, replace "*" with an explicit allowlist of trusted origins.',
    }));
  }

  // ── Credentials allowed (non-wildcard) ──────────────────────────────────
  if (acao !== '*' && acac?.toLowerCase() === 'true') {
    findings.push(createFinding({
      category: 'cors',
      title: 'CORS Credentials Allowed — Verify Origin Validation',
      severity: 'low',
      confidence: 'low',
      url: pageUrl,
      header: 'access-control-allow-credentials',
      evidence: `Access-Control-Allow-Credentials: true with origin "${acao}". If the origin is dynamically reflected from the request without validation, this could allow credential theft from trusted origins.`,
      recommendation: 'Ensure allowed origins are validated against a strict allowlist, not dynamically reflected from the request Origin header.',
    }));
  }

  // ── Dangerous methods allowed ────────────────────────────────────────────
  if (acam) {
    const methods = acam.split(',').map(m => m.trim().toUpperCase());
    const dangerous = methods.filter(m => ['PUT', 'DELETE', 'PATCH'].includes(m));
    if (dangerous.length > 0) {
      findings.push(createFinding({
        category: 'cors',
        title: `CORS Allows Potentially Dangerous HTTP Methods: ${dangerous.join(', ')}`,
        severity: 'low',
        confidence: 'medium',
        url: pageUrl,
        header: 'access-control-allow-methods',
        evidence: `Access-Control-Allow-Methods includes: ${dangerous.join(', ')}. If combined with a permissive origin policy, these methods could be exploited.`,
        recommendation: 'Restrict allowed methods to only those required for the API endpoint.',
      }));
    }
  }

  return findings;
}
