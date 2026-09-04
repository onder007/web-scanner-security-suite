# Privacy Policy for Web Scanner — Dead Links & Security

**Last updated:** September 4, 2026

## 1. Overview
Web Scanner ("the Extension") is a developer and webmaster tool designed to inspect web pages for broken links, analyze HTTP security headers, audit client-side security postures, and monitor HTTP network traffic. 

Your privacy is a core principle. **We do NOT collect, store, sell, or transmit any of your personal data, browsing history, or user credentials to any external servers.**

---

## 2. Data Handling & Permissions

### A. Local-Only Analysis
All scanning and analysis operations are performed entirely within your local browser:
- **Dead Link Scanning:** Analyzes links present on the active web page and issues standard HTTP HEAD/GET requests directly from your browser to check response statuses (e.g., 200, 404).
- **Security Auditing:** Inspects HTTP response headers, DOM form structures, and client scripts of the target page you explicitly choose to scan. No exploitation or intrusive attacks are conducted.
- **Network Traffic Inspector:** Passively observes network requests made by the active inspected tab using the browser's `chrome.webRequest` API. Data is stored solely in temporary memory and is cleared when requested.

### B. Chrome Permissions Explained
- **`activeTab` & `tabs`:** Used strictly to determine the URL of the tab you are auditing.
- **`scripting`:** Used to run passive DOM analysis content scripts on the page you inspect.
- **`storage`:** Used exclusively to persist your user settings and local scan history within your browser's `chrome.storage.local`.
- **`sidePanel`:** Allows viewing the extension interface side-by-side with the web page.
- **`webRequest`:** Used to capture HTTP method, status codes, and headers for developers inspecting their own web application network calls.
- **Host Permissions (`*://*/*`):** Required because developers and webmasters need to audit arbitrary website URLs they own or test.

---

## 3. Third-Party Services
The Extension does not use third-party tracking scripts, analytics SDKs, advertising networks, or remote servers. The extension operates completely offline/standalone.
For email SPF/DMARC validation, the extension queries public DNS-over-HTTPS (Cloudflare DoH) solely for the target domain's public TXT records.

---

## 4. Children's Privacy
The Extension is a professional developer utility and does not knowingly collect information from anyone under the age of 13.

---

## 5. Contact
If you have any questions or feedback regarding this Privacy Policy, you may open an issue on the project's official repository or contact the developer directly.
