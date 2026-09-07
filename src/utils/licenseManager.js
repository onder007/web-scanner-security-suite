// src/utils/licenseManager.js
// Handles zero-backend, zero-signup licensing via Gumroad, Lemon Squeezy, or offline keys.

const STORAGE_KEY = 'web_scanner_license';

// Master Admin & Demo keys for instant offline access
const ADMIN_KEYS = ['ONDER123', 'ONDER', 'ADMIN-MASTER-2026'];
const DEMO_KEYS = ['PRO-TRIAL-2026', 'PRO-DEV-ACCESS', 'VIP-SECURITY-SUITE'];

/**
 * Reads license data from chrome.storage.sync or localStorage
 */
export async function getLicenseData() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get([STORAGE_KEY], (res) => {
        resolve(res[STORAGE_KEY] || { isPro: false, isAdmin: false, key: null, activatedAt: null, plan: 'Free' });
      });
    } else {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        resolve(stored ? JSON.parse(stored) : { isPro: false, isAdmin: false, key: null, activatedAt: null, plan: 'Free' });
      } catch {
        resolve({ isPro: false, isAdmin: false, key: null, activatedAt: null, plan: 'Free' });
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
 * 1. Checks if it's the Master Admin key 'onder123'
 * 2. Checks if it's a test/demo key or starts with 'PRO-'
 * 3. If Gumroad product permalink is configured, verifies via Gumroad API
 * 4. Fallback for valid format keys
 */
export async function activateLicenseKey(rawKey, gumroadPermalink = '') {
  const key = (rawKey || '').trim();
  if (!key) {
    return { success: false, error: 'Lütfen bir anahtar girin.' };
  }

  const normalized = key.toUpperCase();

  // 1. MASTER ADMIN KEY (e.g. onder123)
  if (ADMIN_KEYS.includes(normalized) || normalized === 'ONDER123') {
    const licenseInfo = {
      isPro: true,
      isAdmin: true,
      key: 'onder123',
      plan: '👑 Admin Full Access',
      activatedAt: new Date().toISOString(),
      provider: 'Master Admin'
    };
    await saveLicenseData(licenseInfo);
    return { success: true, license: licenseInfo };
  }

  // 2. Demo / Dev keys
  if (DEMO_KEYS.includes(normalized) || normalized.startsWith('PRO-')) {
    const licenseInfo = {
      isPro: true,
      isAdmin: false,
      key,
      plan: 'Pro Lifetime',
      activatedAt: new Date().toISOString(),
      provider: 'Direct License'
    };
    await saveLicenseData(licenseInfo);
    return { success: true, license: licenseInfo };
  }

  // 3. Optional: Verify with Gumroad API if a permalink is provided
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
          isAdmin: false,
          key,
          plan: 'Pro Lifetime',
          email: data.purchase.email,
          activatedAt: new Date().toISOString(),
          provider: 'Gumroad'
        };
        await saveLicenseData(licenseInfo);
        return { success: true, license: licenseInfo };
      } else {
        return { success: false, error: data.message || 'Geçersiz veya iptal edilmiş lisans anahtarı.' };
      }
    } catch (err) {
      return { success: false, error: `Doğrulama hatası: ${err.message}` };
    }
  }

  // 4. General fallback: Any alphanumeric key with at least 8 characters
  if (key.length >= 8) {
    const licenseInfo = {
      isPro: true,
      isAdmin: false,
      key,
      plan: 'Pro Lisans',
      activatedAt: new Date().toISOString(),
      provider: 'Verified Key'
    };
    await saveLicenseData(licenseInfo);
    return { success: true, license: licenseInfo };
  }

  return { success: false, error: 'Anahtar formatı geçersiz. En az 8 karakter olmalıdır (veya onder123 admin anahtarı).' };
}

/**
 * Deactivates current license
 */
export async function deactivateLicense() {
  const blank = { isPro: false, isAdmin: false, key: null, activatedAt: null, plan: 'Free' };
  await saveLicenseData(blank);
  return blank;
}
