// src/utils/findingTranslator.js
// Comprehensive Turkish translation dictionary & engine for security findings,
// evidence text, recommendations, categories, confidence levels, and fix snippets.

export const CATEGORY_LABELS_TR = {
  'headers': 'Güvenlik Başlıkları',
  'cookies': 'Çerez Güvenliği',
  'https': 'HTTPS / İletişim',
  'mixed-content': 'Karma İçerik (Mixed Content)',
  'sql-injection-risk': 'SQL Enjeksiyon Riski',
  'xss-risk': 'XSS Zafiyet Riski',
  'sensitive-resource': 'Hassas Dosya / Kaynaklar',
  'configuration': 'Sunucu / Yapılandırma',
  'input': 'Form & Girdi Güvenliği',
  'source-map': 'Kaynak Kod (Source Map)',
  'api-route': 'Gizli API & Rotalar',
  'storage': 'Tarayıcı Depolama / JWT',
  'email-security': 'E-posta & DNS Güvenliği',
  'sri': 'Kaynak Bütünlüğü (SRI)',
  'supply-chain': 'Üçüncü Parti / Tedarik Zinciri',
};

export const CONFIDENCE_LABELS_TR = {
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
  info: 'Bilgi'
};

export const SEVERITY_LABELS_TR = {
  critical: 'KRİTİK',
  high: 'YÜKSEK',
  medium: 'ORTA',
  low: 'DÜŞÜK',
  info: 'BİLGİ'
};

