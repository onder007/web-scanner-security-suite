// src/utils/i18n.js
// Turkish and English localization dictionary

export const translations = {
  tr: {
    // Header & Tabs
    appName: 'Web Tarayıcı',
    appSubtitle: 'Kırık Link Denetleyici & Pasif Güvenlik Analizi',
    tabBrokenLinks: 'Kırık Linkler',
    tabSecurity: 'Güvenlik Denetimi',
    tabHistory: 'Tarama Geçmişi',
    proBadgeActive: 'PRO AKTİF',
    getPro: 'PRO AL / ETKİNLEŞTİR',
    adminBadge: 'ADMİN AKTİF',

    // Scan Controls
    urlPlaceholder: 'https://ornek.com',
    scanLinks: 'Linkleri Tara',
    pause: 'Duraklat',
    stop: 'Durdur',
    resume: 'Devam Et',
    pleaseEnterUrl: 'Lütfen geçerli bir internet adresi (URL) girin',

    // Live Terminal
    liveTerminal: 'Canlı Olay Akışı',
    events: 'olay',
    showTerminal: 'Terminali Göster',
    collapseTerminal: 'Terminali Gizle',
    waitingScan: 'Tarayıcının başlaması bekleniyor...',

    // Dashboard
    scanProgress: 'Tarama İlerlemesi',
    pages: 'Sayfa',
    scanned: 'Taranan',
    pending: 'Bekleyen',
    success200: 'Başarılı (200)',
    error404: '404 Bulunamadı',
    error500: 'Sunucu Hatası (5xx)',
    redirects: 'Yönlendirmeler (3xx)',

    // Results Table
    scanResults: 'Tarama Sonuçları',
    searchUrl: 'URL Ara...',
    allStatuses: 'Tüm Durumlar',
    onlySuccess: 'Sadece Başarılı (200)',
    onlyErrors: 'Sadece Hatalar (4xx, 5xx)',
    only404: 'Sadece 404',
    only500: 'Sadece 5xx',
    onlyRedirects: 'Sadece Yönlendirmeler (3xx)',
    exportCSV: 'CSV İndir',
    exportJSON: 'JSON İndir',
    tableColUrl: 'URL',
    tableColStatus: 'Durum',
    tableColTime: 'Süre (ms)',
    tableColType: 'İçerik Türü',
    tableColReferer: 'Bulunduğu Yer (Referer)',

    // Crawler Settings
    crawlerSettings: 'Tarayıcı Motoru Ayarları',
    maxConcurrency: 'Maks Eşzamanlı İstek (Threads)',
    timeout: 'Zaman Aşımı (ms)',
    delay: 'İstekler Arası Bekleme (ms)',
    userAgent: 'Bot User-Agent Başlığı',
    excludePatterns: 'Hariç Tutulacak URL Yolları (virgülle ayırın, örn. /wp-admin, /sepet)',
    ignoreRobots: 'robots.txt kurallarını yoksay',

    // Security Dashboard
    secScore: 'Güvenlik Skoru',
    visualReports: 'Görsel Raporlar',
    bySeverity: 'Önem Derecesine Göre',
    byCategory: 'Kategoriye Göre',
    critical: 'Kritik',
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük',
    info: 'Bilgi',

    // Security Findings & Subtabs
    findings: 'Bulgular',
    networkInspector: 'Ağ İnceleyici',
    scanLogs: 'Tarama Günlükleri',
    filterFindings: 'Bulgularda ara (başlık, URL, parametre)...',
    urgent: 'Acil',
    copyFixSnippet: 'Düzeltme Kodunu Kopyala',
    copied: 'Kopyalandı!',

    // Theme & Lang
    themeDark: 'Koyu Tema',
    themeLight: 'Açık Tema',

    // License Modal
    licenseTitle: 'Web Scanner',
    licenseSubtitle: 'Hızlı aktivasyon — Üyelik formu yok, şifre derdi yok',
    currentPlan: 'Mevcut Paket',
    freePlan: 'Ücretsiz Standart',
    proPlan: 'PRO Sınırsız',
    adminPlan: 'Yönetici (Admin) Erişimi',
    deactivate: 'Lisansı Kaldır',
    featVulnerability: 'Derin Güvenlik Motoru: OWASP, XSS, CSRF & Veri Sızıntısı Denetimi',
    featFixSnippets: '1-Tıkla Hazır Düzeltme Kodları: Nginx, Apache, Express & Caddy',
    featNetwork: 'Canlı Ağ Paketi İnceleyici: Başlık ve istek kurcalama analizi',
    featExport: 'Yönetici Raporu: Anında PDF Güvenlik Denetim Raporu & CSV Çıktısı',
    getLicenseKeyBtn: 'Lisans Satın Al ($14 Ömür Boyu)',
    licenseInputPlaceholder: 'Lisans anahtarınızı girin...',
    activateBtn: 'Etkinleştir',
    verifying: 'Doğrulanıyor...',
    successActivated: 'Lisans başarıyla etkinleştirildi. Tüm özellikler sınırsız açıldı.',
    errorKeyRequired: 'Lütfen geçerli bir lisans anahtarı girin.',
    keyGatePrompt: 'Uzantıyı tam yetkiyle kullanmak için lisans anahtarınızı girin.',

    // First time banner
    gateBannerTitle: 'Ücretsiz Mod',
    gateBannerDesc: 'Tüm özellikleri sınırsız kullanmak için lisans anahtarınızı girin.',
    gateBannerBtn: 'Lisansı Etkinleştir'
  },
  en: {
    // Header & Tabs
    appName: 'Web Scanner',
    appSubtitle: 'Broken Link Inspector & Passive Security Suite',
    tabBrokenLinks: 'Broken Links',
    tabSecurity: 'Security Audit',
    tabHistory: 'Audit History',
    proBadgeActive: 'PRO ACTIVE',
    getPro: 'GET PRO',
    adminBadge: 'ADMIN ACTIVE',

    // Scan Controls
    urlPlaceholder: 'https://example.com',
    scanLinks: 'Scan Links',
    pause: 'Pause',
    stop: 'Stop',
    resume: 'Resume',
    pleaseEnterUrl: 'Please enter a valid website URL',

    // Live Terminal
    liveTerminal: 'Live Event Stream',
    events: 'events',
    showTerminal: 'Show Terminal',
    collapseTerminal: 'Collapse',
    waitingScan: 'Waiting for crawler to start...',

    // Dashboard
    scanProgress: 'Scan Progress',
    pages: 'Pages',
    scanned: 'Scanned',
    pending: 'Pending',
    success200: 'Success (200)',
    error404: '404 Not Found',
    error500: 'Server Errors (5xx)',
    redirects: 'Redirects (3xx)',

    // Results Table
    scanResults: 'Scan Results',
    searchUrl: 'Search URL...',
    allStatuses: 'All Statuses',
    onlySuccess: 'Only Success (200)',
    onlyErrors: 'Only Errors (4xx, 5xx)',
    only404: 'Only 404',
    only500: 'Only 5xx',
    onlyRedirects: 'Only Redirects (3xx)',
    exportCSV: 'Export CSV',
    exportJSON: 'Export JSON',
    tableColUrl: 'URL',
    tableColStatus: 'Status',
    tableColTime: 'Time (ms)',
    tableColType: 'Content Type',
    tableColReferer: 'Found At (Referer)',

    // Crawler Settings
    crawlerSettings: 'Crawler Engine Settings',
    maxConcurrency: 'Max Concurrency (Threads)',
    timeout: 'Request Timeout (ms)',
    delay: 'Delay Between Requests (ms)',
    userAgent: 'Bot User-Agent Header',
    excludePatterns: 'Exclude URL Patterns (comma-separated, e.g. /wp-admin, /cart)',
    ignoreRobots: 'Ignore robots.txt directives',

    // Security Dashboard
    secScore: 'Security Score',
    visualReports: 'Visual Reports',
    bySeverity: 'By Severity',
    byCategory: 'By Category',
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    info: 'Info',

    // Security Findings & Subtabs
    findings: 'Findings',
    networkInspector: 'Network Inspector',
    scanLogs: 'Scan Logs',
    filterFindings: 'Filter findings by title, evidence, parameter, or URL...',
    urgent: 'Urgent',
    copyFixSnippet: 'Copy Fix Snippet',
    copied: 'Copied!',

    // Theme & Lang
    themeDark: 'Dark Theme',
    themeLight: 'Light Theme',

    // License Modal
    licenseTitle: 'Web Scanner',
    licenseSubtitle: 'Instant activation — No sign-up, no passwords',
    currentPlan: 'Current Plan',
    freePlan: 'Free Standard',
    proPlan: 'Pro Lifetime',
    adminPlan: 'Admin Full Access',
    deactivate: 'Deactivate',
    featVulnerability: 'Deep Vulnerability Engine: OWASP, XSS, CSRF & Leak Checks',
    featFixSnippets: '1-Click Fix Snippets: Nginx, Apache, Express & Caddy configs',
    featNetwork: 'Live Network Traffic Inspector: Packet capture & tampering analysis',
    featExport: 'Executive Export: Instant PDF security audit & CSV reporting',
    getLicenseKeyBtn: 'Get License Key ($14 Lifetime)',
    licenseInputPlaceholder: 'Enter your license key...',
    activateBtn: 'Activate',
    verifying: 'Verifying...',
    successActivated: 'Successfully activated. All Pro & Admin features unlocked.',
    errorKeyRequired: 'Please enter a valid license key.',
    keyGatePrompt: 'Enter your license key to unlock full features.',

    // First time banner
    gateBannerTitle: 'Free Mode Active',
    gateBannerDesc: 'Enter your license key to unlock unrestricted scans.',
    gateBannerBtn: 'Activate License'
  }
};
