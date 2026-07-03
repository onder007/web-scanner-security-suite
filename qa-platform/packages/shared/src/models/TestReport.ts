export type Status = 'PASS' | 'FAIL' | 'WARNING' | 'INFO' | 'NEEDS_IMPROVEMENT' | 'PENDING';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
export type Category = 'SEO' | 'SECURITY' | 'PERFORMANCE' | 'ACCESSIBILITY' | 'BEST_PRACTICE' | 'RELIABILITY' | 'NETWORK';

export interface TestReport {
  id: string; // Unique ID for checklist logic
  testName: string;
  status: Status;
  riskLevel: RiskLevel;
  category: Category;
  affectedPage: string;
  foundIssue: string;
  technicalDescription: string;
  userImpact: string;
  seoImpact: string;
  performanceImpact: string;
  securityImpact: string;
  suggestedFix: string;
  exampleCode: string;
  relatedStandard: string;
  referenceSource: string;
}