// Title exact matches or prefixes
const TITLE_MAP_TR = {
  'Exposed JavaScript Source Map (.map) Detected': 'Açıkta Kalan JavaScript Kaynak Haritası (.map) Tespit Edildi',
  'Potential Source Map Exposed': 'Olası JavaScript Kaynak Haritası (.map) Açıkta',
  'Missing Security Header: Strict-Transport-Security (HSTS)': 'Eksik Güvenlik Başlığı: Strict-Transport-Security (HSTS)',
  'Missing Security Header: Content-Security-Policy (CSP)': 'Eksik Güvenlik Başlığı: Content-Security-Policy (CSP)',
  'Missing Security Header: X-Frame-Options': 'Eksik Güvenlik Başlığı: X-Frame-Options (Clickjacking Koruması)',
  'Missing Security Header: X-Content-Type-Options': 'Eksik Güvenlik Başlığı: X-Content-Type-Options (MIME Güvenliği)',
  'Missing Security Header: Referrer-Policy': 'Eksik Güvenlik Başlığı: Referrer-Policy (Yönlendiren Gizliliği)',
  'Missing Security Header: Permissions-Policy': 'Eksik Güvenlik Başlığı: Permissions-Policy (İzin Politikası)',
  'Security Headers Could Not Be Inspected': 'Güvenlik Başlıkları İncelenemedi',
  'POST Form Missing CSRF Token': 'POST Formunda CSRF Belirteci (Token) Bulunamadı',
  'Password Field Allows Browser Autocomplete': 'Şifre Alanında Tarayıcı Otomatik Tamamlama Açık',
  'Form Submits Over HTTP from HTTPS Page (Mixed Form)': 'Form HTTPS Sayfadan Güvensiz HTTP\'ye Gönderiliyor (Karma Form)',
  'Password Form Using GET Method — Credentials in URL': 'Şifre Formu GET Metodu Kullanıyor — Kimlik Bilgileri URL\'de Açıkta',
  'Password-Related Parameter in Form Action URL': 'Form Hedef URL\'sinde Şifre İle İlgili Parametre Var',
  'Potential DOM XSS Vulnerability': 'Olası DOM Tabanlı XSS Güvenlik Açığı',
  'Technology Stack Identified': 'Kullanılan Teknoloji Yığını Tespit Edildi',
  'Session Replay / Keystroke Tracker Script Active': 'Oturum Kaydedici / Tuş Takip Betiği Aktif',
  'Server Version Disclosed': 'Sunucu Sürüm Bilgisi Açıkta (Server Header)',
  'Backend Technology Disclosed via X-Powered-By': 'Arka Uç Teknolojisi X-Powered-By İle Açıkta',
  'CMS/Generator Disclosed via X-Generator': 'İçerik Yönetim Sistemi X-Generator İle Açıkta',
  '.NET Framework Version Disclosed': '.NET Framework Sürümü Açıkta',
  'ASP.NET MVC Version Disclosed': 'ASP.NET MVC Sürümü Açıkta',
  'Drupal CMS Detected via Response Header': 'Yanıt Başlığında Drupal CMS Tespit Edildi',
  'WordPress Detected via Response Header': 'Yanıt Başlığında WordPress Tespit Edildi',
  'Ruby on Rails Application Detected': 'Ruby on Rails Uygulaması Tespit Edildi',
  'Symfony Debug Token Exposed': 'Symfony Hata Ayıklama (Debug) Belirteci Açıkta',
  'Symfony Debug Profiler Link Exposed': 'Symfony Debug Profiler Bağlantısı Açıkta',
  'CMS/Generator Version Disclosed in Meta Tag': 'Meta Etiketinde CMS/Sürüm Bilgisi Açıkta',
  'Author Name Disclosed in Meta Tag': 'Meta Etiketinde Geliştirici/Yazar Adı Açıkta',
  'Legacy Internet Explorer Compatibility Mode Enabled': 'Eski Internet Explorer Uyumluluk Modu Açık',
  'Internal Hostname Leaked via DNS Prefetch': 'DNS Önceden Getirme İle Dahili Sunucu Adı Sızdırıldı',
  'Unsafe PostMessage Listener (Missing Origin Verification)': 'Güvensiz PostMessage Dinleyicisi (Origin Doğrulaması Eksik)',
  'Potential Environment File Exposed': 'Hassas Ortam Yapılandırması (.env) Açıkta Olabilir',
  'Potential Git Repository Exposed': 'Kaynak Kod (.git Deposu) Açıkta Olabilir',
  'Exposed Backup / Archive File': 'Yedekleme / Arşiv Dosyası Açıkta Olabilir',
  'Exposed Configuration File': 'Sunucu Yapılandırma Dosyası Açıkta Olabilir',
  'Exposed Database Dump': 'Veritabanı Yedeği (.sql) Açıkta Olabilir',
  'Exposed phpinfo() / Server Diagnostic Page': 'phpinfo() / Sunucu Tanılama Sayfası Açıkta',
  'Outdated / Vulnerable JavaScript Library Detected': 'Eski / Güvenlik Açığı Olan JavaScript Kütüphanesi Tespit Edildi',
  'Mixed Content Detected': 'Karma İçerik (Mixed Content) Tespit Edildi',
  'Unencrypted HTTP Communication': 'Şifrelenmemiş HTTP İletişimi (HTTPS Yok)',
  'Insecure Cookie: Missing Secure Flag': 'Güvensiz Çerez: Secure Bayrağı Eksik',
  'Insecure Cookie: Missing HttpOnly Flag': 'Güvensiz Çerez: HttpOnly Bayrağı Eksik',
  'Insecure Cookie: Missing SameSite Attribute': 'Güvensiz Çerez: SameSite Özelliği Eksik',
  'SPF Record Missing or Ineffective': 'SPF Kaydı Eksik veya Geçersiz (E-posta Sahteciliği Riski)',
  'DMARC Policy Missing or None': 'DMARC Politikası Eksik veya Etkisiz (Alan Adı Taklit Riski)',
  'Hidden API Routes & Endpoints Discovered': 'Gizli API Uç Noktaları ve Rotalar Keşfedildi',
  'Stack Trace / Database Error Disclosed': 'Yanıt İçinde Hata İzi (Stack Trace) veya Veritabanı Hatası Sızdırıldı',
  'Potential Open Redirect Risk': 'Olası Açık Yönlendirme (Open Redirect) Riski',
  'Disallowed Paths Disclosed in robots.txt': 'robots.txt Dosyasında Gizli Dizin Yolları İfşa Edildi',
  'Exposed API Key / Secret Token Detected': 'Açıkta Kalan API Anahtarı / Gizli Belirteç Tespit Edildi',
};

// Snippet server title translations
export const SNIPPET_SERVER_TR = {
  'Nginx (Block .map files)': 'Nginx (.map Dosyalarını Engelle)',
  'Next.js (Disable Source Maps)': 'Next.js (Kaynak Haritalarını Kapat)',
  'Vite': 'Vite (Üretim Yapılandırması)',
  'HTML Meta Tag': 'HTML Meta Etiketi',
  'Apache (.htaccess)': 'Apache (.htaccess)',
  'Nginx': 'Nginx',
  'Cloudflare': 'Cloudflare',
  'Next.js': 'Next.js',
  'Caddy': 'Caddy',
  'Express (Node.js)': 'Express (Node.js)'
};

