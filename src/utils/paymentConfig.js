// src/utils/paymentConfig.js
// Central payment, licensing, and Merchant-of-Record (MoR) configuration.
// Supports Gumroad and Lemon Squeezy with direct Wise payouts.

export const PAYMENT_CONFIG = {
  // Provider: 'lemonsqueezy' | 'gumroad' | 'custom'
  provider: 'lemonsqueezy',

  // Lemon Squeezy official checkout URL for Web Scanner & Security Suite Pro
  checkoutUrl: 'https://onder.lemonsqueezy.com/checkout/buy/c3a944ae-1513-488a-b147-f457c72baefb',

  // Store & Product identifiers
  storeName: 'Önder Bakır Store',
  productId: '1344830',

  // Pricing display
  price: '$14',
  planName: 'Pro Lifetime License',
  planDescription: 'One-time payment — lifetime access with all future updates',

  // Feature list highlighted during checkout
  features: [
    'Deep Vulnerability Audit Engine (OWASP, XSS, CSRF & Data Leaks)',
    '1-Click Remediation Snippets (Nginx, Apache, Next.js, Vite)',
    'Live Target Network Traffic Inspector & Packet Capture',
    'Executive PDF Audit Reports & Unlimited CSV Exports',
    'Offline & Safe: Zero Analytics, Zero Tracking, 100% Private'
  ]
};
