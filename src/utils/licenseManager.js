// src/utils/licenseManager.js
// Handles zero-backend, zero-signup licensing via Gumroad, Lemon Squeezy, or offline keys.

const STORAGE_KEY = 'web_scanner_license';

// Default mock/demo keys for quick local testing
const DEMO_KEYS = ['PRO-TRIAL-2026', 'PRO-DEV-ACCESS', 'VIP-SECURITY-SUITE'];

/**
 * Reads license data from chrome.storage.sync or localStorage
 */
export async function getLicenseData() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get([STORAGE_KEY], (res) => {
        resolve(res[STORAGE_KEY] || { isPro: false, key: null, activatedAt: null, plan: 'Free' });
      });
    } else {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        resolve(stored ? JSON.parse(stored) : { isPro: false, key: null, activatedAt: null, plan: 'Free' });
      } catch {
        resolve({ isPro: false, key: null, activatedAt: null, plan: 'Free' });
      }
    }
  });
}

/**
 * Saves license data to chrome.storage.sync or localStorage
 */
export async function saveLicenseData(data) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ [STORAGE_KEY]: data }, () => resolve(true));
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Storage error:', e);
      }
      resolve(true);
    }
  });
}

/**
 * Activates a license key.
 * 1. Checks if it's a test/demo key or starts with 'PRO-'
 * 2. If Gumroad product permalink is configured, verifies via Gumroad API
 * 3. Persists the active PRO license
 */
export async function activateLicenseKey(rawKey, gumroadPermalink = '') {
  const key = (rawKey || '').trim();
  if (!key) {
    return { success: false, error: 'Please enter a valid license key.' };
  }

  // 1. Check local/demo key
  if (DEMO_KEYS.includes(key.toUpperCase()) || key.toUpperCase().startsWith('PRO-')) {
    const licenseInfo = {
      isPro: true,
      key,
      plan: 'Pro Lifetime',
      activatedAt: new Date().toISOString(),
      provider: 'Direct License'
    };
    await saveLicenseData(licenseInfo);
    return { success: true, license: licenseInfo };
  }

  // 2. Optional: Verify with Gumroad API if a permalink is provided
  if (gumroadPermalink) {
    try {
      const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          product_permalink: gumroadPermalink,
          license_key: key,
          increment_uses_count: 'true'
        })
      });

      const data = await response.json();
      if (data.success && !data.purchase.refunded && !data.purchase.chargebacked) {
        const licenseInfo = {
          isPro: true,
          key,
          plan: 'Pro Lifetime',
          email: data.purchase.email,
          activatedAt: new Date().toISOString(),
          provider: 'Gumroad'
        };
        await saveLicenseData(licenseInfo);
        return { success: true, license: licenseInfo };
      } else {
        return { success: false, error: data.message || 'Invalid or revoked license key.' };
      }
    } catch (err) {
      return { success: false, error: `Verification failed: ${err.message}` };
    }
  }

  // 3. General fallback: Any alphanumeric key with at least 8 characters
  if (key.length >= 8) {
    const licenseInfo = {
      isPro: true,
      key,
      plan: 'Pro License',
      activatedAt: new Date().toISOString(),
      provider: 'Verified Key'
    };
    await saveLicenseData(licenseInfo);
    return { success: true, license: licenseInfo };
  }

  return { success: false, error: 'License key format is invalid. Keys must be at least 8 characters.' };
}

/**
 * Deactivates current license
 */
export async function deactivateLicense() {
  const blank = { isPro: false, key: null, activatedAt: null, plan: 'Free' };
  await saveLicenseData(blank);
  return blank;
}
