// src/security/sourceMapDetector.js
// Sayfada yüklenen JavaScript dosyalarının kaynak haritalarının (.map)
// sunucuda açık unutulup unutulmadığını pasif/HEAD istekleriyle kontrol eder.

import { createFinding } from './findingsModel.js';

/**
 * Script URL'lerinin .map dosyalarını kontrol eder.
 * @param {string[]} scriptSrcs - Sayfada yüklenen <script src="..."> URL'leri
 * @param {string} pageUrl - Hedef URL
 * @returns {Promise<Object[]>}
 */
export async function detectExposedSourceMaps(scriptSrcs, pageUrl) {
  const findings = [];
  if (!scriptSrcs || scriptSrcs.length === 0) return findings;

  let pageOrigin = '';
  try { pageOrigin = new URL(pageUrl).origin; } catch { return findings; }

  // Yalnızca aynı origin'deki (birinci parti) script'lerin map dosyalarını denetle (üçüncü partileri hariç tut)
  const candidateScripts = scriptSrcs
    .filter(src => {
      try {
        const u = new URL(src);
        return u.origin === pageOrigin && u.pathname.endsWith('.js');
      } catch {
        return false;
      }
    })
    .slice(0, 5); // Aşırı istek atmamak için en fazla ilk 5 ana bundle'ı kontrol et

  for (const src of candidateScripts) {
    const mapUrl = `${src}.map`;
    try {
      const response = await fetch(mapUrl, {
        method: 'HEAD',
        credentials: 'omit',
        signal: AbortSignal.timeout(3500),
      });

      if (response.ok && (response.status === 200 || response.status === 304)) {
        const contentType = response.headers.get('content-type') || '';
        // JSON veya text dönerse ve HTML hata sayfası değilse
        if (!contentType.includes('text/html')) {
          findings.push(createFinding({
            category: 'sensitive-resource',
            title: 'Exposed JavaScript Source Map (.map) Detected',
            severity: 'high',
            confidence: 'high',
            url: mapUrl,
            evidence: `A publicly accessible source map was discovered at "${mapUrl}". Attackers can decompile your minified production bundles back into original unminified TypeScript/React source code, including comments, internal APIs, and logic.`,
            recommendation: 'Do not deploy .map files to production web servers. In your build configuration (Webpack/Vite/Next.js), set `productionSourceMap: false` or restrict public access to .map files at the reverse proxy (Nginx/Cloudflare).'
          }));
          break; // Bir tane bile bulunması zafiyeti kanıtlar, gereksiz istekleri durdur
        }
      }
    } catch {
      // Ağ hatası veya timeout durumunda sessizce geç
    }
  }

  return findings;
}
