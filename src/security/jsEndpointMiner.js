// src/security/jsEndpointMiner.js
// Sayfada yüklenen inline ve harici JavaScript kodlarını derinlemesine tarayarak
// gizli API rotalarını, Swagger/OpenAPI şemalarını, dahili endpoint'leri ve GraphQL yollarını keşfeder.

import { createFinding } from './findingsModel.js';

// Yakalanmak istenen gizli/dahili rota kalıpları
const ENDPOINT_PATTERNS = [
  /(?:["'`])(\/(?:api|v[0-9]|internal|admin|private|graphql|auth|oauth|user|users|webhook|dashboard|management|swagger|openapi)[a-zA-Z0-9_\-\/\.\?\=\&\%]+)(?:["'`])/gi,
  /(?:["'`])(https?:\/\/[a-zA-Z0-9_\-\.]+\/(?:api|v[0-9]|internal|graphql|admin)[a-zA-Z0-9_\-\/\.\?\=\&\%]+)(?:["'`])/gi
];

// Swagger / OpenAPI özel göstergeleri
const SWAGGER_PATTERNS = [
  /\/swagger(?:-ui)?\.(?:json|html|yaml)/i,
  /\/api-docs(?:\.json)?/i,
  /\/v[0-9]\/api-docs/i,
  /\/openapi\.(?:json|yaml)/i
];

/**
 * Script içeriklerinden gizli endpoint ve API rotalarını çıkarır.
 * @param {string[]} scriptContents - Sayfadaki inline veya fetch edilmiş script metinleri
 * @param {string} pageUrl - Hedef URL
 * @returns {Object[]} findings
 */
export function mineEndpointsFromScripts(scriptContents, pageUrl) {
  const findings = [];
  if (!scriptContents || scriptContents.length === 0) return findings;

  const discoveredEndpoints = new Set();
  const swaggerEndpoints = new Set();
  const graphqlEndpoints = new Set();
  const adminEndpoints = new Set();

  for (const code of scriptContents) {
    if (!code || typeof code !== 'string') continue;

    // 1. Standart Rota Taraması
    for (const regex of ENDPOINT_PATTERNS) {
      let match;
      const re = new RegExp(regex.source, regex.flags);
      while ((match = re.exec(code)) !== null) {
        const ep = match[1];
        // Resim/stil/font gibi statik dosyaları ele
        if (/\.(png|jpg|jpeg|gif|svg|webp|css|woff2?|ttf|eot)$/i.test(ep)) continue;
        // Çok kısa veya gürültülü yolları ele
        if (ep.length < 5 || ep.length > 120) continue;

        discoveredEndpoints.add(ep);

        if (SWAGGER_PATTERNS.some(p => p.test(ep))) {
          swaggerEndpoints.add(ep);
        } else if (/graphql/i.test(ep)) {
          graphqlEndpoints.add(ep);
        } else if (/\/(admin|management|internal|private)\b/i.test(ep)) {
          adminEndpoints.add(ep);
        }
      }
    }
  }

  // Swagger / OpenAPI ifşası varsa HIGH
  if (swaggerEndpoints.size > 0) {
    findings.push(createFinding({
      category: 'sensitive-resource',
      title: 'OpenAPI / Swagger Documentation Endpoint Disclosed in JS',
      severity: 'high',
      confidence: 'high',
      url: pageUrl,
      evidence: `JavaScript bundles disclose public API schema locations:\n${Array.from(swaggerEndpoints).slice(0, 5).map(e => `  • ${e}`).join('\n')}`,
      recommendation: 'Ensure API documentation is restricted to authorized developers. Publicly exposed schemas allow attackers to easily map all backend attack surfaces.'
    }));
  }

  // Dahili/Yönetim endpoint'leri ifşa olduysa MEDIUM
  if (adminEndpoints.size > 0) {
    findings.push(createFinding({
      category: 'sensitive-resource',
      title: 'Internal / Administrative Endpoints Disclosed in Client JS',
      severity: 'medium',
      confidence: 'medium',
      url: pageUrl,
      evidence: `Client-side scripts contain references to restricted routes:\n${Array.from(adminEndpoints).slice(0, 8).map(e => `  • ${e}`).join('\n')}`,
      recommendation: 'Verify that all administrative endpoints enforce robust server-side authentication and role-based access control (RBAC).'
    }));
  }

  // GraphQL Endpoint tespiti (INFO)
  if (graphqlEndpoints.size > 0) {
    findings.push(createFinding({
      category: 'configuration',
      title: 'GraphQL API Endpoint Disclosed',
      severity: 'info',
      confidence: 'high',
      url: pageUrl,
      evidence: `GraphQL endpoints referenced in scripts:\n${Array.from(graphqlEndpoints).slice(0, 3).map(e => `  • ${e}`).join('\n')}`,
      recommendation: 'Ensure GraphQL Introspection is disabled in production to prevent complete schema extraction.'
    }));
  }

  // Genel API Yüzeyi Özeti (INFO / Keşif)
  if (discoveredEndpoints.size > 0) {
    const epList = Array.from(discoveredEndpoints).slice(0, 15);
    findings.push(createFinding({
      category: 'configuration',
      title: `Discovered Hidden API Attack Surface (${discoveredEndpoints.size} Endpoints Found)`,
      severity: 'info',
      confidence: 'high',
      url: pageUrl,
      evidence: `Passive extraction from client-side JS bundles identified ${discoveredEndpoints.size} endpoints. Sample:\n${epList.map(e => `  • ${e}`).join('\n')}`,
      recommendation: 'Regularly audit client-side JavaScript bundles to prevent unintentional leakage of backend routing structures.'
    }));
  }

  return findings;
}