/**
 * Translates a finding title into Turkish
 */
export function translateTitle(title, lang) {
  if (lang !== 'tr' || !title) return title;
  if (TITLE_MAP_TR[title]) return TITLE_MAP_TR[title];

  // Dynamic prefix/pattern replacements
  if (title.startsWith('Missing Security Header:')) {
    return title.replace('Missing Security Header:', 'Eksik Güvenlik Başlığı:');
  }
  if (title.startsWith('Weak Security Header:')) {
    return title.replace('Weak Security Header:', 'Zayıf Güvenlik Başlığı:');
  }
  if (title.startsWith('Security Gateway / WAF Detected:')) {
    return title.replace('Security Gateway / WAF Detected:', 'Güvenlik Ağ Geçidi / WAF Tespit Edildi:');
  }
  if (title.startsWith('Missing Subresource Integrity on')) {
    return title
      .replace('Missing Subresource Integrity on', 'Alt Kaynak Bütünlüğü (SRI) Eksik:')
      .replace('CDN Resources', 'CDN Kaynağı')
      .replace('CDN Resource', 'CDN Kaynağı')
      .replace('External Resources', 'Harici Kaynak')
      .replace('External Resource', 'Harici Kaynak');
  }
  if (title.includes('Reverse Tabnapping Risk:')) {
    return title.replace('Reverse Tabnapping Risk:', 'Ters Tabnapping Riski:').replace('Missing rel="noopener"', 'rel="noopener" Özelliği Eksik');
  }
  if (title.startsWith('Sensitive JWT Token Stored in')) {
    return title.replace('Sensitive JWT Token Stored in', 'Hassas JWT Belirteci Saklanıyor:');
  }
  if (title.startsWith('Cleartext Password Key Found in')) {
    return title.replace('Cleartext Password Key Found in', 'Düz Metin Şifre Anahtarı Bulundu:');
  }
  if (title.startsWith('Sensitive Authentication Key in')) {
    return title.replace('Sensitive Authentication Key in', 'Hassas Kimlik Doğrulama Anahtarı:');
  }
  if (title.startsWith('JavaScript Library Detected:')) {
    return title.replace('JavaScript Library Detected:', 'JavaScript Kütüphanesi Tespit Edildi:');
  }
  if (title.startsWith('Usage of Dangerous JS Sinks')) {
    return title.replace('Usage of Dangerous JS Sinks', 'Tehlikeli JS Sink Fonksiyonları Kullanımı');
  }
  if (title.startsWith('Third-Party Script Supply Chain Map')) {
    return title.replace('Third-Party Script Supply Chain Map', 'Üçüncü Taraf Betik Tedarik Zinciri Haritası');
  }

  return title;
}

/**
 * Translates finding evidence into Turkish
 */
