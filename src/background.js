// background.js - Chrome Extension Service Worker
import { analyzeSecurityHeaders } from './security/headerDetector.js';
import { analyzeCookies } from './security/cookieDetector.js';
import { detectMixedContent } from './security/mixedContentDetector.js';
import { detectSensitiveResources, detectBrokenLinkHijacking } from './security/sensitiveResourceDetector.js';
import {
  detectSqliRiskFromParams,
  detectSqliRiskFromForms,
  detectXssRiskFromScripts,
  detectXssRiskFromParams,
} from './security/passiveInputDetector.js';
import { createFinding, sortFindings, summarizeFindings } from './security/findingsModel.js';
// ── New Detector Imports ──────────────────────────────────────────────────────
import { detectVulnerableLibraries, filterScriptUrls } from './security/jsLibraryDetector.js';
import { detectHeaderDisclosure, detectMetaDisclosure, detectDnsPrefetchLeakage } from './security/infoDisclosureDetector.js';
import { analyzeCors } from './security/corsDetector.js';
import { detectMissingSri } from './security/sriDetector.js';
import { detectTabnapping } from './security/tabnappingDetector.js';
import { detectOpenRedirect, detectOpenRedirectInForms } from './security/openRedirectDetector.js';
import { analyzeFormSecurity } from './security/formSecurityDetector.js';
import { analyzeRobotsTxt, checkSecurityTxt, checkHttpToHttpsRedirect } from './security/robotsTxtAnalyzer.js';
// ── Advanced Enterprise Detectors ─────────────────────────────────────────────
import { detectSecrets } from './security/secretDetector.js';
import { detectWaf } from './security/wafDetector.js';
import { detectTechStack } from './security/techStackDetector.js';
import { detectErrorTraces } from './security/errorTraceDetector.js';
import { detectDomXssSinks } from './security/domXssDetector.js';
import { saveScanToHistory } from './storage/historyDb.js';


let activeScan = null;
let isPaused = false;
let isStopped = false;

// ── Global Security Settings ────────────────────────────────────────────────
let securitySettings = {
  autoScanEnabled: false,
  enableDomXss: true,
  enableSecrets: true,
  enableWaf: true,
  enableTechStack: true,
  enableErrorTrace: true
};

chrome.storage.sync.get(['securitySettings'], (result) => {
  if (result.securitySettings) {
    securitySettings = result.securitySettings;
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.securitySettings?.newValue) {
    securitySettings = changes.securitySettings.newValue;
  }
});

// ── Auto-Scan Listener ──────────────────────────────────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (securitySettings.autoScanEnabled && changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    // Run a silent background scan for the badge
    startSecurityScan(tabId, tab.url, true);
  }
});


let stats = {
  totalUrls: 0,
  scannedUrls: 0,
  error404: 0,
  error500: 0,
  redirects: 0,
  successes: 0,
};

let queue = [];
let activeCount = 0;
let visited = new Set();
let results = [];
let options = {};
let baseUrl = '';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start_scan') {
    startScan(request.url, request.options);
    sendResponse({ status: 'started' });
  } else if (request.action === 'pause_scan') {
    isPaused = true;
    sendLog('Crawling paused', 'warning');
    sendResponse({ status: 'paused' });
  } else if (request.action === 'resume_scan') {
    isPaused = false;
    sendLog('Crawling resumed', 'success');
    processQueue();
    sendResponse({ status: 'running' });
  } else if (request.action === 'stop_scan') {
    isStopped = true;
    sendLog('Crawling stopped by user', 'error');
    sendResponse({ status: 'stopped' });
  } else if (request.action === 'get_state') {
    sendResponse({
      status: isStopped ? 'stopped' : isPaused ? 'paused' : activeScan ? 'running' : 'idle',
      stats,
      results
    });
  }
  return true;
});

function sendLog(message, type = 'info') {
  chrome.runtime.sendMessage({
    event: 'log',
    data: { message, type, timestamp: new Date().toISOString() }
  }).catch(() => {}); // Ignore error if popup is closed
}

function emitStats() {
  chrome.runtime.sendMessage({
    event: 'stats',
    data: stats
  }).catch(() => {});
}

