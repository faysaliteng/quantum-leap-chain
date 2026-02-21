import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ArchitectureDocs() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <h1 className="text-2xl font-bold">Architecture</h1>

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
                    │ (Next.js) │ │ (Go/Node)  │──┬── Postgres (charges,
                    │  :3000    │ │   :8080    │  │    merchants, keys…)
                    └───────────┘ └────┬───────┘  │
                                       │          └── Redis (sessions,
                                       │               rate limits,
                                 ┌─────▼──────┐        webhook queue)
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
│  frontend ◀──▶ api       │
└──────────────────────────┘

┌── backend_net ───────────┐
│  api ◀──▶ postgres       │
│  api ◀──▶ redis          │
│  worker ◀──▶ postgres    │
│  worker ◀──▶ redis       │
└──────────────────────────┘

┌── signer_net ────────────┐   ← Isolated
│  worker ◀──▶ signer      │   Only worker can reach signer
│  (no external access)    │
└──────────────────────────┘
          `}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