export function translateEvidence(evidence, lang, finding = {}) {
  if (lang !== 'tr' || !evidence) return evidence;

  // Source map
  if (evidence.includes('A publicly accessible source map was discovered')) {
    const urlMatch = evidence.match(/at "(.*?)"/);
    const mapUrl = urlMatch ? urlMatch[1] : finding.url || '';
    return `"${mapUrl}" adresinde herkese açık bir kaynak haritası (.map) tespit edildi. Saldırganlar veya rakipler, minify edilmiş üretim kodlarınızı orijinal yorumlar, dahili API rotaları ve iş mantığı dahil kaynak TypeScript/React kodlarına geri dönüştürebilir.`;
  }

  // HSTS
  if (evidence.includes('Strict-Transport-Security') && (evidence.includes('missing') || evidence.includes('not set'))) {
    return 'Strict-Transport-Security (HSTS) başlığı yanıtta bulunamadı. Tarayıcılar siteye güvenli olmayan düz HTTP üzerinden de bağlanabilir, bu durum Man-in-the-Middle (Ortadaki Adam) ve SSL şifre çözme saldırılarına imkan tanır.';
  }

  // CSP
  if (evidence.includes('Content-Security-Policy') && (evidence.includes('missing') || evidence.includes('not set'))) {
    return 'Content-Security-Policy (CSP) başlığı tanımlanmamış. Bu durum sitenizi XSS (Cross-Site Scripting), yetkisiz betik çalıştırma ve veri hırsızlığı saldırılarına karşı korumasız bırakır.';
  }

  // X-Frame-Options
  if (evidence.includes('X-Frame-Options') && (evidence.includes('missing') || evidence.includes('not set'))) {
    return 'X-Frame-Options başlığı eksik. Sayfa başka siteler tarafından gizli bir iframe içine yerleştirilebilir ve kullanıcıları yanıltıcı tıklamalar yapmaya zorlayan Clickjacking saldırılarına maruz kalabilir.';
  }

  // X-Content-Type-Options
  if (evidence.includes('X-Content-Type-Options') && (evidence.includes('missing') || evidence.includes('nosniff'))) {
    return 'X-Content-Type-Options başlığı eksik veya "nosniff" olarak ayarlanmamış. Tarayıcıların dosya MIME türlerini yanlış yorumlayarak zararlı içerikleri çalıştırmasını engelleyen güvenlik önlemi aktif değil.';
  }

  // Referrer-Policy
  if (evidence.includes('Referrer-Policy') && (evidence.includes('missing') || evidence.includes('not set'))) {
    return 'Referrer-Policy başlığı eksik. Kullanıcılar harici bir bağlantıya tıkladığında tam sayfa URL\'si ve hassas GET parametreleri hedef sunuculara referer başlığıyla sızabilir.';
  }

  // Permissions-Policy
  if (evidence.includes('Permissions-Policy') && (evidence.includes('missing') || evidence.includes('not set'))) {
    return 'Permissions-Policy başlığı eksik. Kamera, mikrofon, coğrafi konum ve ödeme API\'leri gibi hassas tarayıcı yeteneklerinin gömülü iframeler tarafından kullanımı sınırlandırılmamış.';
  }

  // POST without CSRF
  if (evidence.includes('CSRF token') || evidence.includes('CSRF')) {
    return 'Form gönderiminde herhangi bir anti-CSRF belirteci (token) tespit edilemedi. Başka siteler kullanıcının açık olan oturumunu istismar ederek onun adına yetkisiz işlemler gerçekleştirebilir.';
  }

  // Autocomplete password
  if (evidence.includes('autocomplete') && evidence.includes('password')) {
    return 'Şifre giriş alanında autocomplete="off" veya autocomplete="current-password" özelliği kullanılmamış. Ortak veya halka açık cihazlarda şifre tarayıcı önbelleğine kaydedilerek başkalarının eline geçebilir.';
  }

  // Subresource Integrity (SRI)
  if (evidence.includes('Subresource Integrity') || evidence.includes('integrity attribute')) {
    return 'Sayfada yüklenen harici script veya stil dosyalarında "integrity" (SRI) doğrulaması bulunamadı. İçerik dağıtım ağı (CDN) tehlikeye girerse sitenize zararlı kod enjekte edilebilir.';
  }

  // Tabnapping
  if (evidence.includes('rel="noopener"') || evidence.includes('target="_blank"')) {
    return 'target="_blank" ile açılan harici bağlantılarda rel="noopener noreferrer" özelliği eksik. Açılan harici sayfa, window.opener nesnesi üzerinden ana sayfanızı sahte bir giriş ekranına yönlendirebilir (Reverse Tabnapping).';
  }

  // Cookies
  if (evidence.includes('HttpOnly') || evidence.includes('Secure') || evidence.includes('SameSite')) {
    return 'Oturum veya kimlik çerezi eksik güvenlik bayraklarıyla gönderildi (Secure, HttpOnly veya SameSite eksik). Çerezler JavaScript XSS saldırılarıyla çalınabilir veya şifresiz ağlarda izlenebilir.';
  }

  // SPF / DMARC
  if (evidence.includes('SPF') || evidence.includes('DMARC')) {
    return 'Alan adınızın DNS kayıtlarında geçerli bir SPF veya DMARC politikası bulunamadı ya da politika çok gevşek ("none"). Saldırganlar sizin alan adınız adına sahte e-postalar (spoofing/phishing) gönderebilir.';
  }

  // Storage / JWT
  if (evidence.includes('localStorage') || evidence.includes('sessionStorage') || evidence.includes('JWT')) {
    return 'Tarayıcı yerel depolama alanında (localStorage/sessionStorage) hassas kimlik doğrulama belirteci (JWT) veya şifre anahtarı tespit edildi. Bu veriler olası bir XSS açığında saldırganlar tarafından doğrudan okunabilir.';
  }

  return evidence;
}

/**
 * Translates finding recommendation into Turkish
 */