function emitResult(result) {
  chrome.runtime.sendMessage({
    event: 'result',
    data: result
  }).catch(() => {});
}

async function startScan(startUrl, userOptions) {
  if (activeScan) {
    sendLog('A scan is already running.', 'warning');
    return;
  }
  
  if (!startUrl.startsWith('http://') && !startUrl.startsWith('https://')) {
    startUrl = 'https://' + startUrl;
  }

  options = userOptions;
  isPaused = false;
  isStopped = false;
  activeScan = true;
  queue = [];
  visited.clear();
  results = [];
  stats = { totalUrls: 0, scannedUrls: 0, error404: 0, error500: 0, redirects: 0, successes: 0 };
  
  chrome.runtime.sendMessage({ event: 'scan_started' }).catch(() => {});
  sendLog('Scan started...', 'info');

  try {
    const urlObj = new URL(startUrl);
    baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    enqueue(startUrl, 'User Input');
    processQueue();
  } catch (e) {
    sendLog(`Invalid URL: ${e.message}`, 'error');
    activeScan = false;
  }
}

function enqueue(urlStr, referer = null) {
  try {
    const urlObj = new URL(urlStr, baseUrl);
    urlObj.hash = '';
    const cleanUrl = urlObj.toString();

    if (visited.has(cleanUrl)) return;
    if (cleanUrl.startsWith('mailto:') || cleanUrl.startsWith('tel:') || cleanUrl.startsWith('javascript:')) return;
    
    if (urlObj.host !== new URL(baseUrl).host) return; // Only internal links

    if (options.excludeFolders && options.excludeFolders.length > 0) {
      for (const folder of options.excludeFolders) {
        if (cleanUrl.includes(folder)) return;
      }
    }

    visited.add(cleanUrl);
    stats.totalUrls++;
    queue.push({ url: cleanUrl, referer });
    emitStats();
  } catch (e) {
    // Invalid URL
  }
}

async function processQueue() {
  if (isStopped) {
    activeScan = false;
    chrome.runtime.sendMessage({ event: 'scan_finished', data: { ...stats, status: 'stopped' } }).catch(() => {});
    return;
  }

  if (isPaused) {
    setTimeout(processQueue, 1000);
    return;
  }

  if (queue.length === 0 && activeCount === 0) {
    sendLog('Crawl finished', 'success');
    activeScan = false;
    chrome.runtime.sendMessage({ event: 'scan_finished', data: { ...stats, status: 'completed' } }).catch(() => {});
    return;
  }

  while (activeCount < options.maxConcurrency && queue.length > 0) {
    const item = queue.shift();
    activeCount++;
    crawlPage(item).finally(() => {
      activeCount--;
      processQueue();
    });
  }
}

async function crawlPage({ url, referer }) {
  if (isStopped) return;
  const startTime = Date.now();
  let result = { url, referer, statusCode: null, statusText: '', responseTime: 0, contentType: '', redirectDestination: null };

  try {
    if (options.delay > 0) {
      await new Promise(res => setTimeout(res, options.delay));
    }

    // Chrome Extensions can use fetch and bypass CORS if host_permissions allow it.
    // 'redirect: "manual"' allows us to catch 301/302.
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': options.userAgent },
      redirect: 'manual'
    });

    result.responseTime = Date.now() - startTime;
    result.statusCode = response.status;
    result.statusText = response.statusText || '';
    result.contentType = response.headers.get('content-type') || '';

    // Handle redirects (fetch manual mode sets type='opaqueredirect' and status 0, but if host_permissions match it might expose headers)
    if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
      result.redirectDestination = new URL(response.headers.get('location'), url).toString();
      stats.redirects++;
      sendLog(`Redirect ${response.status}: ${url} -> ${result.redirectDestination}`, 'warning');
      enqueue(result.redirectDestination, url);
    } 
    // fetch with manual redirect returns status 0 if it's an opaque redirect
    else if (response.type === 'opaqueredirect') {
      result.statusCode = 302;
      stats.redirects++;
      sendLog(`Opaque Redirect: ${url} (cannot read destination)`, 'warning');
    }
    else if (response.status === 200) {
      stats.successes++;
      sendLog(`✓ [200] ${url}`, 'success');
      
      if (result.contentType.includes('text/html')) {
        const text = await response.text();
        extractLinksFromHtml(text, url);
      }
    } else if (response.status === 404) {
      stats.error404++;
      sendLog(`✗ [404] Not Found: ${url}`, 'error');
    } else if (response.status >= 500) {
      stats.error500++;
      sendLog(`✗ [${response.status}] Server Error: ${url}`, 'error');
    } else {
      sendLog(`[${response.status}] ${url}`, 'info');
    }
  } catch (error) {
    result.responseTime = Date.now() - startTime;
    result.statusCode = 500;
    result.statusText = error.message;
    stats.error500++;
    sendLog(`✗ [Error] ${url}: ${error.message}`, 'error');
  }

  stats.scannedUrls++;
  results.push(result);
  emitResult(result);
  emitStats();
}

