import { createFinding } from './findingsModel.js';

const TECH_SIGNATURES = [
  { name: 'React', type: 'Frontend Framework', domCheck: (html) => html.includes('data-reactroot') || html.includes('id="root"') || html.includes('_reactRootContainer') },
  { name: 'Vue.js', type: 'Frontend Framework', domCheck: (html) => html.includes('data-v-') || html.includes('__VUE__') },
  { name: 'Angular', type: 'Frontend Framework', domCheck: (html) => html.includes('ng-version') || html.includes('ng-app') },
  { name: 'Next.js', type: 'Fullstack Framework', domCheck: (html) => html.includes('__NEXT_DATA__') || html.includes('/_next/') },
  { name: 'Nuxt.js', type: 'Fullstack Framework', domCheck: (html) => html.includes('window.__NUXT__') || html.includes('/_nuxt/') },
  { name: 'WordPress', type: 'CMS', domCheck: (html) => html.includes('/wp-content/') || html.includes('name="generator" content="WordPress') },
  { name: 'Shopify', type: 'E-commerce', domCheck: (html) => html.includes('window.Shopify') || html.includes('cdn.shopify.com') },
  { name: 'Laravel', type: 'Backend Framework', domCheck: (html) => html.includes('name="csrf-token"') && html.includes('laravel') }
];

/**
 * Sayfanın kaynak kodunu analiz ederek arka plandaki teknolojiyi çıkarır.
 * @param {string} htmlContent - Sayfanın ham HTML'i
 * @param {Headers} responseHeaders - Yanıt başlıkları (X-Powered-By kontrolü için)
 * @param {string} url - Taranan URL
 * @returns {Array}
 */
export function detectTechStack(htmlContent, responseHeaders, url) {
  const findings = [];
  const detectedTech = [];

  // 1. Header analizi
  if (responseHeaders) {
    const poweredBy = responseHeaders.get('x-powered-by');
    if (poweredBy) {
      detectedTech.push(poweredBy);
    }
    const server = responseHeaders.get('server');
    if (server && !server.toLowerCase().includes('cloudflare')) {
      detectedTech.push(`Server: ${server}`);
    }
  }

  // 2. DOM analizi
  if (htmlContent) {
    for (const tech of TECH_SIGNATURES) {
      if (tech.domCheck(htmlContent)) {
        detectedTech.push(`${tech.name} (${tech.type})`);
      }
    }
  }

  if (detectedTech.length > 0) {
    // Aynı teknolojiyi tekrar eklememek için eşsiz yapalım
    const uniqueTech = [...new Set(detectedTech)];
    
    findings.push(createFinding({
      category: 'Configuration',
      title: `Technology Stack Identified`,
      severity: 'info',
      confidence: 'high',
      url: url,
      evidence: `The following technologies were detected through passive fingerprinting:\n- ${uniqueTech.join('\n- ')}`,
      recommendation: `Ensure all detected software (frameworks, servers, CMS) are kept up-to-date with the latest security patches.`
    }));
  }

  return findings;
}
