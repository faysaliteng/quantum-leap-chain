// ── Social URLs ──
export const SOCIAL_LINKS = {
  twitter: "https://x.com/cryptoniumpay",
  github: "https://github.com/cryptoniumpay",
  discord: "https://discord.gg/cryptoniumpay",
  telegram: "https://t.me/cryptoniumpay",
  linkedin: "https://linkedin.com/company/cryptoniumpay",
} as const;

// ── SEO defaults ──
export const SEO = {
  siteName: "Cryptoniumpay",
  titleTemplate: "%s — Cryptoniumpay",
  defaultTitle: "Cryptoniumpay — The Future of Crypto Payments",
  defaultDescription: "The lowest-fee crypto payment gateway. Accept BTC, ETH, USDC and more with 0.5% flat fee. No KYC, instant setup, enterprise-grade security.",
  siteUrl: "https://cryptoniumpay.com",
  twitterHandle: "@cryptoniumpay",
  ogImage: "/og-image.png",
  locale: "en_US",
} as const;

// ── Chain colors for charts ──
export const CHAIN_COLORS: Record<string, string> = {
  BTC: "hsl(38 92% 50%)",
  ETH: "hsl(227 58% 55%)",
  USDC: "hsl(199 89% 48%)",
  USDT: "hsl(142 71% 45%)",
  MATIC: "hsl(270 65% 55%)",
  ARB: "hsl(210 70% 50%)",
  OP: "hsl(0 72% 51%)",
};
