import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { CopyButton } from "@/components/CopyButton";
import {
  BookOpen, Key, CreditCard, Globe, Webhook, FileText, Wallet,
  Settings, Shield, Download, Code, HelpCircle, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, Info, ArrowRight, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  Collapsible Section                                                */
/* ------------------------------------------------------------------ */
function Section({ id, icon: Icon, title, children, defaultOpen = false }: {
  id: string; icon: React.ElementType; title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader className="cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5 text-primary" />
          {title}
          {open ? <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" /> : <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="pt-0 space-y-4 text-sm leading-relaxed">{children}</CardContent>}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Code Block with copy                                               */
/* ------------------------------------------------------------------ */
function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  return (
    <div className="relative group">
      <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">{code}</pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton value={code} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Table                                                       */
/* ------------------------------------------------------------------ */
function StatusTable({ rows }: { rows: { status: string; meaning: string; action: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="border-b text-left text-muted-foreground uppercase"><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Meaning</th><th className="py-2">What to Do</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.status} className="border-b last:border-0">
            <td className="py-2 pr-4"><Badge variant="outline" className="font-mono text-xs">{r.status}</Badge></td>
            <td className="py-2 pr-4 text-muted-foreground">{r.meaning}</td>
            <td className="py-2 text-muted-foreground">{r.action}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tip / Warning / Info callouts                                      */
/* ------------------------------------------------------------------ */
function Callout({ type, children }: { type: "tip" | "warning" | "info"; children: React.ReactNode }) {
  const styles = {
    tip: { icon: CheckCircle2, border: "border-l-4 border-l-emerald-500 bg-emerald-500/5" },
    warning: { icon: AlertTriangle, border: "border-l-4 border-l-amber-500 bg-amber-500/5" },
    info: { icon: Info, border: "border-l-4 border-l-blue-500 bg-blue-500/5" },
  };
  const s = styles[type];
  return (
    <div className={cn("p-3 rounded-r-lg text-xs flex gap-2 items-start", s.border)}>
      <s.icon className="h-4 w-4 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick nav (table of contents)                                      */
/* ------------------------------------------------------------------ */
const TOC = [
  { id: "getting-started", label: "Getting Started", icon: BookOpen },
  { id: "dashboard", label: "Dashboard Overview", icon: Settings },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "charges", label: "Accepting Payments", icon: CreditCard },
  { id: "checkout", label: "Hosted Checkout", icon: Globe },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "settlement", label: "Settlement", icon: Settings },
  { id: "security", label: "Security", icon: Shield },
  { id: "exports", label: "Exports & Reports", icon: Download },
  { id: "code-examples", label: "Code Examples", icon: Code },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

const API_BASE = "https://cryptoniumpay-api-gateway.mailg.workers.dev/api";

/* ================================================================== */
/*  Main Page                                                          */
/* ================================================================== */
export default function MerchantGuide() {
  const { t } = useI18n();
  usePageTitle("Merchant Guide");

  return (
    <div className="max-w-4xl space-y-6" data-testid="page:dashboard-guide">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Merchant Integration Guide
        </h1>
        <p className="text-sm text-muted-foreground">
          Complete noob-friendly guide — every step has copy-paste examples. No coding experience required.
        </p>
      </div>

      {/* Quick nav */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Jump to section</p>
          <div className="flex flex-wrap gap-1.5">
            {TOC.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-muted hover:bg-accent transition-colors">
                <s.icon className="h-3 w-3" />
                {s.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/*  1. GETTING STARTED                                          */}
      {/* ============================================================ */}
      <Section id="getting-started" icon={BookOpen} title="1. Getting Started (5 Minutes)" defaultOpen>
        <h3 className="font-semibold">Step 1: Create Your Account</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <code className="text-xs bg-muted px-1 rounded">/signup</code></li>
          <li>Enter your <strong>name</strong>, <strong>email</strong>, and <strong>password</strong></li>
          <li>Password must be at least 8 characters with uppercase, number, and symbol</li>
          <li>Click <strong>Create Account</strong></li>
          <li>You'll be redirected to the Merchant Dashboard</li>
        </ol>
        <Callout type="tip">No KYC, no company verification, no waiting period. You can start accepting payments immediately.</Callout>

        <h3 className="font-semibold">Step 2: Secure Your Account</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <Link to="/dashboard/settings/security" className="text-primary underline">Settings → Security</Link></li>
          <li>Click <strong>Enable 2FA</strong></li>
          <li>Scan the QR code with Google Authenticator or Authy</li>
          <li>Enter the 6-digit code to confirm</li>
          <li><strong>Save your backup codes</strong> somewhere safe</li>
        </ol>

        <h3 className="font-semibold">Step 3: Get Your API Key</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <Link to="/dashboard/settings/api-keys" className="text-primary underline">Settings → API Keys</Link></li>
          <li>Click <strong>Create API Key</strong></li>
          <li>Give it a name (e.g., "My Website")</li>
          <li>Select scopes: <Badge variant="outline" className="text-xs">read</Badge> + <Badge variant="outline" className="text-xs">write</Badge></li>
          <li>Click <strong>Create</strong></li>
        </ol>
        <Callout type="warning">Copy the API key immediately — it's shown only once! Your key looks like: <code className="text-xs">cp_live_a1b2c3d4...</code></Callout>
      </Section>

      {/* ============================================================ */}
      {/*  2. DASHBOARD OVERVIEW                                       */}
      {/* ============================================================ */}
      <Section id="dashboard" icon={Settings} title="2. Your Dashboard — What's Where">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left text-muted-foreground uppercase"><th className="py-2 pr-4">Section</th><th className="py-2 pr-4">What It Does</th><th className="py-2">Location</th></tr></thead>
            <tbody>
              {[
                ["Dashboard Home", "Overview: total charges, pending payments, volume charts", "/dashboard"],
                ["Charges", "Create and manage payment requests", "/dashboard/charges"],
                ["Invoices", "Create and send invoices to customers", "/dashboard/invoices"],
                ["Wallets", "Manage your crypto wallets (hot + cold)", "/dashboard/wallets"],
                ["Reports", "Export transaction data as CSV/JSON", "/dashboard/reports"],
                ["Notifications", "Payment alerts, system updates", "/dashboard/notifications"],
                ["Export Center", "Download large data exports", "/dashboard/exports"],
                ["Intelligence", "Predictive analytics (volume trends, risk)", "/dashboard/intelligence"],
              ].map(([name, desc, path]) => (
                <tr key={path} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium"><Link to={path} className="text-primary underline">{name}</Link></td>
                  <td className="py-2 pr-4 text-muted-foreground">{desc}</td>
                  <td className="py-2 font-mono text-muted-foreground">{path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  3. API KEYS                                                 */}
      {/* ============================================================ */}
      <Section id="api-keys" icon={Key} title="3. Creating API Keys">
        <h3 className="font-semibold">Via Dashboard (Easiest)</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <Link to="/dashboard/settings/api-keys" className="text-primary underline">Settings → API Keys</Link></li>
          <li>Click <strong>Create API Key</strong></li>
          <li>Name it (e.g., "Production Website")</li>
          <li>Select scopes: <Badge variant="outline" className="text-xs">read</Badge> view data · <Badge variant="outline" className="text-xs">write</Badge> create charges · <Badge variant="outline" className="text-xs">admin</Badge> full access</li>
          <li>Click <strong>Create</strong> → Copy the key</li>
        </ol>

        <h3 className="font-semibold">Via API (curl)</h3>
        <CodeBlock code={`# Login to get JWT token
TOKEN=$(curl -s -X POST ${API_BASE}/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \\
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Create API key
curl -X POST ${API_BASE}/v1/api-keys \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My Website", "scopes": ["read", "write"]}'`} />

        <h3 className="font-semibold">Security Rules</h3>
        <div className="space-y-1">
          <p className="flex gap-2 items-center">❌ <strong>Never</strong> put your API key in frontend JavaScript</p>
          <p className="flex gap-2 items-center">✅ Always use it in backend server code only</p>
          <p className="flex gap-2 items-center">✅ Store in environment variables, not in code</p>
          <p className="flex gap-2 items-center">✅ Use separate keys for testing and production</p>
          <p className="flex gap-2 items-center">✅ Revoke and rotate keys regularly</p>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  4. ACCEPTING PAYMENTS (CHARGES)                             */}
      {/* ============================================================ */}
      <Section id="charges" icon={CreditCard} title="4. Accepting Payments (Charges)">
        <Callout type="info">A "Charge" is a payment request. When you create one, Cryptoniumpay generates unique crypto addresses for the customer to pay to.</Callout>

        <h3 className="font-semibold">How It Works</h3>
        <div className="bg-muted p-4 rounded-lg text-xs font-mono space-y-1">
          <p>1. Your website creates a Charge via API</p>
          <p>2. Cryptoniumpay returns a hosted_url (checkout page)</p>
          <p>3. You redirect the customer to that URL</p>
          <p>4. Customer sees QR code + amount for BTC, ETH, etc.</p>
          <p>5. Customer pays with their crypto wallet</p>
          <p>6. Blockchain confirms the transaction</p>
          <p>7. Cryptoniumpay sends a webhook to your server</p>
          <p>8. Your server marks the order as "paid" ✅</p>
        </div>

        <h3 className="font-semibold">Create a Charge (Dashboard)</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <Link to="/dashboard/charges/new" className="text-primary underline">Charges → Create Charge</Link></li>
          <li>Fill in Name, Description, Amount, Currency, Expiration</li>
          <li>Click <strong>Create Charge</strong></li>
          <li>Copy the <strong>Hosted URL</strong></li>
        </ol>

        <h3 className="font-semibold">Create a Charge (API)</h3>
        <CodeBlock code={`curl -X POST ${API_BASE}/v1/charges \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: order-1234-unique-id" \\
  -d '{
    "name": "Order #1234",
    "description": "Premium subscription - 1 year",
    "pricing_type": "fixed_price",
    "local_price": { "amount": "99.00", "currency": "USD" },
    "expires_in_minutes": 60,
    "redirect_url": "https://yoursite.com/thank-you",
    "cancel_url": "https://yoursite.com/cart"
  }'`} />

        <Callout type="tip">The <strong>Idempotency-Key</strong> prevents duplicate charges. If your server crashes and retries, the API returns the same charge. Use your order ID.</Callout>

        <h3 className="font-semibold">Charge Statuses</h3>
        <StatusTable rows={[
          { status: "NEW", meaning: "Just created, no payment yet", action: "Customer needs to pay" },
          { status: "PENDING", meaning: "Payment detected, waiting for confirmations", action: "Wait for blockchain" },
          { status: "CONFIRMED", meaning: "Payment confirmed on blockchain", action: "✅ Fulfill the order!" },
          { status: "EXPIRED", meaning: "Customer didn't pay in time", action: "Show 'payment expired'" },
          { status: "UNDERPAID", meaning: "Received less than expected", action: "Request remaining amount" },
          { status: "OVERPAID", meaning: "Received more than expected", action: "Refund excess" },
        ]} />

        <h3 className="font-semibold">Check Charge Status</h3>
        <CodeBlock code={`curl ${API_BASE}/v1/charges/YOUR_CHARGE_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"`} />

        <h3 className="font-semibold">List All Charges</h3>
        <CodeBlock code={`# All charges
curl ${API_BASE}/v1/charges \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by status
curl "${API_BASE}/v1/charges?status=CONFIRMED&page=1&per_page=25" \\
  -H "Authorization: Bearer YOUR_API_KEY"`} />
      </Section>

      {/* ============================================================ */}
      {/*  5. HOSTED CHECKOUT                                          */}
      {/* ============================================================ */}
      <Section id="checkout" icon={Globe} title="5. Hosted Checkout Page">
        <p>When you create a charge, you get a <code className="text-xs bg-muted px-1 rounded">hosted_url</code>. This is a ready-made checkout page showing:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>💰 Amount in crypto (e.g., 0.00105 BTC)</li>
          <li>📱 QR Code — scan with any crypto wallet</li>
          <li>⏱️ Countdown Timer</li>
          <li>🔗 Chain Selector — choose BTC, ETH, Polygon, etc.</li>
          <li>📋 Copy Address — one-click copy</li>
        </ul>

        <h3 className="font-semibold">Payment Flow</h3>
        <div className="bg-muted p-4 rounded-lg text-xs font-mono space-y-1">
          <p>Your Website ──POST /v1/charges──▶ Cryptoniumpay</p>
          <p>Your Website ◀──hosted_url──── Cryptoniumpay</p>
          <p>Customer ──────redirect──────▶ Checkout Page</p>
          <p>Customer pays... blockchain confirms...</p>
          <p>Your Website ◀──webhook: charge.confirmed── Cryptoniumpay</p>
          <p>Customer ──────redirect──────▶ Thank You Page</p>
        </div>

        <h3 className="font-semibold">Embed as iframe</h3>
        <CodeBlock language="html" code={`<iframe 
  src="https://cryptoniumpay.pages.dev/pay/YOUR_CHARGE_ID" 
  width="400" height="600" frameborder="0"
></iframe>`} />
      </Section>

      {/* ============================================================ */}
      {/*  6. WEBHOOKS                                                 */}
      {/* ============================================================ */}
      <Section id="webhooks" icon={Webhook} title="6. Webhooks — Get Notified When Paid">
        <Callout type="info">Without webhooks, you'd have to keep polling the API. Webhooks tell you instantly when a payment happens.</Callout>

        <h3 className="font-semibold">Step 1: Create a Webhook Endpoint on Your Server</h3>
        <CodeBlock language="javascript" code={`// Node.js / Express
app.post('/webhooks/cryptoniumpay', (req, res) => {
  const event = req.body;
  
  if (event.type === 'charge:confirmed') {
    const chargeId = event.data.id;
    // Mark order as paid in your database
    markOrderAsPaid(chargeId);
  }
  
  res.status(200).send('OK'); // Always respond 200
});`} />

        <h3 className="font-semibold">Step 2: Register in Dashboard</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <Link to="/dashboard/settings/webhooks" className="text-primary underline">Settings → Webhooks</Link></li>
          <li>Click <strong>Create Webhook</strong></li>
          <li>Enter your URL: <code className="text-xs bg-muted px-1 rounded">https://yoursite.com/webhooks/cryptoniumpay</code></li>
          <li>Select events: <Badge variant="outline" className="text-xs">charge.paid</Badge> <Badge variant="outline" className="text-xs">charge.confirmed</Badge> <Badge variant="outline" className="text-xs">charge.expired</Badge></li>
          <li>Click <strong>Create</strong></li>
        </ol>

        <h3 className="font-semibold">Step 3: Verify Signatures (Important!)</h3>
        <CodeBlock language="javascript" code={`const crypto = require('crypto');

app.post('/webhooks/cryptoniumpay', (req, res) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  
  const expected = crypto
    .createHmac('sha256', 'YOUR_WEBHOOK_SECRET')
    .update(timestamp + '.' + JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).send('Invalid signature');
  }

  // Safe to process...
  res.status(200).send('OK');
});`} />

        <h3 className="font-semibold">Webhook Events</h3>
        <StatusTable rows={[
          { status: "charge.created", meaning: "Charge was created", action: "Informational" },
          { status: "charge.pending", meaning: "Payment detected, awaiting confirms", action: "Show 'confirming...'" },
          { status: "charge.confirmed", meaning: "Payment confirmed ✅", action: "Fulfill the order!" },
          { status: "charge.expired", meaning: "Charge expired", action: "Show 'expired'" },
          { status: "charge.underpaid", meaning: "Received less than expected", action: "Contact customer" },
        ]} />

        <Callout type="tip">Use the <strong>Test</strong> button in Settings → Webhooks to send a test event without real payment.</Callout>
      </Section>

      {/* ============================================================ */}
      {/*  7. INVOICES                                                 */}
      {/* ============================================================ */}
      <Section id="invoices" icon={FileText} title="7. Managing Invoices">
        <h3 className="font-semibold">Create an Invoice (Dashboard)</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <Link to="/dashboard/invoices/new" className="text-primary underline">Invoices → Create Invoice</Link></li>
          <li>Fill in customer name, email, line items, amount, due date</li>
          <li>Click <strong>Create</strong></li>
          <li>Click <strong>Send</strong> to email it</li>
        </ol>

        <h3 className="font-semibold">Via API</h3>
        <CodeBlock code={`curl -X POST ${API_BASE}/v1/invoices \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customer_name": "Acme Corp",
    "customer_email": "billing@acme.com",
    "amount": "500.00",
    "currency": "USD",
    "due_date": "2026-03-15",
    "items": [
      {"description": "Web Development - February", "amount": "500.00"}
    ]
  }'`} />

        <h3 className="font-semibold">Invoice Lifecycle</h3>
        <StatusTable rows={[
          { status: "draft", meaning: "Created but not sent", action: "Click Send when ready" },
          { status: "sent", meaning: "Emailed to customer", action: "Wait for payment" },
          { status: "paid", meaning: "Customer paid ✅", action: "Done!" },
          { status: "overdue", meaning: "Past due date", action: "Follow up" },
          { status: "cancelled", meaning: "You cancelled it", action: "Nothing" },
        ]} />
      </Section>

      {/* ============================================================ */}
      {/*  8. WALLETS                                                  */}
      {/* ============================================================ */}
      <Section id="wallets" icon={Wallet} title="8. Wallet Management">
        <h3 className="font-semibold">Types of Wallets</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left text-muted-foreground uppercase"><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Description</th><th className="py-2">Use For</th></tr></thead>
            <tbody>
              <tr className="border-b"><td className="py-2 pr-4 font-medium">Hot Wallet</td><td className="py-2 pr-4 text-muted-foreground">Online, keys encrypted on server</td><td className="py-2 text-muted-foreground">Automated payment processing</td></tr>
              <tr className="border-b"><td className="py-2 pr-4 font-medium">Cold Wallet</td><td className="py-2 pr-4 text-muted-foreground">Offline, watch-only on server</td><td className="py-2 text-muted-foreground">Large balance storage</td></tr>
              <tr className="border-b last:border-0"><td className="py-2 pr-4 font-medium">WalletConnect</td><td className="py-2 pr-4 text-muted-foreground">MetaMask, Trust Wallet, etc.</td><td className="py-2 text-muted-foreground">Non-custodial control</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-semibold">Generate a New Wallet</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <Link to="/dashboard/wallets" className="text-primary underline">Wallets</Link> → Click <strong>Generate Wallet</strong></li>
          <li>Select a Chain (Bitcoin, Ethereum, Solana, etc.)</li>
          <li>Enter a Label (e.g., "BTC Payments")</li>
          <li>Click <strong>Generate</strong></li>
        </ol>
        <Callout type="warning">You'll see your <strong>Private Key</strong> and <strong>Recovery Phrase</strong> — write them down and store safely. They are shown ONLY ONCE.</Callout>

        <h3 className="font-semibold">Supported Chains</h3>
        <div className="flex flex-wrap gap-1.5">
          {["Bitcoin (BTC)", "Ethereum (ETH)", "Polygon (MATIC)", "Arbitrum", "Optimism", "Avalanche (AVAX)", "BSC (BNB)", "Fantom (FTM)", "Base", "Solana (SOL)", "Tron (TRX)", "Litecoin (LTC)", "Dogecoin (DOGE)"].map((c) => (
            <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
          ))}
        </div>

        <h3 className="font-semibold">Send Crypto</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <strong>Wallets</strong> → Select a wallet → Click <strong>Send</strong></li>
          <li>Enter: To Address, Amount, Memo (optional)</li>
          <li>Review estimated fee</li>
          <li>Click <strong>Confirm Send</strong></li>
        </ol>
      </Section>

      {/* ============================================================ */}
      {/*  9. SETTLEMENT                                               */}
      {/* ============================================================ */}
      <Section id="settlement" icon={Settings} title="9. Settlement & Withdrawals">
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <Link to="/dashboard/settings/settlement" className="text-primary underline">Settings → Settlement</Link></li>
          <li>Set your <strong>settlement address</strong> (where crypto gets sent)</li>
          <li>Choose sweep mode:</li>
        </ol>
        <div className="ml-5 space-y-1 mt-2">
          <p><Badge variant="outline" className="text-xs">Immediate</Badge> — Sweep after each confirmed payment</p>
          <p><Badge variant="outline" className="text-xs">Threshold</Badge> — Sweep when balance exceeds minimum</p>
          <p><Badge variant="outline" className="text-xs">Manual</Badge> — You trigger sweeps manually</p>
        </div>

        <h3 className="font-semibold">Via API</h3>
        <CodeBlock code={`curl -X PUT ${API_BASE}/v1/settlement \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "chain": "eth",
    "asset": "USDC",
    "address": "0xYourPersonalWalletAddress",
    "sweep_mode": "threshold",
    "min_sweep_threshold": "100.00"
  }'`} />
      </Section>

      {/* ============================================================ */}
      {/*  10. SECURITY                                                */}
      {/* ============================================================ */}
      <Section id="security" icon={Shield} title="10. Security Settings">
        <h3 className="font-semibold">Enable 2FA</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li><Link to="/dashboard/settings/security" className="text-primary underline">Settings → Security</Link> → Click <strong>Enable 2FA</strong></li>
          <li>Scan QR with Google Authenticator / Authy</li>
          <li>Enter the 6-digit code</li>
          <li>Save backup codes</li>
        </ol>

        <h3 className="font-semibold">Manage Sessions</h3>
        <p>See all logged-in devices → Click <strong>Revoke</strong> on suspicious sessions, or <strong>Revoke All</strong> to log out everywhere.</p>

        <h3 className="font-semibold">Change Password</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Settings → Security → <strong>Change Password</strong></li>
          <li>Enter current password → Enter new password → Click <strong>Update</strong></li>
        </ol>
      </Section>

      {/* ============================================================ */}
      {/*  11. EXPORTS & REPORTS                                       */}
      {/* ============================================================ */}
      <Section id="exports" icon={Download} title="11. Exports & Reports">
        <h3 className="font-semibold">Quick Export</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <Link to="/dashboard/reports" className="text-primary underline">Reports</Link> → Select date range</li>
          <li>Click <strong>Export CSV</strong> or <strong>Export JSON</strong></li>
        </ol>

        <h3 className="font-semibold">Large Data Exports</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Go to <Link to="/dashboard/exports" className="text-primary underline">Export Center</Link></li>
          <li>Click <strong>New Export</strong></li>
          <li>Select type: Charges, Invoices, Transactions, or Webhook Deliveries</li>
          <li>Select date range and filters</li>
          <li>Click <strong>Start Export</strong> → Wait → Click <strong>Download</strong></li>
        </ol>
      </Section>

      {/* ============================================================ */}
      {/*  12. CODE EXAMPLES                                           */}
      {/* ============================================================ */}
      <Section id="code-examples" icon={Code} title="12. Code Examples (Copy-Paste)">
        <Tabs defaultValue="nodejs">
          <TabsList>
            <TabsTrigger value="nodejs" className="text-xs">Node.js</TabsTrigger>
            <TabsTrigger value="python" className="text-xs">Python</TabsTrigger>
            <TabsTrigger value="php" className="text-xs">PHP</TabsTrigger>
            <TabsTrigger value="html" className="text-xs">HTML Button</TabsTrigger>
          </TabsList>

          <TabsContent value="nodejs" className="mt-3">
            <CodeBlock language="javascript" code={`const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const API_KEY = process.env.CRYPTONIUMPAY_API_KEY;
const WEBHOOK_SECRET = process.env.CRYPTONIUMPAY_WEBHOOK_SECRET;
const API_BASE = '${API_BASE}';

// Create payment
app.post('/create-payment', async (req, res) => {
  try {
    const response = await axios.post(\`\${API_BASE}/v1/charges\`, {
      name: \`Order #\${req.body.orderId}\`,
      pricing_type: 'fixed_price',
      local_price: { amount: req.body.amount, currency: 'USD' },
      expires_in_minutes: 60,
      redirect_url: \`https://yoursite.com/order/\${req.body.orderId}/success\`,
    }, {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Idempotency-Key': \`order-\${req.body.orderId}\`
      }
    });
    res.json({ checkout_url: response.data.hosted_url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Webhook handler
app.post('/webhooks/cryptoniumpay', (req, res) => {
  const sig = req.headers['x-signature'];
  const ts = req.headers['x-timestamp'];
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET)
    .update(ts + '.' + JSON.stringify(req.body)).digest('hex');

  if (sig !== expected) return res.status(401).send('Bad sig');

  if (req.body.type === 'charge:confirmed') {
    console.log('Paid!', req.body.data.id);
    // fulfillOrder(req.body.data.metadata.orderId);
  }
  res.status(200).send('OK');
});

app.listen(3000);`} />
          </TabsContent>

          <TabsContent value="python" className="mt-3">
            <CodeBlock language="python" code={`import hmac, hashlib, json, requests
from flask import Flask, request, jsonify

app = Flask(__name__)
API_KEY = "YOUR_API_KEY"
WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET"
API_BASE = "${API_BASE}"

@app.route('/create-payment', methods=['POST'])
def create_payment():
    data = request.json
    r = requests.post(f"{API_BASE}/v1/charges", json={
        "name": f"Order #{data['order_id']}",
        "pricing_type": "fixed_price",
        "local_price": {"amount": str(data["amount"]), "currency": "USD"},
        "expires_in_minutes": 60,
    }, headers={
        "Authorization": f"Bearer {API_KEY}",
        "Idempotency-Key": f"order-{data['order_id']}"
    })
    return jsonify({"checkout_url": r.json()["hosted_url"]})

@app.route('/webhooks/cryptoniumpay', methods=['POST'])
def webhook():
    sig = request.headers.get('X-Signature', '')
    ts = request.headers.get('X-Timestamp', '')
    payload = ts + '.' + json.dumps(request.json, separators=(',', ':'))
    expected = hmac.new(WEBHOOK_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return "Invalid", 401
    if request.json["type"] == "charge:confirmed":
        print(f"Paid: {request.json['data']['id']}")
    return "OK", 200

if __name__ == '__main__':
    app.run(port=3000)`} />
          </TabsContent>

          <TabsContent value="php" className="mt-3">
            <CodeBlock language="php" code={`<?php
// Create payment
Route::post('/create-payment', function (Request $request) {
    $response = Http::withHeaders([
        'Authorization' => 'Bearer ' . env('CRYPTONIUMPAY_API_KEY'),
        'Idempotency-Key' => 'order-' . $request->order_id,
    ])->post('${API_BASE}/v1/charges', [
        'name' => 'Order #' . $request->order_id,
        'pricing_type' => 'fixed_price',
        'local_price' => ['amount' => (string) $request->amount, 'currency' => 'USD'],
        'expires_in_minutes' => 60,
    ]);
    return response()->json(['checkout_url' => $response->json('hosted_url')]);
});

// Webhook handler
Route::post('/webhooks/cryptoniumpay', function (Request $request) {
    $sig = $request->header('X-Signature');
    $ts = $request->header('X-Timestamp');
    $payload = $ts . '.' . json_encode($request->all());
    $expected = hash_hmac('sha256', $payload, env('CRYPTONIUMPAY_WEBHOOK_SECRET'));
    if (!hash_equals($expected, $sig)) return response('Invalid', 401);
    if ($request->input('type') === 'charge:confirmed') {
        Log::info("Paid: " . $request->input('data.id'));
    }
    return response('OK', 200);
});`} />
          </TabsContent>

          <TabsContent value="html" className="mt-3">
            <p className="mb-2">For a simple "Pay with Crypto" button on a static page:</p>
            <CodeBlock language="html" code={`<a href="https://cryptoniumpay.pages.dev/pay/YOUR_CHARGE_ID" 
   target="_blank"
   style="display:inline-block; padding:12px 24px; background:#6366f1; 
          color:white; text-decoration:none; border-radius:8px; font-weight:bold;">
  💰 Pay with Crypto
</a>`} />
          </TabsContent>
        </Tabs>
      </Section>

      {/* ============================================================ */}
      {/*  13. FAQ                                                     */}
      {/* ============================================================ */}
      <Section id="faq" icon={HelpCircle} title="13. FAQ">
        {[
          { q: "How much does Cryptoniumpay charge?", a: "0.5% flat fee per transaction. No monthly fees, no setup fees, no hidden costs." },
          { q: "Which cryptocurrencies are supported?", a: "BTC, ETH, MATIC, ARB, OP, AVAX, BNB, FTM, BASE, SOL, TRX, LTC, DOGE — and all ERC-20/BEP-20 tokens." },
          { q: "How fast do payments confirm?", a: "Bitcoin: 10-60 min (3 confirms) · Ethereum: 2-5 min (12 confirms) · Polygon: 30-60s (30 confirms) · Solana: 5-15s (1 confirm)" },
          { q: "What happens if the customer underpays?", a: "Charge shows partial payment. You can accept it, request the remaining amount, or refund." },
          { q: "What if my webhook endpoint is down?", a: "Retries with exponential backoff: 1 min → 5 min → 30 min → 2 hours → 24 hours. All delivery attempts are logged." },
          { q: "How do I test without real crypto?", a: "Use testnet chains during development. Also use the 'Test Webhook' feature to simulate events." },
          { q: "Where are my private keys stored?", a: "Hot wallets: encrypted with AES-256-GCM on server. Cold wallets & WalletConnect: keys are NEVER stored on the server." },
        ].map((item) => (
          <div key={item.q} className="space-y-1">
            <p className="font-semibold">{item.q}</p>
            <p className="text-muted-foreground">{item.a}</p>
          </div>
        ))}
      </Section>

      {/* ============================================================ */}
      {/*  Quick Reference Card                                        */}
      {/* ============================================================ */}
      <Card className="border-primary/20">
        <CardHeader><CardTitle className="text-base">Quick Reference Card</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b text-left text-muted-foreground uppercase"><th className="py-2 pr-4">Action</th><th className="py-2 pr-4">Dashboard</th><th className="py-2">API Endpoint</th></tr></thead>
              <tbody>
                {[
                  ["Create charge", "Charges → Create", "POST /v1/charges"],
                  ["Check status", "Charges → Click charge", "GET /v1/charges/:id"],
                  ["Create API key", "Settings → API Keys", "POST /v1/api-keys"],
                  ["Create webhook", "Settings → Webhooks", "POST /v1/webhooks"],
                  ["Generate wallet", "Wallets → Generate", "POST /v1/wallets/generate"],
                  ["Send crypto", "Wallets → Send", "POST /v1/wallets/:id/send"],
                  ["Create invoice", "Invoices → Create", "POST /v1/invoices"],
                  ["Settlement config", "Settings → Settlement", "PUT /v1/settlement"],
                ].map(([action, dash, api]) => (
                  <tr key={action} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{action}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{dash}</td>
                    <td className="py-2 font-mono text-muted-foreground">{api}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <strong>API Base URL:</strong> <code className="bg-muted px-1 rounded">{API_BASE}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}