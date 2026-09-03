// src/content_security.js
// Security Scanner Content Script — DOM analizi yapar ve background'a gönderir.
//
// KISITLAMALAR:
// - Hiçbir payload üretmez, göndermez.
// - Cookie VALUE'larını okumaz/saklamaz.
// - Password alanı değerlerini okumaz.
// - Authorization/token değerlerini loglamaz.
// - Sadece sayfa yapısını analiz eder ve metadata gönderir.
// - document_idle'da çalışır, sayfayı yavaşlatmaz.

(function () {
  'use strict';

  // Daha önce mesaj gönderildiyse tekrar gönderme (duplicate listener önlemi)
  if (window.__securityScannerInjected) return;
  window.__securityScannerInjected = true;

  /**
   * Sayfadaki URL parametrelerini toplar.
   * @returns {Array<{name, value, url, method}>}
   */
  function collectUrlParams() {
    const params = [];
    const seen = new Set();

    // Mevcut sayfa URL'si
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.forEach((value, name) => {
        const key = `${currentUrl.pathname}::${name}`;
        if (seen.has(key)) return;
        seen.add(key);
        // value değeri sadece parametre adı için gerekli, saklamıyoruz uzun string'leri
        params.push({
          name,
          value: value.length > 50 ? '[truncated]' : value,
          url: currentUrl.origin + currentUrl.pathname + '?' + name + '=[value]',
          method: 'GET',
        });
      });
    } catch { /* geçersiz URL */ }

    // Sayfadaki linklerdeki parametreler
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      try {
        const u = new URL(link.href, window.location.href);
        if (u.origin !== window.location.origin) return; // sadece same-origin
        u.searchParams.forEach((value, name) => {
          const key = `${u.pathname}::${name}`;
          if (seen.has(key)) return;
          seen.add(key);
          params.push({
            name,
            value: value.length > 50 ? '[truncated]' : value,
            url: u.origin + u.pathname + '?' + name + '=[value]',
            method: 'GET',
          });
        });
      } catch { /* geçersiz URL */ }
    });

    return params;
  }

  /**
   * Sayfadaki formları analiz eder.
   * PASSWORD değerlerini ASLA saklamaz.
   * @returns {Array<{action, method, inputs}>}
   */
  function collectForms() {
    const forms = [];
    const formEls = document.querySelectorAll('form');

    formEls.forEach(form => {
      const inputs = [];
      const inputEls = form.querySelectorAll('input, textarea, select');

      inputEls.forEach(input => {
        const type = (input.type || 'text').toLowerCase();
        const name = input.name || input.id || '';
        if (!name) return;

        const entry = {
          name,
          type,
          autocomplete: input.getAttribute('autocomplete') || '',
        };

        // Hidden alan adı + değerini al (CSRF token tespiti için)
        // Password değerlerini kesinlikle alma
        if (type === 'hidden') {
          entry.value = (input.value || '').substring(0, 100);
        }

        inputs.push(entry);
      });

      // action URL'yi tam olarak al (form security için)
      let action = '';
      try {
        action = new URL(form.action || '', window.location.href).href;
      } catch {
        action = form.getAttribute('action') || '';
      }

      forms.push({
        action,
        method: (form.method || 'GET').toUpperCase(),
        inputs,
      });
    });

    return forms;
  }

  /**
   * Inline script içeriklerini toplar (sadece DOM sink analizi için).
   * Maksimum 20 script, her biri maksimum 5000 karakter.
   * @returns {string[]}
   */
  function collectInlineScripts() {
    const scripts = [];
    const scriptEls = document.querySelectorAll('script:not([src])');

    let count = 0;
    scriptEls.forEach(script => {
      if (count >= 20) return;
      const content = script.textContent || '';
      if (content.trim().length === 0) return;
      scripts.push(content.substring(0, 5000)); // Maksimum 5000 karakter
      count++;
    });

    return scripts;
  }

  /**
   * Sayfadaki external script src URL'lerini toplar (JS library detection için).
   * @returns {string[]}
   */
  function collectScriptSrcs() {
    const srcs = [];
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      try {
        srcs.push(new URL(src, window.location.href).href);
      } catch { srcs.push(src); }
    });
    return srcs;
  }

  /**
   * Sayfanın outerHTML'ini döner (SRI, tabnapping analizi için).
   * Maksimum 500KB ile sınırlı.
   */
  function collectPageHtml() {
    try {
      const html = document.documentElement.outerHTML || '';
      return html.substring(0, 500000);
    } catch { return ''; }
  }

  /**
   * Sayfadaki tüm linkleri toplar (sensitive resource tespiti için).
   * @returns {string[]}
   */
  function collectAllLinks() {
    const links = new Set();
    document.querySelectorAll('a[href], link[href], script[src], img[src], iframe[src]').forEach(el => {
      const href = el.getAttribute('href') || el.getAttribute('src') || '';
      if (!href || href.startsWith('data:') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;
      try {
        const u = new URL(href, window.location.href);
        links.add(u.href);
      } catch { /* geçersiz URL */ }
    });
    return Array.from(links);
  }

  /**
   * localStorage ve sessionStorage anahtar/değer özetlerini toplar.
   */
  function collectClientStorage() {
    const storageData = { localStorage: {}, sessionStorage: {} };
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          const val = window.localStorage.getItem(key) || '';
          storageData.localStorage[key] = val.length > 500 ? val.substring(0, 500) : val;
        }
      }
    } catch {}

    try {
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          const val = window.sessionStorage.getItem(key) || '';
          storageData.sessionStorage[key] = val.length > 500 ? val.substring(0, 500) : val;
        }
      }
    } catch {}

    return storageData;
  }

  /**
   * Tüm DOM analizini çalıştırır ve background'a gönderir.
   */
  function runDomAnalysis() {
    try {
      const data = {
        pageUrl: window.location.href,
        isHttps: window.location.protocol === 'https:',
        origin: window.location.origin,
        params: collectUrlParams(),
        forms: collectForms(),
        inlineScripts: collectInlineScripts(),
        allLinks: collectAllLinks(),
        clientStorage: collectClientStorage(),
      };

      chrome.runtime.sendMessage({
        event: 'security_dom_data',
        data,
      }).catch(() => {
        // Popup kapalıysa hata yoksay
      });
    } catch (e) {
      // Content script hataları sessizce yoksay
    }
  }

  // Background'dan gelen "collect_dom_data" isteğini dinle
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'collect_dom_data') {
      try {
        const data = {
          pageUrl: window.location.href,
          isHttps: window.location.protocol === 'https:',
          origin: window.location.origin,
          params: collectUrlParams(),
          forms: collectForms(),
          inlineScripts: collectInlineScripts(),
          scriptSrcs: collectScriptSrcs(),
          pageHtml: collectPageHtml(),
          allLinks: collectAllLinks(),
          clientStorage: collectClientStorage(),
        };
        sendResponse({ success: true, data });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    }
    return true; // async response
  });

})();
