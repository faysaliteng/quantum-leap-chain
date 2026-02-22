import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { SocialLinks } from "@/components/SocialLinks";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CryptoPriceTicker } from "@/components/CryptoPriceTicker";
import {
  Shield, Zap, Globe, Key, Webhook, BarChart3, ArrowRight,
  Lock, Eye, Bitcoin, Sparkles, Menu, X,
  CheckCircle, Clock, Send, CreditCard, Percent, Users, Rocket,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Zap, title: "Instant Setup", desc: "Create an account, grab your API key, and start accepting crypto in under 2 minutes. No company verification needed." },
  { icon: Globe, title: "Multi-Chain Support", desc: "BTC, ETH, Arbitrum, Optimism, Polygon — with USDC/USDT stablecoin support out of the box." },
  { icon: Percent, title: "Lowest Fees in Crypto", desc: "Flat 0.5% per transaction. No hidden charges, no monthly fees, no minimum volume. Free to start." },
  { icon: Webhook, title: "Enterprise Webhooks", desc: "HMAC-signed, timestamped webhooks with exponential retry and delivery tracking." },
  { icon: Key, title: "Scoped API Keys", desc: "Create read/write/admin-scoped API keys with rotation and usage tracking." },
  { icon: Lock, title: "Non-Custodial Security", desc: "Your funds go directly to your wallet. We never hold your crypto. Zero custody risk." },
  { icon: Shield, title: "Battle-Tested Infra", desc: "99.9% uptime SLA, sub-2s payment detection, automatic on-chain verification with reorg protection." },
  { icon: BarChart3, title: "Full Reporting", desc: "Transaction reports, CSV/JSON exports, volume breakdowns by chain, asset, and time period." },
];

