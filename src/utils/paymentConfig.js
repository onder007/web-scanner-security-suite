// src/utils/paymentConfig.js
// Central payment, licensing, and Merchant-of-Record (MoR) configuration.
// Supports Gumroad and Lemon Squeezy with direct Wise payouts.

export const PAYMENT_CONFIG = {
  // Provider: 'gumroad' | 'lemonsqueezy' | 'custom'
  provider: 'gumroad',

  // Gumroad Store / Product URL (User should replace with their own Gumroad product link)
  // When sold, Gumroad automatically pays directly into the creator's Wise multi-currency bank account.
  checkoutUrl: 'https://gumroad.com/l/webscanner-pro',

  // Gumroad product permalink slug used for API verification
  gumroadPermalink: 'webscanner-pro',

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
