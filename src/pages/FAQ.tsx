import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { SocialLinks } from "@/components/SocialLinks";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { publicApi } from "@/lib/api-client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Search, HelpCircle, MessageSquare, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FAQ() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: faqData = [], isLoading } = useQuery({
    queryKey: ["public-faq"],
    queryFn: publicApi.faq,
    staleTime: 60_000,
  });

  const categories = useMemo(() => {
    const cats = Array.from(new Set(faqData.map((f) => f.category)));
    return ["All", ...cats];
  }, [faqData]);

  const filtered = useMemo(() => {
    return faqData.filter((f) => {
      const matchCategory = activeCategory === "All" || f.category === activeCategory;
      const matchSearch = !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch && f.visible;
    });
  }, [search, activeCategory, faqData]);

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
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length > 0 ? (
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
