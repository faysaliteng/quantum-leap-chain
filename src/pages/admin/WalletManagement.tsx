import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/PageSkeleton";
import { CopyButton } from "@/components/CopyButton";
import { WalletConnectPanel } from "@/components/WalletConnectPanel";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Wallet, Shield, ShieldCheck, PlusCircle, Trash2, Lock, Unlock,
  Send, Download, AlertTriangle, TrendingUp, TrendingDown, Eye,
  Link2, Usb, Smartphone, ArrowUpRight, Unplug,
  ArrowDownUp, Search, RefreshCw, ArrowDown, ArrowUp, Zap, Globe,
  History, BarChart3, ExternalLink, Coins, Database,
  Activity, CircleDollarSign, ChevronRight,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { WalletConfig, ChainId } from "@/lib/types";

const CHAINS: Record<string, { label: string; icon: string; color: string }> = {
  btc: { label: "Bitcoin", icon: "₿", color: "text-orange-500" },
  eth: { label: "Ethereum", icon: "Ξ", color: "text-blue-400" },
  bsc: { label: "BNB Chain", icon: "⬡", color: "text-yellow-400" },
  polygon: { label: "Polygon", icon: "⬟", color: "text-purple-400" },
  solana: { label: "Solana", icon: "◎", color: "text-green-400" },
  tron: { label: "TRON", icon: "◈", color: "text-red-400" },
  arbitrum: { label: "Arbitrum", icon: "◆", color: "text-blue-300" },
  optimism: { label: "Optimism", icon: "⊕", color: "text-red-500" },
  ltc: { label: "Litecoin", icon: "Ł", color: "text-gray-400" },
  doge: { label: "Dogecoin", icon: "Ð", color: "text-yellow-500" },
  avax: { label: "Avalanche", icon: "▲", color: "text-red-600" },
  fantom: { label: "Fantom", icon: "◇", color: "text-blue-500" },
  base: { label: "Base", icon: "🔵", color: "text-blue-600" },
};

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground",
  locked: "bg-destructive/10 text-destructive border-destructive/20",
};

type AdminTab = "treasury" | "wallets" | "convert" | "activity";

