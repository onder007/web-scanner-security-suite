# 🛡️ Web Scanner — Dead Links & Security Suite

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-v1.1.0-blue.svg?logo=google-chrome)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Security Auditing](https://img.shields.io/badge/OWASP-Top%2010%20Compliant-emerald.svg)](https://owasp.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An enterprise-grade, high-performance Chrome Extension for webmasters, QA engineers, and cybersecurity professionals. Combines concurrent broken link crawling, deep passive vulnerability discovery, Google-standard CSP evaluation, email spoofing validation (SPF/DMARC), and real-time target-isolated network traffic inspection in a single, lightweight browser extension.

---

## ⚡ Key Highlights

- **🔗 High-Speed Dead Links Crawler:** Concurrent crawling of internal and external links. Categorizes HTTP 200, 301/302 redirects, 404 broken links, and 500 server errors.
- **🛡️ Deep Security Auditing (Passive & Safe):** Zero active attack payloads. Operates strictly via static code analysis, DOM parsing, HTTP headers, and DoH.
- **🔐 Google CSP Evaluator Integration:** Detects `unsafe-inline`, `unsafe-eval`, missing `base-uri`, and wildcard bypass vulnerabilities according to Google security standards.
- **📧 Email Security & Anti-Spoofing (SPF & DMARC):** Real-time DNS-over-HTTPS (DoH) queries verify whether domain SPF and DMARC policies prevent unauthorized mail forgery.
- **🕵️ Hidden API & Route Miner:** Mines client-side JavaScript bundles for unadvertised backend endpoints (`/api/v1/...`, `/internal/...`, `/graphql`, Swagger/OpenAPI schemas).
- **🗺️ Source Map Leak Detection:** Detects exposed `.map` files that leak raw TypeScript/React source code and unminified internal logic to the public.
- **🔑 Client Storage & JWT Leak Audit:** Analyzes `localStorage` and `sessionStorage` for exposed JWT tokens, API keys, and credentials vulnerable to XSS exfiltration.
- **🌐 Real-Time Network Traffic Inspector:** Live inspection of HTTP/HTTPS requests (Fetch, XHR, Scripts, CSS) with **Target Domain Isolation** (background tabs like YouTube or Spotify are strictly excluded).
- **📋 1-Click Server Remediation Snippets:** Ready-to-copy hardening configuration blocks for **Nginx**, **Apache**, **Cloudflare**, **Next.js**, and **Vite**.
- **📊 Compliance Readiness Scorecards:** Instant readiness calculations for **KVKK / GDPR**, **PCI-DSS v4.0**, and **OWASP Top 10**.

---

## 🏗️ Architecture & Technical Stack

- **Extension API:** Manifest V3 (Chrome Service Worker)
- **Frontend UI:** React 18 SPA + Vite + Recharts + Glassmorphism Design System
- **Network Engine:** `chrome.webRequest` (Isolated Domain Filter) & DNS-over-HTTPS (Cloudflare DoH)
- **Security Parsers:** AST & Pattern Mining, Google CSP Rules, Retirement DB matching
- **DOM Engine:** Content Script (`content_security.js`) running at `document_idle`
- **Build Tooling:** `@crxjs/vite-plugin` + Rollup

---

## 🚀 Quick Start (Development & Local Testing)

### 1. Clone & Install
```bash
git clone https://github.com/onder007/web-scanner-security-suite.git
cd web-scanner-security-suite
npm install
```

### 2. Build Extension
```bash
npm run build
```
The compiled, store-ready extension will be output to the `dist/` directory.

### 3. Load into Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the `dist/` folder.
4. Open any website and click the Web Scanner icon in your extensions toolbar!

---

## 🔒 Security & Privacy Policy

Web Scanner operates under strict ethical guidelines:
1. **No Exploits / No Fuzzing:** The scanner never submits attack strings, SQLi payloads, or disruptive requests to the target web server.
2. **Local-Only Processing:** All analysis happens directly in your browser session. No telemetry, credentials, or scan reports are sent to external third parties.
3. Review our complete [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
