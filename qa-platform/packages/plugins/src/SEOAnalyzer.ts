import { IAnalyzerPlugin, PageData, TestReport } from '@qa/shared';

export class SEOAnalyzer implements IAnalyzerPlugin {
  public name = 'SEO Analyzer';
  public category = 'SEO' as const;
  public description = 'Analyzes page structure for SEO best practices.';

  public async analyze(pageData: PageData): Promise<TestReport[]> {
    const reports: TestReport[] = [];
    
    // Check for Title
    const hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(pageData.html);
    if (!hasTitle) {
      reports.push({
        id: 'seo-title',
        testName: 'Missing Title Tag',
        status: 'FAIL',
        riskLevel: 'HIGH',
        category: this.category,
        affectedPage: pageData.url,
        foundIssue: 'Sayfada <title> etiketi bulunmuyor.',
        technicalDescription: 'HTML belgesinin <head> bölümünde geçerli bir <title> etiketi tespit edilemedi.',
        userImpact: 'Tarayıcı sekmesinde sayfa başlığı görünmez.',
        seoImpact: 'Arama motorları sayfanın içeriğini anlamlandıramaz, arama sonuçlarında gösterim yapılamaz.',
        performanceImpact: 'Yok',
        securityImpact: 'Yok',
        suggestedFix: '<head> etiketleri arasına sayfa içeriğini özetleyen 50-60 karakterlik bir <title> etiketi ekleyin.',
        exampleCode: '<title>Ürünler - Nexus E-Ticaret</title>',
        relatedStandard: 'Google SEO Starter Guide',
        referenceSource: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
      });
    }

    // Check for Alt tags on images
    const imgRegex = /<img([^>]+)>/g;
    let match;
    let missingAltCount = 0;
    while ((match = imgRegex.exec(pageData.html)) !== null) {
      const imgAttrs = match[1];
      if (!/alt=["']/i.test(imgAttrs)) {
        missingAltCount++;
      }
    }

    if (missingAltCount > 0) {
      reports.push({
        id: 'seo-alt',
        testName: 'Missing Alt Text',
        status: 'FAIL',
        riskLevel: 'MEDIUM',
        category: 'ACCESSIBILITY', // Mixed category for demo
        affectedPage: pageData.url,
        foundIssue: `${missingAltCount} resimde ALT etiketi bulunmuyor.`,
        technicalDescription: 'Sayfadaki <img> etiketlerinde "alt" özniteliği eksik bırakılmış.',
        userImpact: 'Ekran okuyucu kullanan görme engelli kullanıcılar görsellerin ne anlama geldiğini anlayamaz.',
        seoImpact: 'Google görsel aramalarında resimler indekslenmez ve sayfa bağlamı anlaşılamaz.',
        performanceImpact: 'Yok',
        securityImpact: 'Yok',
        suggestedFix: 'Tüm img etiketlerine, görseli açıklayan, anahtar kelime içermeyen açıklayıcı alt değerleri eklenmelidir.',
        exampleCode: '<img src="logo.png" alt="Nexus QA Platform Logosu" />',
        relatedStandard: 'WCAG 2.1 (1.1.1 Non-text Content)',
        referenceSource: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
      });
    }

    return reports;
  }
}