export function translateRecommendation(rec, lang) {
  if (lang !== 'tr' || !rec) return rec;

  // Source map
  if (rec.includes('.map files') || rec.includes('productionSourceMap')) {
    return '.map dosyalarını canlı (production) sunuculara yüklemeyin. Derleme yapılandırmanızda (Vite/Next.js/Webpack) "sourcemap: false" veya "productionSourceMap: false" ayarını etkinleştirin ya da Nginx/Cloudflare ters vekil sunucunuzda .map uzantılı dosyalara erişimi 404/403 ile engelleyin.';
  }

  // HSTS
  if (rec.includes('Strict-Transport-Security') || rec.includes('max-age=31536000')) {
    return 'Web sunucunuza veya CDN ayarlarınıza "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload" başlığını ekleyin.';
  }

  // CSP
  if (rec.includes('Content-Security-Policy') || rec.includes('CSP')) {
    return 'Siteniz için sıkı bir İçerik Güvenlik Politikası (CSP) başlığı tanımlayın. Betik ve stillerin yalnızca güvenilir kaynaklardan yüklenmesine izin verin, gereksiz \'unsafe-inline\' ve \'unsafe-eval\' izinlerinden kaçının.';
  }

  // X-Frame-Options
  if (rec.includes('X-Frame-Options') || rec.includes('DENY') || rec.includes('SAMEORIGIN')) {
    return 'Web sunucusu başlıklarınıza "X-Frame-Options: SAMEORIGIN" veya "X-Frame-Options: DENY" ekleyin. Modern tarayıcılar için CSP içindeki "frame-ancestors \'self\'" kuralını da yapılandırın.';
  }

  // X-Content-Type-Options
  if (rec.includes('X-Content-Type-Options') || rec.includes('nosniff')) {
    return 'Tüm HTTP yanıtlarına "X-Content-Type-Options: nosniff" başlığını ekleyin.';
  }

  // Referrer-Policy
  if (rec.includes('Referrer-Policy') || rec.includes('strict-origin-when-cross-origin')) {
    return 'Gizlilik ve güvenliği korumak için "Referrer-Policy: strict-origin-when-cross-origin" veya "no-referrer" başlığını tanımlayın.';
  }

  // Permissions-Policy
  if (rec.includes('Permissions-Policy')) {
    return 'Web sunucusu başlıklarınıza "Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()" gibi kısıtlayıcı bir izin politikası ekleyin.';
  }

  // CSRF
  if (rec.includes('CSRF') || rec.includes('anti-CSRF')) {
    return 'Tüm durum değiştiren formlara (POST, PUT, DELETE) sunucu tarafında doğrulanacak benzersiz, tahmin edilemez bir anti-CSRF belirteci (token) ekleyin ve SameSite çerez politikasını Lax veya Strict yapın.';
  }

  // Autocomplete
  if (rec.includes('autocomplete')) {
    return 'Şifre alanlarına autocomplete="current-password" veya autocomplete="new-password" özelliğini ekleyin.';
  }

  // SRI
  if (rec.includes('integrity') || rec.includes('crossorigin')) {
    return 'Harici CDN kaynaklarına "integrity" (örn. sha384-...) ve "crossorigin=\\"anonymous\\"" özelliklerini ekleyin.';
  }

  // Tabnapping
  if (rec.includes('rel="noopener') || rec.includes('noopener')) {
    return 'target="_blank" içeren tüm harici bağlantılara rel="noopener noreferrer" özelliğini ekleyin.';
  }

  // Cookies
  if (rec.includes('HttpOnly') || rec.includes('Secure') || rec.includes('SameSite')) {
    return 'Hassas çerezlerde "Secure", "HttpOnly" ve "SameSite=Lax" (veya Strict) bayraklarını mutlaka etkinleştirin.';
  }

  // SPF / DMARC
  if (rec.includes('SPF') || rec.includes('DMARC')) {
    return 'DNS bölgenize alan adınızı koruyan bir SPF TXT kaydı (v=spf1 ... -all) ve en az karantina modunda (p=quarantine veya p=reject) bir DMARC kaydı ekleyin.';
  }

  // Storage / JWT
  if (rec.includes('localStorage') || rec.includes('httpOnly cookie')) {
    return 'Kimlik doğrulama belirteçlerini (JWT) ve şifreleri localStorage veya sessionStorage içinde saklamayın. Bunları "HttpOnly" ve "Secure" bayraklı çerezlerde tutun.';
  }

  return rec;
}