function extractLinksFromHtml(html, sourceUrl) {
  // Regex to match href, src attributes roughly
  const linkRegex = /(?:href|src)=["']([^"']+)["']/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const link = match[1];
    enqueue(link, sourceUrl);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY SCANNER — Passive Security Assessment Module
// Mevcut Dead Link Scanner koduna dokunulmamıştır.
// ─────────────────────────────────────────────────────────────────────────────


// ── Security Scanner State ────────────────────────────────────────────────────
let secIsRunning = false;
let secIsStopped = false;
let secFindings = [];
let secStats = {
  urlsAnalyzed: 0,
  paramsFound: 0,
  formsFound: 0,
  headersChecked: 0,
  cookiesChecked: 0,
  mixedContent: 0,
  findingsCount: 0,
};

// ── Security Message Handler (mevcut handler'a ek olarak) ────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start_security_scan') {
    startSecurityScan(request.tabId, request.url);
    sendResponse({ status: 'started' });
    return true;
  }
  if (request.action === 'stop_security_scan') {
    secIsStopped = true;
    secIsRunning = false;
    emitSecurityEvent('security_scan_finished', {
      status: 'cancelled',
      stats: secStats,
      summary: summarizeFindings(secFindings),
    });
    sendResponse({ status: 'stopped' });
    return true;
  }
  if (request.action === 'get_security_state') {
    sendResponse({
      isRunning: secIsRunning,
      findings: sortFindings(secFindings),
      stats: secStats,
      summary: summarizeFindings(secFindings),
    });
    return true;
  }
  // Content script'ten DOM verisi geldi
  if (request.event === 'security_dom_data') {
    // Bu mesaj content script'ten gelir, security scan akışında işlenir
    // (processDomData aracılığıyla zaten handle ediliyor)
    return false;
  }
});

// ── Emit Helpers ──────────────────────────────────────────────────────────────
function finishSecurityScan(status) {
  secIsRunning = false;
  secIsStopped = false;
  
  const currentSummary = summarizeFindings(secFindings);

  if (!secIsSilent && status === 'completed') {
    // Only save manual completed scans to history
    saveScanToHistory(pageUrlGlobal, secStats, currentSummary, secFindings);
  }

  if (!secIsSilent) {
    emitSecurityEvent('security_scan_completed', {
      status,
      stats: secStats,
      summary: currentSummary,
    });
  }
  
  // Update badge if silent or manual
  updateBadge();
}

let pageUrlGlobal = '';

