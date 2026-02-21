import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Zap, Globe, Key, Webhook, BarChart3, ArrowRight,
  Bitcoin, CircleDollarSign, Layers, Lock, Server, Eye,
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
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">SP</div>
            <span className="font-semibold">SingularityPay</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link to="/docs/architecture">Docs</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/docs/api">API</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/docs/security">Security</Link></Button>
            <Button size="sm" asChild><Link to="/login">Sign in <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-20 text-center">
        <Badge variant="outline" className="mb-4 text-xs">Self-hosted · Non-custodial · Multi-chain</Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Accept Crypto Payments<br />
          <span className="text-primary">Without Middlemen</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Enterprise-grade payment gateway you deploy on your own infrastructure. 
          BTC, ETH, stablecoins — with automatic on-chain verification, webhooks, and settlement.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild><Link to="/login">Open Dashboard <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
          <Button size="lg" variant="outline" asChild><Link to="/docs/architecture">View Architecture</Link></Button>
        </div>
      </section>

      {/* Chains */}
      <section className="border-y bg-muted/30">
        <div className="container py-8">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-wider mb-4">Supported Chains & Assets</p>
          <div className="flex flex-wrap justify-center gap-3">
            {chains.map((c) => (
              <Badge key={c.symbol} variant="outline" className="text-sm px-3 py-1.5 font-mono">{c.symbol}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <h2 className="text-center text-2xl font-bold mb-8">Built for Security & Simplicity</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="pt-6">
                <f.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Status Flow */}
      <section className="border-t bg-muted/30">
        <div className="container py-16">
          <h2 className="text-center text-2xl font-bold mb-2">Payment Lifecycle</h2>
          <p className="text-center text-muted-foreground mb-8">Coinbase Commerce-compatible charge status model</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {["NEW", "PENDING", "CONFIRMED", "PAID"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">{s}</Badge>
                {i < 3 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm mt-3">
            {["UNDERPAID", "OVERPAID", "EXPIRED", "CANCELED"].map((s) => (
              <Badge key={s} variant="outline" className="font-mono text-muted-foreground">{s}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Docs Links */}
      <section className="container py-16">
        <h2 className="text-center text-2xl font-bold mb-8">Documentation</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Architecture", desc: "System diagram, data flows, network isolation", to: "/docs/architecture", icon: Layers },
            { title: "Security", desc: "STRIDE threat model, hardening checklist", to: "/docs/security", icon: Shield },
            { title: "Database Schema", desc: "18 tables, indexes, relationships", to: "/docs/schema", icon: Server },
            { title: "API Reference", desc: "REST endpoints, webhooks, auth", to: "/docs/api", icon: Eye },
          ].map((d) => (
            <Link key={d.to} to={d.to}>
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <d.icon className="h-6 w-6 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">{d.title}</h3>
                  <p className="text-sm text-muted-foreground">{d.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-xs text-muted-foreground">
          <p>SingularityPay — Self-hosted crypto payment gateway</p>
          <p className="mt-1">Deploy on your own infrastructure. No third-party dependencies.</p>
        </div>
      </footer>
    </div>
  );
}