const chains = [
  { name: "Bitcoin", symbol: "BTC" },
  { name: "Ethereum", symbol: "ETH" },
  { name: "Arbitrum", symbol: "ARB" },
  { name: "Optimism", symbol: "OP" },
  { name: "Polygon", symbol: "MATIC" },
  { name: "USDC", symbol: "USDC" },
  { name: "USDT", symbol: "USDT" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const } }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Accept Crypto Payments — 0.5% Flat Fee" description="The lowest-fee crypto payment gateway. Accept BTC, ETH, and stablecoins with 0.5% flat fee. No KYC, no monthly fees, instant setup." />
      {/* Nav */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container flex h-16 items-center justify-between">
          <CryptoniumpayLogo size="md" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild><Link to="/pricing">Pricing</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/blog">Blog</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/docs/api">API Docs</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/docs/security">Security</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/contact">Contact</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button>
            <ThemeToggle />
            <Button size="sm" className="bg-gradient-gold text-primary-foreground font-semibold ml-2" asChild>
              <Link to="/signup">Get Started Free <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </nav>

          {/* Mobile nav toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-sm">
            <nav className="container flex flex-col gap-1 py-4">
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/pricing">Pricing</Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/blog">Blog</Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/docs/api">API Docs</Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/docs/security">Security</Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/contact">Contact</Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/login">Sign in</Link>
              </Button>
              <div className="border-t border-border/50 pt-2 mt-2">
                <Button size="sm" className="w-full bg-gradient-gold text-primary-foreground font-semibold" asChild onClick={() => setMobileMenuOpen(false)}>
                  <Link to="/signup">Get Started Free <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="container py-24 md:py-32 text-center relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <motion.div
          className="relative"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div className="flex justify-center mb-6" variants={fadeUp} custom={0}>
            <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium border-primary/30 bg-primary/5">
              <Sparkles className="h-3 w-3 mr-1.5 text-primary" />
              Free to start · No KYC · 0.5% flat fee
            </Badge>
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-5xl font-display font-bold tracking-tight lg:text-7xl leading-[1.1]"
            variants={fadeUp}
            custom={1}
          >
            Accept Crypto.<br />
            <span className="text-gradient-gold">Pay Less.</span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed"
            variants={fadeUp}
            custom={2}
          >
            The lowest-fee crypto payment gateway. Sign up, get your API key, and start receiving
            BTC, ETH, and stablecoin payments in minutes. No company verification. No monthly fees.
          </motion.p>
          <motion.div className="mt-10 flex flex-col sm:flex-row justify-center gap-4" variants={fadeUp} custom={3}>
            <Button size="lg" className="bg-gradient-gold text-primary-foreground font-semibold h-12 px-8 text-base glow-gold" asChild>
              <Link to="/signup">Create Free Account <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-border/50" asChild>
              <Link to="/docs/api">View API Docs</Link>
            </Button>
          </motion.div>

          {/* Floating Bitcoin icon */}
          <motion.div
            className="absolute -top-4 right-[10%] hidden lg:block"
            animate={{ y: [0, -14, 0], rotate: [0, 6, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-gold glow-gold flex items-center justify-center opacity-20">
              <Bitcoin className="h-9 w-9 text-primary-foreground" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Pricing Highlight */}
      <motion.section
        className="border-y border-border/50 bg-primary/5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <div className="container py-16">
          <div className="grid gap-8 md:grid-cols-3 text-center">
            <div>
              <p className="text-5xl font-display font-bold text-gradient-gold">0.5%</p>
              <p className="text-muted-foreground mt-2">Flat fee per transaction</p>
              <p className="text-xs text-muted-foreground mt-1">Lowest in the entire crypto payment industry</p>
            </div>
            <div>
              <p className="text-5xl font-display font-bold text-gradient-gold">$0</p>
              <p className="text-muted-foreground mt-2">Monthly fee</p>
              <p className="text-xs text-muted-foreground mt-1">Free forever. No credit card required.</p>
            </div>
            <div>
              <p className="text-5xl font-display font-bold text-gradient-gold">0</p>
              <p className="text-muted-foreground mt-2">Documents required</p>
              <p className="text-xs text-muted-foreground mt-1">No KYC, no company verification to start.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Live Crypto Prices */}
      <motion.section
        className="border-b border-border/50 bg-card/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
      >
        <div className="container py-16">
          <CryptoPriceTicker />
        </div>
      </motion.section>

      {/* Chains */}
      <section className="bg-card/50">
        <div className="container py-10">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-[0.2em] mb-6 font-medium">Supported Chains & Assets</p>
          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {chains.map((c) => (
              <motion.div key={c.symbol} variants={cardVariant}>
                <Badge variant="outline" className="text-sm px-4 py-2 font-mono font-medium border-border/50 bg-background/50">
                  {c.symbol === "BTC" && <Bitcoin className="h-3.5 w-3.5 mr-1.5 text-primary" />}
                  {c.symbol}
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-20">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-display font-bold">Start Accepting Payments in 3 Steps</h2>
          <p className="text-muted-foreground mt-2">No paperwork. No waiting. Go live today.</p>
        </motion.div>
        <motion.div
          className="grid gap-6 sm:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          {[
            { step: "1", icon: Rocket, title: "Create Account", desc: "Sign up with just your name and email. No company registration, no KYC documents required." },
            { step: "2", icon: Key, title: "Get Your API Key", desc: "Generate API keys from your dashboard. Integrate with our REST API or use hosted checkout links." },
            { step: "3", icon: CreditCard, title: "Receive Payments", desc: "Your customers pay in crypto. Funds go directly to your wallet. We charge just 0.5% per transaction." },
          ].map((s) => (
            <motion.div key={s.step} variants={cardVariant}>
              <Card className="border-border/50 bg-card/80 h-full relative overflow-hidden">
                <div className="absolute top-3 right-4 text-6xl font-display font-bold text-primary/5">{s.step}</div>
                <CardContent className="pt-6 relative">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold mb-1.5">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-display font-bold">Enterprise Features. Startup Pricing.</h2>
          <p className="text-muted-foreground mt-2">Everything you need to accept crypto payments at scale</p>
        </motion.div>
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={cardVariant}>
              <Card className="border-border/50 bg-card/80 hover:border-primary/30 transition-all duration-300 hover:glow-gold h-full">
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Comparison */}
      <motion.section
        className="border-t border-border/50 bg-card/50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="container py-20">
          <h2 className="text-center text-3xl font-display font-bold mb-2">Compare & Save</h2>
          <p className="text-center text-muted-foreground mb-10">See how Cryptoniumpay stacks up against the competition</p>
          <div className="max-w-2xl mx-auto">
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3">Fee</th>
                      <th className="px-4 py-3">KYC Required</th>
                      <th className="px-4 py-3">Setup Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-primary/5">
                      <td className="px-4 py-3 font-semibold text-primary">Cryptoniumpay</td>
                      <td className="px-4 py-3 font-mono font-bold text-primary">0.5%</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-xs border-primary/30">None</Badge></td>
                      <td className="px-4 py-3 font-mono">2 min</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3 text-muted-foreground">Coinbase Commerce</td>
                      <td className="px-4 py-3 font-mono">1.0%</td>
                      <td className="px-4 py-3 text-muted-foreground">Full KYB</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">Days</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3 text-muted-foreground">BitPay</td>
                      <td className="px-4 py-3 font-mono">1.0%</td>
                      <td className="px-4 py-3 text-muted-foreground">Full KYB</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">Days</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-muted-foreground">NOWPayments</td>
                      <td className="px-4 py-3 font-mono">0.5–1%</td>
                      <td className="px-4 py-3 text-muted-foreground">Partial</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">Hours</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* Payment Lifecycle */}
      <section className="container py-20">
        <h2 className="text-center text-3xl font-display font-bold mb-2">Payment Lifecycle</h2>
        <p className="text-center text-muted-foreground mb-10">Transparent status tracking from creation to settlement</p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          {["NEW", "PENDING", "CONFIRMED", "PAID"].map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono px-4 py-1.5 border-primary/30 bg-primary/5">{s}</Badge>
              {i < 3 && <ArrowRight className="h-4 w-4 text-primary/50 hidden sm:block" />}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm mt-4">
          {["UNDERPAID", "OVERPAID", "EXPIRED", "CANCELED"].map((s) => (
            <Badge key={s} variant="outline" className="font-mono text-muted-foreground border-border/50">{s}</Badge>
          ))}
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="container py-12">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { value: "99.9%", label: "Uptime SLA" },
              { value: "5+", label: "Chains Supported" },
              { value: "<2s", label: "Detection Latency" },
              { value: "0.5%", label: "Flat Fee" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={cardVariant}>
                <p className="text-3xl font-display font-bold text-gradient-gold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <motion.div
          className="text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-display font-bold mb-4">Ready to accept crypto payments?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of merchants using Cryptoniumpay. Free to start, no credit card required, 
            no company verification. Just sign up and go.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-gradient-gold text-primary-foreground font-semibold h-12 px-8 text-base glow-gold" asChild>
              <Link to="/signup">Create Free Account <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-border/50" asChild>
              <Link to="/docs/api">Read API Docs</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Docs Links */}
      <section className="border-t border-border/50 bg-card/50">
        <div className="container py-20">
          <motion.h2
            className="text-center text-3xl font-display font-bold mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Developer Resources
          </motion.h2>
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { title: "API Reference", desc: "REST endpoints, webhooks, authentication", to: "/docs/api", icon: Eye },
              { title: "Security", desc: "Threat model, signing, encryption", to: "/docs/security", icon: Shield },
              { title: "Architecture", desc: "System design, data flows, infra", to: "/docs/architecture", icon: Globe },
              { title: "Database Schema", desc: "Tables, indexes, relationships", to: "/docs/schema", icon: BarChart3 },
            ].map((d) => (
              <motion.div key={d.to} variants={cardVariant}>
                <Link to={d.to}>
                  <Card className="h-full border-border/50 hover:border-primary/30 transition-all duration-300 group">
                    <CardContent className="pt-6">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                        <d.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-display font-semibold mb-1">{d.title}</h3>
                      <p className="text-sm text-muted-foreground">{d.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div>
              <CryptoniumpayLogo size="sm" />
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                The lowest-fee crypto payment gateway. Accept BTC, ETH, and stablecoins with 0.5% flat fee.
              </p>
              <SocialLinks className="mt-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                <Link to="/signup" className="hover:text-foreground transition-colors">Get Started</Link>
                <Link to="/docs/api" className="hover:text-foreground transition-colors">API Reference</Link>
                <Link to="/docs/architecture" className="hover:text-foreground transition-colors">Architecture</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Security</h4>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <Link to="/docs/security" className="hover:text-foreground transition-colors">Security Model</Link>
                <Link to="/docs/singularitycoin" className="hover:text-foreground transition-colors">SingularityCoin</Link>
                <span>SOC 2 Compliant</span>
                <span>Non-Custodial</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Company</h4>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
                <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
                <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
                <a href="https://github.com/cryptoniumpay" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Cryptoniumpay. All rights reserved.</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
