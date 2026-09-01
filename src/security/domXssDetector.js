import { createFinding } from './findingsModel.js';

const DANGEROUS_SINKS = [
  { name: 'innerHTML', regex: /\.innerHTML\s*=/g, description: 'Assigning data to innerHTML can lead to XSS if the data is user-controlled.' },
  { name: 'document.write()', regex: /document\.write\s*\(/g, description: 'Using document.write() is outdated and dangerous if used with untrusted data.' },
  { name: 'eval()', regex: /\beval\s*\(/g, description: 'Executing strings as code using eval() is highly dangerous.' },
  { name: 'setTimeout/setInterval with string', regex: /(setTimeout|setInterval)\s*\(\s*['"`]/g, description: 'Passing a string instead of a function to setTimeout/setInterval acts like eval().' },
  { name: 'location.href assignment', regex: /location(\.href)?\s*=/g, description: 'Assigning to location.href can lead to Open Redirect or XSS (javascript:).' }
];

const SOURCES = [
  'location.search',
  'location.hash',
  'document.referrer',
  'window.name'
];

/**
 * Sayfadaki inline script'lerde (statik analiz ile) tehlikeli DOM XSS lavabolarını (sinks) arar.
 * Taint analizi basitleştirilmiştir: Aynı kod bloğunda hem tehlikeli kaynak (source) hem de lavabo (sink) varsa uyarır.
 * @param {string[]} inlineScripts - Sayfadaki <script> bloklarının içerikleri
 * @param {string} url - Taranan URL
 * @returns {Array}
 */
export function detectDomXssSinks(inlineScripts, url) {
  const findings = [];
  if (!inlineScripts || inlineScripts.length === 0) return findings;

  inlineScripts.forEach((scriptCode, index) => {
    // 1. Sink (Tehlikeli Fonksiyon) var mı?
    const foundSinks = [];
    for (const sink of DANGEROUS_SINKS) {
      if (sink.regex.test(scriptCode)) {
        foundSinks.push(sink);
      }
    }

    if (foundSinks.length > 0) {
      // 2. Source (Kullanıcı Girdisi Kaynağı) var mı kontrol edelim
      const foundSources = [];
      for (const source of SOURCES) {
        if (scriptCode.includes(source)) {
          foundSources.push(source);
        }
      }

      // Eğer hem source hem sink varsa, XSS riski oldukça yüksektir.
      const isHighRisk = foundSources.length > 0;
      const severity = isHighRisk ? 'high' : 'info';
      const confidence = isHighRisk ? 'medium' : 'low'; // Statik analiz olduğu için kesin diyemeyiz
      
      const sinkNames = foundSinks.map(s => s.name).join(', ');
      
      let evidence = `Inline script #${index + 1} uses dangerous DOM methods/sinks: ${sinkNames}.`;
      if (isHighRisk) {
        evidence += `\nWARNING: The same script also reads from dangerous sources (${foundSources.join(', ')}). This indicates a potential DOM-based XSS vulnerability if the source flows into the sink unprotected.`;
      }

      findings.push(createFinding({
        category: 'DOM XSS Risk',
        title: isHighRisk ? `Potential DOM XSS Vulnerability` : `Usage of Dangerous JS Sinks (${sinkNames})`,
        severity,
        confidence,
        url: url,
        evidence: evidence,
        recommendation: `Avoid using dangerous sinks like innerHTML or eval(). If necessary, ensure all data flowing into them is strictly sanitized using DOMPurify or similar libraries.`
      }));
    }
  });

  return findings;
}
