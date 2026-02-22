import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, DollarSign, Receipt, TrendingUp } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { SEOHead } from "@/components/SEOHead";
import { StatCard } from "@/components/StatCard";
import { useQuery } from "@tanstack/react-query";
import { charges as chargesApi } from "@/lib/api-client";
import { CHAIN_COLORS } from "@/lib/constants";
import type { Charge } from "@/lib/types";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

function exportData(data: Charge[], format: "csv" | "json") {
  let content: string;
  let mime: string;
  let ext: string;
  if (format === "json") {
    content = JSON.stringify(data, null, 2);
    mime = "application/json";
    ext = "json";
  } else {
    const headers = ["id", "name", "status", "amount", "currency", "created_at"];
    const rows = data.map((c) => [c.id, c.name, c.status, c.local_price?.amount ?? "", c.local_price?.currency ?? "", c.created_at]);
    content = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    mime = "text/csv";
    ext = "csv";
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${new Date().toISOString().slice(0, 10)}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

function aggregateByDay(charges: Charge[]) {
  const map = new Map<string, number>();
  charges.forEach((c) => {
    const day = c.created_at.slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + parseFloat(c.local_price?.amount ?? "0"));
  });
  return Array.from(map, ([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date));
}

function aggregateByAsset(charges: Charge[]) {
  const map = new Map<string, number>();
  charges.forEach((c) => {
    const asset = c.requested_crypto?.asset ?? "OTHER";
    map.set(asset, (map.get(asset) ?? 0) + parseFloat(c.local_price?.amount ?? "0"));
  });
  return Array.from(map, ([asset, amount]) => ({ asset, amount }));
}

export default function Reports() {
  usePageTitle("Reports");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["report-charges", from, to],
    queryFn: () => chargesApi.list({ from: from || undefined, to: to || undefined, per_page: 1000 }),
    enabled: false,
  });

  const charges = data?.data ?? [];
  const totalVolume = charges.reduce((sum, c) => sum + parseFloat(c.local_price?.amount ?? "0"), 0);
  const confirmed = charges.filter((c) => c.status === "CONFIRMED" || c.status === "PAID").length;
  const dailyData = aggregateByDay(charges);
  const assetData = aggregateByAsset(charges);
  const chainColors = Object.values(CHAIN_COLORS);

  return (
    <div className="space-y-6">
      <SEOHead title="Reports" noindex />
      <h1 className="text-lg font-semibold">Reports</h1>

      {/* KPI Summary */}
      {charges.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Charges" value={charges.length} icon={Receipt} />
          <StatCard label="Volume (USD)" value={`$${totalVolume.toLocaleString()}`} icon={DollarSign} />
          <StatCard label="Confirmed/Paid" value={confirmed} icon={TrendingUp} subtitle={`${charges.length > 0 ? ((confirmed / charges.length) * 100).toFixed(1) : 0}% success rate`} />
        </div>
      )}

      {/* Export Controls */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Export Transactions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => refetch()} disabled={isLoading}>{isLoading ? "Loading…" : "Fetch Data"}</Button>
            <Button size="sm" variant="outline" onClick={() => exportData(charges, "csv")} disabled={!charges.length}>
              <Download className="mr-1.5 h-3.5 w-3.5" />CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportData(charges, "json")} disabled={!charges.length}>
              <Download className="mr-1.5 h-3.5 w-3.5" />JSON
            </Button>
          </div>
          {charges.length > 0 && <p className="text-xs text-muted-foreground">{charges.length} charges fetched</p>}
        </CardContent>
      </Card>

      {/* Charts */}
      {charges.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Volume by Day */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Volume by Day</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Volume"]} />
                    <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#reportGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Asset */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Revenue by Asset</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={assetData} dataKey="amount" nameKey="asset" cx="50%" cy="50%" innerRadius={60} outerRadius={100} strokeWidth={2} stroke="hsl(var(--background))">
                      {assetData.map((entry, i) => (
                        <Cell key={entry.asset} fill={CHAIN_COLORS[entry.asset] || chainColors[i % chainColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
