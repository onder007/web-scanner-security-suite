/**
 * historyDb.js
 * Saves and retrieves security scan history using chrome.storage.local
 */

const MAX_HISTORY = 30; // Son 30 taramayı tut

export async function saveScanToHistory(url, stats, summary, findings) {
  try {
    const domain = new URL(url).hostname;
    
    // Lightweight history item
    const historyItem = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      url,
      domain,
      summary,
      stats,
      // Çok büyük verileri (kanıtları vb.) kesebiliriz
      findings: findings.map(f => ({
        id: f.id,
        severity: f.severity,
        category: f.category,
        title: f.title
      }))
    };

    const data = await chrome.storage.local.get(['securityHistory']);
    let history = data.securityHistory || [];
    
    // Aynı domainin eski kayıtlarını koru ama toplam sayıyı aşma
    history.unshift(historyItem);
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }

    await chrome.storage.local.set({ securityHistory: history });
    return historyItem;
  } catch (e) {
    console.error('Failed to save history:', e);
    return null;
  }
}

export async function getScanHistory() {
  const data = await chrome.storage.local.get(['securityHistory']);
  return data.securityHistory || [];
}

export async function clearScanHistory() {
  await chrome.storage.local.set({ securityHistory: [] });
}