function updateBadge() {
  const summary = summarizeFindings(secFindings);
  let text = '';
  let color = '#94a3b8'; // default gray

  if (summary.critical > 0) {
    text = summary.critical.toString();
    color = '#ef4444'; // red
  } else if (summary.high > 0) {
    text = summary.high.toString();
    color = '#f97316'; // orange
  } else if (summary.medium > 0) {
    text = summary.medium.toString();
    color = '#f59e0b'; // yellow
  } else if (summary.low > 0 || summary.info > 0) {
    text = '✓';
    color = '#10b981'; // green
  }

  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

function emitSecurityFinding(finding, isSilent = false) {
  secFindings.push(finding);
  secFindings = sortFindings(secFindings);
  secStats.findingsCount = secFindings.length;
  if (!secIsSilent && !isSilent) {
    emitSecurityEvent('security_finding_added', finding);
    emitSecurityStats();
  }
}

function emitSecurityLog(message, type = 'info') {
  emitSecurityEvent('security_log', {
    message,
    type,
    timestamp: new Date().toISOString(),
  });
}

function emitSecurityStats() {
  emitSecurityEvent('security_stats', { stats: secStats });
}

// ── Main Security Scan Orchestrator ──────────────────────────────────────────
async function startSecurityScan(tabId, pageUrlHint, isSilent = false) {
  if (secIsRunning && !isSilent) {
    emitSecurityLog('A security scan is already running.', 'warning');
    return;
  }

  // If silent scan but already running a manual scan on the same tab, skip
  if (isSilent && secIsRunning) return;

  secIsRunning = true;
  secIsStopped = false;
  secFindings = [];
  secStats = {
    urlsAnalyzed: 0,
    paramsFound: 0,
    formsFound: 0,
    headersChecked: 0,
    cookiesChecked: 0,
    mixedContent: 0,
    findingsCount: 0,
  };

  if (!isSilent) {
    emitSecurityEvent('security_scan_started', {});
    emitSecurityLog('Security scan initializing...', 'info');
  }

  // URL'yi chrome.tabs.get'ten al (tabs permission ile güvenilir)
  let pageUrl = pageUrlHint || '';
  if (tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab && tab.url && tab.url.startsWith('http')) {
        pageUrl = tab.url;
      }
    } catch (tabErr) {
      emitSecurityLog(`Could not get tab info: ${tabErr.message}`, 'warning');
    }
  }
  
  pageUrlGlobal = pageUrl;

  // Hâlâ URL yoksa hata ver
  if (!pageUrl || (!pageUrl.startsWith('http://') && !pageUrl.startsWith('https://'))) {
    emitSecurityLog(`Cannot scan: invalid or missing URL "${pageUrl}". Navigate to an http/https page first.`, 'error');
    finishSecurityScan('error');
    return;
  }

  emitSecurityLog(`Target: ${pageUrl}`, 'info');

  try {
    let pageOrigin = '';
    try { pageOrigin = new URL(pageUrl).origin; } catch {}
    const isHttps = pageUrl.startsWith('https://');

    // ── Step 1: HTTPS Kontrolü ──────────────────────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    emitSecurityLog('Checking HTTPS...', 'info');

    if (!isHttps) {
      emitSecurityFinding(createFinding({
        category: 'https',
        title: 'HTTPS Not Enabled',
        severity: 'medium',
        confidence: 'high',
        url: pageUrl,
        evidence: 'The page is served over HTTP. Data transmitted between the browser and server is not encrypted.',
        recommendation: 'Enable HTTPS using a valid TLS certificate. Consider redirecting all HTTP traffic to HTTPS and enabling HSTS.',
      }));
    }

    // ── Step 2: Sayfayı Fetch Et — Header + Cookie + HTML Analizi ──────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    emitSecurityLog(`Fetching page for header and content analysis: ${pageUrl}`, 'info');

    let responseHeaders = null;
    let setCookieValues = [];
    let htmlContent = '';

    try {
      const response = await fetch(pageUrl, {
        method: 'GET',
        credentials: 'omit', // Cookie'leri request'e ekleme
        redirect: 'follow',
      });

      responseHeaders = response.headers;

      // Set-Cookie header'larını topla (değerleri değil, sadece yapıyı)
      // Not: Fetch API güvenlik nedeniyle Set-Cookie'yi expose etmeyebilir
      try {
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          setCookieValues = setCookie.split(/,(?=\s*\w+=)/); // birden fazla cookie
        }
      } catch { /* header erişimi başarısız */ }

      if (response.headers.get('content-type')?.includes('text/html')) {
        htmlContent = await response.text();
      }

      secStats.urlsAnalyzed++;
      emitSecurityStats();
    } catch (fetchErr) {
      emitSecurityLog(`Could not fetch page: ${fetchErr.message}. Header analysis skipped.`, 'warning');
      emitSecurityFinding(createFinding({
        category: 'configuration',
        title: 'Page Could Not Be Fetched for Analysis',
        severity: 'info',
        confidence: 'high',
        url: pageUrl,
        evidence: `Fetch error: ${fetchErr.message}`,
        recommendation: 'Manually inspect security headers using browser DevTools → Network tab.',
      }));
    }

    // ── Step 3: Security Headers Analizi ────────────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    emitSecurityLog('Analyzing security headers...', 'info');

    const headerFindings = analyzeSecurityHeaders(responseHeaders, pageUrl);
    secStats.headersChecked = 6;
    for (const f of headerFindings) emitSecurityFinding(f);

    // ── Step 3b: Information Disclosure (Response Headers) ──────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    emitSecurityLog('Checking for server information disclosure...', 'info');
    const headerDisclosureFindings = detectHeaderDisclosure(responseHeaders, pageUrl);
    for (const f of headerDisclosureFindings) emitSecurityFinding(f);

    // ── Step 3c: CORS Policy ─────────────────────────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    emitSecurityLog('Analyzing CORS policy...', 'info');
    const corsFindings = analyzeCors(responseHeaders, pageUrl);
    for (const f of corsFindings) emitSecurityFinding(f);

    // ── Step 4: Cookie Analizi ───────────────────────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    emitSecurityLog('Analyzing cookie security flags...', 'info');

    if (setCookieValues.length > 0) {
      secStats.cookiesChecked = setCookieValues.length;
      const cookieFindings = analyzeCookies(setCookieValues, pageUrl, isHttps);
      for (const f of cookieFindings) emitSecurityFinding(f);
    } else {
      emitSecurityLog('No Set-Cookie headers detected (or browser restricted access).', 'info');
    }

    // ── Step 4b: WAF Fingerprinting ──────────────────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    if (securitySettings.enableWaf) {
      emitSecurityLog('Fingerprinting for Web Application Firewalls (WAF)...', 'info');
      const wafFindings = detectWaf(responseHeaders, setCookieValues, pageUrl);
      for (const f of wafFindings) emitSecurityFinding(f);
    }

    // ── Step 5: Mixed Content Analizi ───────────────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    if (htmlContent && isHttps) {
      emitSecurityLog('Checking for mixed content...', 'info');
      const { findings: mcFindings, summary: mcSummary } = detectMixedContent(htmlContent, pageUrl);
      secStats.mixedContent = mcSummary.total;
      for (const f of mcFindings) emitSecurityFinding(f);
    }

    // ── Step 5e: Tech Stack Fingerprinting ──────────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    if (securitySettings.enableTechStack) {
      emitSecurityLog('Analyzing technology stack...', 'info');
      const techStackFindings = detectTechStack(htmlContent, responseHeaders, pageUrl);
      for (const f of techStackFindings) emitSecurityFinding(f);
    }

    // ── Step 5f: Secrets Leakage Detection ──────────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    if (htmlContent && securitySettings.enableSecrets) {
      emitSecurityLog('Scanning for leaked secrets and API keys...', 'info');
      const secretFindings = detectSecrets(htmlContent, pageUrl);
      for (const f of secretFindings) emitSecurityFinding(f);
    }

    // ── Step 5g: Error Trace Leakage Detection ──────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    if (htmlContent && securitySettings.enableErrorTrace) {
      emitSecurityLog('Scanning for sensitive error traces and stack leaks...', 'info');
      const errorFindings = detectErrorTraces(htmlContent, pageUrl);
      for (const f of errorFindings) emitSecurityFinding(f);
    }

    // ── Step 5b: Subresource Integrity (SRI) ────────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    if (htmlContent) {
      emitSecurityLog('Checking Subresource Integrity (SRI)...', 'info');
      const sriFindings = detectMissingSri(htmlContent, pageUrl, pageOrigin);
      for (const f of sriFindings) emitSecurityFinding(f);

      // ── Step 5c: Reverse Tabnapping ─────────────────────────────────────
      emitSecurityLog('Checking for reverse tabnapping vulnerabilities...', 'info');
      const tabnappingFindings = detectTabnapping(htmlContent, pageUrl, pageOrigin);
      for (const f of tabnappingFindings) emitSecurityFinding(f);

      // ── Step 5d: Information Disclosure (Meta Tags + DNS Prefetch) ────────
      emitSecurityLog('Analyzing meta tags and DNS prefetch for information disclosure...', 'info');
      const metaFindings = detectMetaDisclosure(htmlContent, pageUrl);
      const dnsFindings = detectDnsPrefetchLeakage(htmlContent, pageUrl);
      for (const f of [...metaFindings, ...dnsFindings]) emitSecurityFinding(f);
    }

    // ── Step 6: DOM Analizi — Content Script ─────────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    emitSecurityLog('Requesting DOM analysis from page...', 'info');

    let domData = null;
    try {
      domData = await requestDomData(tabId);
    } catch (domErr) {
      emitSecurityLog(`DOM analysis unavailable: ${domErr.message}`, 'warning');
    }

    if (domData) {
      const {
        params = [], forms = [], inlineScripts = [],
        scriptSrcs = [], pageHtml = '', allLinks = [],
        isHttps: domIsHttps = isHttps,
      } = domData;

      secStats.paramsFound = params.length;
      secStats.formsFound = forms.length;
      emitSecurityStats();

      emitSecurityLog(`DOM analysis: ${params.length} params, ${forms.length} forms, ${scriptSrcs.length} scripts, ${allLinks.length} links.`, 'info');

      // ── Step 7: Sensitive Resource Detection ──────────────────────────────
      if (secIsStopped) return finishSecurityScan('cancelled');
      emitSecurityLog('Scanning for sensitive resources...', 'info');
      const sensitiveFindings = detectSensitiveResources(allLinks, pageUrl, pageOrigin);
      for (const f of sensitiveFindings) emitSecurityFinding(f);

      // ── Step 7a: Subdomain Takeover / Broken Link Hijacking ────────────────
      if (secIsStopped) return finishSecurityScan('cancelled');
      emitSecurityLog('Scanning external scripts for Subdomain Takeover risks...', 'info');
      const takeoverFindings = await detectBrokenLinkHijacking(scriptSrcs, pageUrl);
      for (const f of takeoverFindings) emitSecurityFinding(f);

      // ── Step 7b: JavaScript Library Vulnerability Detection ───────────────
      if (secIsStopped) return finishSecurityScan('cancelled');
      emitSecurityLog('Detecting JavaScript library vulnerabilities...', 'info');
      const jsLibFindings = detectVulnerableLibraries(scriptSrcs, inlineScripts, pageUrl);
      for (const f of jsLibFindings) emitSecurityFinding(f);

      // ── Step 7e: Advanced DOM-XSS Sink Detection ──────────────────────────
      if (secIsStopped) return finishSecurityScan('cancelled');
      if (securitySettings.enableDomXss) {
        emitSecurityLog('Analyzing inline scripts for dangerous sinks (DOM-XSS)...', 'info');
        const domXssFindings = detectDomXssSinks(inlineScripts, pageUrl);
        for (const f of domXssFindings) emitSecurityFinding(f);
      }

      // ── Step 7c: Open Redirect Detection ──────────────────────────────────
      if (secIsStopped) return finishSecurityScan('cancelled');
      emitSecurityLog('Checking for open redirect parameters...', 'info');
      const openRedirectParamFindings = detectOpenRedirect(params, pageUrl);
      const openRedirectFormFindings = detectOpenRedirectInForms(forms, pageUrl);
      for (const f of [...openRedirectParamFindings, ...openRedirectFormFindings]) emitSecurityFinding(f);

      // ── Step 7d: Enhanced Form Security Analysis ──────────────────────────
      if (secIsStopped) return finishSecurityScan('cancelled');
      emitSecurityLog('Analyzing form security (CSRF, autocomplete, mixed forms)...', 'info');
      const formSecFindings = analyzeFormSecurity(forms, pageUrl, domIsHttps);
      for (const f of formSecFindings) emitSecurityFinding(f);

      // ── Step 8: Passive SQLi Risk Detection ───────────────────────────────
      if (secIsStopped) return finishSecurityScan('cancelled');
      emitSecurityLog('Identifying potential SQL injection input points...', 'info');
      const sqliParamFindings = detectSqliRiskFromParams(params, pageUrl);
      const sqliFormFindings = detectSqliRiskFromForms(forms, pageUrl);
      for (const f of [...sqliParamFindings, ...sqliFormFindings]) emitSecurityFinding(f);

      // ── Step 9: Passive XSS Risk Detection ────────────────────────────────
      if (secIsStopped) return finishSecurityScan('cancelled');
      emitSecurityLog('Identifying potential XSS risk points...', 'info');
      const xssScriptFindings = detectXssRiskFromScripts(inlineScripts, pageUrl);
      const xssParamFindings = detectXssRiskFromParams(params, pageUrl);
      for (const f of [...xssScriptFindings, ...xssParamFindings]) emitSecurityFinding(f);

      // ── Step 9b: SRI from DOM HTML (if not from fetch) ────────────────────
      if (!htmlContent && pageHtml) {
        const sriDomFindings = detectMissingSri(pageHtml, pageUrl, pageOrigin);
        for (const f of sriDomFindings) emitSecurityFinding(f);
        const tabnappingDomFindings = detectTabnapping(pageHtml, pageUrl, pageOrigin);
        for (const f of tabnappingDomFindings) emitSecurityFinding(f);
      }
    }

    // ── Step 10: HTML fallback link analysis ──────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    if (htmlContent && !domData) {
      emitSecurityLog('Running HTML-based link analysis (DOM unavailable)...', 'info');
      const links = extractLinksFromHtmlForSecurity(htmlContent, pageUrl);
      const sensitiveFindings = detectSensitiveResources(links, pageUrl, pageOrigin);
      for (const f of sensitiveFindings) emitSecurityFinding(f);
    }

    // ── Step 11: robots.txt Analizi ───────────────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    emitSecurityLog('Fetching and analyzing robots.txt...', 'info');
    const robotsFindings = await analyzeRobotsTxt(pageUrl);
    for (const f of robotsFindings) emitSecurityFinding(f);

    // ── Step 12: security.txt Kontrolü ────────────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    emitSecurityLog('Checking for security.txt (RFC 9116)...', 'info');
    const secTxtFindings = await checkSecurityTxt(pageUrl);
    for (const f of secTxtFindings) emitSecurityFinding(f);

    // ── Step 13: HTTP→HTTPS Redirect Kontrolü ────────────────────────────
    if (secIsStopped) return finishSecurityScan('cancelled');
    emitSecurityLog('Checking HTTP to HTTPS redirect configuration...', 'info');
    const redirectFindings = await checkHttpToHttpsRedirect(pageUrl);
    for (const f of redirectFindings) emitSecurityFinding(f);

    finishSecurityScan('completed');

  } catch (err) {
    emitSecurityLog(`Security scan error: ${err.message}`, 'error');
    finishSecurityScan('error');
  }
}

