// src/security/complianceEngine.js
// Bulguları analiz ederek KVKK, GDPR, PCI-DSS ve OWASP standartlarına
// göre uyumluluk puanları (0-100%) ve durumları hesaplar.

/**
 * Mevcut bulgulara göre regülasyon uyumluluk skorlarını hesaplar.
 * @param {Object[]} findings
 * @param {Object} stats
 * @returns {{
 *   kvkkGdpr: { score: number, status: string, issues: string[] },
 *   pciDss: { score: number, status: string, issues: string[] },
 *   owasp: { score: number, status: string, issues: string[] },
 *   letterGrade: { grade: string, color: string, label: string }
 * }}
 */
export function calculateCompliance(findings = [], stats = {}) {
  let kvkkDeduction = 0;
  let pciDeduction = 0;
  let owaspDeduction = 0;

  const kvkkIssues = [];
  const pciIssues = [];
  const owaspIssues = [];

  for (const f of findings) {
    const sev = f.severity;
    const cat = f.category;
    const title = f.title.toLowerCase();

    // ── 1. KVKK / GDPR (Kullanıcı Verisi & Çerez Gizliliği) ───────────────────
    if (cat === 'cookies' || title.includes('cookie')) {
      kvkkDeduction += sev === 'high' ? 25 : sev === 'medium' ? 15 : 8;
      kvkkIssues.push('Insecure Cookie configuration (Missing Secure/HttpOnly/SameSite)');
    }
    if (cat === 'https' || title.includes('https not enabled')) {
      kvkkDeduction += 35;
      kvkkIssues.push('Unencrypted communication (No HTTPS)');
    }
    if (cat === 'mixed-content') {
      kvkkDeduction += 15;
      kvkkIssues.push('Mixed content leaks user data over HTTP');
    }
    if (title.includes('form') && title.includes('sensitive')) {
      kvkkDeduction += 20;
      kvkkIssues.push('Unprotected form inputs without secure transmission');
    }

    // ── 2. PCI-DSS (Ödeme & Kart Güvenliği Standartları) ─────────────────────
    if (cat === 'https' || title.includes('https not enabled')) {
      pciDeduction += 45;
      pciIssues.push('PCI-DSS Requirement 4: Sensitive payment data must be encrypted in transit');
    }
    if (cat === 'mixed-content') {
      pciDeduction += 25;
      pciIssues.push('PCI-DSS Requirement 6: Mixed active content risks payment interception');
    }
    if (title.includes('strict-transport-security') || title.includes('hsts')) {
      pciDeduction += 15;
      pciIssues.push('Missing HSTS enforcement for payment transport');
    }
    if (title.includes('x-frame-options') || title.includes('clickjacking')) {
      pciDeduction += 20;
      pciIssues.push('Missing Clickjacking protection on payment/form surfaces');
    }
    if (title.includes('vulnerable') && cat.includes('library')) {
      pciDeduction += 30;
      pciIssues.push('Known vulnerable JavaScript libraries present (Magecart risk)');
    }

    // ── 3. OWASP Top 10 (Genel Uygulama Hijyeni) ─────────────────────────────
    if (sev === 'critical') {
      owaspDeduction += 35;
      owaspIssues.push(f.title);
    } else if (sev === 'high') {
      owaspDeduction += 20;
      owaspIssues.push(f.title);
    } else if (sev === 'medium') {
      owaspDeduction += 8;
    } else if (sev === 'low') {
      owaspDeduction += 2;
    }
  }

  const kvkkScore = Math.max(0, 100 - kvkkDeduction);
  const pciScore = Math.max(0, 100 - pciDeduction);
  const owaspScore = Math.max(0, 100 - owaspDeduction);

  // ── Harf Notu (Letter Grade) Hesaplama ──────────────────────────────────────
  let grade = 'A+';
  let gradeColor = '#10b981';
  let gradeLabel = 'Exceptional Security';

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;

  if (criticalCount > 0) {
    grade = 'F';
    gradeColor = '#ef4444';
    gradeLabel = 'Critical Risk Detected';
  } else if (highCount >= 2) {
    grade = 'D';
    gradeColor = '#f97316';
    gradeLabel = 'High Exposure';
  } else if (highCount === 1 || mediumCount >= 4) {
    grade = 'C';
    gradeColor = '#f59e0b';
    gradeLabel = 'Needs Immediate Hardening';
  } else if (mediumCount >= 1 || findings.length > 5) {
    grade = 'B';
    gradeColor = '#3b82f6';
    gradeLabel = 'Good, Minor Hardening Needed';
  } else if (findings.length > 0) {
    grade = 'A';
    gradeColor = '#10b981';
    gradeLabel = 'Strong Security Baseline';
  }

  return {
    kvkkGdpr: {
      score: kvkkScore,
      status: kvkkScore >= 85 ? 'Compliant' : kvkkScore >= 60 ? 'Needs Review' : 'Non-Compliant',
      color: kvkkScore >= 85 ? '#10b981' : kvkkScore >= 60 ? '#f59e0b' : '#ef4444',
      issues: [...new Set(kvkkIssues)]
    },
    pciDss: {
      score: pciScore,
      status: pciScore >= 90 ? 'Ready' : pciScore >= 70 ? 'Partial' : 'Fails Requirements',
      color: pciScore >= 90 ? '#10b981' : pciScore >= 70 ? '#f59e0b' : '#ef4444',
      issues: [...new Set(pciIssues)]
    },
    owasp: {
      score: owaspScore,
      status: owaspScore >= 80 ? 'Pass' : owaspScore >= 50 ? 'Warning' : 'Fail',
      color: owaspScore >= 80 ? '#10b981' : owaspScore >= 50 ? '#f59e0b' : '#ef4444',
      issues: [...new Set(owaspIssues)]
    },
    letterGrade: {
      grade,
      color: gradeColor,
      label: gradeLabel
    }
  };
}
