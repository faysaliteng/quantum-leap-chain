import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wallets } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageSkeleton } from "@/components/PageSkeleton";
import { CopyButton } from "@/components/CopyButton";
import { WalletConnectPanel } from "@/components/WalletConnectPanel";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Wallet, PlusCircle, Trash2, Send, Download, Eye, EyeOff,
  ArrowUpRight, AlertTriangle, Lock, Shield, ShieldCheck,
  QrCode, Key, Link2, Unplug, Usb, Smartphone,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { ChainId, WalletConfig } from "@/lib/types";

const chainLabels: Record<string, string> = {
  btc: "Bitcoin", eth: "Ethereum", arbitrum: "Arbitrum", optimism: "Optimism", polygon: "Polygon",
};
const chainIcons: Record<string, string> = {
  btc: "₿", eth: "Ξ", arbitrum: "◆", optimism: "⊕", polygon: "⬡",
};
const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted text-muted-foreground",
  locked: "bg-destructive/10 text-destructive",
};

export default function MerchantWallets() {
  const { t } = useI18n();
  usePageTitle(t("wallets.title"));
  const qc = useQueryClient();

  // WalletConnect dialog
  const [showConnect, setShowConnect] = useState(false);

  // Send / Withdraw dialog
  const [sendWallet, setSendWallet] = useState<WalletConfig | null>(null);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendConfirm, setSendConfirm] = useState(false);
  const [sendMemo, setSendMemo] = useState("");

  // Receive dialog
  const [receiveWallet, setReceiveWallet] = useState<WalletConfig | null>(null);

  // Detail view
  const [selectedWallet, setSelectedWallet] = useState<WalletConfig | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const { data: myWallets, isLoading } = useQuery({
    queryKey: ["merchant-wallets"],
    queryFn: wallets.list,
  });

  const addMut = useMutation({
    mutationFn: (data: { label: string; chain: string; address: string; type: string }) => wallets.add(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merchant-wallets"] });
      toast.success("Wallet connected successfully");
    },
    onError: () => toast.error("Failed to add wallet"),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => wallets.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["merchant-wallets"] }); toast.success("Wallet removed"); },
  });

  if (isLoading) return <PageSkeleton />;

  const wList = myWallets ?? [];
  const totalUsd = wList.reduce((s, w) => s + w.balance_usd, 0);
  const hotWallets = wList.filter((w) => w.type === "hot");
  const coldWallets = wList.filter((w) => w.type === "cold");

  const handleWalletConnected = (wallet: { label: string; chain: ChainId; address: string; type: "hot" | "cold" }) => {
    addMut.mutate({ label: wallet.label, chain: wallet.chain, address: wallet.address, type: wallet.type });
  };

  const estimatedFee = sendWallet?.chain === "btc" ? 0.00005 : 0.001;

  return (
    <div className="space-y-6" data-testid="page:dashboard-wallets">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">{t("wallets.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("wallets.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowConnect(true)}>
            <Link2 className="mr-1.5 h-4 w-4" />{t("wallets.connectWallet")}
          </Button>
          <Button onClick={() => setShowConnect(true)}>
            <PlusCircle className="mr-1.5 h-4 w-4" />{t("wallets.addWallet")}
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("wallets.totalPortfolio")}</p>
              <p className="text-3xl font-display font-bold">${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t("wallets.totalWallets"), value: wList.length },
              { label: t("wallets.hotWallets"), value: hotWallets.length, color: "text-success" },
              { label: t("wallets.coldWallets"), value: coldWallets.length, color: "text-info" },
              { label: t("wallets.chains"), value: new Set(wList.map((w) => w.chain)).size },
            ].map((s) => (
              <div key={s.label} className="bg-background/60 backdrop-blur-sm rounded-lg p-3 border border-border/50">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.color ?? ""}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Connection Methods Banner */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-sm font-medium">{t("wallets.supportedConnections")}</p>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { icon: <Smartphone className="h-3.5 w-3.5" />, label: "WalletConnect v2" },
                { icon: <Usb className="h-3.5 w-3.5" />, label: "Ledger" },
                { icon: <Shield className="h-3.5 w-3.5" />, label: "Trezor" },
                { icon: <QrCode className="h-3.5 w-3.5" />, label: "Keystone" },
              ].map((c) => (
                <Badge key={c.label} variant="outline" className="gap-1 text-xs">
                  {c.icon}{c.label}
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground">{t("wallets.moreWallets")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">{t("wallets.all")} ({wList.length})</TabsTrigger>
          <TabsTrigger value="hot">{t("wallets.hot")} ({hotWallets.length})</TabsTrigger>
          <TabsTrigger value="cold">{t("wallets.cold")} ({coldWallets.length})</TabsTrigger>
        </TabsList>

        {(["all", "hot", "cold"] as const).map((tab) => {
          const filtered = tab === "all" ? wList : tab === "hot" ? hotWallets : coldWallets;
          return (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {filtered.length ? filtered.map((w) => (
                <Card key={w.id} className="group hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold ${w.type === "hot" ? "bg-success/10 text-success" : "bg-info/10 text-info"}`}>
                          {chainIcons[w.chain] ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-base">{w.label}</span>
                            <Badge variant="outline" className="text-xs">{chainLabels[w.chain] ?? w.chain}</Badge>
                            <Badge className={`${statusStyles[w.status]} border-0 text-xs`}>
                              {w.type === "hot" ? <Wallet className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                              {w.type === "hot" ? "Hot" : "Cold"} · {w.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <code className="text-xs text-muted-foreground font-mono truncate max-w-[240px]">{w.address}</code>
                            <CopyButton value={w.address} />
                          </div>
                          {w.last_activity && (
                            <p className="text-xs text-muted-foreground mt-1">Last activity: {new Date(w.last_activity).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-right">
                          <p className="text-xl font-display font-bold">{w.balance}</p>
                          <p className="text-sm text-muted-foreground">${w.balance_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setSendWallet(w)} title="Send / Withdraw">
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setReceiveWallet(w)} title="Receive">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setSelectedWallet(w)} title="Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeMut.mutate(w.id)} title="Disconnect">
                            <Unplug className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t("wallets.noWallets")}</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowConnect(true)}>
                    <Link2 className="mr-1.5 h-4 w-4" />{t("wallets.connectFirst")}
                  </Button>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Security Notice */}
      <Card className="border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">{t("wallets.securityTitle")}</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-1.5"><Shield className="h-3 w-3" />Private keys encrypted with AES-256-GCM at rest</li>
                <li className="flex items-center gap-1.5"><Lock className="h-3 w-3" />Hardware wallets: keys never leave the device</li>
                <li className="flex items-center gap-1.5"><Key className="h-3 w-3" />Multi-signature support for high-value transactions</li>
                <li className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />Withdrawal limits, 2FA confirmation, and anomaly detection</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── WalletConnect Panel ── */}
      <WalletConnectPanel
        open={showConnect}
        onOpenChange={setShowConnect}
        onWalletConnected={handleWalletConnected}
      />

      {/* ── Send / Withdraw Dialog ── */}
      <Dialog open={!!sendWallet} onOpenChange={() => { setSendWallet(null); setSendTo(""); setSendAmount(""); setSendConfirm(false); setSendMemo(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />{t("wallets.sendWithdraw")}
            </DialogTitle>
            <DialogDescription>
              {sendWallet?.type === "cold"
                ? `Sending from cold wallet — requires hardware device confirmation`
                : `Send crypto from ${sendWallet?.label}`}
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
                  <Badge className={`${statusStyles[sendWallet.status]} border-0`}>
                    {sendWallet.type === "hot" ? "🔥 Hot" : "🧊 Cold"}
                  </Badge>
                </div>
              </div>

              {sendWallet.type === "cold" && (
                <div className="bg-info/10 border border-info/20 rounded-lg p-3 flex items-start gap-2">
                  <Usb className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-info">Hardware signing required:</strong> This transaction must be approved on your connected hardware wallet device.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>{t("wallets.recipientAddress")}</Label>
                <Input placeholder="0x... or bc1..." value={sendTo} onChange={(e) => setSendTo(e.target.value)} className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>{t("table.amount")}</Label>
                <div className="relative">
                  <Input type="number" step="any" placeholder="0.00" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} className="pr-16" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-8 text-xs text-primary" onClick={() => setSendAmount(sendWallet.balance)}>
                    MAX
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("wallets.memo")}</Label>
                <Input placeholder="Internal reference…" value={sendMemo} onChange={(e) => setSendMemo(e.target.value)} />
              </div>

              {!sendConfirm ? (
                <Button className="w-full" onClick={() => setSendConfirm(true)} disabled={!sendTo || !sendAmount}>
                  <ArrowUpRight className="mr-1.5 h-4 w-4" />{t("wallets.reviewWithdrawal")}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">To:</span><code className="font-mono text-xs truncate max-w-[200px]">{sendTo}</code></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span><span className="font-bold">{sendAmount}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("wallets.networkFee")}:</span><span>~{estimatedFee}</span></div>
                    {sendMemo && <div className="flex justify-between"><span className="text-muted-foreground">Memo:</span><span className="text-xs">{sendMemo}</span></div>}
                    <Separator />
                    <div className="flex justify-between font-semibold"><span>Total:</span><span>{(parseFloat(sendAmount || "0") + estimatedFee).toFixed(6)}</span></div>
                  </div>
                  <div className="bg-warning/10 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">{t("wallets.irreversible")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setSendConfirm(false)}>Back</Button>
                    <Button className="flex-1 bg-gradient-gold text-primary-foreground font-semibold"
                      onClick={() => {
                        toast.success(sendWallet.type === "cold" ? "Awaiting hardware device confirmation…" : "Transaction submitted");
                        setSendWallet(null); setSendTo(""); setSendAmount(""); setSendConfirm(false); setSendMemo("");
                      }}>
                      <ShieldCheck className="mr-1.5 h-4 w-4" />
                      {sendWallet.type === "cold" ? "Sign on Device" : t("wallets.confirmSend")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Receive Dialog ── */}
      <Dialog open={!!receiveWallet} onOpenChange={() => setReceiveWallet(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />{t("wallets.receive")} {receiveWallet ? chainLabels[receiveWallet.chain] : ""}
            </DialogTitle>
            <DialogDescription>{t("wallets.scanQr")}</DialogDescription>
          </DialogHeader>
          {receiveWallet && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={receiveWallet.address} size={180} level="H" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Wallet Address</Label>
                <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                  <code className="text-xs font-mono break-all flex-1">{receiveWallet.address}</code>
                  <CopyButton value={receiveWallet.address} />
                </div>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                <Badge variant="outline" className="text-xs">{chainLabels[receiveWallet.chain]}</Badge>
                <span className="text-xs text-muted-foreground">Only send {chainLabels[receiveWallet.chain]} assets to this address</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Wallet Detail Dialog ── */}
      <Dialog open={!!selectedWallet} onOpenChange={() => { setSelectedWallet(null); setShowPrivateKey(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />{selectedWallet?.label}</DialogTitle>
            <DialogDescription>Wallet details and key management</DialogDescription>
          </DialogHeader>
          {selectedWallet && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-lg font-bold font-display">{selectedWallet.balance}</p>
                  <p className="text-xs text-muted-foreground">${selectedWallet.balance_usd.toLocaleString()}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${statusStyles[selectedWallet.status]} border-0`}>{selectedWallet.status}</Badge>
                    <Badge variant="outline">{selectedWallet.type === "hot" ? "Hot" : "Cold"}</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Public Address</Label>
                <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                  <code className="text-xs font-mono break-all flex-1">{selectedWallet.address}</code>
                  <CopyButton value={selectedWallet.address} />
                </div>
              </div>
              {selectedWallet.xpub && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Extended Public Key (xpub)</Label>
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                    <code className="text-xs font-mono break-all flex-1 truncate">{selectedWallet.xpub}</code>
                    <CopyButton value={selectedWallet.xpub} />
                  </div>
                </div>
              )}
              {selectedWallet.derivation_path && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Derivation Path</Label>
                  <code className="text-xs font-mono bg-muted rounded-lg p-3 block">{selectedWallet.derivation_path}</code>
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Key className="h-3 w-3" />Private Key</Label>
                  <Button variant="ghost" size="sm" onClick={() => setShowPrivateKey(!showPrivateKey)} className="text-xs">
                    {showPrivateKey ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
                    {showPrivateKey ? "Hide" : "Reveal"}
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  {showPrivateKey ? (
                    <div className="space-y-2">
                      <code className="text-xs font-mono break-all text-destructive">
                        ••• Private key is stored encrypted in HSM. Export requires 2FA verification and admin approval for cold wallets.
                      </code>
                      <Button variant="destructive" size="sm" className="w-full">
                        <Lock className="mr-1.5 h-3.5 w-3.5" />Request Private Key Export (Requires 2FA)
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">Click "Reveal" to view private key options</p>
                  )}
                </div>
              </div>
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-warning">Warning:</strong> Never share your private keys. Cryptoniumpay support will never ask for your private keys.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
