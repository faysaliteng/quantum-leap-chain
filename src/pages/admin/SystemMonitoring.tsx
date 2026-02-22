import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useExport } from "@/hooks/use-export";
import { FileDown } from "lucide-react";

export default function SystemMonitoring() {
  const { t } = useI18n();
  usePageTitle(t("admin.monitoring"));
  const { data: health, isLoading } = useQuery({ queryKey: ["admin-health"], queryFn: admin.health, refetchInterval: 10000 });
  const { startExport, isExporting } = useExport({ scope: "admin" });

  if (isLoading) return <PageSkeleton />;
  if (!health) return <p className="text-muted-foreground">Unable to fetch system health</p>;

  return (
    <div className="space-y-6" data-testid="page:admin-monitoring">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("admin.monitoring")}</h1>
        <Button variant="outline" size="sm" onClick={() => startExport("health_snapshot", "json")} disabled={isExporting}>
          <FileDown className="mr-1.5 h-3.5 w-3.5" />{isExporting ? "Exporting…" : "Snapshot"}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Watcher Checkpoints</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase"><th className="px-4 py-2">Chain</th><th className="px-4 py-2">Block</th><th className="px-4 py-2">Latest</th><th className="px-4 py-2">Lag</th><th className="px-4 py-2">Updated</th></tr></thead>
            <tbody>{health.watchers.map((w) => (
              <tr key={w.chain} className="border-b last:border-0">
                <td className="px-4 py-2 font-mono text-xs uppercase">{w.chain}</td>
                <td className="px-4 py-2 font-mono">{w.current_block.toLocaleString()}</td>
                <td className="px-4 py-2 font-mono">{w.latest_block.toLocaleString()}</td>
                <td className="px-4 py-2"><Badge variant={w.lag > 10 ? "destructive" : w.lag > 3 ? "outline" : "default"} className="text-xs font-mono">{w.lag} blocks</Badge></td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(w.last_updated).toLocaleTimeString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">RPC Health</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {health.rpc_status.map((r) => (
              <div key={r.chain} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs uppercase">{r.chain}</span>
                <Badge variant={r.healthy === r.total ? "outline" : "destructive"} className="text-xs">{r.healthy}/{r.total}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Webhook Queue</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span>Pending</span><span className="font-mono">{health.webhook_queue.pending}</span></div>
            <div className="flex justify-between text-sm"><span>Failed</span><span className="font-mono text-destructive">{health.webhook_queue.failed}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Uptime</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{Math.floor(health.uptime_seconds / 3600)}h {Math.floor((health.uptime_seconds % 3600) / 60)}m</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
