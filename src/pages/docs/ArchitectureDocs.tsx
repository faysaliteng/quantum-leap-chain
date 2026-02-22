import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocsNav } from "@/components/DocsNav";
import { SEOHead } from "@/components/SEOHead";
import { ShareBar } from "@/components/ShareBar";

export default function ArchitectureDocs() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Architecture" description="System architecture, deployment options, and key flows for the Cryptoniumpay payment gateway." />
      <DocsNav />
      <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Architecture</h1>
          <ShareBar title="Cryptoniumpay Architecture" />
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm">System Architecture</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs font-mono whitespace-pre overflow-x-auto text-muted-foreground">{`
┌─────────────┐     ┌──────────────────────────────────────────────┐
│   Browser   │────▶│              Nginx / Reverse Proxy            │
│  (Merchant, │     │  :443 TLS termination                        │
│   Customer) │     └─────┬────────────┬───────────────────────────┘
└─────────────┘           │            │
                    ┌─────▼─────┐ ┌────▼──────┐
                    │ Frontend  │ │    API     │   Stateless, JWT auth
                    │ (React +  │ │ (REST +   │──┬── PostgreSQL (charges,
                    │  Vite)    │ │  Workers) │  │    merchants, keys…)
                    │  :3000    │ │   :8080   │  │
                    └───────────┘ └────┬──────┘  └── Redis (sessions,
                                       │              rate limits,
                                       │              webhook queue)
                                 ┌─────▼──────┐
                                 │   Worker    │
                                 │  (watchers, │──── RPC endpoints
                                 │  webhooks,  │     (BTC, EVM chains)
                                 │  sweeps)    │
                                 └─────┬──────┘
                          ┌────────────┘
                          │  Isolated Docker Network
                    ┌─────▼──────┐
                    │   Signer   │   Optional, hot wallet only
                    │  (HSM/KMS  │   No direct external access
                    │  or local) │
                    └────────────┘
          `}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Deployment Options</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-4">
            <div>
              <h3 className="font-medium mb-1">Option A: Cloudflare Pages + Workers</h3>
              <p className="text-muted-foreground">React SPA deployed to Cloudflare Pages (global CDN). API logic runs on Cloudflare Workers with D1/KV for edge state. Ideal for low-ops teams wanting global performance.</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Option B: VM + Docker Compose</h3>
              <p className="text-muted-foreground">Full self-hosted stack on a single Linux VM. Nginx reverse proxy with auto-TLS (Certbot), PostgreSQL, Redis, API, Worker, and isolated Signer — all orchestrated via Docker Compose. Complete control, no external dependencies.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Create Charge Flow</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs font-mono whitespace-pre overflow-x-auto text-muted-foreground">{`
Merchant ──POST /v1/charges──▶ API
  │                              │
  │  ◀── 201 { charge_id,       │── Insert charge (status=NEW)
  │       addresses, hosted_url }│── Allocate deposit address(es)
  │                              │── Emit charge.created webhook
  │                              │
  │                              ▼
  │                         Worker (watcher)
  │                           │ polls RPC/indexer
  │                           │ detects inbound tx
  │                           │── Insert charge_payment (status=detected)
  │                           │── Update charge (status=PENDING)
  │                           │── Emit charge.pending webhook
  │                           │
  │                           │ confirmations accumulate…
  │                           │── Update charge (status=CONFIRMED)
  │                           │── Emit charge.confirmed webhook
  │                           │
  │                           │ threshold met
  │                           │── Initiate sweep to settlement addr
  │                           │── Update charge (status=PAID)
  │                           │── Emit charge.paid webhook
          `}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Docker Network Isolation</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs font-mono whitespace-pre overflow-x-auto text-muted-foreground">{`
┌── frontend_net ──────────┐
│  nginx ◀──▶ api          │   Browser-facing only
└──────────────────────────┘

┌── backend_net ───────────┐
│  api ◀──▶ postgres       │   No internet access
│  api ◀──▶ redis          │
│  worker ◀──▶ postgres    │
│  worker ◀──▶ redis       │
└──────────────────────────┘

┌── signer_net ────────────┐   ← Maximum isolation
│  worker ◀──▶ signer      │   Only worker can reach signer
│  (no external access)    │   Private keys never leave this network
└──────────────────────────┘
          `}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Tech Stack</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2">Layer</th><th className="px-4 py-2">Technology</th></tr></thead>
              <tbody>
                {[
                  ["Frontend", "React 18 + TypeScript + Vite + Tailwind CSS"],
                  ["UI Components", "shadcn/ui + Radix Primitives"],
                  ["State Management", "TanStack React Query"],
                  ["Charts", "Recharts (sparklines, area charts)"],
                  ["API Client", "Axios (typed, interceptors)"],
                  ["Validation", "Zod (client-side form validation)"],
                  ["QR Codes", "qrcode.react (checkout page)"],
                  ["Reverse Proxy", "Nginx (TLS termination, rate limiting)"],
                  ["Database", "PostgreSQL 15+ (18 tables, indexed)"],
                  ["Cache / Queue", "Redis (sessions, rate limits, webhook queue)"],
                  ["Deployment", "Docker Compose / Cloudflare Pages"],
                ].map(([layer, tech]) => (
                  <tr key={layer} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{layer}</td>
                    <td className="px-4 py-2 text-muted-foreground">{tech}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}