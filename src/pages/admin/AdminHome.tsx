import { useQuery } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Receipt, Activity, AlertCircle } from "lucide-react";

export default function AdminHome() {
  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: admin.stats });
  const { data: health } = useQuery({ queryKey: ["admin-health"], queryFn: admin.health, refetchInterval: 15000 });

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">System Overview</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Merchants</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{stats?.total_merchants ?? "—"}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Active Charges</CardTitle><Receipt className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{stats?.active_charges ?? "—"}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Txs Today</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{stats?.transactions_today ?? "—"}</p></CardContent></Card>
      </div>

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
                      <td className="px-4 py-2"><Badge variant={w.lag > 10 ? "destructive" : "outline"} className="text-xs">{w.lag}</Badge></td>
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
    </div>
  );
}
