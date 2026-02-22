import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/PageSkeleton";
import { StatCard } from "@/components/StatCard";
import { AssetDistributionBar } from "@/components/AssetDistributionBar";
import { TimeRangeSelector, type TimeRange } from "@/components/TimeRangeSelector";
import { QuickActions } from "@/components/QuickActions";
import { CryptoPriceTicker } from "@/components/CryptoPriceTicker";
import {
  Users, Receipt, Activity, CheckCircle, XCircle, AlertTriangle, Flag,
  Clock, UserPlus, FileText, Key, RefreshCw,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminHome() {
  const { t } = useI18n();
  usePageTitle(t("admin.overview"));
  const [range, setRange] = useState<TimeRange>("1M");

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({ queryKey: ["admin-stats"], queryFn: admin.stats });
  const { data: health, isLoading: healthLoading } = useQuery({ queryKey: ["admin-health"], queryFn: admin.health, refetchInterval: 15000 });

  if (statsLoading && healthLoading) return <PageSkeleton />;

  const kpis = [
    { label: t("admin.totalTransactions"), value: stats?.total_transactions?.toLocaleString() ?? stats?.transactions_today?.toLocaleString() ?? "—", icon: Receipt },
    { label: t("admin.completed"), value: stats?.completed?.toLocaleString() ?? "—", icon: CheckCircle },
    { label: t("admin.processing"), value: stats?.processing?.toLocaleString() ?? stats?.active_charges?.toLocaleString() ?? "—", icon: Clock },
    { label: t("admin.rejected"), value: stats?.rejected?.toLocaleString() ?? "0", icon: XCircle },
    { label: t("admin.failed"), value: stats?.failed?.toLocaleString() ?? "0", icon: AlertTriangle },
    { label: t("admin.flagged"), value: stats?.flagged?.toLocaleString() ?? "0", icon: Flag },
  ];

  return (
    <div className="space-y-6" data-testid="page:admin-home">
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <CryptoPriceTicker />
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">{t("admin.overview")}</h1>
        <QuickActions actions={[
          { label: t("admin.addMerchant"), icon: UserPlus, to: "/admin/merchants" },
          { label: t("admin.auditLogLink"), icon: FileText, to: "/admin/audit-log" },
          { label: t("admin.apiKeysLink"), icon: Key, to: "/admin/monitoring" },
        ]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />
        ))}
      </div>

      {stats?.holdings && stats.holdings.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("admin.cryptoHoldings")}</CardTitle></CardHeader>
          <CardContent>
            <AssetDistributionBar holdings={stats.holdings} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">{t("admin.transactionVolume")}</CardTitle>
          <TimeRangeSelector value={range} onChange={setRange} />
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.volume_chart ?? []}>
                <defs>
                  <linearGradient id="adminVolGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, t("admin.transactionVolume")]}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#adminVolGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {health && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-sm">{t("admin.watcherStatus")}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2">{t("table.chain")}</th><th className="px-4 py-2">{t("admin.currentBlock")}</th><th className="px-4 py-2">{t("admin.latest")}</th><th className="px-4 py-2">{t("admin.lag")}</th><th className="px-4 py-2">{t("admin.updated")}</th></tr></thead>
                <tbody>
                  {health.watchers.map((w) => (
                    <tr key={w.chain} className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono text-xs uppercase">{w.chain}</td>
                      <td className="px-4 py-2 font-mono">{w.current_block.toLocaleString()}</td>
                      <td className="px-4 py-2 font-mono">{w.latest_block.toLocaleString()}</td>
                      <td className="px-4 py-2"><Badge variant={w.lag > 10 ? "destructive" : "outline"} className="text-xs">{w.lag} {t("admin.blocks")}</Badge></td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(w.last_updated).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">{t("admin.rpcEndpoints")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {health.rpc_status.map((r) => (
                  <div key={r.chain} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs uppercase">{r.chain}</span>
                    <Badge variant={r.healthy === r.total ? "outline" : "destructive"} className="text-xs">{r.healthy}/{r.total} {t("admin.healthy")}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">{t("admin.webhookQueue")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span>{t("admin.pending")}</span><span className="font-mono">{health.webhook_queue.pending}</span></div>
                <div className="flex items-center justify-between text-sm"><span>{t("admin.failed")}</span><span className="font-mono text-destructive">{health.webhook_queue.failed}</span></div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {stats?.recent_activity && stats.recent_activity.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" />{t("admin.recentActivity")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {stats.recent_activity.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <span className="font-medium">{a.action}</span>
                    <span className="text-muted-foreground ml-2">{a.detail}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
