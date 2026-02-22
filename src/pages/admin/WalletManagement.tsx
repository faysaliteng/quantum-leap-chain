import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import {
  Wallet, Shield, ShieldCheck, PlusCircle, Trash2, Lock, Unlock, Copy,
  ArrowUpRight, ArrowDownLeft, ExternalLink, AlertTriangle, TrendingUp,
} from "lucide-react";
import type { WalletConfig, ChainId } from "@/lib/types";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
  locked: "bg-destructive/10 text-destructive",
};

const chainLabels: Record<string, string> = {
  btc: "Bitcoin",
  eth: "Ethereum",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  polygon: "Polygon",
};

export default function AdminWalletManagement() {
  usePageTitle("Wallet Management");
  const qc = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "hot" | "cold">("all");

  const [form, setForm] = useState({
    label: "",
    type: "hot" as "hot" | "cold",
    chain: "eth" as ChainId,
    address: "",
    xpub: "",
    derivation_path: "m/84'/0'/0'",
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: admin.wallets.stats,
  });

  const addMut = useMutation({
    mutationFn: () => admin.wallets.add({
      ...form,
      xpub: form.xpub || undefined,
      derivation_path: form.derivation_path || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-wallets"] });
      setForm({ label: "", type: "hot", chain: "eth", address: "", xpub: "", derivation_path: "m/84'/0'/0'" });
      setShowAddForm(false);
      toast.success("Wallet added");
    },
    onError: () => toast.error("Failed to add wallet"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      admin.wallets.update(id, { status: status === "active" ? "locked" : "active" } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wallets"] }); toast.success("Updated"); },
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => admin.wallets.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wallets"] }); toast.success("Removed"); },
  });

  if (isLoading) return <PageSkeleton />;

  const wallets = stats?.wallets ?? [];
  const filtered = filter === "all" ? wallets : wallets.filter((w) => w.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Wallet Management</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <PlusCircle className="mr-1.5 h-3.5 w-3.5" />{showAddForm ? "Cancel" : "Connect Wallet"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6 text-center">
            <Wallet className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">${(stats?.total_balance_usd ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-6 w-6 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.total_hot_wallets ?? 0}</p>
            <p className="text-xs text-muted-foreground">Hot Wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <ShieldCheck className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.total_cold_wallets ?? 0}</p>
            <p className="text-xs text-muted-foreground">Cold Wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-6 w-6 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold">${(stats?.hot_balance_usd ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Hot Balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold">${(stats?.cold_balance_usd ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Cold Balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Wallet Form */}
      {showAddForm && (
        <Card className="border-primary/20">
          <CardHeader><CardTitle className="text-sm">Connect New Wallet</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input placeholder="e.g. Primary Hot Wallet" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as typeof f.type }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot">🔥 Hot Wallet</SelectItem>
                    <SelectItem value="cold">🧊 Cold Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Chain</Label>
                <Select value={form.chain} onValueChange={(v) => setForm((f) => ({ ...f, chain: v as ChainId }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(chainLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Wallet Address</Label>
              <Input placeholder="0x... or bc1..." value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="font-mono text-sm" />
            </div>
            {form.type === "cold" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>XPUB (Extended Public Key)</Label>
                  <Input placeholder="xpub6..." value={form.xpub} onChange={(e) => setForm((f) => ({ ...f, xpub: e.target.value }))} className="font-mono text-xs" />
                  <p className="text-xs text-muted-foreground">For HD wallet address derivation (watch-only)</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Derivation Path</Label>
                  <Input value={form.derivation_path} onChange={(e) => setForm((f) => ({ ...f, derivation_path: e.target.value }))} className="font-mono text-sm" />
                </div>
              </div>
            )}
            {form.type === "cold" && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Cold Wallet — Watch Only</p>
                  <p className="text-xs text-muted-foreground">Private keys are NEVER stored on this server. Only the XPUB or address is registered for monitoring and settlement.</p>
                </div>
              </div>
            )}
            <Button onClick={() => addMut.mutate()} disabled={!form.label.trim() || !form.address.trim() || addMut.isPending}>
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />Connect Wallet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "hot", "cold"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}
            className={filter === f ? "bg-gradient-gold text-primary-foreground" : ""}>
            {f === "all" ? "All Wallets" : f === "hot" ? "🔥 Hot" : "🧊 Cold"} ({f === "all" ? wallets.length : wallets.filter((w) => w.type === f).length})
          </Button>
        ))}
      </div>

      {/* Wallet List */}
      <div className="space-y-3">
        {filtered.length ? filtered.map((w) => (
          <Card key={w.id} className={w.status === "locked" ? "border-destructive/30" : w.type === "cold" ? "border-info/20" : ""}>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2.5 ${w.type === "hot" ? "bg-warning/10" : "bg-info/10"}`}>
                    {w.type === "hot" ? <Shield className="h-5 w-5 text-warning" /> : <ShieldCheck className="h-5 w-5 text-info" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{w.label}</span>
                      <Badge variant="outline" className="text-xs font-mono">{chainLabels[w.chain] ?? w.chain}</Badge>
                      <Badge className={`${statusColors[w.status]} border-0 text-xs`}>{w.status}</Badge>
                      <Badge variant="outline" className="text-xs">{w.type === "hot" ? "🔥 Hot" : "🧊 Cold"}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-muted-foreground font-mono truncate max-w-[200px] sm:max-w-xs">{w.address}</code>
                      <button onClick={() => { navigator.clipboard.writeText(w.address); toast.success("Copied"); }}>
                        <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                    {w.last_activity && (
                      <p className="text-xs text-muted-foreground mt-1">Last activity: {new Date(w.last_activity).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold font-display">{w.balance} {w.chain === "btc" ? "BTC" : "ETH"}</p>
                    <p className="text-xs text-muted-foreground">${w.balance_usd.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleMut.mutate({ id: w.id, status: w.status })}>
                      {w.status === "active" ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMut.mutate(w.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No {filter === "all" ? "" : filter} wallets connected. Click "Connect Wallet" to add one.
          </div>
        )}
      </div>
    </div>
  );
}
