import { useState, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { SocialLinks } from "@/components/SocialLinks";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Search, HelpCircle, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

// Placeholder FAQ data (in production, fetched from CMS via publicApi.faq())
const faqData = [
  { id: "1", question: "What is Cryptoniumpay?", answer: "Cryptoniumpay is a self-hosted, non-custodial crypto payment gateway that lets businesses accept BTC, ETH, and stablecoins with a flat 0.5% fee. We never hold your funds — payments go directly to your wallet.", category: "General", sort_order: 1, visible: true, created_at: "" },
  { id: "2", question: "How do I get started?", answer: "Create a free account, generate an API key from your dashboard, and integrate using our REST API or hosted checkout links. The entire process takes under 2 minutes with no company verification required.", category: "Getting Started", sort_order: 2, visible: true, created_at: "" },
  { id: "3", question: "What cryptocurrencies do you support?", answer: "We support Bitcoin (BTC), Ethereum (ETH), USDC, USDT on Ethereum, Arbitrum, Optimism, and Polygon. More chains are being added regularly.", category: "General", sort_order: 3, visible: true, created_at: "" },
  { id: "4", question: "What are the fees?", answer: "We charge a flat 0.5% per transaction — the lowest in the industry. There are no monthly fees, no setup fees, and no minimum volume requirements. Volume discounts are available for high-volume merchants.", category: "Pricing", sort_order: 4, visible: true, created_at: "" },
  { id: "5", question: "Is KYC required?", answer: "No. Cryptoniumpay does not require KYC, KYB, or any company verification to start accepting payments. You can be live in minutes.", category: "Getting Started", sort_order: 5, visible: true, created_at: "" },
  { id: "6", question: "How does the non-custodial model work?", answer: "Cryptoniumpay never holds your crypto. We generate unique deposit addresses for each payment, and once confirmed on-chain, funds are automatically swept to your configured settlement wallet. Private keys are managed by an isolated signer service.", category: "Security", sort_order: 6, visible: true, created_at: "" },
  { id: "7", question: "How are webhooks secured?", answer: "All webhooks are signed with HMAC-SHA256 using your webhook secret. Each delivery includes x-cryptoniumpay-signature, x-cryptoniumpay-timestamp, and x-cryptoniumpay-event headers for replay protection and verification.", category: "Security", sort_order: 7, visible: true, created_at: "" },
  { id: "8", question: "Can I self-host Cryptoniumpay?", answer: "Yes. Cryptoniumpay is designed for self-hosting. We provide atomic-level deployment instructions for both Cloudflare (Pages + Workers) and VM (Docker Compose) environments. See our DEPLOYMENT.md for complete instructions.", category: "Technical", sort_order: 8, visible: true, created_at: "" },
  { id: "9", question: "What happens if a payment is underpaid?", answer: "If a customer sends less than the required amount, the charge status changes to UNDERPAID. You can configure your webhook to handle this automatically — either requesting additional payment or issuing a refund.", category: "Payments", sort_order: 9, visible: true, created_at: "" },
  { id: "10", question: "How fast is payment detection?", answer: "Payments are detected within 1-3 seconds of the on-chain transaction being broadcast. Full confirmation depends on the chain's block time and your configured confirmation threshold (e.g., 1 block for ETH, 3 for BTC).", category: "Payments", sort_order: 10, visible: true, created_at: "" },
  { id: "11", question: "Do you support invoicing?", answer: "Yes. Merchants can create, send, and track invoices directly from the dashboard. Each invoice generates a unique payment link that customers can pay with any supported cryptocurrency.", category: "Features", sort_order: 11, visible: true, created_at: "" },
  { id: "12", question: "What reporting is available?", answer: "The merchant dashboard includes transaction reports with date-range filtering, CSV/JSON export, volume-by-day charts, and revenue-by-asset breakdown. All data is available via the API as well.", category: "Features", sort_order: 12, visible: true, created_at: "" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FAQ() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(faqData.map((f) => f.category)));
    return ["All", ...cats];
  }, []);

  const filtered = useMemo(() => {
    return faqData.filter((f) => {
      const matchCategory = activeCategory === "All" || f.category === activeCategory;
      const matchSearch = !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch && f.visible;
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-background" data-testid="page:faq">
      <SEOHead title="FAQ — Frequently Asked Questions" description="Get answers to common questions about Cryptoniumpay, crypto payments, fees, security, and integration." />

      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <CryptoniumpayLogo size="md" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link to="/">{t("nav.home")}</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/docs/api">{t("nav.docs")}</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/contact">{t("nav.contact")}</Link></Button>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-16 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold">{t("faq.title")}</h1>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">{t("faq.subtitle")}</p>

          {/* Search */}
          <div className="relative max-w-md mx-auto mt-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("faq.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>
      </section>

      {/* Categories */}
      <section className="container pb-4">
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? "bg-gradient-gold text-primary-foreground" : ""}
            >
              {cat === "All" ? t("faq.all") : cat}
              {cat !== "All" && (
                <Badge variant="secondary" className="ml-1.5 text-xs h-5 px-1.5">
                  {faqData.filter((f) => f.category === cat && f.visible).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="container pb-20 max-w-3xl">
        {filtered.length > 0 ? (
          <Accordion type="multiple" className="space-y-3">
            {filtered.map((faq, i) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <AccordionItem value={faq.id} className="border border-border/50 rounded-lg px-4 bg-card/50 data-[state=open]:border-primary/30">
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="text-xs mt-0.5 shrink-0">{faq.category}</Badge>
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4 pl-[4.5rem]">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{t("faq.noResults")}</p>
          </div>
        )}

        {/* CTA */}
        <Card className="mt-12 border-primary/20 bg-primary/5">
          <CardContent className="py-8 text-center">
            <MessageSquare className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display font-semibold text-lg mb-2">{t("faq.stillHaveQuestions")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("faq.stillHaveQuestionsDesc")}</p>
            <Button className="bg-gradient-gold text-primary-foreground" asChild>
              <Link to="/contact">{t("faq.contactSupport")}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Cryptoniumpay. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground">{t("nav.terms")}</Link>
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground">{t("nav.privacy")}</Link>
            <SocialLinks />
          </div>
        </div>
      </footer>
    </div>
  );
}
