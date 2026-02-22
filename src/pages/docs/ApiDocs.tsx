import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocsNav } from "@/components/DocsNav";
import { SEOHead } from "@/components/SEOHead";
import { ShareBar } from "@/components/ShareBar";

const endpoints = [
  { method: "POST", path: "/v1/auth/login", desc: "Authenticate and receive JWT", auth: false },
  { method: "POST", path: "/v1/charges", desc: "Create a new charge/invoice", auth: true },
  { method: "GET", path: "/v1/charges/{id}", desc: "Retrieve charge details", auth: true },
  { method: "GET", path: "/v1/charges", desc: "List charges with filters", auth: true },
  { method: "GET", path: "/v1/charges/{id}/transactions", desc: "List inbound payments for a charge", auth: true },
  { method: "GET", path: "/v1/checkout/{id}", desc: "Public charge data for checkout page", auth: false },
  { method: "POST", path: "/v1/api-keys", desc: "Create a new API key", auth: true },
  { method: "GET", path: "/v1/api-keys", desc: "List API keys", auth: true },
  { method: "DELETE", path: "/v1/api-keys/{id}", desc: "Revoke an API key", auth: true },
  { method: "POST", path: "/v1/webhooks", desc: "Create webhook endpoint", auth: true },
  { method: "GET", path: "/v1/webhooks", desc: "List webhook endpoints", auth: true },
  { method: "DELETE", path: "/v1/webhooks/{id}", desc: "Delete webhook endpoint", auth: true },
  { method: "POST", path: "/v1/webhooks/{id}/test", desc: "Send test webhook", auth: true },
  { method: "GET", path: "/v1/webhooks/{id}/deliveries", desc: "List webhook delivery attempts", auth: true },
  { method: "GET", path: "/v1/settlement", desc: "Get settlement config", auth: true },
  { method: "PUT", path: "/v1/settlement", desc: "Update settlement config", auth: true },
  { method: "GET", path: "/v1/sweeps", desc: "List settlement sweeps", auth: true },
  { method: "GET", path: "/v1/addresses/stats", desc: "Address pool statistics", auth: true },
  { method: "POST", path: "/v1/addresses/upload", desc: "Upload deposit addresses", auth: true },
  { method: "GET", path: "/v1/dashboard/stats", desc: "Merchant dashboard statistics", auth: true },
  { method: "GET", path: "/v1/admin/stats", desc: "Admin global statistics", auth: true },
  { method: "GET", path: "/v1/admin/merchants", desc: "List all merchants", auth: true },
  { method: "PATCH", path: "/v1/admin/merchants/{id}", desc: "Enable/disable merchant", auth: true },
  { method: "GET", path: "/v1/admin/chains", desc: "List chain configurations", auth: true },
  { method: "PUT", path: "/v1/admin/chains/{chain}", desc: "Update chain config", auth: true },
  { method: "GET", path: "/v1/admin/health", desc: "System health with watcher status", auth: true },
  { method: "GET", path: "/v1/admin/audit-log", desc: "Query audit log entries", auth: true },
  { method: "GET", path: "/v1/health", desc: "Public health check", auth: false },
];

const webhookEvents = [
  { type: "charge.created", desc: "Charge was created" },
  { type: "charge.pending", desc: "Payment detected, awaiting confirmations" },
  { type: "charge.confirmed", desc: "Payment confirmed on-chain" },
  { type: "charge.paid", desc: "Fully paid and settled" },
  { type: "charge.expired", desc: "Charge expired without full payment" },
  { type: "charge.underpaid", desc: "Received less than expected" },
  { type: "charge.overpaid", desc: "Received more than expected" },
  { type: "settlement.sweep.initiated", desc: "Sweep transaction broadcasted" },
  { type: "settlement.sweep.confirmed", desc: "Sweep confirmed on-chain" },
  { type: "settlement.sweep.failed", desc: "Sweep transaction failed" },
];

