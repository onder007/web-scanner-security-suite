import { Server } from 'socket.io';
import { CrawlerEngine } from '@qa/crawler';
import { BrokenLinkScanner, SEOAnalyzer } from '@qa/plugins';
import { TestReport } from '@qa/shared';

export class ScanManager {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public async startScan(url: string) {
    this.io.emit('scan_progress', {
      status: 'INITIALIZING',
      message: `Starting scan for ${url}...`,
      progress: 0,
      stats: {
        scannedPages: 0,
        remainingPages: 0,
        foundLinks: 0,
        processedLinks: 0,
        failedTests: 0,
        totalErrors: 0,
        totalWarnings: 0,
      }
    });

    try {
      const engine = new CrawlerEngine();
      engine.registerPlugin(new BrokenLinkScanner());
      engine.registerPlugin(new SEOAnalyzer());
      // More plugins can be registered here...

      let startMs = Date.now();
      
      const reports = await engine.startScan(url, (stats) => {
        // Calculate a rough progress percentage (just for UI purposes)
        const totalKnown = stats.scannedPages + stats.remainingPages;
        const progress = totalKnown === 0 ? 0 : Math.min(99, Math.round((stats.scannedPages / totalKnown) * 100));
        
        this.io.emit('scan_progress', {
          status: 'CRAWLING',
          message: `Crawling ${stats.currentUrl}`,
          progress,
          stats
        });
      });

      // Calculate final score
      const qualityScore = this.calculateQualityScore(reports);
      const criticalIssues = reports
        .filter(r => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH')
        .map(r => r.testName);
      
      const uniqueCriticals = Array.from(new Set(criticalIssues)).slice(0, 5);

      this.io.emit('scan_progress', {
        status: 'COMPLETED',
        message: `Scan completed successfully in ${((Date.now() - startMs) / 1000).toFixed(1)}s.`,
        progress: 100,
      });
      
      this.io.emit('scan_completed', {
        qualityScore,
        reports,
        executiveSummary: {
           readyForProduction: qualityScore >= 80,
           criticalIssues: uniqueCriticals.length > 0 ? uniqueCriticals : ['No critical issues found.'],
           fixPriority: uniqueCriticals.length > 0 ? `Priority fix required for: ${uniqueCriticals[0]}` : 'Looking good!',
           estimatedScoreAfterFix: Math.min(100, qualityScore + (uniqueCriticals.length * 5))
        }
      });
    } catch (error: any) {
      this.io.emit('scan_progress', {
        status: 'ERROR',
        message: `Scan failed: ${error.message}`,
        progress: 0,
      });
      console.error(error);
    }
  }

  private calculateQualityScore(reports: TestReport[]): number {
    let score = 100;
    reports.forEach(report => {
      if (report.status === 'FAIL') {
        switch (report.riskLevel) {
          case 'CRITICAL': score -= 15; break;
          case 'HIGH': score -= 10; break;
          case 'MEDIUM': score -= 5; break;
          case 'LOW': score -= 2; break;
        }
      }
    });
    return Math.max(0, score);
  }
}
