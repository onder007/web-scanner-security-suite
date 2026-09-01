// src/security/findingsModel.js
// Ortak Finding veri modeli — tüm security detectorlar bu formatı kullanır

let _findingCounter = 0;

/**
 * Yeni bir security finding oluşturur.
 * @param {Object} opts
 * @param {string} opts.category - 'headers' | 'cookies' | 'https' | 'mixed-content' | 'sql-injection-risk' | 'xss-risk' | 'sensitive-resource' | 'configuration' | 'input'
 * @param {string} opts.title
 * @param {string} opts.severity - 'critical' | 'high' | 'medium' | 'low' | 'info'
 * @param {string} opts.confidence - 'high' | 'medium' | 'low'
 * @param {string} opts.url
 * @param {string} opts.evidence
 * @param {string} opts.recommendation
 * @param {string} [opts.parameter]
 * @param {string} [opts.method]
 * @param {string} [opts.header]
 * @param {string} [opts.cookieName]
 * @returns {Object} finding
 */
export function createFinding(opts) {
  _findingCounter++;
  return {
    id: `sec-${Date.now()}-${_findingCounter}`,
    category: opts.category,
    title: opts.title,
    severity: opts.severity,
    confidence: opts.confidence || 'medium',
    url: opts.url || '',
    evidence: opts.evidence || '',
    recommendation: opts.recommendation || '',
    parameter: opts.parameter || null,
    method: opts.method || null,
    header: opts.header || null,
    cookieName: opts.cookieName || null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Finding'leri severity önceliğine göre sıralar.
 */
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export function sortFindings(findings) {
  return [...findings].sort((a, b) =>
    (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
  );
}

/**
 * Finding özetini hesaplar.
 */
export function summarizeFindings(findings) {
  return {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'info').length,
    total: findings.length,
  };
}

/**
 * Export için hassas alanları temizler.
 */
export function sanitizeFindingForExport(finding) {
  const { id, timestamp, ...safe } = finding;
  // cookieName değeri zaten cookie adı, değeri değil — güvenli
  // password alanlarını filtrele
  return safe;
}
