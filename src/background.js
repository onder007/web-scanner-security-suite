// background.js - Chrome Extension Service Worker

let activeScan = null;
let isPaused = false;
let isStopped = false;

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
