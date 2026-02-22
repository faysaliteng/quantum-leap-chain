import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboard, charges as chargesApi } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { AssetDistributionBar } from "@/components/AssetDistributionBar";
import { TimeRangeSelector, type TimeRange } from "@/components/TimeRangeSelector";
import { QuickActions } from "@/components/QuickActions";
import {
  PlusCircle, DollarSign, Clock, CheckCircle, TrendingUp, RefreshCw,
  CreditCard, Percent, Key, Webhook, FileText,
} from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { PageSkeleton } from "@/components/PageSkeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function DashboardHome() {
  usePageTitle("Dashboard");
  const { t } = useI18n();
  const [range, setRange] = useState<TimeRange>("1M");

  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: dashboard.stats });
  const { data: recent, isLoading: chargesLoading, isError: chargesError, refetch: refetchCharges } = useQuery({ queryKey: ["charges-recent"], queryFn: () => chargesApi.list({ per_page: 10 }) });

  if (statsLoading && chargesLoading) return <PageSkeleton />;

  if (statsError && chargesError) return (
    <div className="text-center py-16 space-y-3">
      <p className="text-muted-foreground">{t("dashboard.failedToLoad")}</p>
      <Button variant="outline" size="sm" onClick={() => { refetchStats(); refetchCharges(); }}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("common.retry")}</Button>
    </div>
  );

  const cards = [
    { label: t("dashboard.totalCharges"), value: stats?.total_charges?.toLocaleString() ?? "—", icon: DollarSign },
    { label: t("dashboard.pending"), value: stats?.pending_payments?.toLocaleString() ?? "—", icon: Clock },
    { label: t("dashboard.confirmedToday"), value: stats?.confirmed_today?.toLocaleString() ?? "—", icon: CheckCircle },
    { label: t("dashboard.volumeUsd"), value: stats?.total_volume_usd ? `$${stats.total_volume_usd}` : "—", icon: TrendingUp },
    { label: t("dashboard.paymentsReceived"), value: stats?.total_payments_received?.toLocaleString() ?? "—", icon: CreditCard },
    { label: t("dashboard.successRate"), value: stats?.success_rate !== undefined ? `${stats.success_rate}%` : "—", icon: Percent },
  ];

  return (
    <div className="space-y-6" data-testid="page:dashboard-home">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">{t("dashboard.title")}</h1>
        <QuickActions actions={[
          { label: t("dashboard.newCharge"), icon: PlusCircle, to: "/dashboard/charges/new", variant: "default" },
          { label: t("sidebar.apiKeys"), icon: Key, to: "/dashboard/settings/api-keys" },
          { label: t("sidebar.reports"), icon: FileText, to: "/dashboard/reports" },
          { label: t("sidebar.webhooks"), icon: Webhook, to: "/dashboard/settings/webhooks" },
        ]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} />
        ))}
      </div>

      {stats?.holdings && stats.holdings.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("dashboard.walletBalance")}</CardTitle></CardHeader>
          <CardContent>
            <AssetDistributionBar holdings={stats.holdings} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">{t("dashboard.transactionVolume")}</CardTitle>
          <TimeRangeSelector value={range} onChange={setRange} />
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.volume_chart ?? []}>
                <defs>
                  <linearGradient id="dashVolGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Volume"]}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#dashVolGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">{t("dashboard.recentCharges")}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/charges">{t("dashboard.viewAll")}</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-2">{t("table.id")}</th>
                  <th className="px-4 py-2">{t("table.name")}</th>
                  <th className="px-4 py-2">{t("table.amount")}</th>
                  <th className="px-4 py-2">{t("table.status")}</th>
                  <th className="px-4 py-2">{t("table.created")}</th>
                </tr>
              </thead>
              <tbody>
                {recent?.data?.length ? recent.data.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-2"><Link to={`/dashboard/charges/${c.id}`} className="font-mono text-xs text-primary hover:underline">{c.id.slice(0, 8)}</Link></td>
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2 font-mono">{c.local_price ? `${c.local_price.amount} ${c.local_price.currency}` : "—"}</td>
                    <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-2 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("dashboard.noCharges")} <Link to="/dashboard/charges/new" className="text-primary hover:underline">{t("dashboard.createFirst")}</Link></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
