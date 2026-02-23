import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, Tag, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import { SocialLinks } from "@/components/SocialLinks";
import { useI18n } from "@/lib/i18n";
import { publicApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/lib/types";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

type Category = "All" | string;

const categoryColors: Record<string, string> = {
  Guides: "bg-info/10 text-info",
  Industry: "bg-primary/10 text-primary",
  Product: "bg-success/10 text-success",
  Engineering: "bg-destructive/10 text-destructive",
};

export default function Blog() {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [active, setActive] = useState<Category>("All");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["public-blog"],
    queryFn: publicApi.blog,
    staleTime: 60_000,
  });

  // Derive categories from real data
  const categories: Category[] = ["All", ...Array.from(new Set(articles.map((a: BlogPost) => a.tags?.[0] || "Uncategorized")))];

  const getCategory = (a: BlogPost) => a.tags?.[0] || "Uncategorized";
  const filtered = active === "All" ? articles : articles.filter((a) => getCategory(a) === active);
  const featured = articles.filter((a: BlogPost) => a.status === "published").slice(0, 2);
  const rest = filtered.filter((a) => !(active === "All" && featured.includes(a)));

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="page:blog">
      <SEOHead
        title="Blog"
        description="Crypto payment guides, integration tutorials, industry news, and product updates from the Cryptoniumpay team."
      />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2"><CryptoniumpayLogo /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.pricing")}</Link>
            <Link to="/blog" className="text-primary font-medium">{t("nav.blog")}</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.contact")}</Link>
            <LanguageSwitcher />
            <ThemeToggle />
            <Link to="/login"><Button variant="ghost" size="sm">{t("nav.login")}</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-gradient-gold text-primary-foreground">{t("nav.getStarted")}</Button></Link>
          </nav>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-6 bg-foreground transition-transform ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block h-0.5 w-6 bg-foreground transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-6 bg-foreground transition-transform ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl p-4 space-y-3">
            <Link to="/pricing" className="block text-muted-foreground">{t("nav.pricing")}</Link>
            <Link to="/blog" className="block text-primary font-medium">{t("nav.blog")}</Link>
            <Link to="/contact" className="block text-muted-foreground">{t("nav.contact")}</Link>
            <div className="flex gap-2 pt-2">
              <Link to="/login"><Button variant="ghost" size="sm">{t("nav.login")}</Button></Link>
              <Link to="/signup"><Button size="sm" className="bg-gradient-gold text-primary-foreground">{t("nav.getStarted")}</Button></Link>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </nav>
        )}
      </header>

      <main>
        {/* Hero */}
        <motion.section initial="hidden" animate="visible" variants={stagger} className="container mx-auto px-4 py-20 text-center">
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">{t("blog.title")}</Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold font-display mb-4">
            {t("blog.heading")} <span className="text-gradient-gold">{t("blog.headingAccent")}</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("blog.subtitle")}
          </motion.p>
        </motion.section>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        )}

        {/* Featured (only on "All") */}
        {!isLoading && active === "All" && featured.length > 0 && (
          <section className="container mx-auto px-4 pb-12">
            <div className="grid md:grid-cols-2 gap-6">
              {featured.map((a) => (
                <motion.div key={a.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <Card className="h-full border-primary/20 hover:border-primary/40 transition-colors group cursor-pointer">
                    <CardContent className="p-6 md:p-8 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={(categoryColors[getCategory(a)] || "bg-muted text-muted-foreground") + " border-0 text-xs"}>{getCategory(a)}</Badge>
                          <Badge variant="outline" className="border-primary/20 text-primary text-[10px]">{t("blog.featured")}</Badge>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold font-display mb-3 group-hover:text-primary transition-colors">{a.title}</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">{a.excerpt}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {Math.max(1, Math.ceil((a.body?.length || 500) / 1000))} min {t("blog.read")}</span>
                        <span className="ml-auto flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          {t("blog.readMore")} <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Category filter */}
        <section className="container mx-auto px-4 pb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={active === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActive(cat)}
                className={active === cat ? "bg-gradient-gold text-primary-foreground" : ""}
              >
                {cat === "All" ? t("blog.allPosts") : cat}
              </Button>
            ))}
          </div>
        </section>

        {/* Article list */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="container mx-auto px-4 pb-20"
        >
          <div className="space-y-4">
            {rest.map((a) => (
              <motion.div key={a.title} variants={fadeUp}>
                <Card className="hover:border-primary/30 transition-colors group cursor-pointer">
                  <CardContent className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={(categoryColors[getCategory(a)] || "bg-muted text-muted-foreground") + " border-0 text-xs"}>{getCategory(a)}</Badge>
                      </div>
                      <h3 className="font-bold font-display text-lg mb-1 group-hover:text-primary transition-colors truncate">{a.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {Math.max(1, Math.ceil((a.body?.length || 500) / 1000))} min</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {rest.length === 0 && (
              <p className="text-center text-muted-foreground py-12">{t("blog.noArticles")}</p>
            )}
          </div>
        </motion.section>

        {/* CTA */}
        <section className="container mx-auto px-4 pb-20 text-center">
          <Card className="border-primary/20 glow-gold">
            <CardContent className="py-12 px-6">
              <Tag className="h-8 w-8 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold font-display mb-2">{t("blog.stayUpdated")}</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t("blog.stayUpdatedDesc")}
              </p>
              <SocialLinks />
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-foreground">{t("nav.home")}</Link>
            <Link to="/pricing" className="hover:text-foreground">{t("nav.pricing")}</Link>
            <Link to="/contact" className="hover:text-foreground">{t("nav.contact")}</Link>
            <Link to="/terms" className="hover:text-foreground">{t("nav.terms")}</Link>
            <Link to="/privacy" className="hover:text-foreground">{t("nav.privacy")}</Link>
          </div>
          <SocialLinks />
          <p>© {new Date().getFullYear()} Cryptoniumpay</p>
        </div>
      </footer>
    </div>
  );
}
