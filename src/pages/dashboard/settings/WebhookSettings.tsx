import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { webhooks } from "@/lib/api-client";
import { usePageTitle } from "@/hooks/use-page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PlusCircle, Trash2, Send, ChevronDown, ChevronUp, FileDown } from "lucide-react";
import { useExport } from "@/hooks/use-export";
import type { WebhookEventType, WebhookDelivery } from "@/lib/types";

const ALL_EVENTS: WebhookEventType[] = [
  "charge.created", "charge.pending", "charge.confirmed", "charge.paid",
  "charge.expired", "charge.underpaid", "charge.overpaid",
  "settlement.sweep.initiated", "settlement.sweep.confirmed", "settlement.sweep.failed",
];

export default function WebhookSettings() {
  usePageTitle("Webhooks");
  const qc = useQueryClient();
  const { data: endpoints } = useQuery({ queryKey: ["webhooks"], queryFn: webhooks.list });
  const [showCreate, setShowCreate] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<WebhookEventType[]>([...ALL_EVENTS]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { startExport, isExporting } = useExport({ scope: "merchant" });

  const createMut = useMutation({ mutationFn: () => webhooks.create({ url, events }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["webhooks"] }); setShowCreate(false); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => webhooks.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }) });
  const testMut = useMutation({ mutationFn: (id: string) => webhooks.test(id) });

  const { data: deliveries } = useQuery({ queryKey: ["webhook-deliveries", expandedId], queryFn: () => webhooks.deliveries(expandedId!), enabled: !!expandedId });

  return (
    <div className="space-y-4" data-testid="page:dashboard-settings-webhooks">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Webhooks</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => startExport("webhook_deliveries", "csv")} disabled={isExporting}>
            <FileDown className="mr-1.5 h-3.5 w-3.5" />{isExporting ? "Exporting…" : "Export Deliveries"}
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}><PlusCircle className="mr-1.5 h-3.5 w-3.5" />Add Endpoint</Button>
        </div>
      </div>

      <div className="space-y-3">
        {endpoints?.map((ep) => (
          <Card key={ep.id}>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant={ep.active ? "default" : "outline"} className="text-xs shrink-0">{ep.active ? "Active" : "Inactive"}</Badge>
                  <span className="text-sm font-mono truncate">{ep.url}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => testMut.mutate(ep.id)} title="Send test"><Send className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMut.mutate(ep.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Secret:</span>
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{ep.secret.slice(0, 12)}…</code>
                <CopyButton value={ep.secret} />
              </div>
              <div className="flex flex-wrap gap-1">{ep.events.map((e) => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}</div>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setExpandedId(expandedId === ep.id ? null : ep.id)}>
                Deliveries {expandedId === ep.id ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
              </Button>
              {expandedId === ep.id && (
                <table className="w-full text-xs mt-2">
                  <thead><tr className="border-b text-left text-muted-foreground"><th className="py-1 pr-2">Event</th><th className="py-1 pr-2">Status</th><th className="py-1 pr-2">Latency</th><th className="py-1">Time</th></tr></thead>
                  <tbody>
                    {deliveries?.length ? deliveries.map((d) => (
                      <tr key={d.id} className="border-b last:border-0"><td className="py-1 pr-2">{d.event_type}</td><td className="py-1 pr-2 font-mono">{d.status_code ?? "—"}</td><td className="py-1 pr-2">{d.latency_ms ? `${d.latency_ms}ms` : "—"}</td><td className="py-1 text-muted-foreground">{new Date(d.created_at).toLocaleString()}</td></tr>
                    )) : <tr><td colSpan={4} className="py-3 text-center text-muted-foreground">No deliveries</td></tr>}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )) ?? <p className="text-muted-foreground">No webhook endpoints configured</p>}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Webhook Endpoint</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourserver.com/webhooks" /></div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid grid-cols-2 gap-2">{ALL_EVENTS.map((e) => (
                <label key={e} className="flex items-center gap-1.5 text-xs">
                  <Checkbox checked={events.includes(e)} onCheckedChange={(c) => setEvents(c ? [...events, e] : events.filter((x) => x !== e))} />
                  {e}
                </label>
              ))}</div>
            </div>
          </div>
          <DialogFooter><Button onClick={() => createMut.mutate()} disabled={!url || createMut.isPending}>Add Endpoint</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
