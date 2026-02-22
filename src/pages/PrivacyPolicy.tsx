import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Privacy Policy" description="Privacy Policy for the Cryptoniumpay payment gateway platform. Learn how we handle your data." />
      <div className="container max-w-3xl py-16 space-y-8">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/"><ArrowLeft className="mr-1.5 h-4 w-4" />Back to Home</Link>
        </Button>

        <div>
          <h1 className="text-3xl font-display font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: February 22, 2026</p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information you provide directly to us when creating an account, including your name,
              email address, and settlement wallet addresses. We also collect usage data such as IP addresses,
              browser type, pages visited, and API usage patterns to improve our Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">2. How We Use Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use collected information to: provide and maintain the Service; process transactions and send
              related notifications; send technical notices and security alerts; respond to support requests;
              monitor and analyze usage trends; detect and prevent fraud or abuse; and comply with legal obligations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">3. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data, including: argon2id password
              hashing, JWT-based authentication with short-lived tokens, HMAC-signed webhook payloads, TLS encryption
              for all data in transit, and encrypted storage for sensitive data at rest. API keys are stored as
              irreversible hashes — we never store your raw API key after initial creation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">4. Non-Custodial Architecture</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cryptoniumpay is a non-custodial platform. We do not store, hold, or have access to your cryptocurrency
              private keys or funds. Payment addresses are derived from your extended public key (XPUB) using an
              isolated signer service. We never have custody of merchant funds at any point in the payment flow.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain account information for as long as your account is active. Transaction records and audit
              logs are retained for a minimum of 7 years for compliance purposes. You may request deletion of
              your account and associated personal data at any time, subject to legal retention requirements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">6. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use CoinGecko's public API to display real-time cryptocurrency market data. This data is fetched
              client-side and no personal information is shared with CoinGecko. We do not sell, share, or rent
              your personal information to any third parties for marketing purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">7. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use localStorage for authentication tokens and user preferences (such as theme selection and
              dismissed announcements). We do not use third-party tracking cookies. No advertising or analytics
              cookies are placed without your explicit consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">8. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to: access your personal data; correct inaccurate data; request deletion of your
              data; export your data in a portable format; object to processing of your data; and withdraw consent
              at any time. To exercise these rights, contact us at the address below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by
              email or through a prominent notice on the platform at least 30 days before the changes take effect.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">10. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related inquiries, contact us at{" "}
              <a href="mailto:privacy@cryptoniumpay.com" className="text-primary hover:underline">privacy@cryptoniumpay.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
