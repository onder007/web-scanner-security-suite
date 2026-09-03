// src/security/fixSnippetsEngine.js
// Güvenlik bulguları için Nginx, Apache (.htaccess), Cloudflare ve Next.js/Node
// formatlarında tek tıkla kopyalanabilir hazır çözüm kodları üretir.

/**
 * Bir bulguya göre ilgili sunucu ve framework'ler için çözüm kodlarını üretir.
 * @param {Object} finding
 * @returns {Array<{ server: string, code: string, path: string, notes?: string }> | null}
 */
export function getFixSnippets(finding) {
  if (!finding) return null;
  const title = (finding.title || '').toLowerCase();
  const category = (finding.category || '').toLowerCase();
  const header = (finding.header || '').toLowerCase();

  // 1. Strict-Transport-Security (HSTS)
  if (title.includes('strict-transport-security') || header === 'strict-transport-security') {
    return [
      {
        server: 'Nginx',
        path: '/etc/nginx/sites-available/default',
        code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`
      },
      {
        server: 'Apache (.htaccess)',
        path: '.htaccess / httpd.conf',
        code: `<IfModule mod_headers.c>\n  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"\n</IfModule>`
      },
      {
        server: 'Cloudflare',
        path: 'Rules → Transform Rules → Modify Response Header',
        code: `Header: Strict-Transport-Security\nValue: max-age=31536000; includeSubDomains; preload`
      },
      {
        server: 'Next.js',
        path: 'next.config.js',
        code: `module.exports = {\n  async headers() {\n    return [{\n      source: '/(.*)',\n      headers: [{\n        key: 'Strict-Transport-Security',\n        value: 'max-age=31536000; includeSubDomains; preload'\n      }]\n    }];\n  }\n};`
      }
    ];
  }

  // 2. Content-Security-Policy (CSP)
  if (title.includes('content-security-policy') || header === 'content-security-policy') {
    return [
      {
        server: 'Nginx',
        path: '/etc/nginx/conf.d/security.conf',
        code: `add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;" always;`
      },
      {
        server: 'Apache (.htaccess)',
        path: '.htaccess',
        code: `<IfModule mod_headers.c>\n  Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"\n</IfModule>`
      },
      {
        server: 'HTML Meta Tag',
        path: '<head> tag',
        code: `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self';">`
      },
      {
        server: 'Next.js',
        path: 'next.config.js',
        code: `// next.config.js\nconst ContentSecurityPolicy = "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";\n// Add to headers() configuration`
      }
    ];
  }

  // 3. X-Frame-Options (Clickjacking)
  if (title.includes('x-frame-options') || header === 'x-frame-options') {
    return [
      {
        server: 'Nginx',
        path: '/etc/nginx/nginx.conf',
        code: `add_header X-Frame-Options "SAMEORIGIN" always;`
      },
      {
        server: 'Apache (.htaccess)',
        path: '.htaccess',
        code: `<IfModule mod_headers.c>\n  Header always append X-Frame-Options "SAMEORIGIN"\n</IfModule>`
      },
      {
        server: 'Express / Node.js',
        path: 'app.js (Helmet)',
        code: `app.use(helmet.frameguard({ action: 'sameorigin' }));`
      },
      {
        server: 'PHP',
        path: 'index.php (en üstte)',
        code: `header('X-Frame-Options: SAMEORIGIN');`
      }
    ];
  }

  // 4. X-Content-Type-Options
  if (title.includes('x-content-type-options') || header === 'x-content-type-options') {
    return [
      {
        server: 'Nginx',
        path: '/etc/nginx/nginx.conf',
        code: `add_header X-Content-Type-Options "nosniff" always;`
      },
      {
        server: 'Apache (.htaccess)',
        path: '.htaccess',
        code: `<IfModule mod_headers.c>\n  Header set X-Content-Type-Options "nosniff"\n</IfModule>`
      },
      {
        server: 'Next.js',
        path: 'next.config.js',
        code: `{\n  key: 'X-Content-Type-Options',\n  value: 'nosniff'\n}`
      }
    ];
  }

  // 5. Referrer-Policy
  if (title.includes('referrer-policy') || header === 'referrer-policy') {
    return [
      {
        server: 'Nginx',
        path: '/etc/nginx/nginx.conf',
        code: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`
      },
      {
        server: 'Apache (.htaccess)',
        path: '.htaccess',
        code: `<IfModule mod_headers.c>\n  Header set Referrer-Policy "strict-origin-when-cross-origin"\n</IfModule>`
      },
      {
        server: 'HTML',
        path: '<head>',
        code: `<meta name="referrer" content="strict-origin-when-cross-origin">`
      }
    ];
  }

  // 6. Permissions-Policy
  if (title.includes('permissions-policy') || header === 'permissions-policy') {
    return [
      {
        server: 'Nginx',
        path: '/etc/nginx/nginx.conf',
        code: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;`
      },
      {
        server: 'Apache (.htaccess)',
        path: '.htaccess',
        code: `<IfModule mod_headers.c>\n  Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"\n</IfModule>`
      }
    ];
  }

  // 7. Server / Technology Information Disclosure
  if (title.includes('information disclosure') || title.includes('server banner') || title.includes('x-powered-by')) {
    return [
      {
        server: 'Nginx',
        path: '/etc/nginx/nginx.conf (http block)',
        code: `server_tokens off;`
      },
      {
        server: 'PHP',
        path: 'php.ini',
        code: `expose_php = Off`
      },
      {
        server: 'Express.js',
        path: 'app.js',
        code: `app.disable('x-powered-by');`
      },
      {
        server: 'Apache',
        path: 'httpd.conf',
        code: `ServerSignature Off\nServerTokens Prod`
      }
    ];
  }

  // 8. Cookie Security (Secure, HttpOnly, SameSite)
  if (category.includes('cookie') || title.includes('cookie')) {
    return [
      {
        server: 'PHP (Session Cookies)',
        path: 'php.ini',
        code: `session.cookie_httponly = 1\nsession.cookie_secure = 1\nsession.cookie_samesite = "Lax"`
      },
      {
        server: 'Express.js',
        path: 'app.js',
        code: `res.cookie('name', 'value', {\n  httpOnly: true,\n  secure: true,\n  sameSite: 'lax'\n});`
      },
      {
        server: 'Nginx (Proxy Cookie Flags)',
        path: 'nginx.conf',
        code: `proxy_cookie_path / "/; Secure; HttpOnly; SameSite=Lax";`
      }
    ];
  }

  // 9. Sensitive Resource (.env, .git)
  if (title.includes('environment file') || title.includes('.env') || title.includes('git repository')) {
    return [
      {
        server: 'Nginx',
        path: '/etc/nginx/sites-available/default',
        code: `location ~ /\\.(env|git) {\n  deny all;\n  return 404;\n}`
      },
      {
        server: 'Apache (.htaccess)',
        path: '.htaccess',
        code: `<FilesMatch "^\\.(env|git)">\n  Order allow,deny\n  Deny from all\n</FilesMatch>`
      }
    ];
  }

  // 10. Tabnapping (target="_blank")
  if (title.includes('tabnapping')) {
    return [
      {
        server: 'HTML',
        path: 'Target <a> tags',
        code: `<!-- Add rel="noopener noreferrer" to external links -->\n<a href="https://external.com" target="_blank" rel="noopener noreferrer">Visit Link</a>`
      },
      {
        server: 'React / Next.js',
        path: 'Component',
        code: `<Link href="https://external.com" target="_blank" rel="noopener noreferrer">\n  External Site\n</Link>`
      }
    ];
  }

  // 11. SPF / Email Spoofing
  if (title.includes('spf')) {
    return [
      {
        server: 'DNS TXT Record (Zone)',
        path: 'DNS Management Console (Cloudflare, GoDaddy vb.)',
        code: `Name: @\nType: TXT\nTTL: Auto\nValue: v=spf1 include:_spf.google.com ~all\n\n# (Not: Kendi e-posta sağlayıcınızın include adresini ekleyin)`
      }
    ];
  }

  // 12. DMARC
  if (title.includes('dmarc')) {
    return [
      {
        server: 'DNS TXT Record (Zone)',
        path: 'DNS Management Console',
        code: `Name: _dmarc\nType: TXT\nTTL: Auto\nValue: v=DMARC1; p=reject; sp=reject; pct=100; rua=mailto:dmarc-reports@yourdomain.com;`
      }
    ];
  }

  // 13. Source Map (.map) Exposure
  if (title.includes('source map') || title.includes('.map')) {
    return [
      {
        server: 'Nginx (Block .map files)',
        path: '/etc/nginx/sites-available/default',
        code: `location ~* \\.map$ {\n  deny all;\n  return 404;\n}`
      },
      {
        server: 'Next.js (Disable Source Maps)',
        path: 'next.config.js',
        code: `module.exports = {\n  productionBrowserSourceMaps: false,\n};`
      },
      {
        server: 'Vite',
        path: 'vite.config.js',
        code: `export default defineConfig({\n  build: {\n    sourcemap: false\n  }\n});`
      }
    ];
  }

  // 14. PostMessage Origin Verification
  if (title.includes('postmessage')) {
    return [
      {
        server: 'JavaScript (Origin Validation)',
        path: 'Client-side script',
        code: `window.addEventListener('message', (event) => {\n  // 1. Her zaman gönderici origin'i denetleyin\n  if (event.origin !== 'https://trusted-domain.com') return;\n\n  // 2. Veriyi güvenle işleyin\n  console.log('Valid message received:', event.data);\n});`
      }
    ];
  }

  // 15. JWT / Client Storage Leak
  if (title.includes('jwt token') || title.includes('stored in localstorage')) {
    return [
      {
        server: 'Express.js (HttpOnly Cookie)',
        path: 'Backend Auth Controller',
        code: `// JWT'yi localStorage yerine HttpOnly çerezde saklayın:\nres.cookie('token', jwtToken, {\n  httpOnly: true,\n  secure: process.env.NODE_ENV === 'production',\n  sameSite: 'strict'\n});`
      }
    ];
  }

  return null;
}
