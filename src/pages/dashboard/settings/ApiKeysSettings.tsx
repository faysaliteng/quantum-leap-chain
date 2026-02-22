import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiKeys } from "@/lib/api-client";
import { usePageTitle } from "@/hooks/use-page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2 } from "lucide-react";
import type { ApiKeyScope, ApiKeyCreated } from "@/lib/types";

const SCOPES: ApiKeyScope[] = ["read", "write", "admin"];

export default function ApiKeysSettings() {
  usePageTitle("API Keys");
  const qc = useQueryClient();
  const { data: keys } = useQuery({ queryKey: ["api-keys"], queryFn: apiKeys.list });
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ApiKeyScope[]>(["read"]);
  const [created, setCreated] = useState<ApiKeyCreated | null>(null);

  const createMut = useMutation({
    mutationFn: () => apiKeys.create({ name, scopes }),
    onSuccess: (key) => { setCreated(key); qc.invalidateQueries({ queryKey: ["api-keys"] }); setShowCreate(false); },
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => apiKeys.revoke(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  return (
    <div className="space-y-4" data-testid="page:dashboard-settings-api-keys">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">API Keys</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}><PlusCircle className="mr-1.5 h-3.5 w-3.5" />New Key</Button>
      </div>

      {created && (
        <Card className="border-success/50 bg-success/5">
          <CardContent className="py-4">
            <p className="text-sm font-medium mb-1">API Key created — copy it now, it won't be shown again:</p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{created.key}</code>
              <CopyButton value={created.key} />
            </div>
            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setCreated(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Prefix</th>
                <th className="px-4 py-2">Scopes</th>
                <th className="px-4 py-2">Last Used</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {keys?.length ? keys.map((k) => (
                <tr key={k.id} className="border-b last:border-0">
                  <td className="px-4 py-2">{k.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">{k.prefix}…</td>
                  <td className="px-4 py-2 space-x-1">{k.scopes.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(k.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => revokeMut.mutate(k.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                </tr>
              )) : <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No API keys</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create API Key</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production key" /></div>
            <div className="space-y-2">
              <Label>Scopes</Label>
              <div className="flex gap-4">{SCOPES.map((s) => (
                <label key={s} className="flex items-center gap-1.5 text-sm">
                  <Checkbox checked={scopes.includes(s)} onCheckedChange={(c) => setScopes(c ? [...scopes, s] : scopes.filter((x) => x !== s))} />
                  {s}
                </label>
              ))}</div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createMut.mutate()} disabled={!name || createMut.isPending}>{createMut.isPending ? "Creating…" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
