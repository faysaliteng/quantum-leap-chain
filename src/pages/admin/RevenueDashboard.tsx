import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/PageSkeleton";
import { DollarSign, TrendingUp, Receipt, Users } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function RevenueDashboard() {
  usePageTitle("Revenue");

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
    { title: "Total Revenue", value: `$${revenue?.total_revenue_usd ?? "0.00"}`, icon: DollarSign, change: revenue?.revenue_change_pct },
    { title: "Fees Collected Today", value: `$${revenue?.fees_today_usd ?? "0.00"}`, icon: TrendingUp },
    { title: "Total Transactions", value: revenue?.total_transactions?.toLocaleString() ?? "0", icon: Receipt },
    { title: "Active Merchants", value: revenue?.active_merchants?.toLocaleString() ?? "0", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Platform Revenue</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
              {kpi.change !== undefined && (
                <p className={`text-xs mt-1 ${kpi.change >= 0 ? "text-green-500" : "text-destructive"}`}>
                  {kpi.change >= 0 ? "+" : ""}{kpi.change}% vs last month
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      {revenue?.daily_revenue && revenue.daily_revenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Daily Revenue (Last 30 Days)</CardTitle>
          </CardHeader>
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
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Merchants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top Merchants by Volume</CardTitle>
        </CardHeader>
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
