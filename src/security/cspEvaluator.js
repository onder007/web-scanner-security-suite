// src/security/cspEvaluator.js
// Google CSP Evaluator kurallarını baz alarak Content-Security-Policy başlığını
// derinlemesine analiz eder; bypass vektörlerini, güvensiz direktifleri ve zafiyetleri raporlar.

import { createFinding } from './findingsModel.js';

/**
 * CSP başlık değerini derinlemesine değerlendirir.
 * @param {string} cspHeader - Raw CSP string
 * @param {string} pageUrl - Hedef URL
 * @returns {Object[]} findings
 */
export function evaluateCspDeep(cspHeader, pageUrl) {
  const findings = [];
  if (!cspHeader || typeof cspHeader !== 'string') return findings;

  const policy = cspHeader.toLowerCase();

  // 1. 'unsafe-inline' Kontrolü
  if (policy.includes("'unsafe-inline'")) {
    findings.push(createFinding({
      category: 'headers',
      title: "CSP Policy Contains 'unsafe-inline' Directive",
      severity: 'medium',
      confidence: 'high',
      url: pageUrl,
      evidence: `Content-Security-Policy includes "'unsafe-inline'". This disables protections against Cross-Site Scripting (XSS) by allowing arbitrary inline script execution.`,
      recommendation: "Replace 'unsafe-inline' with cryptographic nonces (e.g. 'nonce-rAnd0m') or SHA hashes (e.g. 'sha256-...') to safely run required inline scripts."
    }));
  }

  // 2. 'unsafe-eval' Kontrolü
  if (policy.includes("'unsafe-eval'")) {
    findings.push(createFinding({
      category: 'headers',
      title: "CSP Policy Contains 'unsafe-eval' Directive",
      severity: 'low',
      confidence: 'high',
      url: pageUrl,
      evidence: `Content-Security-Policy includes "'unsafe-eval'". This permits string-to-code execution via eval(), setTimeout(), and new Function(), increasing DOM-XSS risks.`,
      recommendation: "Refactor JavaScript code to avoid dynamic evaluation functions and remove 'unsafe-eval' from your policy."
    }));
  }

  // 3. object-src 'none' Eksikliği
  if (!policy.includes('object-src') || (!policy.includes("object-src 'none'") && !policy.includes('object-src: none'))) {
    findings.push(createFinding({
      category: 'headers',
      title: "Missing 'object-src' 'none' Directive in CSP",
      severity: 'low',
      confidence: 'high',
      url: pageUrl,
      evidence: "CSP does not explicitly restrict object-src. Outdated plugins (Flash, Java Applets) could theoretically be loaded if default-src is overly permissive.",
      recommendation: "Add `object-src 'none';` to your Content-Security-Policy."
    }));
  }

  // 4. base-uri Kısıtlaması Eksikliği
  if (!policy.includes('base-uri')) {
    findings.push(createFinding({
      category: 'headers',
      title: "Missing 'base-uri' Restriction in CSP",
      severity: 'low',
      confidence: 'high',
      url: pageUrl,
      evidence: "CSP lacks a 'base-uri' directive. Attackers injecting an HTML `<base href='https://evil.com'>` tag can hijack relative script paths and force the page to load malicious external scripts.",
      recommendation: "Add `base-uri 'self';` or `base-uri 'none';` to your CSP header."
    }));
  }

  // 5. Wildcard (*) Kullanımı
  if (/(?:script-src|default-src)[^;]*\*/.test(policy)) {
    findings.push(createFinding({
      category: 'headers',
      title: 'Overly Permissive Wildcard (*) in CSP Script Directives',
      severity: 'medium',
      confidence: 'high',
      url: pageUrl,
      evidence: "A wildcard (*) was detected in script-src or default-src. This effectively allows scripts to be loaded from any host on the entire internet, defeating the purpose of CSP.",
      recommendation: "Specify explicit trusted domains instead of using wildcards in script-src."
    }));
  }

  return findings;
}
