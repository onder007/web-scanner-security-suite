# 404 Error Scanner Chrome Extension

A professional, high-performance web crawler and HTTP status analyzer built directly into your browser. This extension allows you to effortlessly scan entire websites for broken links, server errors, and redirects without relying on any external backend servers.

![404 Error Scanner Dashboard](https://via.placeholder.com/1000x500?text=404+Error+Scanner+Chrome+Extension)

## Features

- **Standalone Chrome Extension:** No Node.js or backend servers required. It leverages Chrome's Manifest V3 Background Service Workers to bypass CORS and crawl efficiently.
- **Real-Time Analysis:** View a live stream of crawling logs and statistics right inside the sleek extension popup.
- **Concurrent Crawling:** Built-in asynchronous queue processing with adjustable thread/concurrency limits.
- **Glassmorphism UI:** A beautiful, modern React interface built with pure CSS.
- **Data Export:** Export your scan results in `CSV` or `JSON` formats instantly.
- **Smart Filters:** Filter results by Status Code (200, 301, 404, 500, etc.) and search by URL.
- **Advanced Configuration:** Set custom User-Agents, timeouts, delays, and exclude specific folders or `robots.txt`.

## Tech Stack

- **Frontend:** React.js, Vite
- **Extension Infrastructure:** Manifest V3, Chrome Runtime Messaging, Background Service Workers
- **HTML Parsing:** Cheerio (Lightweight browser build)
- **Bundler:** Vite with `@crxjs/vite-plugin`

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation & Build

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/404-error-scanner.git
   cd 404-error-scanner
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   npm run build
   ```
   *This will generate a `dist` folder in the root directory.*

### Loading into Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** in the top right corner.
3. Click on **Load unpacked** in the top left corner.
4. Select the `dist` folder that was generated in the previous step.
5. The extension is now installed! Click the puzzle icon in Chrome to pin it to your toolbar and start scanning.

## License

MIT License - feel free to use, modify, and distribute this project.