/**
 * Content script'ten DOM verisi ister.
 * @param {number} tabId
 * @returns {Promise<Object>}
 */
function requestDomData(tabId) {
  return new Promise((resolve, reject) => {
    if (!tabId) {
      reject(new Error('No tab ID provided'));
      return;
    }
    const timeout = setTimeout(() => reject(new Error('DOM data request timed out')), 5000);
    chrome.tabs.sendMessage(tabId, { action: 'collect_dom_data' }, (response) => {
      clearTimeout(timeout);
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response && response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response?.error || 'Content script did not respond'));
      }
    });
  });
}

/**
 * HTML içeriğinden güvenlik analizi için link listesi çıkarır.
 * Dead Link Scanner'ın extractLinksFromHtml'inden bağımsız — enqueue çağırmaz.
 */
function extractLinksFromHtmlForSecurity(html, sourceUrl) {
  const links = new Set();
  const linkRegex = /(?:href|src|action)=["']([^"']+)["']/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const raw = match[1];
    if (raw.startsWith('mailto:') || raw.startsWith('javascript:') || raw.startsWith('data:')) continue;
    try {
      const resolved = new URL(raw, sourceUrl).href;
      links.add(resolved);
    } catch { /* geçersiz URL */ }
  }
  return Array.from(links);
}
