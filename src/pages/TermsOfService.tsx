import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useI18n } from "@/lib/i18n";

export default function TermsOfService() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background" data-testid="page:terms">
      <SEOHead title={t("terms.title")} description="Terms of Service for using the Cryptoniumpay payment gateway platform." />
      <div className="container max-w-3xl py-16 space-y-8">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/"><ArrowLeft className="mr-1.5 h-4 w-4" />{t("common.backToHome")}</Link>
        </Button>

        <div>
          <h1 className="text-3xl font-display font-bold">{t("terms.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("terms.lastUpdated")}: February 22, 2026</p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the Cryptoniumpay platform ("Service"), you agree to be bound by these Terms of Service ("Terms").
              If you do not agree to these Terms, you may not use the Service. These Terms apply to all users, including merchants,
              administrators, and visitors.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cryptoniumpay provides a non-custodial cryptocurrency payment gateway that enables merchants to accept
              cryptocurrency payments from their customers. The Service includes payment processing, webhook notifications,
              API access, hosted checkout pages, and administrative tools.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">3. Account Registration</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use the Service, you must create an account by providing accurate and complete information.
              You are responsible for maintaining the confidentiality of your account credentials, including
              API keys and passwords. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">4. Fees and Payments</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cryptoniumpay charges a flat 0.5% transaction fee on all completed payments. There are no monthly fees,
              setup fees, or minimum volume requirements. Fee rates may be subject to custom arrangements for
              high-volume merchants. All fees are deducted automatically from the settlement amount.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">5. Non-Custodial Nature</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cryptoniumpay operates on a non-custodial basis. Customer payments are directed to merchant-controlled
              wallet addresses. Cryptoniumpay does not hold, store, or have access to merchant funds at any time.
              Merchants are solely responsible for the security of their settlement wallet addresses.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">6. Prohibited Activities</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to use the Service for any illegal or unauthorized purpose, including but not limited to:
              money laundering, terrorist financing, fraud, sale of prohibited goods or services, or any activity
              that violates applicable laws or regulations in your jurisdiction.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">7. API Usage</h2>
            <p className="text-muted-foreground leading-relaxed">
              Access to the Cryptoniumpay API is subject to rate limits and usage policies. You agree not to abuse,
              reverse-engineer, or attempt to circumvent any security measures of the API. API keys must be kept
              confidential and should not be shared or exposed in client-side code.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Cryptoniumpay shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including loss of profits, data, or cryptocurrency,
              arising from your use of or inability to use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">9. Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. Material changes will be communicated via
              email or platform notification at least 30 days before taking effect. Continued use of the Service
              after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-semibold">10. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@cryptoniumpay.com" className="text-primary hover:underline">legal@cryptoniumpay.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
