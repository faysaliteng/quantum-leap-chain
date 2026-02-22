import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import { SocialLinks } from "@/components/SocialLinks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

type Category = "All" | "Guides" | "Industry" | "Product" | "Engineering";

const categories: Category[] = ["All", "Guides", "Industry", "Product", "Engineering"];

const articles: {
  title: string;
  excerpt: string;
  category: Exclude<Category, "All">;
  date: string;
  readTime: string;
  featured?: boolean;
}[] = [
  {
    title: "Why 0.5% Is All You Should Ever Pay for Crypto Payment Processing",
    excerpt: "Most processors charge 1% or more. We break down the real cost of crypto payments and why the industry standard is unnecessarily high.",
    category: "Industry",
    date: "Feb 18, 2026",
    readTime: "6 min",
    featured: true,
  },
  {
    title: "Integrating Cryptoniumpay in Under 10 Minutes: A Step-by-Step Guide",
    excerpt: "From API key generation to your first test charge — a practical walkthrough for developers who want to accept crypto payments fast.",
    category: "Guides",
    date: "Feb 14, 2026",
    readTime: "8 min",
    featured: true,
  },
  {
    title: "Stablecoin Settlement: How USDC and USDT Are Changing Merchant Payouts",
    excerpt: "Volatile markets don't have to mean volatile revenue. Learn how stablecoin settlement protects your bottom line.",
    category: "Industry",
    date: "Feb 10, 2026",
    readTime: "5 min",
  },
  {
    title: "Webhook Best Practices for Reliable Payment Notifications",
    excerpt: "Missed webhooks can mean missed orders. Here's how to build a bulletproof webhook handler for Cryptoniumpay events.",
    category: "Engineering",
    date: "Feb 6, 2026",
    readTime: "7 min",
  },
  {
    title: "New: Volume-Based Pricing Tiers Now Live",
    excerpt: "Process more, pay less. We're introducing automatic fee reductions starting at $10K monthly volume — no negotiation required.",
    category: "Product",
    date: "Feb 2, 2026",
    readTime: "3 min",
  },
  {
    title: "Accepting Bitcoin Payments in 2026: What Merchants Need to Know",
    excerpt: "BTC remains the most requested crypto payment method. We cover network fees, confirmation times, and Lightning support.",
    category: "Industry",
    date: "Jan 28, 2026",
    readTime: "6 min",
  },
  {
    title: "Building a Checkout Page with the Cryptoniumpay SDK",
    excerpt: "A hands-on tutorial for creating a branded, mobile-friendly checkout experience using our hosted payment page and API.",
    category: "Guides",
    date: "Jan 22, 2026",
    readTime: "9 min",
  },
  {
    title: "How We Designed Our Zero-KYC Onboarding Flow",
    excerpt: "Privacy-first doesn't mean security-last. A look inside our risk model that lets merchants start accepting crypto instantly.",
    category: "Engineering",
    date: "Jan 16, 2026",
    readTime: "5 min",
  },
  {
    title: "Multi-Chain Support: Ethereum, Polygon, Arbitrum, and Beyond",
    excerpt: "Supporting 7+ chains means your customers always have options. Here's how our multi-chain architecture works under the hood.",
    category: "Product",
    date: "Jan 10, 2026",
    readTime: "4 min",
  },
];

const categoryColors: Record<Exclude<Category, "All">, string> = {
  Guides: "bg-info/10 text-info",
  Industry: "bg-primary/10 text-primary",
  Product: "bg-success/10 text-success",
  Engineering: "bg-destructive/10 text-destructive",
};

export default function Blog() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [active, setActive] = useState<Category>("All");

  const filtered = active === "All" ? articles : articles.filter((a) => a.category === active);
  const featured = articles.filter((a) => a.featured);
  const rest = filtered.filter((a) => !(active === "All" && a.featured));

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
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/blog" className="text-primary font-medium">Blog</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            <ThemeToggle />
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-gradient-gold text-primary-foreground">Get Started</Button></Link>
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
            <Link to="/pricing" className="block text-muted-foreground">Pricing</Link>
            <Link to="/blog" className="block text-primary font-medium">Blog</Link>
            <Link to="/contact" className="block text-muted-foreground">Contact</Link>
            <div className="flex gap-2 pt-2">
              <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
              <Link to="/signup"><Button size="sm" className="bg-gradient-gold text-primary-foreground">Get Started</Button></Link>
            </div>
            <ThemeToggle />
          </nav>
        )}
      </header>

      <main>
        {/* Hero */}
        <motion.section initial="hidden" animate="visible" variants={stagger} className="container mx-auto px-4 py-20 text-center">
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Blog</Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold font-display mb-4">
            Insights & <span className="text-gradient-gold">Guides</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Crypto payment strategies, integration tutorials, and product updates from the Cryptoniumpay team.
          </motion.p>
        </motion.section>

        {/* Featured (only on "All") */}
        {active === "All" && (
          <section className="container mx-auto px-4 pb-12">
            <div className="grid md:grid-cols-2 gap-6">
              {featured.map((a) => (
                <motion.div key={a.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <Card className="h-full border-primary/20 hover:border-primary/40 transition-colors group cursor-pointer">
                    <CardContent className="p-6 md:p-8 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={categoryColors[a.category] + " border-0 text-xs"}>{a.category}</Badge>
                          <Badge variant="outline" className="border-primary/20 text-primary text-[10px]">Featured</Badge>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold font-display mb-3 group-hover:text-primary transition-colors">{a.title}</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">{a.excerpt}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {a.date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {a.readTime} read</span>
                        <span className="ml-auto flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Read more <ArrowRight className="h-3.5 w-3.5" />
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
                {cat === "All" ? "All Posts" : cat}
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
                        <Badge className={categoryColors[a.category] + " border-0 text-xs"}>{a.category}</Badge>
                      </div>
                      <h3 className="font-bold font-display text-lg mb-1 group-hover:text-primary transition-colors truncate">{a.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {a.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {a.readTime}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {rest.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No articles in this category yet.</p>
            )}
          </div>
        </motion.section>

        {/* CTA */}
        <section className="container mx-auto px-4 pb-20 text-center">
          <Card className="border-primary/20 glow-gold">
            <CardContent className="py-12 px-6">
              <Tag className="h-8 w-8 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold font-display mb-2">Stay Updated</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Follow us on social media for the latest articles, product updates, and crypto payment insights.
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
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          </div>
          <SocialLinks />
          <p>© {new Date().getFullYear()} Cryptoniumpay</p>
        </div>
      </footer>
    </div>
  );
}
