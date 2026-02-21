import { useQuery } from "@tanstack/react-query";
import { dashboard, charges as chargesApi } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle, DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react";

export default function DashboardHome() {
  const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: dashboard.stats });
  const { data: recent } = useQuery({ queryKey: ["charges-recent"], queryFn: () => chargesApi.list({ per_page: 10 }) });

  const cards = [
    { label: "Total Charges", value: stats?.total_charges ?? "—", icon: DollarSign },
    { label: "Pending", value: stats?.pending_payments ?? "—", icon: Clock },
    { label: "Confirmed Today", value: stats?.confirmed_today ?? "—", icon: CheckCircle },
    { label: "Volume (USD)", value: stats?.total_volume_usd ? `$${stats.total_volume_usd}` : "—", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <Button asChild size="sm">
          <Link to="/dashboard/charges/new"><PlusCircle className="mr-1.5 h-4 w-4" />New Charge</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.label}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Charges</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {recent?.data?.length ? recent.data.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer" onClick={() => window.location.href = `/dashboard/charges/${c.id}`}>
                    <td className="px-4 py-2 font-mono text-xs">{c.id.slice(0, 8)}</td>
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2 font-mono">{c.local_price ? `${c.local_price.amount} ${c.local_price.currency}` : "—"}</td>
                    <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-2 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No charges yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
