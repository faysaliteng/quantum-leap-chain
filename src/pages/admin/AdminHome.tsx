import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
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
  usePageTitle("Admin Overview");
  const [range, setRange] = useState<TimeRange>("1M");

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({ queryKey: ["admin-stats"], queryFn: admin.stats });
  const { data: health, isLoading: healthLoading } = useQuery({ queryKey: ["admin-health"], queryFn: admin.health, refetchInterval: 15000 });

  if (statsLoading && healthLoading) return <PageSkeleton />;

  const kpis = [
    { label: "Total Transactions", value: stats?.total_transactions?.toLocaleString() ?? stats?.transactions_today?.toLocaleString() ?? "—", icon: Receipt },
    { label: "Completed", value: stats?.completed?.toLocaleString() ?? "—", icon: CheckCircle },
    { label: "Processing", value: stats?.processing?.toLocaleString() ?? stats?.active_charges?.toLocaleString() ?? "—", icon: Clock },
    { label: "Rejected", value: stats?.rejected?.toLocaleString() ?? "0", icon: XCircle },
    { label: "Failed", value: stats?.failed?.toLocaleString() ?? "0", icon: AlertTriangle },
    { label: "Flagged", value: stats?.flagged?.toLocaleString() ?? "0", icon: Flag },
  ];

  return (
    <div className="space-y-6" data-testid="page:admin-home">
      {/* Live Crypto Ticker */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <CryptoPriceTicker />
        </CardContent>
      </Card>

      {/* Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">System Overview</h1>
        <QuickActions actions={[
          { label: "Add Merchant", icon: UserPlus, to: "/admin/merchants" },
          { label: "Audit Log", icon: FileText, to: "/admin/audit-log" },
          { label: "API Keys", icon: Key, to: "/admin/monitoring" },
        ]} />
      </div>

      {/* 6 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} />
        ))}
      </div>

      {/* Crypto Holdings */}
      {stats?.holdings && stats.holdings.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Total Crypto Holdings</CardTitle></CardHeader>
          <CardContent>
            <AssetDistributionBar holdings={stats.holdings} />
          </CardContent>
        </Card>
      )}

      {/* Volume Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Transaction Volume</CardTitle>
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Volume"]}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#adminVolGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Watcher + System Health */}
      {health && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-sm">Watcher Status</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2">Chain</th><th className="px-4 py-2">Current Block</th><th className="px-4 py-2">Latest</th><th className="px-4 py-2">Lag</th><th className="px-4 py-2">Updated</th></tr></thead>
                <tbody>
                  {health.watchers.map((w) => (
                    <tr key={w.chain} className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono text-xs uppercase">{w.chain}</td>
                      <td className="px-4 py-2 font-mono">{w.current_block.toLocaleString()}</td>
                      <td className="px-4 py-2 font-mono">{w.latest_block.toLocaleString()}</td>
                      <td className="px-4 py-2"><Badge variant={w.lag > 10 ? "destructive" : "outline"} className="text-xs">{w.lag} blocks</Badge></td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(w.last_updated).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">RPC Endpoints</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {health.rpc_status.map((r) => (
                  <div key={r.chain} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs uppercase">{r.chain}</span>
                    <Badge variant={r.healthy === r.total ? "outline" : "destructive"} className="text-xs">{r.healthy}/{r.total} healthy</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Webhook Queue</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span>Pending</span><span className="font-mono">{health.webhook_queue.pending}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Failed</span><span className="font-mono text-destructive">{health.webhook_queue.failed}</span></div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Recent Activity */}
      {stats?.recent_activity && stats.recent_activity.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" />Recent Activity</CardTitle></CardHeader>
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
