import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wallets } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/PageSkeleton";
import { toast } from "sonner";
import {
  Wallet, Shield, ShieldCheck, PlusCircle, Trash2, Copy,
  ArrowUpRight, ArrowDownLeft, AlertTriangle, Lock,
} from "lucide-react";
import type { ChainId } from "@/lib/types";

const chainLabels: Record<string, string> = {
  btc: "Bitcoin", eth: "Ethereum", arbitrum: "Arbitrum", optimism: "Optimism", polygon: "Polygon",
};

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
  locked: "bg-destructive/10 text-destructive",
};

export default function MerchantWallets() {
  usePageTitle("My Wallets");
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    label: "", chain: "eth" as ChainId, address: "", type: "settlement" as "settlement" | "refund",
  });

  const { data: myWallets, isLoading } = useQuery({
    queryKey: ["merchant-wallets"],
    queryFn: wallets.list,
  });

  const addMut = useMutation({
    mutationFn: () => wallets.add(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merchant-wallets"] });
      setForm({ label: "", chain: "eth", address: "", type: "settlement" });
      setShowAdd(false);
      toast.success("Wallet connected");
    },
    onError: () => toast.error("Failed to add wallet"),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => wallets.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["merchant-wallets"] }); toast.success("Removed"); },
  });

  if (isLoading) return <PageSkeleton />;

  const wList = myWallets ?? [];
  const totalUsd = wList.reduce((s, w) => s + w.balance_usd, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">My Wallets</h1>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <PlusCircle className="mr-1.5 h-3.5 w-3.5" />{showAdd ? "Cancel" : "Add Wallet"}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <Wallet className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">${totalUsd.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <ArrowDownLeft className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{wList.filter((w) => w.type === "hot").length}</p>
            <p className="text-xs text-muted-foreground">Settlement Wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <ArrowUpRight className="h-6 w-6 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold">{wList.filter((w) => w.type === "cold").length}</p>
            <p className="text-xs text-muted-foreground">Refund Wallets</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Form */}
      {showAdd && (
        <Card className="border-primary/20">
          <CardHeader><CardTitle className="text-sm">Connect Wallet</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input placeholder="e.g. Main settlement" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Purpose</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as typeof f.type }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="settlement">Settlement (receive funds)</SelectItem>
                    <SelectItem value="refund">Refund (send refunds)</SelectItem>
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
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-warning">Security:</strong> Only connect wallets you control. Cryptoniumpay never has access to your private keys.
              </p>
            </div>
            <Button onClick={() => addMut.mutate()} disabled={!form.label.trim() || !form.address.trim() || addMut.isPending}>
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />Connect Wallet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Wallet List */}
      <div className="space-y-3">
        {wList.length ? wList.map((w) => (
          <Card key={w.id}>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2.5 ${w.type === "hot" ? "bg-success/10" : "bg-info/10"}`}>
                    {w.type === "hot" ? <ArrowDownLeft className="h-5 w-5 text-success" /> : <ArrowUpRight className="h-5 w-5 text-info" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{w.label}</span>
                      <Badge variant="outline" className="text-xs font-mono">{chainLabels[w.chain] ?? w.chain}</Badge>
                      <Badge className={`${statusColors[w.status]} border-0 text-xs`}>{w.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-muted-foreground font-mono truncate max-w-[200px] sm:max-w-xs">{w.address}</code>
                      <button onClick={() => { navigator.clipboard.writeText(w.address); toast.success("Copied"); }}>
                        <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold font-display">{w.balance}</p>
                    <p className="text-xs text-muted-foreground">${w.balance_usd.toLocaleString()}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMut.mutate(w.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No wallets connected yet. Add your first wallet to start receiving payments.
          </div>
        )}
      </div>
    </div>
  );
}
