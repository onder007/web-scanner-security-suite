import { createFinding } from './findingsModel.js';

const WAF_SIGNATURES = [
  { name: 'Cloudflare', headers: { 'server': 'cloudflare', 'cf-ray': /.*/ }, cookies: ['__cfduid', '__cf_bm'] },
  { name: 'Akamai', headers: { 'server': 'akamai' }, cookies: ['ak_bmsc', 'bm_sv'] },
  { name: 'Imperva / Incapsula', headers: { 'x-iinfo': /.*/, 'x-cdn': 'incapsula' }, cookies: ['incap_ses_', 'visid_incap_'] },
  { name: 'AWS WAF', headers: { 'x-amzn-requestid': /.*/, 'x-amz-cf-id': /.*/ }, cookies: ['awsalbtg', 'awsalbcors'] },
  { name: 'Sucuri', headers: { 'x-sucuri-id': /.*/, 'server': 'sucuri/cloudproxy' }, cookies: ['sucuri_cloudproxy_uuid_'] },
  { name: 'Fastly', headers: { 'fastly-client-ip': /.*/, 'x-fastly-request-id': /.*/ }, cookies: [] }
];

/**
 * Yanıt başlıkları ve çerezlere bakarak WAF (Web Application Firewall) veya CDN kalkanı tespit eder.
 * @param {Headers} responseHeaders 
 * @param {string[]} setCookieValues 
 * @param {string} url 
 * @returns {Array}
 */
export function detectWaf(responseHeaders, setCookieValues, url) {
  const findings = [];
  if (!responseHeaders) return findings;

  for (const waf of WAF_SIGNATURES) {
    let matched = false;
    let evidenceStr = '';

    // Header kontrolü
    for (const [hKey, hVal] of Object.entries(waf.headers)) {
      const headerValue = responseHeaders.get(hKey);
      if (headerValue) {
        if (hVal instanceof RegExp ? hVal.test(headerValue) : headerValue.toLowerCase().includes(hVal.toLowerCase())) {
          matched = true;
          evidenceStr = `Matched header: ${hKey}`;
          break;
        }
      }
    }

    // Cookie kontrolü
    if (!matched && setCookieValues.length > 0) {
      for (const cookie of setCookieValues) {
        for (const wCookie of waf.cookies) {
          if (cookie.includes(wCookie)) {
            matched = true;
            evidenceStr = `Matched cookie: ${wCookie}`;
            break;
          }
        }
      }
    }

    if (matched) {
      findings.push(createFinding({
        category: 'Configuration',
        title: `Security Gateway / WAF Detected: ${waf.name}`,
        severity: 'info',
        confidence: 'high',
        url: url,
        evidence: `The site appears to be protected by ${waf.name}. ${evidenceStr}`,
        recommendation: `Ensure the WAF is configured in blocking mode, not just monitoring mode.`
      }));
      // Sadece 1 WAF bulmamız genelde yeterli (Bazen birden fazla olabilir ama nadirdir).
      break; 
    }
  }

  return findings;
}
