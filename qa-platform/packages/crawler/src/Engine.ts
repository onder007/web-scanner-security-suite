import { chromium, Browser, Page } from 'playwright';
import { IAnalyzerPlugin, PageData, TestReport } from '@qa/shared';

export class SinglePageAnalyzer {
  private plugins: Map<string, IAnalyzerPlugin> = new Map();
  private browser: Browser | null = null;

  constructor() {}

  public registerPlugin(plugin: IAnalyzerPlugin) {
    this.plugins.set(plugin.name, plugin);
  }

  public async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
  }

  public async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  public async runCheck(url: string, pluginName: string): Promise<TestReport[]> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found.`);
    }

    if (!this.browser) {
      await this.init();
    }

    const context = await this.browser!.newContext();
    const page = await context.newPage();
    
    let statusCode = 200;
    let headers: Record<string, string> = {};
    const consoleLogs: { type: string; text: string }[] = [];
    const networkRequests: { url: string; status: number; type: string }[] = [];

    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    page.on('response', response => {
      if (response.url() === url) {
        statusCode = response.status();
        headers = response.headers();
      }
      networkRequests.push({
        url: response.url(),
        status: response.status(),
        type: response.request().resourceType()
      });
    });

    try {
      const startTime = Date.now();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      const responseTimeMs = Date.now() - startTime;
      
      const html = await page.content();
      
      const pageData: PageData = {
        url,
        html,
        statusCode,
        headers,
        responseTimeMs,
        consoleLogs,
        networkRequests
      };

      const reports = await plugin.analyze(pageData);
      return reports;
    } finally {
      await context.close();
    }
  }
}
