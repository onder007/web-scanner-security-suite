// src/security/dnsEmailDetector.js
// Cloudflare / Google DNS-over-HTTPS (DoH) API'sini kullanarak
// pasif olarak domainin SPF (TXT) ve DMARC (TXT) kayıtlarını denetler.
// Hiçbir aktif tarama yapmaz, sadece halka açık DNS kayıtlarını sorgular.

import { createFinding } from './findingsModel.js';

/**
 * Cloudflare DNS-over-HTTPS (DoH) API ile TXT kayıtlarını sorgular
 * @param {string} domain 
 * @returns {Promise<string[]>}
 */
async function queryDohTxt(domain) {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=TXT`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/dns-json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.Answer || !Array.isArray(data.Answer)) return [];
    
    // DoH verisi genellikle tırnak işaretleriyle döner ("v=spf1 ...")
    return data.Answer.map(ans => (ans.data || '').replace(/^"|"$/g, '').trim());
  } catch (err) {
    // DNS sorgusu başarısız olursa sessizce boş dön
    return [];
  }
}

/**
 * Domainin SPF ve DMARC e-posta güvenliği yapılandırmasını denetler.
 * @param {string} pageUrl 
 * @returns {Promise<Object[]>}
 */
export async function analyzeDnsEmailSecurity(pageUrl) {
  const findings = [];
  let domain = '';
  try {
    domain = new URL(pageUrl).hostname;
    // Eğer localhost veya IP adresi ise atla
    if (domain === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(domain)) {
      return findings;
    }
  } catch {
    return findings;
  }

  // ── 1. SPF Kontrolü ────────────────────────────────────────────────────────
  const rootTxtRecords = await queryDohTxt(domain);
  const spfRecord = rootTxtRecords.find(txt => txt.toLowerCase().startsWith('v=spf1'));

  if (!spfRecord) {
    findings.push(createFinding({
      category: 'configuration',
      title: 'Missing SPF Record (Email Spoofing Risk)',
      severity: 'high',
      confidence: 'high',
      url: `dns://${domain}`,
      evidence: `No SPF (Sender Policy Framework) record was found in DNS for "${domain}". Any unauthorized mail server can send forged emails appearing to come from your domain.`,
      recommendation: 'Add a TXT record to your DNS zone with your authorized mail servers. Example: "v=spf1 include:_spf.google.com ~all".',
    }));
  } else {
    // SPF var ama güvensiz mi? (+all veya eksik mekanizma)
    if (spfRecord.includes('+all')) {
      findings.push(createFinding({
        category: 'configuration',
        title: 'Overly Permissive SPF Record (+all Detected)',
        severity: 'critical',
        confidence: 'high',
        url: `dns://${domain}`,
        evidence: `SPF record contains "+all": "${spfRecord}". This explicitly allows ANY server on the internet to send legitimate emails on behalf of "${domain}".`,
        recommendation: 'Replace "+all" with "-all" (hard fail) or "~all" (soft fail) in your SPF TXT record.',
      }));
    } else if (!spfRecord.includes('~all') && !spfRecord.includes('-all')) {
      findings.push(createFinding({
        category: 'configuration',
        title: 'Weak SPF Record Policy',
        severity: 'medium',
        confidence: 'medium',
        url: `dns://${domain}`,
        evidence: `SPF record does not specify a terminal qualifier (-all or ~all): "${spfRecord}".`,
        recommendation: 'Append "-all" or "~all" to enforce failure for unauthorized mail senders.',
      }));
    } else {
      // SPF geçerli ve güvenli
      findings.push(createFinding({
        category: 'configuration',
        title: 'Valid SPF Record Configured',
        severity: 'info',
        confidence: 'high',
        url: `dns://${domain}`,
        evidence: `SPF Record: ${spfRecord}`,
        recommendation: 'Good job! Regularly audit your SPF record to remove decommissioned third-party email providers.',
      }));
    }
  }

  // ── 2. DMARC Kontrolü ──────────────────────────────────────────────────────
  const dmarcDomain = `_dmarc.${domain}`;
  const dmarcTxtRecords = await queryDohTxt(dmarcDomain);
  const dmarcRecord = dmarcTxtRecords.find(txt => txt.toLowerCase().startsWith('v=dmarc1'));

  if (!dmarcRecord) {
    findings.push(createFinding({
      category: 'configuration',
      title: 'Missing DMARC Policy (Phishing & Impersonation Risk)',
      severity: 'medium',
      confidence: 'high',
      url: `dns://${dmarcDomain}`,
      evidence: `No DMARC record found at "_dmarc.${domain}". Without DMARC, receiving email servers cannot verify if emails passing SPF/DKIM truly belong to your brand, allowing attackers to conduct phishing campaigns.`,
      recommendation: 'Publish a DMARC TXT record at "_dmarc.' + domain + '". Example: "v=DMARC1; p=reject; rua=mailto:dmarc-reports@' + domain + ';".',
    }));
  } else {
    // DMARC var, policy kontrolü (p=none vs p=quarantine / p=reject)
    if (dmarcRecord.includes('p=none')) {
      findings.push(createFinding({
        category: 'configuration',
        title: 'DMARC Policy Set to Monitoring Only (p=none)',
        severity: 'low',
        confidence: 'high',
        url: `dns://${dmarcDomain}`,
        evidence: `DMARC policy is set to "p=none": "${dmarcRecord}". Fake emails from attackers will still be delivered to recipient inboxes; only monitoring reports are collected.`,
        recommendation: 'After reviewing incoming DMARC aggregate reports (rua), upgrade your policy to "p=quarantine" or "p=reject" for active spoofing protection.',
      }));
    } else {
      findings.push(createFinding({
        category: 'configuration',
        title: 'Enforcing DMARC Policy Active',
        severity: 'info',
        confidence: 'high',
        url: `dns://${dmarcDomain}`,
        evidence: `DMARC Policy: ${dmarcRecord}`,
        recommendation: 'Excellent! Your domain is actively protected against email spoofing and brand impersonation.',
      }));
    }
  }

  return findings;
}
