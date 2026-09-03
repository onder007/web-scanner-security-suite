// src/security/clientStorageDetector.js
// Content script tarafından toplanan localStorage ve sessionStorage
// anahtarlarını/değerlerini inceleyerek JWT token, açık metin parola veya oturum sızıntılarını tespit eder.

import { createFinding } from './findingsModel.js';

// JWT (JSON Web Token) Regex
const JWT_REGEX = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

// Hassas anahtar isimleri
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /auth[-_]?token/i,
  /access[-_]?token/i,
  /refresh[-_]?token/i,
  /bearer/i,
  /api[-_]?key/i,
  /credit[-_]?card/i,
  /session[-_]?id/i
];

/**
 * İstemci tarafı depolama verilerini analiz eder.
 * @param {Object} storageData - { localStorage: Record<string, string>, sessionStorage: Record<string, string> }
 * @param {string} pageUrl - Hedef sayfa URL'si
 * @returns {Object[]} findings
 */
export function analyzeClientStorage(storageData, pageUrl) {
  const findings = [];
  if (!storageData) return findings;

  const { localStorage = {}, sessionStorage = {} } = storageData;

  const checkEntries = (entries, storageType) => {
    for (const [key, val] of Object.entries(entries)) {
      if (!val || typeof val !== 'string') continue;

      // 1. JWT Token Tespiti
      if (val.startsWith('eyJ') && JWT_REGEX.test(val) && val.length > 50) {
        findings.push(createFinding({
          category: 'cookies',
          title: `Sensitive JWT Token Stored in ${storageType}`,
          severity: 'high',
          confidence: 'high',
          url: pageUrl,
          evidence: `Key "${key}" contains an unencrypted JSON Web Token (JWT) in ${storageType}.\nJWTs stored in client-side Web Storage are accessible to any script running on the page, leaving them completely exposed to Cross-Site Scripting (XSS) session hijacking.`,
          recommendation: 'Store sensitive authentication tokens in `HttpOnly; Secure; SameSite=Strict` cookies instead of localStorage/sessionStorage so JavaScript cannot exfiltrate them.'
        }));
      }

      // 2. Açık Metin Parola veya Hassas Anahtar Tespiti
      for (const pattern of SENSITIVE_KEY_PATTERNS) {
        if (pattern.test(key)) {
          // Eğer şifre gibi görünüyorsa
          if (/password|passwd/i.test(key)) {
            findings.push(createFinding({
              category: 'configuration',
              title: `Cleartext Password Key Found in ${storageType}`,
              severity: 'critical',
              confidence: 'high',
              url: pageUrl,
              evidence: `Storage item "${key}" appears to hold plaintext credential information in ${storageType}.`,
              recommendation: 'Never store plaintext user passwords in browser storage.'
            }));
          } else if (!val.startsWith('eyJ')) {
            // Hassas token anahtarı ama JWT değil
            findings.push(createFinding({
              category: 'configuration',
              title: `Sensitive Authentication Key in ${storageType}`,
              severity: 'medium',
              confidence: 'medium',
              url: pageUrl,
              evidence: `Key "${key}" holds potentially sensitive auth state in ${storageType}. Value preview: ${val.substring(0, 15)}...`,
              recommendation: 'Review client storage items to ensure credentials and keys are minimized.'
            }));
          }
          break;
        }
      }
    }
  };

  checkEntries(localStorage, 'localStorage');
  checkEntries(sessionStorage, 'sessionStorage');

  return findings;
}
