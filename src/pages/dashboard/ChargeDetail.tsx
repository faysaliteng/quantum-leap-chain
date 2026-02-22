import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { charges as chargesApi } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";

export default function ChargeDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  usePageTitle(`${t("chargeDetail.title")} ${id?.slice(0, 8) ?? ""}`);
  const { data: charge, isLoading } = useQuery({ queryKey: ["charge", id], queryFn: () => chargesApi.get(id!), enabled: !!id });
  const { data: txs } = useQuery({ queryKey: ["charge-txs", id], queryFn: () => chargesApi.getTransactions(id!), enabled: !!id });

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-60" />
      <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-60" /><Skeleton className="h-60" /></div>
    </div>
  );
  if (!charge) return <div className="text-muted-foreground">{t("chargeDetail.notFound")}</div>;

  return (
    <div className="space-y-6" data-testid="page:dashboard-charge-detail">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-7 w-7"><Link to="/dashboard/charges"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="text-lg font-semibold">{charge.name}</h1>
        <StatusBadge status={charge.status} />
        <Button variant="outline" size="sm" className="ml-auto h-7 text-xs" asChild>
          <a href={charge.hosted_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 h-3 w-3" />{t("chargeDetail.checkout")}</a>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("chargeDetail.details")}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label={t("chargeDetail.chargeId")} value={charge.id} mono copy />
            <Row label={t("table.description")} value={charge.description || "—"} />
            <Row label={t("chargeDetail.type")} value={charge.pricing_type} />
            {charge.local_price && <Row label={t("chargeDetail.price")} value={`${charge.local_price.amount} ${charge.local_price.currency}`} />}
            <Row label={t("table.created")} value={new Date(charge.created_at).toLocaleString()} />
            <Row label={t("table.expires")} value={new Date(charge.expires_at).toLocaleString()} />
            {charge.metadata && <Row label={t("chargeDetail.metadata")} value={JSON.stringify(charge.metadata)} mono />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">{t("chargeDetail.paymentAddresses")}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {Object.entries(charge.addresses || {}).length > 0 ? Object.entries(charge.addresses).map(([key, addr]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="text-xs shrink-0">{addr.chain}/{addr.asset}</Badge>
                  <span className="text-xs text-muted-foreground">{addr.amount} {addr.asset}</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-xs truncate max-w-[220px]">
                  <span className="truncate">{addr.address}</span>
                  <CopyButton value={addr.address} />
                </div>
              </div>
            )) : <p className="text-muted-foreground">{t("chargeDetail.noAddresses")}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">{t("chargeDetail.transactions")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-2">{t("chargeDetail.txHash")}</th>
                <th className="px-4 py-2">{t("table.chain")}</th>
                <th className="px-4 py-2">{t("table.asset")}</th>
                <th className="px-4 py-2">{t("table.amount")}</th>
                <th className="px-4 py-2">{t("table.confirmations")}</th>
                <th className="px-4 py-2">{t("table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {txs?.length ? txs.map((tx) => (
                <tr key={tx.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-xs flex items-center gap-1">{tx.tx_hash.slice(0, 16)}…<CopyButton value={tx.tx_hash} /></td>
                  <td className="px-4 py-2 text-xs uppercase">{tx.chain}</td>
                  <td className="px-4 py-2 text-xs">{tx.asset}</td>
                  <td className="px-4 py-2 font-mono">{tx.amount}</td>
                  <td className="px-4 py-2"><span className={tx.confirmations >= tx.required_confirmations ? "text-success" : ""}>{tx.confirmations}/{tx.required_confirmations}</span></td>
                  <td className="px-4 py-2"><Badge variant="outline" className="text-xs">{tx.status}</Badge></td>
                </tr>
              )) : <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">{t("chargeDetail.noTransactions")}</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, mono, copy }: { label: string; value: string; mono?: boolean; copy?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        <span className={`truncate max-w-[300px] ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
        {copy && <CopyButton value={value} />}
      </div>
    </div>
  );
}
