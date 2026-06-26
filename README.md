<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/React-Dark.svg" width="60" alt="React" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Vite-Dark.svg" width="60" alt="Vite" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NodeJS-Dark.svg" width="60" alt="NodeJS" />
  <h1 align="center">404 Error Scanner Chrome Extension</h1>
  <p align="center">
    <strong>A professional, high-performance web crawler and HTTP status analyzer built directly into your browser.</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Manifest-V3-34A853?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Manifest V3" />
    <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
  </p>
</div>

<br />

![404 Error Scanner Dashboard](https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)
*(Illustration of web analysis & crawling)*

---

## 🚀 Features

- 🕵️‍♂️ **Standalone Chrome Extension:** No Node.js or backend servers required. It leverages Chrome's Manifest V3 Background Service Workers to bypass CORS and crawl efficiently.
- ⚡ **Real-Time Analysis:** View a live stream of crawling logs and statistics right inside the sleek extension popup.
- 🔄 **Concurrent Crawling:** Built-in asynchronous queue processing with adjustable thread/concurrency limits.
- 🎨 **Glassmorphism UI:** A beautiful, modern React interface built with pure CSS.
- 📊 **Data Export:** Export your scan results in `CSV` or `JSON` formats instantly.
- 🔍 **Smart Filters:** Filter results by Status Code (200, 301, 404, 500, etc.) and search by URL.
- ⚙️ **Advanced Configuration:** Set custom User-Agents, timeouts, delays, and exclude specific folders or `robots.txt`.

---

## 🏗️ Architecture & Work Flow

The extension relies on a powerful **Background Service Worker** to independently fetch pages and extract links without slowing down your browser or being blocked by Cross-Origin Resource Sharing (CORS) rules.

### Process Flow Diagram

```mermaid
sequenceDiagram
    participant UI as 🖥️ Extension Popup (React)
    participant SW as ⚙️ Background Service Worker
    participant Web as 🌐 Target Website

    UI->>SW: Send "start_scan" (Target URL)
    activate SW
    SW->>Web: Fetch URL (GET Request)
    Web-->>SW: Return HTML Content
    SW->>SW: Parse Links & Queue Internal URLs
    SW-->>UI: Stream Logs, Stats, Results (Live via Messages)
    SW->>Web: Concurrently Fetch Queued Links...
    deactivate SW
```

### System Architecture

```mermaid
graph TD
    A[User clicks Extension] --> B(Glassmorphism Dashboard)
    B -->|Start Scan / Options| C{Background Service Worker}
    C -->|Fetch API| D[Target Domain]
    D -->|HTML Response| C
    C -->|Regex / Parser| E[Internal URL Queue]
    E -->|Next Batch| C
    C -->|chrome.runtime.sendMessage| B
    B -->|Export Action| F[CSV / JSON Download]
    
    style B fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    style C fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff
    style D fill:#333,stroke:#f59e0b,stroke-width:2px,color:#fff
```

---

## 💻 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn`

### Installation & Build

1. **Clone the repository:**
   ```bash
   git clone https://github.com/onder007/error-Scanner.git
   cd error-Scanner
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   npm run build
   ```
   *This will generate a `dist` folder in the root directory containing the compiled extension.*

---

## 🔌 Loading into Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top right corner.
3. Click the **Load unpacked** button in the top left corner.
4. Select the `dist` folder that was generated in the previous step.
5. **Done!** Click the puzzle icon in Chrome to pin the extension to your toolbar and start scanning.

---

## 🛠️ Tech Stack

- **UI Framework:** [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Extension Infrastructure:** Chrome Manifest V3, Service Workers
- **HTML Parsing:** Cheerio (Browser version) & Regex Pattern Matching
- **Styling:** Vanilla CSS (Glassmorphism aesthetics)

---

## 📜 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute this software.
