# Chrome Web Store — Adım Adım Yayınlama ve Kopyala-Yapıştır Rehberi ("Al Bunu Buraya At")

Bu rehber, eklentinizi **Google Chrome Web Mağazası'nda en hızlı şekilde ve ilk seferde onay alacak şekilde** yayınlamanız için hazırlandı.

---

## 📁 1. Hazırlanan ve Yüklenecek Dosyalar (Masaüstü / Proje Klasörünüzde)

| Alan | Yüklenecek Dosya Yolu | Açıklama |
| :--- | :--- | :--- |
| **Ana Paket (.zip)** | `web-scanner-store.zip` | `dist/` klasöründen derlenmiş, tüm ikonları içeren hazır paket. |
| **Mağaza Simgesi (128x128)** | `public/icons/icon128.png` | Google'ın istediği 128x128 boyutunda logo. |
| **Tanıtım Kutucuğu (440x280)** | `public/icons/marquee_440x280.png` | Mağaza listelerinde öne çıkarıldığında görünecek afiş. |
| **Ekran Görüntüsü (1280x800)** | `public/icons/store_screenshot_1280x800.png` | Mağaza vitrininde görünecek profesyonel dashboard önizlemesi. |

---

## 📝 2. Mağaza Girişi (Store Listing) — Kopyala / Yapıştır Metinleri

### A. Uzantı Adı (Extension Name - Max 45 Karakter)
```text
Web Scanner — Dead Links & Security
```

### B. Kısa Açıklama (Summary - Max 132 Karakter)
```text
Broken link finder, deep security & vulnerability audit, and real-time network traffic inspector for developers and webmasters.
```

### C. Ayrıntılı Açıklama (Detailed Description)
*(Aşağıdaki metni kopyalayıp mağazadaki Ayrıntılı Açıklama kutusuna yapıştırın):*
```text
Web Scanner is an all-in-one developer productivity and website hygiene suite built for webmasters, QA testers, and cybersecurity auditors.

Tired of broken links ruining your SEO and missing security headers exposing your users? Web Scanner combines high-speed dead link crawling, enterprise-grade passive security auditing, and a real-time network traffic inspector in a single, lightweight browser extension.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ KEY FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 High-Speed Dead Links Finder:
• Crawl entire web pages or domains for broken 404, 500, and redirecting links.
• Filter by status code, external/internal links, and export full reports in CSV or JSON.
• Pause, resume, and inspect error causes instantly.

🛡️ Deep Passive Security Auditing:
• HTTP Security Headers: Evaluates HSTS (preload/subdomains), CSP, X-Frame-Options, and nosniff.
• Google CSP Evaluator Engine: Detects unsafe-inline, unsafe-eval, missing object-src, and wildcard bypass risks.
• Email Security & Anti-Spoofing: Verifies SPF and DMARC TXT records via DNS-over-HTTPS.
• Client Storage & Token Audit: Inspects localStorage and sessionStorage for exposed JWT tokens and secrets.
• JS Endpoint & Attack Surface Miner: Extracts hidden backend API routes (/api/v1/..., /admin, GraphQL) from scripts.
• Source Map (.map) Leak Detection: Warns if production bundles disclose original unminified source code.
• 1-Click Fix Snippets: Copy ready-to-use configuration code for Nginx, Apache, Cloudflare, Vite, and Next.js.

🌐 Real-Time Network Traffic Inspector:
• Capture live HTTP/HTTPS requests (Fetch, XHR, Scripts, CSS) initiated by the target website.
• Target Domain Isolation: Automatically ignores background tabs (like YouTube or Spotify) so your network log stays clean.
• Inspect request methods, status codes, and expand full Response Headers with a single click.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 STRICTLY PASSIVE & SAFE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Web Scanner is strictly a passive analysis utility. It DOES NOT perform active exploits, penetration attacks, or fuzzing payloads. All evaluations are conducted locally within your browser without transmitting your data to third parties.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 COMPLIANCE READINESS SCORES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Instant compliance readiness estimation for:
• KVKK / GDPR (Privacy & Cookie hygiene)
• PCI-DSS v4.0 (Payment transport standards)
• OWASP Top 10 (Web Application hygiene)
```

