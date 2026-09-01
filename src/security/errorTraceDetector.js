import { createFinding } from './findingsModel.js';

const ERROR_SIGNATURES = [
  { name: 'SQL Syntax Error (MySQL)', regex: /You have an error in your SQL syntax; check the manual that corresponds to your MySQL/i },
  { name: 'SQL Error (PostgreSQL)', regex: /PostgreSQL query failed: ERROR:/i },
  { name: 'SQL Error (SQL Server)', regex: /Unclosed quotation mark after the character string/i },
  { name: 'PHP Error (Warning/Fatal)', regex: /<b>(Warning|Fatal error|Notice)<\/b>: .* in <b>.*<\/b> on line <b>\d+<\/b>/i },
  { name: 'Python/Django Debug Trace', regex: /Django Version:[\s\S]*Exception Type:[\s\S]*Exception Value:/i },
  { name: 'Laravel Ignition Debug Page', regex: /<title>Error[\s\S]*Facade[\s\S]*Ignition/i },
  { name: 'Java Stack Trace', regex: /Exception in thread ".*" java\..*Exception:/i },
  { name: 'ASP.NET Error Trace', regex: /Server Error in '\/' Application./i }
];

/**
 * Yanıt gövdesinde (HTML) sızan veritabanı veya uygulama hata izlerini arar.
 * @param {string} htmlContent - Sayfanın ham HTML'i
 * @param {string} url - Taranan URL
 * @returns {Array}
 */
export function detectErrorTraces(htmlContent, url) {
  const findings = [];
  if (!htmlContent) return findings;

  for (const sig of ERROR_SIGNATURES) {
    if (sig.regex.test(htmlContent)) {
      findings.push(createFinding({
        category: 'Information Disclosure',
        title: `Error Trace Leakage: ${sig.name}`,
        severity: 'high', // Hata sızıntıları her zaman yüksek risklidir (özellikle SQL).
        confidence: 'high',
        url: url,
        evidence: `Detected an error trace matching "${sig.name}" in the HTTP response body. This indicates the server is exposing internal application errors to users.`,
        recommendation: `Disable verbose error reporting in production. Configure the application to log errors internally and display generic error pages to users.`
      }));
    }
  }

  return findings;
}
