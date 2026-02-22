import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, ArrowRight, Calculator, Zap, Shield, Globe } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CryptoniumpayLogo } from "@/components/CryptoniumpayLogo";
import { SocialLinks } from "@/components/SocialLinks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const competitors = [
  { name: "Cryptoniumpay", fee: "0.5%", settlement: "Instant", kyc: "None", chains: "7+", highlight: true },
  { name: "BitPay", fee: "1.0%", settlement: "1–2 days", kyc: "Full KYC", chains: "3", highlight: false },
  { name: "Coinbase Commerce", fee: "1.0%", settlement: "1–3 days", kyc: "Required", chains: "4", highlight: false },
  { name: "CoinGate", fee: "1.0%", settlement: "Next day", kyc: "Required", chains: "5", highlight: false },
  { name: "NOWPayments", fee: "0.5–1.0%", settlement: "Varies", kyc: "Optional", chains: "6", highlight: false },
];

const tiers = [
  { range: "$0 – $10K", fee: "0.50%", label: "Starter" },
  { range: "$10K – $50K", fee: "0.45%", label: "Growth" },
  { range: "$50K – $250K", fee: "0.35%", label: "Scale" },
  { range: "$250K – $1M", fee: "0.25%", label: "Enterprise" },
  { range: "$1M+", fee: "Custom", label: "Custom" },
];

function FeeCalculator() {
  const [volume, setVolume] = useState(5000);

  const getRate = (v: number) => {
    if (v >= 1_000_000) return 0.002;
    if (v >= 250_000) return 0.0025;
    if (v >= 50_000) return 0.0035;
    if (v >= 10_000) return 0.0045;
    return 0.005;
  };

  const rate = getRate(volume);
  const fee = volume * rate;
  const competitorFee = volume * 0.01;
  const saved = competitorFee - fee;

  return (
    <Card className="border-primary/20 glow-gold">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Calculator className="h-5 w-5 text-primary" />
          Fee Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Monthly Volume</Label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={volume}
              onChange={(e) => setVolume(Math.max(0, Number(e.target.value)))}
              className="w-40 font-mono"
              min={0}
            />
            <span className="text-sm text-muted-foreground">USD</span>
          </div>
          <Slider
            value={[Math.min(volume, 500_000)]}
            onValueChange={([v]) => setVolume(v)}
            max={500_000}
            step={500}
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground mb-1">Your Rate</p>
            <p className="text-2xl font-bold text-primary font-display">{(rate * 100).toFixed(2)}%</p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground mb-1">Your Fee</p>
            <p className="text-2xl font-bold font-display">${fee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg bg-success/10 p-4">
            <p className="text-xs text-muted-foreground mb-1">You Save</p>
            <p className="text-2xl font-bold text-success font-display">${saved.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Compared to the industry-standard 1.0% fee
        </p>
      </CardContent>
    </Card>
  );
}

export default function Pricing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Pricing"
        description="Cryptoniumpay charges a flat 0.5% fee — the lowest in crypto payments. No hidden costs, no KYC, volume discounts available."
      />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <CryptoniumpayLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/pricing" className="text-primary font-medium">Pricing</Link>
            <Link to="/docs/api" className="text-muted-foreground hover:text-foreground transition-colors">API Docs</Link>
            <Link to="/docs/security" className="text-muted-foreground hover:text-foreground transition-colors">Security</Link>
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
            <Link to="/pricing" className="block text-primary font-medium">Pricing</Link>
            <Link to="/docs/api" className="block text-muted-foreground">API Docs</Link>
            <Link to="/docs/security" className="block text-muted-foreground">Security</Link>
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
        <motion.section
          initial="hidden" animate="visible" variants={stagger}
          className="container mx-auto px-4 py-20 text-center"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Simple, transparent pricing</Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-bold font-display mb-4">
            <span className="text-gradient-gold">0.5%</span> flat fee
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            The lowest fee in crypto payments. No hidden charges, no monthly minimums, no KYC required. Start accepting crypto in minutes.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {[
              { icon: Zap, text: "Instant settlement" },
              { icon: Shield, text: "No KYC required" },
              { icon: Globe, text: "7+ chains supported" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" /> {text}
              </span>
            ))}
          </motion.div>
        </motion.section>

        {/* Comparison Table */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="container mx-auto px-4 py-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-bold font-display text-center mb-10">
            How We Compare
          </motion.h2>
          <motion.div variants={fadeUp} className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Settlement</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Chains</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((c) => (
                  <TableRow key={c.name} className={c.highlight ? "bg-primary/5 font-medium" : ""}>
                    <TableCell className="flex items-center gap-2">
                      {c.name}
                      {c.highlight && <Badge className="bg-gradient-gold text-primary-foreground text-[10px]">Best</Badge>}
                    </TableCell>
                    <TableCell className={c.highlight ? "text-primary font-bold" : ""}>{c.fee}</TableCell>
                    <TableCell>
                      {c.settlement === "Instant" ? (
                        <span className="flex items-center gap-1 text-success"><Check className="h-4 w-4" /> {c.settlement}</span>
                      ) : c.settlement}
                    </TableCell>
                    <TableCell>
                      {c.kyc === "None" ? (
                        <span className="flex items-center gap-1 text-success"><Check className="h-4 w-4" /> {c.kyc}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground"><X className="h-4 w-4 text-destructive" /> {c.kyc}</span>
                      )}
                    </TableCell>
                    <TableCell>{c.chains}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </motion.section>

        {/* Volume Tiers */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="container mx-auto px-4 py-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-bold font-display text-center mb-3">
            Volume Discounts
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
            Process more, pay less. Our tiered pricing rewards growth automatically.
          </motion.p>
          <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {tiers.map((t, i) => (
              <Card key={t.label} className={`text-center ${i === 3 ? "border-primary/40 glow-gold" : ""}`}>
                <CardContent className="pt-6 space-y-2">
                  <Badge variant={i === 3 ? "default" : "outline"} className={i === 3 ? "bg-gradient-gold text-primary-foreground" : ""}>
                    {t.label}
                  </Badge>
                  <p className="text-3xl font-bold font-display text-primary">{t.fee}</p>
                  <p className="text-sm text-muted-foreground">{t.range}/mo</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </motion.section>

        {/* Calculator */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="container mx-auto px-4 py-16 max-w-xl"
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-bold font-display text-center mb-10">
            Estimate Your Fees
          </motion.h2>
          <motion.div variants={fadeUp}>
            <FeeCalculator />
          </motion.div>
        </motion.section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold font-display mb-4">Ready to save on every transaction?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Set up in minutes. No contracts, no minimums, cancel anytime.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-gradient-gold text-primary-foreground gap-2">
              Start Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-foreground">Home</Link>
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
