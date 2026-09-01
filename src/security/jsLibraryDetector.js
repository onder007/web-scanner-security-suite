// src/security/jsLibraryDetector.js
// Sayfadaki JS kütüphane versiyonlarını tespit eder ve bilinen CVE'lerle karşılaştırır.
// Tamamen pasif — sıfır ek request, sayfa HTML ve script URL'lerinden çalışır.

import { createFinding } from './findingsModel.js';

// ── Bilinen güvenlik açıklı versiyon veritabanı ──────────────────────────────
// Format: { name, detectPatterns, versionPattern, vulnerableRanges, cves, severity }
const LIBRARY_DB = [
  {
    name: 'jQuery',
    urlPatterns: [/jquery[.-](\d+\.\d+\.?\d*)(\.min)?\.js/i, /jquery\/(\d+\.\d+\.?\d*)\//i],
    inlinePatterns: [/jQuery\s+v(\d+\.\d+\.?\d*)/i, /jQuery JavaScript Library v(\d+\.\d+\.?\d*)/i],
    vulnerableRanges: [
      { below: '1.12.0', cves: ['CVE-2015-9251', 'CVE-2012-6708'], severity: 'high', desc: 'XSS via cross-domain Ajax requests' },
      { below: '3.0.0', atLeast: '1.12.0', cves: ['CVE-2019-11358'], severity: 'medium', desc: 'Prototype pollution via $.extend' },
      { below: '3.5.0', atLeast: '3.0.0', cves: ['CVE-2020-11022', 'CVE-2020-11023'], severity: 'medium', desc: 'XSS via HTML parsing' },
    ],
  },
  {
    name: 'Bootstrap',
    urlPatterns: [/bootstrap[.-](\d+\.\d+\.?\d*)(\.min)?\.js/i, /bootstrap\/(\d+\.\d+\.?\d*)\//i],
    inlinePatterns: [/Bootstrap v(\d+\.\d+\.?\d*)/i],
    vulnerableRanges: [
      { below: '3.4.0', cves: ['CVE-2018-14040', 'CVE-2018-14041', 'CVE-2018-14042'], severity: 'medium', desc: 'XSS via data-target, data-content attributes' },
      { below: '4.3.1', atLeast: '4.0.0', cves: ['CVE-2019-8331'], severity: 'medium', desc: 'XSS in tooltip/popover data-template' },
    ],
  },
  {
    name: 'AngularJS',
    urlPatterns: [/angular(?:js)?[.-](\d+\.\d+\.?\d*)(\.min)?\.js/i],
    inlinePatterns: [/AngularJS\s+v(\d+\.\d+\.?\d*)/i],
    vulnerableRanges: [
      { below: '1.8.0', cves: ['CVE-2019-14863', 'CVE-2020-7676'], severity: 'high', desc: 'XSS via ng-attr, ng-style directives' },
      { exact: '1.x', cves: ['EOL-AngularJS'], severity: 'medium', desc: 'AngularJS reached End of Life in December 2021' },
    ],
  },
  {
    name: 'Lodash',
    urlPatterns: [/lodash[.-](\d+\.\d+\.?\d*)(\.min)?\.js/i],
    inlinePatterns: [/Lodash\s+<https:\/\/lodash.com\/>\s+(\d+\.\d+\.?\d*)/i],
    vulnerableRanges: [
      { below: '4.17.21', cves: ['CVE-2021-23337', 'CVE-2020-8203', 'CVE-2019-10744'], severity: 'high', desc: 'Prototype pollution, command injection' },
    ],
  },
  {
    name: 'Moment.js',
    urlPatterns: [/moment[.-](\d+\.\d+\.?\d*)(\.min)?\.js/i],
    inlinePatterns: [/moment\.version\s*=\s*['"](\d+\.\d+\.?\d*)['"]/i],
    vulnerableRanges: [
      { below: '2.29.4', cves: ['CVE-2022-24785', 'CVE-2022-31129'], severity: 'high', desc: 'Path traversal and ReDoS vulnerabilities' },
      { exact: 'any', cves: ['LEGACY'], severity: 'info', desc: 'Moment.js is in maintenance mode. Consider migrating to date-fns or Day.js.' },
    ],
  },
  {
    name: 'Underscore.js',
    urlPatterns: [/underscore[.-](\d+\.\d+\.?\d*)(\.min)?\.js/i],
    vulnerableRanges: [
      { below: '1.13.0', cves: ['CVE-2021-23358'], severity: 'high', desc: 'Arbitrary code execution via template function' },
    ],
  },
  {
    name: 'Handlebars',
    urlPatterns: [/handlebars[.-](\d+\.\d+\.?\d*)(\.min)?\.js/i],
    vulnerableRanges: [
      { below: '4.7.7', cves: ['CVE-2021-23369', 'CVE-2021-23383'], severity: 'critical', desc: 'Prototype pollution leading to RCE' },
    ],
  },
  {
    name: 'Vue.js',
    urlPatterns: [/vue[.-](\d+\.\d+\.?\d*)(\.min)?\.js/i, /vue\/(\d+\.\d+\.?\d*)\//i],
    vulnerableRanges: [
      { below: '2.7.0', atLeast: '2.0.0', cves: ['CVE-2022-23470'], severity: 'low', desc: 'Potential XSS in certain template configurations' },
    ],
  },
];

// ── Sürüm Karşılaştırma ────────────────────────────────────────────────────
function parseVersion(v) {
  return v.split('.').map(n => parseInt(n, 10) || 0);
}

function versionLessThan(v, limit) {
  const a = parseVersion(v);
  const b = parseVersion(limit);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const ai = a[i] || 0, bi = b[i] || 0;
    if (ai < bi) return true;
    if (ai > bi) return false;
  }
  return false; // equal = not less than
}

function versionAtLeast(v, min) {
  return !versionLessThan(v, min);
}

function isVulnerable(version, range) {
  if (range.exact === 'any') return true; // always flag (e.g. deprecated libs)
  if (range.exact === '1.x' && version.startsWith('1.')) return true;
  const belowLimit = range.below ? versionLessThan(version, range.below) : true;
  const aboveMin = range.atLeast ? versionAtLeast(version, range.atLeast) : true;
  return belowLimit && aboveMin;
}

// ── Script URL'lerinden versiyon çıkar ────────────────────────────────────
function extractVersionFromUrl(url, patterns) {
  for (const pattern of patterns) {
    const m = url.match(pattern);
    if (m && m[1]) return m[1];
  }
  return null;
}

// ── Inline script içeriğinden versiyon çıkar ─────────────────────────────
function extractVersionFromInline(scripts, patterns) {
  if (!patterns) return null;
  for (const script of scripts) {
    for (const pattern of patterns) {
      const m = script.match(pattern);
      if (m && m[1]) return m[1];
    }
  }
  return null;
}

// ── Ana Detector ─────────────────────────────────────────────────────────
/**
 * @param {string[]} scriptUrls - Sayfadaki tüm external script URL'leri
 * @param {string[]} inlineScripts - Inline script içerikleri (kısaltılmış)
 * @param {string} pageUrl
 * @returns {Object[]} findings
 */
export function detectVulnerableLibraries(scriptUrls, inlineScripts, pageUrl) {
  const findings = [];
  const detected = new Set(); // aynı kütüphaneyi iki kez raporlama

  for (const lib of LIBRARY_DB) {
    if (detected.has(lib.name)) continue;

    // 1. Script URL'lerinden tespit
    let version = null;
    let sourceUrl = null;

    for (const url of scriptUrls) {
      const v = extractVersionFromUrl(url, lib.urlPatterns);
      if (v) { version = v; sourceUrl = url; break; }
    }

    // 2. Inline script içeriğinden tespit
    if (!version && lib.inlinePatterns) {
      version = extractVersionFromInline(inlineScripts || [], lib.inlinePatterns);
    }

    if (!version) continue;
    detected.add(lib.name);

    // Vulnerable range kontrolü
    for (const range of lib.vulnerableRanges) {
      if (!isVulnerable(version, range)) continue;

      const isEol = range.exact === 'any' || range.exact === '1.x';
      const severity = range.severity;
      const cveList = range.cves.join(', ');

      findings.push(createFinding({
        category: 'configuration',
        title: isEol
          ? `Outdated/Deprecated Library: ${lib.name} v${version}`
          : `Vulnerable JavaScript Library: ${lib.name} v${version}`,
        severity,
        confidence: 'medium',
        url: sourceUrl || pageUrl,
        evidence: `${lib.name} version ${version} detected. ${range.desc}. References: ${cveList}`,
        recommendation: isEol
          ? `Consider migrating from ${lib.name} to a maintained alternative.`
          : `Update ${lib.name} to the latest stable version to patch known vulnerabilities (${cveList}).`,
      }));
      break; // Her kütüphane için en kritik range'i raporla
    }

    // Versiyon bulundu ama vulnerable değilse — info olarak kaydet
    if (!findings.some(f => f.evidence?.includes(lib.name))) {
      findings.push(createFinding({
        category: 'configuration',
        title: `JavaScript Library Detected: ${lib.name} v${version}`,
        severity: 'info',
        confidence: 'medium',
        url: sourceUrl || pageUrl,
        evidence: `${lib.name} v${version} detected. No known critical vulnerabilities for this version.`,
        recommendation: 'Keep libraries updated to the latest stable version.',
      }));
    }
  }

  return findings;
}

/**
 * Script URL'lerini toplar (content script'ten gelen allLinks'den filtrele)
 */
export function filterScriptUrls(allLinks) {
  return allLinks.filter(url => /\.(js)(\?|$)/i.test(url));
}