### D. Kategori (Category)
```text
Developer Tools (Geliştirici Araçları)
```

---

## 🔒 3. Gizlilik Uygulamaları (Privacy Practices) — İzin Gerekçeleri

Google inceleme ekibi, `manifest.json` içindeki her izin için tek cümlelik net bir gerekçe ister. Aşağıdaki İngilizce gerekçeleri birebir kopyalayıp ilgili kutulara yapıştırın:

### Tek Amaç Açıklaması (Single Purpose Description):
```text
Web Scanner is a developer utility designed to identify broken dead links, audit passive web security configurations, and inspect real-time network traffic on target websites.
```

### İzin Gerekçeleri (Permission Justifications):
* **`storage`:**
  ```text
  Used to persist user scan preferences, option settings, and local security audit history locally on the device.
  ```
* **`activeTab`:**
  ```text
  Used to identify the URL and DOM of the active tab when the user explicitly triggers a link or security scan.
  ```
* **`scripting`:**
  ```text
  Used to execute lightweight content scripts that passively extract links, form actions, and script sources from the analyzed page.
  ```
* **`tabs`:**
  ```text
  Used to read the current tab URL and open the extended dashboard view in a separate tab when requested by the user.
  ```
* **`sidePanel`:**
  ```text
  Used to provide a native side-by-side inspection view in Chrome alongside the inspected web application.
  ```
* **`webRequest`:**
  ```text
  Used to observe real-time HTTP request methods, status codes, and response headers strictly for the target domain being inspected.
  ```
* **`*://*/*` (Host Permissions):**
  ```text
  Required because webmasters and developers need to run broken link and security audits across any arbitrary website or staging environment they test.
  ```

### Veri Kullanımı Soruları (Data Usage Checkboxes):
* *"Kullanıcı verilerini satıyor veya üçüncü taraflarla paylaşıyor musunuz?"* -> **HAYIR (NO)**
* *"Kullanıcı verilerini onaylanmamış amaçlarla kullanıyor musunuz?"* -> **HAYIR (NO)**
* *"Kullanıcı verilerini kredi değerlendirmesi için kullanıyor musunuz?"* -> **HAYIR (NO)**

---

## 🚀 4. "Al Bunu Buraya At" Adımları (5 Dakikada Tamamlama)

1. **Geliştirici Paneline Girin:**  
   [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/) adresini açın.
2. **Paketi Yükleyin:**  
   **"Yeni Öğe Ekle" (Add new item)** butonuna tıklayın. Proje klasörünüzdeki **`web-scanner-store.zip`** dosyasını sürükleyip bırakın.
3. **Mağaza Girişi Sekmesini Doldurun:**  
   - Yukarıdaki **Uzantı Adı**, **Kısa Açıklama** ve **Ayrıntılı Açıklama** metinlerini yapıştırın.
   - **Simge:** `public/icons/icon128.png` dosyasını yükleyin.
   - **Ekran Görüntüleri:** `public/icons/store_screenshot_1280x800.png` dosyasını yükleyin.
   - **Tanıtım Kutucuğu:** `public/icons/marquee_440x280.png` dosyasını yükleyin.
4. **Gizlilik Sekmesini Doldurun:**  
   - Yukarıdaki **Single Purpose** ve **İzin Gerekçeleri** metinlerini yapıştırın.
   - **Gizlilik Politikası URL'si:** GitHub projenizdeki `PRIVACY_POLICY.md` dosyasının linkini veya Notion sayfanızın linkini girin.
5. **İncelemeye Gönderin:**  
   Sağ üstteki **"İncelemeye Gönder" (Submit for review)** butonuna basın!

Tebrikler! Google ekibi genellikle 24-48 saat içinde incelemeyi tamamlayıp eklentinizi dünya çapında yayına alacaktır.