export default function AdminWalletManagement() {
  const { t } = useI18n();
  usePageTitle(t("admin.walletMgmt"));
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<AdminTab>("treasury");
  const [showConnect, setShowConnect] = useState(false);
  const [walletFilter, setWalletFilter] = useState<"all" | "hot" | "cold">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Send state
  const [sendWallet, setSendWallet] = useState<WalletConfig | null>(null);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendMemo, setSendMemo] = useState("");
  const [sendConfirm, setSendConfirm] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState(0);

  // Receive
  const [receiveWallet, setReceiveWallet] = useState<WalletConfig | null>(null);

  // Convert state
  const [fromAsset, setFromAsset] = useState("ETH");
  const [toAsset, setToAsset] = useState("USDT");
  const [convertAmount, setConvertAmount] = useState("");
  const [swapQuote, setSwapQuote] = useState<import("@/lib/types").SwapQuote | null>(null);

  // ── Queries ──
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: admin.wallets.stats,
  });

  const { data: portfolio } = useQuery({
    queryKey: ["admin-wallets-portfolio"],
    queryFn: admin.wallets.portfolio,
  });

  const { data: adminAssets } = useQuery({
    queryKey: ["admin-wallets-assets"],
    queryFn: admin.wallets.assets,
  });

  const { data: marketData } = useQuery({
    queryKey: ["admin-market"],
    queryFn: admin.wallets.market,
    refetchInterval: 30000,
  });

  // ── Mutations ──
  const addMut = useMutation({
    mutationFn: (data: Partial<WalletConfig>) => admin.wallets.add(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wallets"] }); toast.success("Wallet connected"); },
    onError: () => toast.error("Failed to add wallet"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      admin.wallets.update(id, { status: status === "active" ? "locked" : "active" } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wallets"] }); toast.success("Wallet updated"); },
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => admin.wallets.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-wallets"] }); toast.success("Wallet removed"); },
  });

  const sendMut = useMutation({
    mutationFn: () => admin.wallets.send(sendWallet!.id, { to_address: sendTo, amount: sendAmount, memo: sendMemo || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-wallets"] });
      toast.success(sendWallet!.type === "cold" ? "Awaiting hardware confirmation" : "Transaction submitted");
      setSendWallet(null); setSendTo(""); setSendAmount(""); setSendConfirm(false); setSendMemo("");
    },
    onError: () => toast.error("Transaction failed"),
  });

  const swapMut = useMutation({
    mutationFn: () => admin.wallets.swapExecute({ from_asset: fromAsset, to_asset: toAsset, amount: convertAmount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-wallets"] });
      toast.success("Swap executed");
      setConvertAmount("");
    },
    onError: () => toast.error("Swap failed"),
  });

  // Swap quote for admin convert
  useEffect(() => {
    if (!convertAmount || !fromAsset || !toAsset || fromAsset === toAsset) { setSwapQuote(null); return; }
    const t = setTimeout(() => {
      admin.wallets.swapQuote({ from_asset: fromAsset, to_asset: toAsset, amount: convertAmount })
        .then(setSwapQuote)
        .catch(() => setSwapQuote(null));
    }, 500);
    return () => clearTimeout(t);
  }, [fromAsset, toAsset, convertAmount]);

  // Fee estimation
  useEffect(() => {
    if (!sendWallet || !sendTo || !sendAmount) { setEstimatedFee(0); return; }
    admin.wallets.estimateFee(sendWallet.id, { to_address: sendTo, amount: sendAmount })
      .then((res) => setEstimatedFee(parseFloat(res.estimated_fee)))
      .catch(() => setEstimatedFee(0));
  }, [sendWallet?.id, sendTo, sendAmount]);

  if (isLoading) return <PageSkeleton />;

  const walletsList = stats?.wallets ?? [];
  const assetList = adminAssets ?? portfolio?.assets ?? [];
  const filtered = walletsList.filter((w) => {
    const matchType = walletFilter === "all" || w.type === walletFilter;
    const matchSearch = !searchQuery || w.label.toLowerCase().includes(searchQuery.toLowerCase()) || w.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const handleWalletConnected = (wallet: { label: string; chain: ChainId; address: string; type: "hot" | "cold"; connection_method: string }) => {
    if (wallet.connection_method === "generated") {
      qc.invalidateQueries({ queryKey: ["admin-wallets"] });
      qc.invalidateQueries({ queryKey: ["admin-wallets-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-wallets-portfolio"] });
      return;
    }
    addMut.mutate({ label: wallet.label, chain: wallet.chain, address: wallet.address, type: wallet.type } as any);
  };

  return (
    <div className="space-y-6" data-testid="page:admin-wallets">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />{t("admin.walletMgmt")}
          </h1>
          <p className="text-xs text-muted-foreground">{t("admin.platformTreasury")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin-wallets"] })}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button className="bg-gradient-gold text-primary-foreground font-semibold" onClick={() => setShowConnect(true)}>
            <Link2 className="mr-1.5 h-3.5 w-3.5" />{t("admin.connectWallet")}
          </Button>
        </div>
      </div>

      {/* ── Treasury Overview ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { icon: <CircleDollarSign className="h-5 w-5 text-primary" />, value: `$${(stats?.total_balance_usd ?? 0).toLocaleString()}`, label: "Total Balance", highlight: true },
          { icon: <Zap className="h-5 w-5 text-warning" />, value: `$${(stats?.hot_balance_usd ?? 0).toLocaleString()}`, label: "Hot Balance" },
          { icon: <Lock className="h-5 w-5 text-info" />, value: `$${(stats?.cold_balance_usd ?? 0).toLocaleString()}`, label: "Cold Balance" },
          { icon: <Shield className="h-5 w-5 text-success" />, value: stats?.total_hot_wallets ?? 0, label: "Hot Wallets" },
          { icon: <ShieldCheck className="h-5 w-5 text-muted-foreground" />, value: stats?.total_cold_wallets ?? 0, label: "Cold Wallets" },
        ].map((s) => (
          <Card key={s.label} className={s.highlight ? "border-primary/20 shadow-md" : ""}>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">{s.icon}<p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p></div>
              <p className="text-2xl font-bold font-display">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tab Navigation ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)}>
        <TabsList className="bg-card border border-border/50 h-11">
          <TabsTrigger value="treasury" className="gap-1.5 data-[state=active]:bg-primary/10"><BarChart3 className="h-3.5 w-3.5" />Treasury Assets</TabsTrigger>
          <TabsTrigger value="wallets" className="gap-1.5 data-[state=active]:bg-primary/10"><Wallet className="h-3.5 w-3.5" />All Wallets</TabsTrigger>
          <TabsTrigger value="convert" className="gap-1.5 data-[state=active]:bg-primary/10"><ArrowDownUp className="h-3.5 w-3.5" />Convert</TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5 data-[state=active]:bg-primary/10"><Activity className="h-3.5 w-3.5" />Activity</TabsTrigger>
        </TabsList>

        {/* ═══════ TREASURY ASSETS TAB ═══════ */}
        <TabsContent value="treasury" className="mt-4 space-y-4">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 pl-4">Asset</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Price</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">24h</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Holdings</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Value</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assetList.length ? assetList.map((asset) => {
                    const chain = CHAINS[asset.chain];
                    return (
                      <tr key={`${asset.chain}-${asset.symbol}`} className="border-b border-border/20 hover:bg-muted/20 transition-colors group">
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border/50 text-base font-bold ${chain?.color ?? ""}`}>
                              {chain?.icon ?? "?"}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{asset.name}</p>
                              <span className="text-xs text-muted-foreground">{asset.symbol} · {chain?.label}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono text-sm">${asset.price_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: asset.price_usd < 1 ? 6 : 2 })}</td>
                        <td className="p-3 text-right">
                          <span className={`text-xs font-mono ${asset.change_24h >= 0 ? "text-success" : "text-destructive"}`}>
                            {asset.change_24h >= 0 ? "+" : ""}{asset.change_24h.toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-sm">{asset.balance} {asset.symbol}</td>
                        <td className="p-3 text-right font-bold text-sm">${asset.balance_usd.toLocaleString()}</td>
                        <td className="p-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setActiveTab("convert"); setFromAsset(asset.symbol); }}>
                              <ArrowDownUp className="h-3 w-3 mr-1" />Swap
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground"><Coins className="h-8 w-8 mx-auto mb-2 opacity-30" />No assets</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Market Tickers */}
          {marketData?.length ? (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Market Overview</h3>
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {marketData.slice(0, 8).map((ticker) => (
                  <Card key={ticker.symbol} className="hover:border-primary/20 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg ${CHAINS[ticker.symbol.toLowerCase()]?.color ?? "text-primary"}`}>{CHAINS[ticker.symbol.toLowerCase()]?.icon ?? "●"}</span>
                          <div>
                            <p className="text-xs font-semibold">{ticker.symbol}</p>
                            <p className="text-[10px] text-muted-foreground">{ticker.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold">${ticker.price_usd.toLocaleString()}</p>
                          <p className={`text-[10px] font-mono ${ticker.change_24h >= 0 ? "text-success" : "text-destructive"}`}>
                            {ticker.change_24h >= 0 ? "+" : ""}{ticker.change_24h.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* ═══════ ALL WALLETS TAB ═══════ */}
        <TabsContent value="wallets" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search wallets..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex gap-1.5">
              {(["all", "hot", "cold"] as const).map((f) => (
                <Button key={f} variant={walletFilter === f ? "default" : "outline"} size="sm" onClick={() => setWalletFilter(f)}
                  className={walletFilter === f ? "bg-gradient-gold text-primary-foreground" : ""}>
                  {f === "all" ? "All" : f === "hot" ? "🔥 Hot" : "🧊 Cold"} ({f === "all" ? walletsList.length : walletsList.filter((w) => w.type === f).length})
                </Button>
              ))}
            </div>
          </div>

          {/* Wallet Cards */}
          <div className="space-y-3">
            {filtered.length ? filtered.map((w) => {
              const chain = CHAINS[w.chain];
              return (
                <Card key={w.id} className={`group hover:shadow-md transition-all ${w.status === "locked" ? "border-destructive/20" : "hover:border-primary/20"}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold border border-border/50 ${w.type === "hot" ? "bg-warning/5" : "bg-info/5"} ${chain?.color ?? ""}`}>
                          {chain?.icon ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{w.label}</span>
                            <Badge variant="outline" className="text-[10px]">{chain?.label ?? w.chain}</Badge>
                            <Badge className={`text-[10px] ${statusColors[w.status]} border-0`}>{w.status}</Badge>
                            <Badge variant="outline" className="text-[10px]">{w.type === "hot" ? "🔥 Hot" : "🧊 Cold"}</Badge>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <code className="text-[11px] text-muted-foreground font-mono truncate max-w-[240px]">{w.address}</code>
                            <CopyButton value={w.address} />
                          </div>
                          {w.last_activity && (
                            <p className="text-[10px] text-muted-foreground mt-1">Last active: {new Date(w.last_activity).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold font-display">{w.balance}</p>
                          <p className="text-xs text-muted-foreground">${w.balance_usd.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSendWallet(w)} title="Send"><Send className="h-3.5 w-3.5" /></Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setReceiveWallet(w)} title="Receive"><Download className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleMut.mutate({ id: w.id, status: w.status })} title={w.status === "active" ? "Lock" : "Unlock"}>
                            {w.status === "active" ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMut.mutate(w.id)} title="Remove"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="text-center py-16 text-muted-foreground">
                <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No wallets found</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowConnect(true)}>
                  <Link2 className="mr-1.5 h-4 w-4" />Connect Wallet
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══════ CONVERT TAB ═══════ */}
        <TabsContent value="convert" className="mt-4">
          <div className="max-w-lg mx-auto">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-info/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg"><ArrowDownUp className="h-5 w-5 text-primary" />Treasury Convert</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">From</Label>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center justify-between">
                      <Select value={fromAsset} onValueChange={setFromAsset}>
                        <SelectTrigger className="w-[140px] border-0 bg-transparent p-0 h-auto font-bold text-base"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["BTC","ETH","BNB","USDT","USDC","SOL","TRX","MATIC","DOGE","LTC","AVAX"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" step="any" placeholder="0.00" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} className="text-right text-xl font-mono font-bold border-0 bg-transparent w-[180px] p-0 h-auto focus-visible:ring-0" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center -my-2">
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-2 border-primary/30" onClick={() => { setFromAsset(toAsset); setToAsset(fromAsset); }}>
                    <ArrowDownUp className="h-4 w-4 text-primary" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">To</Label>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center justify-between">
                      <Select value={toAsset} onValueChange={setToAsset}>
                        <SelectTrigger className="w-[140px] border-0 bg-transparent p-0 h-auto font-bold text-base"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["BTC","ETH","BNB","USDT","USDC","SOL","TRX","MATIC","DOGE","LTC","AVAX"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xl font-mono font-bold text-muted-foreground">{swapQuote?.to_amount ?? "—"}</p>
                    </div>
                  </div>
                </div>

                {swapQuote && (
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-xs border border-border/30">
                    <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-mono">1 {fromAsset} = {swapQuote.rate} {toAsset}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span className="font-mono">{swapQuote.fee} ({swapQuote.fee_usd})</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Slippage</span><span className="font-mono">{swapQuote.slippage}%</span></div>
                  </div>
                )}

                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground"><strong className="text-destructive">Admin action:</strong> This swap affects platform treasury. Audit log will be created.</p>
                </div>

                <Button className="w-full h-11 bg-gradient-gold text-primary-foreground font-semibold" disabled={!swapQuote || !convertAmount || swapMut.isPending || fromAsset === toAsset} onClick={() => swapMut.mutate()}>
                  <ArrowDownUp className="mr-1.5 h-4 w-4" />{swapMut.isPending ? "Processing..." : `Convert ${fromAsset} → ${toAsset}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════ ACTIVITY TAB ═══════ */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Transaction activity is available in</p>
              <Button variant="link" className="text-primary" onClick={() => window.location.href = "/admin/wallets/transactions"}>
                Wallet Transactions <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Supported Connections ── */}
      <Card className="border-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs font-medium text-muted-foreground">Supported:</p>
            {[
              { icon: <Smartphone className="h-3 w-3" />, label: "WalletConnect v2" },
              { icon: <Usb className="h-3 w-3" />, label: "Ledger" },
              { icon: <Shield className="h-3 w-3" />, label: "Trezor" },
              { icon: <ShieldCheck className="h-3 w-3" />, label: "Keystone" },
            ].map((c) => (
              <Badge key={c.label} variant="outline" className="gap-1 text-[10px]">{c.icon}{c.label}</Badge>
            ))}
            <span className="text-[10px] text-muted-foreground">+ GridPlus, Manual Import</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Dialogs ── */}
      <WalletConnectPanel open={showConnect} onOpenChange={setShowConnect} onWalletConnected={handleWalletConnected} context="admin" />

      {/* Send Dialog */}
      <Dialog open={!!sendWallet} onOpenChange={() => { setSendWallet(null); setSendTo(""); setSendAmount(""); setSendConfirm(false); setSendMemo(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" />Admin Withdrawal</DialogTitle>
            <DialogDescription>{sendWallet?.type === "cold" ? "Hardware signing required" : `Send from ${sendWallet?.label}`}</DialogDescription>
          </DialogHeader>
          {sendWallet && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">From: {sendWallet.label}</p>
                  <p className="text-lg font-bold font-display">{sendWallet.balance}</p>
                  <p className="text-xs text-muted-foreground">${sendWallet.balance_usd.toLocaleString()}</p>
                </div>
                <Badge variant="outline">{sendWallet.type === "hot" ? "🔥 Hot" : "🧊 Cold"}</Badge>
              </div>

              {sendWallet.type === "cold" && (
                <div className="bg-info/10 border border-info/20 rounded-lg p-3 flex items-start gap-2">
                  <Usb className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground"><strong className="text-info">Hardware signing required</strong></p>
                </div>
              )}

              <div className="space-y-2"><Label>Recipient</Label><Input placeholder="0x..." value={sendTo} onChange={(e) => setSendTo(e.target.value)} className="font-mono text-sm" /></div>
              <div className="space-y-2"><Label>Amount</Label>
                <div className="relative">
                  <Input type="number" step="any" placeholder="0.00" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} className="pr-16" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-8 text-xs text-primary" onClick={() => setSendAmount(sendWallet.balance)}>MAX</Button>
                </div>
              </div>
              <div className="space-y-2"><Label>Audit Note</Label><Input placeholder="Reason for withdrawal..." value={sendMemo} onChange={(e) => setSendMemo(e.target.value)} /></div>

              {sendTo && sendAmount && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Network Fee</span><span className="font-mono">~{estimatedFee}</span></div>
                  <Separator />
                  <div className="flex justify-between font-semibold"><span>Total</span><span className="font-mono">{(parseFloat(sendAmount || "0") + estimatedFee).toFixed(6)}</span></div>
                </div>
              )}

              {!sendConfirm ? (
                <Button className="w-full bg-gradient-gold text-primary-foreground font-semibold" disabled={!sendTo || !sendAmount} onClick={() => setSendConfirm(true)}>
                  <ArrowUpRight className="mr-1.5 h-4 w-4" />Review Withdrawal
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground"><strong className="text-destructive">Admin withdrawal</strong> — this action is logged and irreversible.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setSendConfirm(false)}>Back</Button>
                    <Button className="flex-1 bg-gradient-gold text-primary-foreground font-semibold" disabled={sendMut.isPending} onClick={() => sendMut.mutate()}>
                      <ShieldCheck className="mr-1.5 h-4 w-4" />{sendWallet.type === "cold" ? "Sign on Device" : "Confirm"}
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
            <DialogTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Receive Funds</DialogTitle>
            <DialogDescription>Deposit to {receiveWallet?.label}</DialogDescription>
          </DialogHeader>
          {receiveWallet && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-background rounded-xl border border-border/30">
                <QRCodeSVG value={receiveWallet.address} size={180} level="H" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Address</Label>
                <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                  <code className="text-xs font-mono break-all flex-1">{receiveWallet.address}</code>
                  <CopyButton value={receiveWallet.address} />
                </div>
              </div>
              <Badge variant="outline" className="w-full justify-center py-1.5">
                {CHAINS[receiveWallet.chain]?.icon} {CHAINS[receiveWallet.chain]?.label} Network Only
              </Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}