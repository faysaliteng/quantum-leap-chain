import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CryptonpayLogo } from "@/components/CryptonpayLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CryptoPriceTicker } from "@/components/CryptoPriceTicker";
import {
  Shield, Zap, Globe, Key, Webhook, BarChart3, ArrowRight,
  Lock, Server, Eye, Layers, Bitcoin, Sparkles, Menu, X,
} from "lucide-react";

const features = [
  { icon: Shield, title: "Non-Custodial by Default", desc: "XPUB-only on server. Private keys never touch the API. Cold wallet signing supported." },
  { icon: Zap, title: "Auto Payment Verification", desc: "Chain watchers detect payments automatically with configurable confirmation thresholds." },
  { icon: Globe, title: "Multi-Chain Support", desc: "BTC, ETH, Arbitrum, Optimism, Polygon — with USDC/USDT stablecoin support." },
  { icon: Webhook, title: "Enterprise Webhooks", desc: "HMAC-signed, timestamped webhooks with exponential retry and delivery tracking." },
  { icon: Key, title: "Scoped API Keys", desc: "Create read/write/admin-scoped API keys with rotation and audit logging." },
  { icon: Lock, title: "Isolated Signer", desc: "Hot wallet signer runs in separate Docker network. Only worker can reach it." },
  { icon: Server, title: "Self-Hosted", desc: "Docker Compose on a single VM. Postgres + Redis. No third-party dependencies." },
  { icon: BarChart3, title: "Full Reporting", desc: "Transaction reports, CSV/JSON exports, volume breakdowns by chain and asset." },
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

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container flex h-16 items-center justify-between">
          <CryptonpayLogo size="md" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild><Link to="/docs/architecture">Docs</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/docs/api">API</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/docs/security">Security</Link></Button>
            <ThemeToggle />
            <Button size="sm" className="bg-gradient-gold text-primary-foreground font-semibold ml-2" asChild>
              <Link to="/login">Sign in <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
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
                <Link to="/docs/architecture">Documentation</Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/docs/api">API Reference</Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/docs/security">Security</Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/docs/schema">Database Schema</Link>
              </Button>
              <div className="border-t border-border/50 pt-2 mt-2">
                <Button size="sm" className="w-full bg-gradient-gold text-primary-foreground font-semibold" asChild onClick={() => setMobileMenuOpen(false)}>
                  <Link to="/login">Sign in <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
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
        <div className="relative">
          <div className="flex justify-center mb-6">
            <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium border-primary/30 bg-primary/5">
              <Sparkles className="h-3 w-3 mr-1.5 text-primary" />
              Self-hosted · Non-custodial · Multi-chain
            </Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight lg:text-7xl leading-[1.1]">
            The Future of<br />
            <span className="text-gradient-gold">Crypto Payments</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Enterprise-grade payment infrastructure you deploy on your own servers.
            BTC, ETH, stablecoins — with automatic on-chain verification, webhooks, and instant settlement.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-gradient-gold text-primary-foreground font-semibold h-12 px-8 text-base glow-gold" asChild>
              <Link to="/login">Open Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-border/50" asChild>
              <Link to="/docs/architecture">View Architecture</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Live Crypto Prices */}
      <section className="border-y border-border/50 bg-card/30">
        <div className="container py-16">
          <CryptoPriceTicker />
        </div>
      </section>

      {/* Chains */}
      <section className="bg-card/50">
        <div className="container py-10">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-[0.2em] mb-6 font-medium">Supported Chains & Assets</p>
          <div className="flex flex-wrap justify-center gap-3">
            {chains.map((c) => (
              <Badge key={c.symbol} variant="outline" className="text-sm px-4 py-2 font-mono font-medium border-border/50 bg-background/50">
                {c.symbol === "BTC" && <Bitcoin className="h-3.5 w-3.5 mr-1.5 text-primary" />}
                {c.symbol}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold">Built for Security & Scale</h2>
          <p className="text-muted-foreground mt-2">Infrastructure trusted by enterprises processing millions</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="border-border/50 bg-card/80 hover:border-primary/30 transition-all duration-300 hover:glow-gold">
              <CardContent className="pt-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Status Flow */}
      <section className="border-t border-border/50 bg-card/50">
        <div className="container py-20">
          <h2 className="text-center text-3xl font-display font-bold mb-2">Payment Lifecycle</h2>
          <p className="text-center text-muted-foreground mb-10">Coinbase Commerce-compatible charge status model</p>
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
        </div>
      </section>

      {/* Docs Links */}
      <section className="container py-20">
        <h2 className="text-center text-3xl font-display font-bold mb-10">Documentation</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Architecture", desc: "System diagram, data flows, network isolation", to: "/docs/architecture", icon: Layers },
            { title: "Security", desc: "STRIDE threat model, hardening checklist", to: "/docs/security", icon: Shield },
            { title: "Database Schema", desc: "18 tables, indexes, relationships", to: "/docs/schema", icon: Server },
            { title: "API Reference", desc: "REST endpoints, webhooks, auth", to: "/docs/api", icon: Eye },
          ].map((d) => (
            <Link key={d.to} to={d.to}>
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
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="container flex flex-col items-center gap-4">
          <CryptonpayLogo size="sm" />
          <p className="text-xs text-muted-foreground text-center">
            Deploy on your own infrastructure. No third-party dependencies. Built for the next generation.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/docs/architecture" className="hover:text-foreground transition-colors">Docs</Link>
            <Link to="/docs/api" className="hover:text-foreground transition-colors">API</Link>
            <Link to="/docs/security" className="hover:text-foreground transition-colors">Security</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
