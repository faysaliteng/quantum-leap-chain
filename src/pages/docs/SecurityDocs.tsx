import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocsNav } from "@/components/DocsNav";
import { SEOHead } from "@/components/SEOHead";
import { ShareBar } from "@/components/ShareBar";

const threats = [
  { category: "Spoofing", threat: "Attacker impersonates merchant via stolen API key", severity: "High", mitigation: "Hashed API keys, scoped permissions, key rotation, rate limiting, IP allowlists" },
  { category: "Tampering", threat: "Modify charge amount or destination address", severity: "Critical", mitigation: "Immutable charge records, server-side address derivation, signed webhooks, audit log" },
  { category: "Repudiation", threat: "Merchant denies receiving payment", severity: "Medium", mitigation: "Append-only audit log, on-chain tx proofs, webhook delivery receipts" },
  { category: "Information Disclosure", threat: "Private keys leaked from server", severity: "Critical", mitigation: "Keys NEVER stored in DB/API. Signer in isolated network. XPUB-only on server. HSM/KMS for production" },
  { category: "Denial of Service", threat: "Flood API with charge creation requests", severity: "Medium", mitigation: "Rate limiting (Redis), request size limits, API key quotas, WAF" },
  { category: "Elevation of Privilege", threat: "Merchant accesses admin endpoints", severity: "High", mitigation: "Role-based JWT claims, middleware enforcement, separate admin auth flow" },
];

const checklist = [
  "All API keys stored as bcrypt/argon2 hashes — never plaintext",
  "Private keys NEVER touch API/DB — signer service only",
  "XPUB stored server-side for address derivation",
  "Signer in isolated Docker network — only worker can reach it",
  "TLS everywhere (Nginx terminates, internal mTLS optional)",
  "Webhook secrets unique per endpoint, HMAC-SHA256 signed",
  "Idempotency keys prevent double-processing",
  "Rate limiting on all public endpoints",
  "Admin requires 2FA (TOTP enforced at login)",
  "Audit log is append-only with actor, IP, timestamp",
  "DB credentials rotated, not in docker-compose env",
  "Redis AUTH enabled, not exposed externally",
  "Chain reorg handling with safe depth rollback",
  "Hot wallet balance capped, auto-sweep to cold storage",
];

export default function SecurityDocs() {
  return (
    <div className="min-h-screen bg-background" data-testid="page:docs-security">
      <SEOHead title="Security & Threat Model" description="STRIDE-based threat model, authentication flows, webhook signing, and operational hardening for Cryptoniumpay." />
      <DocsNav />
      <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Security & Threat Model</h1>
          <ShareBar title="Cryptoniumpay Security Docs" />
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm">STRIDE Threat Model</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2">Category</th><th className="px-4 py-2">Threat</th><th className="px-4 py-2">Severity</th><th className="px-4 py-2">Mitigation</th></tr></thead>
              <tbody>{threats.map((t, i) => (
                <tr key={i} className="border-b last:border-0 align-top">
                  <td className="px-4 py-2 font-medium whitespace-nowrap">{t.category}</td>
                  <td className="px-4 py-2 text-muted-foreground">{t.threat}</td>
                  <td className="px-4 py-2"><Badge variant={t.severity === "Critical" ? "destructive" : "outline"} className="text-xs">{t.severity}</Badge></td>
                  <td className="px-4 py-2 text-xs">{t.mitigation}</td>
                </tr>
              ))}</tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Key Management Model</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-3">
            <p><strong>Server stores:</strong> XPUB (extended public key) only. Derives unique deposit addresses per charge via BIP-32/BIP-44 derivation paths.</p>
            <p><strong>Signer service:</strong> Holds private keys (or interfaces with HSM/KMS). Runs in isolated Docker network. Only the worker process can communicate with it over an internal gRPC/REST API. No external network access.</p>
            <p><strong>Cold wallet:</strong> For treasury/large sweeps: system generates unsigned transactions (PSBT for BTC, JSON for EVM). Admin exports, signs offline, imports signed tx. No private key ever touches the server.</p>
            <p><strong>Hot wallet:</strong> Optional, strictly limited. Auto-sweeps to cold storage when balance exceeds configurable threshold. Used only for gas/fee payments and small automated sweeps.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Hardening Checklist</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">{checklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-success mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}</ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
