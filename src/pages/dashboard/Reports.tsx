import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery } from "@tanstack/react-query";
import { charges as chargesApi } from "@/lib/api-client";
import type { Charge } from "@/lib/types";

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

export default function Reports() {
  usePageTitle("Reports");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["report-charges", from, to],
    queryFn: () => chargesApi.list({ from: from || undefined, to: to || undefined, per_page: 1000 }),
    enabled: false,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Reports</h1>
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
            <Button size="sm" variant="outline" onClick={() => data?.data && exportData(data.data, "csv")} disabled={!data?.data?.length}>
              <Download className="mr-1.5 h-3.5 w-3.5" />CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => data?.data && exportData(data.data, "json")} disabled={!data?.data?.length}>
              <Download className="mr-1.5 h-3.5 w-3.5" />JSON
            </Button>
          </div>
          {data?.data && <p className="text-xs text-muted-foreground">{data.data.length} charges fetched</p>}
        </CardContent>
      </Card>
    </div>
  );
}
