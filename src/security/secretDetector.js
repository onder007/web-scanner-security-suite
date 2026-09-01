import { createFinding } from './findingsModel.js';

const SECRET_PATTERNS = [
  { name: 'AWS Access Key ID', regex: /\b(AKIA[0-9A-Z]{16})\b/g },
  { name: 'Stripe Secret Key', regex: /\b(sk_(test|live)_[0-9a-zA-Z]{24,34})\b/g },
  { name: 'Stripe Restricted Key', regex: /\b(rk_(test|live)_[0-9a-zA-Z]{24,34})\b/g },
  { name: 'Google API Key', regex: /\b(AIza[0-9A-Za-z\-_]{35})\b/g },
  { name: 'GitHub Personal Access Token', regex: /\b(ghp_[a-zA-Z0-9]{36})\b/g },
  { name: 'GitHub OAuth Access Token', regex: /\b(gho_[a-zA-Z0-9]{36})\b/g },
  { name: 'Slack Bot Token', regex: /\b(xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24})\b/g },
  { name: 'Slack Webhook', regex: /\b(https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8}\/B[a-zA-Z0-9_]{8}\/[a-zA-Z0-9_]{24})\b/g },
  { name: 'Mailchimp API Key', regex: /\b([0-9a-f]{32}-us[0-9]{1,2})\b/g },
  { name: 'JSON Web Token (JWT)', regex: /\b(ey[a-zA-Z0-9_-]+\.ey[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\b/g }
];

/**
 * Sayfa içeriğinde gizli token/anahtar sızıntılarını arar.
 * @param {string} htmlContent - Sayfanın ham HTML'i
 * @param {string} url - Taranan URL
 * @returns {Array} - Bulgular dizisi
 */
export function detectSecrets(htmlContent, url) {
  const findings = [];
  if (!htmlContent) return findings;

  for (const pattern of SECRET_PATTERNS) {
    const matches = htmlContent.match(pattern.regex) || [];
    const uniqueMatches = [...new Set(matches)];

    if (uniqueMatches.length > 0) {
      const displayMatches = uniqueMatches.slice(0, 3);
      const isJwt = pattern.name.includes('JWT');
      const isGoogle = pattern.name.includes('Google API');
      
      // Google API keys and JWTs are often safely exposed in client side, so confidence/severity is lower.
      const severity = isJwt ? 'info' : (isGoogle ? 'low' : 'high');
      const confidence = (isJwt || isGoogle) ? 'low' : 'medium';

      findings.push(createFinding({
        category: 'Sensitive Resources',
        title: `Potential Secret Leakage: ${pattern.name}`,
        severity,
        confidence,
        url: url,
        evidence: `Found ${uniqueMatches.length} instance(s) matching ${pattern.name} in the page source.\nExamples:\n- ${displayMatches.join('\n- ')}`,
        recommendation: `Verify if these tokens are meant to be public. If sensitive, rotate the tokens immediately and remove them from client-side code.`
      }));
    }
  }

  return findings;
}
