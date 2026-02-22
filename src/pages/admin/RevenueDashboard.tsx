import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/PageSkeleton";
import { StatCard } from "@/components/StatCard";
import { TimeRangeSelector, type TimeRange } from "@/components/TimeRangeSelector";
import { CHAIN_COLORS } from "@/lib/constants";
import { DollarSign, TrendingUp, Receipt, Users, FileDown } from "lucide-react";
import { useExport } from "@/hooks/use-export";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

export default function RevenueDashboard() {
  const { t } = useI18n();
  usePageTitle(t("admin.revenue"));
  const [range, setRange] = useState<TimeRange>("1M");
  const { startExport, isExporting } = useExport({ scope: "admin" });

  const { data: revenue, isLoading } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: admin.revenue.stats,
  });

  const { data: topMerchants, isLoading: merchantsLoading } = useQuery({
    queryKey: ["admin-top-merchants"],
    queryFn: admin.revenue.topMerchants,
  });

  if (isLoading && merchantsLoading) return <PageSkeleton />;

  const kpis = [
    { label: "Total Revenue", value: `$${revenue?.total_revenue_usd ?? "0.00"}`, icon: DollarSign, change: revenue?.revenue_change_pct },
    { label: "Fees Collected Today", value: `$${revenue?.fees_today_usd ?? "0.00"}`, icon: TrendingUp },
    { label: "Total Transactions", value: revenue?.total_transactions?.toLocaleString() ?? "0", icon: Receipt },
    { label: "Active Merchants", value: revenue?.active_merchants?.toLocaleString() ?? "0", icon: Users },
  ];

  const chainColors = Object.values(CHAIN_COLORS);

  return (
    <div className="space-y-6" data-testid="page:admin-revenue">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{t("admin.revenue")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => startExport("revenue", "csv")} disabled={isExporting}>
            <FileDown className="mr-1.5 h-3.5 w-3.5" />{isExporting ? "Exporting…" : "Export"}
          </Button>
          <TimeRangeSelector value={range} onChange={setRange} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} change={kpi.change} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Area Chart */}
        {revenue?.daily_revenue && revenue.daily_revenue.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Daily Revenue (Last 30 Days)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue.daily_revenue}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                    />
                    <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#revenueGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction Volume Bar Chart */}
        {revenue?.transaction_volume && revenue.transaction_volume.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Transaction Volume</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue.transaction_volume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value: number) => [value.toLocaleString(), "Transactions"]}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Revenue by Chain Donut */}
      {revenue?.revenue_by_chain && revenue.revenue_by_chain.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue by Chain</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenue.revenue_by_chain}
                    dataKey="amount"
                    nameKey="chain"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {revenue.revenue_by_chain.map((entry, i) => (
                      <Cell key={entry.chain} fill={CHAIN_COLORS[entry.chain.toUpperCase()] || chainColors[i % chainColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Merchants */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Top Merchants by Volume</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Merchant</th>
                <th className="px-4 py-2">Volume (USD)</th>
                <th className="px-4 py-2">Fees Paid</th>
                <th className="px-4 py-2">Transactions</th>
                <th className="px-4 py-2">Fee Rate</th>
              </tr>
            </thead>
            <tbody>
              {topMerchants && topMerchants.length > 0 ? topMerchants.map((m, i) => (
                <tr key={m.merchant_id} className="border-b last:border-0">
                  <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{m.name}</td>
                  <td className="px-4 py-2 font-mono">${parseFloat(m.volume_usd).toLocaleString()}</td>
                  <td className="px-4 py-2 font-mono">${parseFloat(m.fees_usd).toLocaleString()}</td>
                  <td className="px-4 py-2 font-mono">{m.tx_count.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <Badge variant="outline" className="text-xs font-mono">{m.rate_percent}%</Badge>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No transaction data yet</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
