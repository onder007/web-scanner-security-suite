// src/security/postMessageDetector.js
// Sayfadaki JavaScript kodlarında window.addEventListener('message', ...) kullanımlarını
// tarayarak event.origin kontrolünün eksik olup olmadığını (Cross-Window Message Hijacking) denetler.

import { createFinding } from './findingsModel.js';

/**
 * Script kodları içindeki postMessage dinleyicilerini statik olarak inceler.
 * @param {string[]} scriptContents - Sayfadaki script metinleri
 * @param {string} pageUrl - Hedef URL
 * @returns {Object[]} findings
 */
export function analyzePostMessageSecurity(scriptContents, pageUrl) {
  const findings = [];
  if (!scriptContents || scriptContents.length === 0) return findings;

  const listenerRegex = /(?:window\.)?addEventListener\s*\(\s*['"]message['"]/gi;

  for (const code of scriptContents) {
    if (!code || typeof code !== 'string') continue;

    let match;
    while ((match = listenerRegex.exec(code)) !== null) {
      // Dinleyicinin takip eden 500 karakterlik gövdesini al
      const handlerSnippet = code.substring(match.index, match.index + 500);

      // Gövdede origin kontrolü yapılıyor mu?
      // örn: .origin, origin ===, origin !==, origin.includes
      const hasOriginCheck = /\.origin\b|event\.origin|e\.origin/i.test(handlerSnippet);

      if (!hasOriginCheck) {
        findings.push(createFinding({
          category: 'xss-risk',
          title: 'Unsafe PostMessage Listener (Missing Origin Verification)',
          severity: 'high',
          confidence: 'medium',
          url: pageUrl,
          evidence: `A "message" event listener was detected that does not appear to validate "event.origin":\n${handlerSnippet.substring(0, 150)}...`,
          recommendation: 'Always verify `event.origin` in postMessage handlers before processing data or invoking DOM sinks. Example: `if (event.origin !== "https://trusted.com") return;`'
        }));
        break; // Bir scriptte bir açık bulunması yeterli
      }
    }
  }

  return findings;
}