const methodColor: Record<string, string> = {
  GET: "bg-info/15 text-info",
  POST: "bg-success/15 text-success",
  PUT: "bg-warning/15 text-warning",
  DELETE: "bg-destructive/15 text-destructive",
  PATCH: "bg-warning/15 text-warning",
};

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="API Reference" description="Complete REST API reference for Cryptoniumpay. 33 authenticated endpoints across charges, webhooks, settlement, and admin." />
      <DocsNav />
      <div className="max-w-5xl mx-auto space-y-8 py-8 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">API Reference</h1>
          <ShareBar title="Cryptoniumpay API Reference" />
        </div>

        <Tabs defaultValue="endpoints">
          <TabsList>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="webhooks">Webhook Events</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2 w-20">Method</th><th className="px-4 py-2">Path</th><th className="px-4 py-2">Description</th><th className="px-4 py-2 w-16">Auth</th></tr></thead>
                  <tbody>{endpoints.map((ep, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-2"><Badge className={`text-xs font-mono ${methodColor[ep.method]}`}>{ep.method}</Badge></td>
                      <td className="px-4 py-2 font-mono text-xs">{ep.path}</td>
                      <td className="px-4 py-2 text-muted-foreground">{ep.desc}</td>
                      <td className="px-4 py-2">{ep.auth ? <Badge variant="outline" className="text-xs">Required</Badge> : <span className="text-xs text-muted-foreground">No</span>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader><CardTitle className="text-sm">Create Charge — Request Example</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-4 rounded overflow-x-auto">{JSON.stringify({
                  name: "Order #12345",
                  description: "Premium subscription",
                  pricing_type: "fixed_price",
                  local_price: { amount: "99.00", currency: "USD" },
                  expires_in_minutes: 60,
                  metadata: { order_id: "12345", customer_email: "user@example.com" },
                  redirect_url: "https://shop.example.com/success",
                  cancel_url: "https://shop.example.com/cancel",
                }, null, 2)}</pre>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader><CardTitle className="text-sm">Create Charge — Response Example</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-4 rounded overflow-x-auto">{JSON.stringify({
                  id: "c7e8f9a0-1b2c-4d5e-6f7a-8b9c0d1e2f3a",
                  name: "Order #12345",
                  status: "NEW",
                  hosted_url: "https://pay.cryptoniumpay.com/pay/c7e8f9a0",
                  addresses: {
                    "btc-BTC": { chain: "btc", asset: "BTC", address: "bc1q...", amount: "0.00145200" },
                    "eth-USDC": { chain: "eth", asset: "USDC", address: "0x...", amount: "99.000000" },
                  },
                  expires_at: "2026-02-21T21:30:00Z",
                  created_at: "2026-02-21T20:30:00Z",
                }, null, 2)}</pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2">Event Type</th><th className="px-4 py-2">Description</th></tr></thead>
                  <tbody>{webhookEvents.map((e) => (
                    <tr key={e.type} className="border-b last:border-0"><td className="px-4 py-2 font-mono text-xs">{e.type}</td><td className="px-4 py-2 text-muted-foreground">{e.desc}</td></tr>
                  ))}</tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Webhook Payload Example</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-muted p-4 rounded overflow-x-auto">{JSON.stringify({
                  event: "charge.confirmed",
                  data: {
                    id: "c7e8f9a0-1b2c-4d5e-6f7a-8b9c0d1e2f3a",
                    status: "CONFIRMED",
                    payments: [{
                      chain: "btc",
                      asset: "BTC",
                      amount: "0.00145200",
                      tx_hash: "abc123...",
                      confirmations: 3,
                      required_confirmations: 3,
                    }],
                  },
                  created_at: "2026-02-21T20:45:00Z",
                }, null, 2)}</pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Webhook Signature Verification</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>Each webhook delivery includes these headers:</p>
                <pre className="text-xs font-mono bg-muted p-3 rounded">{`X-Signature: HMAC_SHA256(secret, timestamp + "." + payload)
X-Timestamp: 1700000000`}</pre>
                <p className="text-muted-foreground">Verify the HMAC matches and the timestamp is within ±5 minutes of current time to prevent replay attacks.</p>
                <pre className="text-xs font-mono bg-muted p-3 rounded mt-3">{`// Node.js verification example
const crypto = require('crypto');

function verifyWebhook(payload, signature, timestamp, secret) {
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(timestamp + '.' + payload)
    .digest('hex');

  const timeDiff = Math.abs(Date.now() / 1000 - parseInt(timestamp));
  if (timeDiff > 300) return false; // 5 min tolerance

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );
}`}</pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auth" className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Authentication Methods</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Dashboard (JWT)</h3>
                  <p className="text-muted-foreground">POST to <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">/v1/auth/login</code> with email/password. Returns a JWT token. Include as <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code> header.</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">API Key (Programmatic)</h3>
                  <p className="text-muted-foreground">Include <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">X-API-Key: &lt;key&gt;</code> header. Keys are scoped (read/write/admin). Keys are hashed server-side — the full key is only shown once at creation.</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Idempotency</h3>
                  <p className="text-muted-foreground">For POST requests, include <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">Idempotency-Key: &lt;uuid&gt;</code> header. Same key + same endpoint returns the original response without re-processing.</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Error Responses</h3>
                  <pre className="text-xs font-mono bg-muted p-3 rounded mt-1">{JSON.stringify({
                    error: { code: "INVALID_API_KEY", message: "API key is invalid or revoked", status: 401 }
                  }, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
