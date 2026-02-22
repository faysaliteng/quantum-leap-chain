import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageSkeleton } from "@/components/PageSkeleton";
import { CopyButton } from "@/components/CopyButton";
import { WalletConnectPanel } from "@/components/WalletConnectPanel";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Wallet, Shield, ShieldCheck, PlusCircle, Trash2, Lock, Unlock, Copy,
  Send, Download, ExternalLink, AlertTriangle, TrendingUp, Eye,
  Link2, Usb, Smartphone, ArrowUpRight, Unplug,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { WalletConfig, ChainId } from "@/lib/types";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
  locked: "bg-destructive/10 text-destructive",
};
const chainLabels: Record<string, string> = {
  btc: "Bitcoin", eth: "Ethereum", arbitrum: "Arbitrum", optimism: "Optimism", polygon: "Polygon",
};

export default function AdminWalletManagement() {
  const { t } = useI18n();
  usePageTitle(t("admin.walletMgmt"));
  const qc = useQueryClient();
  const [showConnect, setShowConnect] = useState(false);
  const [filter, setFilter] = useState<"all" | "hot" | "cold">("all");

  const [sendWallet, setSendWallet] = useState<WalletConfig | null>(null);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendConfirm, setSendConfirm] = useState(false);
  const [sendMemo, setSendMemo] = useState("");
  const [receiveWallet, setReceiveWallet] = useState<WalletConfig | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: admin.wallets.stats,
  });

  const addMut = useMutation({
    mutationFn: (data: Partial<WalletConfig>) => admin.wallets.add(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wallets"] }); toast.success(t("admin.connectWallet")); },
    onError: () => toast.error(t("admin.failed")),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      admin.wallets.update(id, { status: status === "active" ? "locked" : "active" } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wallets"] }); toast.success(t("admin.update")); },
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => admin.wallets.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wallets"] }); toast.success(t("admin.remove")); },
  });

  if (isLoading) return <PageSkeleton />;

  const walletsList = stats?.wallets ?? [];
  const filtered = filter === "all" ? walletsList : walletsList.filter((w) => w.type === filter);
  const estimatedFee = sendWallet?.chain === "btc" ? 0.00005 : 0.001;

  const handleWalletConnected = (wallet: { label: string; chain: ChainId; address: string; type: "hot" | "cold" }) => {
    addMut.mutate({ label: wallet.label, chain: wallet.chain, address: wallet.address, type: wallet.type } as any);
  };

  return (
    <div className="space-y-6" data-testid="page:admin-wallets">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t("admin.walletMgmt")}</h1>
          <p className="text-xs text-muted-foreground">{t("admin.platformTreasury")}</p>
        </div>
        <Button onClick={() => setShowConnect(true)}>
          <Link2 className="mr-1.5 h-3.5 w-3.5" />{t("admin.connectWallet")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { icon: <Wallet className="h-6 w-6 text-primary" />, value: `$${(stats?.total_balance_usd ?? 0).toLocaleString()}`, label: t("admin.totalBalance") },
          { icon: <Shield className="h-6 w-6 text-warning" />, value: stats?.total_hot_wallets ?? 0, label: t("admin.hotWallets") },
          { icon: <ShieldCheck className="h-6 w-6 text-success" />, value: stats?.total_cold_wallets ?? 0, label: t("admin.coldWallets") },
          { icon: <TrendingUp className="h-6 w-6 text-info" />, value: `$${(stats?.hot_balance_usd ?? 0).toLocaleString()}`, label: t("admin.hotBalance") },
          { icon: <Lock className="h-6 w-6 text-muted-foreground" />, value: `$${(stats?.cold_balance_usd ?? 0).toLocaleString()}`, label: t("admin.coldBalance") },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto mb-2">{s.icon}</div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connection Methods */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-sm font-medium">{t("admin.supported")}</p>
            {[
              { icon: <Smartphone className="h-3.5 w-3.5" />, label: "WalletConnect v2" },
              { icon: <Usb className="h-3.5 w-3.5" />, label: "Ledger" },
              { icon: <Shield className="h-3.5 w-3.5" />, label: "Trezor" },
            ].map((c) => (
              <Badge key={c.label} variant="outline" className="gap-1 text-xs">{c.icon}{c.label}</Badge>
            ))}
            <span className="text-xs text-muted-foreground">+ Keystone, GridPlus, Manual</span>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "hot", "cold"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}
            className={filter === f ? "bg-gradient-gold text-primary-foreground" : ""}>
            {f === "all" ? t("admin.allWallets") : f === "hot" ? `🔥 ${t("admin.hot")}` : `🧊 ${t("admin.cold")}`} ({f === "all" ? walletsList.length : walletsList.filter((w) => w.type === f).length})
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
                      <Badge variant="outline" className="text-xs">{w.type === "hot" ? `🔥 ${t("admin.hot")}` : `🧊 ${t("admin.cold")}`}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-muted-foreground font-mono truncate max-w-[200px] sm:max-w-xs">{w.address}</code>
                      <CopyButton value={w.address} />
                    </div>
                    {w.last_activity && (
                      <p className="text-xs text-muted-foreground mt-1">{t("admin.lastActivity")}: {new Date(w.last_activity).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold font-display">{w.balance} {w.chain === "btc" ? "BTC" : "ETH"}</p>
                    <p className="text-xs text-muted-foreground">${w.balance_usd.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSendWallet(w)} title={t("common.send")}>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setReceiveWallet(w)} title={t("wallets.receive")}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
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
            <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{t("admin.noWalletsConnected")}</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowConnect(true)}>
              <Link2 className="mr-1.5 h-4 w-4" />{t("admin.connectFirstWallet")}
            </Button>
          </div>
        )}
      </div>

      <WalletConnectPanel open={showConnect} onOpenChange={setShowConnect} onWalletConnected={handleWalletConnected} />

      {/* Send Dialog */}
      <Dialog open={!!sendWallet} onOpenChange={() => { setSendWallet(null); setSendTo(""); setSendAmount(""); setSendConfirm(false); setSendMemo(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />{t("admin.adminWithdraw")}
            </DialogTitle>
            <DialogDescription>
              {sendWallet?.type === "cold" ? t("admin.coldWalletSign") : `${t("admin.treasurySend")} ${sendWallet?.label}`}
            </DialogDescription>
          </DialogHeader>
          {sendWallet && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">From: {sendWallet.label}</p>
                    <p className="text-lg font-bold font-display">{sendWallet.balance}</p>
                    <p className="text-xs text-muted-foreground">${sendWallet.balance_usd.toLocaleString()}</p>
                  </div>
                  <Badge className={`${statusColors[sendWallet.status]} border-0`}>
                    {sendWallet.type === "hot" ? `🔥 ${t("admin.hot")}` : `🧊 ${t("admin.cold")}`}
                  </Badge>
                </div>
              </div>

              {sendWallet.type === "cold" && (
                <div className="bg-info/10 border border-info/20 rounded-lg p-3 flex items-start gap-2">
                  <Usb className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-info">{t("admin.hardwareRequired")}</strong> {t("admin.hardwareRequiredDesc")}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t("admin.recipientAddress")}</Label>
                <Input placeholder="0x... or bc1..." value={sendTo} onChange={(e) => setSendTo(e.target.value)} className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.amount")}</Label>
                <div className="relative">
                  <Input type="number" step="any" placeholder="0.00" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} className="pr-16" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-8 text-xs text-primary" onClick={() => setSendAmount(sendWallet.balance)}>
                    MAX
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.memoAudit")}</Label>
                <Input placeholder={t("admin.memoPlaceholder")} value={sendMemo} onChange={(e) => setSendMemo(e.target.value)} />
              </div>

              {!sendConfirm ? (
                <Button className="w-full" onClick={() => setSendConfirm(true)} disabled={!sendTo || !sendAmount}>
                  <ArrowUpRight className="mr-1.5 h-4 w-4" />{t("admin.reviewWithdrawal")}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">To:</span><code className="font-mono text-xs truncate max-w-[200px]">{sendTo}</code></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.amount")}:</span><span className="font-bold">{sendAmount}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.networkFee")}:</span><span>~{estimatedFee}</span></div>
                    {sendMemo && <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.auditNote")}:</span><span className="text-xs">{sendMemo}</span></div>}
                    <Separator />
                    <div className="flex justify-between font-semibold"><span>{t("admin.totalLabel")}:</span><span>{(parseFloat(sendAmount || "0") + estimatedFee).toFixed(6)}</span></div>
                  </div>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-destructive">{t("admin.adminWithdrawalWarning")}</strong> {t("admin.adminWithdrawalDesc")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setSendConfirm(false)}>{t("admin.back")}</Button>
                    <Button className="flex-1 bg-gradient-gold text-primary-foreground font-semibold"
                      onClick={() => {
                        toast.success(sendWallet.type === "cold" ? t("admin.signOnDevice") : t("admin.confirmWithdrawal"));
                        setSendWallet(null); setSendTo(""); setSendAmount(""); setSendConfirm(false); setSendMemo("");
                      }}>
                      <ShieldCheck className="mr-1.5 h-4 w-4" />
                      {sendWallet.type === "cold" ? t("admin.signOnDevice") : t("admin.confirmWithdrawal")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={!!receiveWallet} onOpenChange={() => setReceiveWallet(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />{t("admin.receiveFunds")}
            </DialogTitle>
            <DialogDescription>{t("admin.depositToWallet")}</DialogDescription>
          </DialogHeader>
          {receiveWallet && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={receiveWallet.address} size={180} level="H" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t("admin.walletAddress")}</Label>
                <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                  <code className="text-xs font-mono break-all flex-1">{receiveWallet.address}</code>
                  <CopyButton value={receiveWallet.address} />
                </div>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                <Badge variant="outline" className="text-xs">{chainLabels[receiveWallet.chain]}</Badge>
                <span className="text-xs text-muted-foreground">{t("admin.onlySend")} {chainLabels[receiveWallet.chain]}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}