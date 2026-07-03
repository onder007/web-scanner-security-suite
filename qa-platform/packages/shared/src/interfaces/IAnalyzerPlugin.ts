import { TestReport } from '../models/TestReport';

export interface PageData {
  url: string;
  html: string;
  statusCode: number;
  headers: Record<string, string>;
  responseTimeMs: number;
  // If the page was rendered with Playwright, we could have console logs, network reqs, etc.
  consoleLogs?: { type: string; text: string }[];
  networkRequests?: { url: string; status: number; type: string }[];
}

export interface IAnalyzerPlugin {
  name: string;
  category: string;
  description: string;
  
  /**
   * Run the analyzer on the given page data.
   * Modüller bağımsız çalışmalı ve hata atsa bile ana sistemi çökertmemelidir.
   */
  analyze(pageData: PageData): Promise<TestReport[]>;
}
