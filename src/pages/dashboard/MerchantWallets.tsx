import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wallets } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
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
  ArrowDownUp, TrendingUp, TrendingDown, Search, RefreshCw,
  ArrowDown, ArrowUp, Zap, Globe, History, BarChart3,
  ChevronRight, ExternalLink, CircleDollarSign, Coins,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { ChainId, WalletConfig, WalletAsset, SwapQuote } from "@/lib/types";
import CryptoIcon from "@/components/CryptoIcon";

// ── Chain metadata ──
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

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-muted",
  locked: "bg-destructive/10 text-destructive border-destructive/20",
};

type WalletTab = "overview" | "send" | "receive" | "convert" | "history";

export default function MerchantWallets() {
  const { t } = useI18n();
  usePageTitle(t("wallets.title"));
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<WalletTab>("overview");
  const [showConnect, setShowConnect] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChainFilter, setSelectedChainFilter] = useState<string>("all");

  // Send state
  const [sendWallet, setSendWallet] = useState<WalletConfig | null>(null);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendMemo, setSendMemo] = useState("");
  const [sendConfirm, setSendConfirm] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState(0);

  // Receive state
  const [receiveChain, setReceiveChain] = useState<string>("eth");

  // Convert state
  const [fromAsset, setFromAsset] = useState("ETH");
  const [toAsset, setToAsset] = useState("USDT");
  const [convertAmount, setConvertAmount] = useState("");
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);

  // Detail view
  const [selectedWallet, setSelectedWallet] = useState<WalletConfig | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  // ── Queries ──
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ["merchant-wallets-portfolio"],
    queryFn: wallets.portfolio,
  });

  const { data: assets } = useQuery({
    queryKey: ["merchant-wallets-assets"],
    queryFn: wallets.assets,
  });

  const { data: marketData } = useQuery({
    queryKey: ["merchant-market"],
    queryFn: wallets.market,
    refetchInterval: 30000,
  });

  const { data: recentTx } = useQuery({
    queryKey: ["merchant-wallet-tx"],
    queryFn: () => wallets.transactions({ per_page: 10 }),
  });

  const { data: depositInfo } = useQuery({
    queryKey: ["deposit-info", receiveChain],
    queryFn: () => wallets.depositInfo(receiveChain),
    enabled: activeTab === "receive",
  });

  // ── Mutations ──
  const addMut = useMutation({
    mutationFn: (data: { label: string; chain: string; address: string; type: string }) => wallets.add(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["merchant-wallets-portfolio"] }); toast.success("Wallet connected"); },
    onError: () => toast.error("Failed to add wallet"),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => wallets.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["merchant-wallets-portfolio"] }); toast.success("Wallet removed"); },
  });

  const sendMut = useMutation({
    mutationFn: () => wallets.send(sendWallet!.id, { to_address: sendTo, amount: sendAmount, memo: sendMemo || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merchant-wallets-portfolio"] });
      toast.success(sendWallet!.type === "cold" ? "Awaiting hardware confirmation…" : "Transaction submitted");
      setSendWallet(null); setSendTo(""); setSendAmount(""); setSendConfirm(false); setSendMemo("");
    },
    onError: () => toast.error("Transaction failed"),
  });

  const swapMut = useMutation({
    mutationFn: () => wallets.swapExecute({ from_asset: fromAsset, to_asset: toAsset, amount: convertAmount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merchant-wallets-portfolio"] });
      toast.success("Swap executed successfully");
      setConvertAmount(""); setSwapQuote(null);
    },
    onError: () => toast.error("Swap failed"),
  });

  // Fee estimation
  useEffect(() => {
    if (!sendWallet || !sendTo || !sendAmount) { setEstimatedFee(0); return; }
    wallets.estimateFee(sendWallet.id, { to_address: sendTo, amount: sendAmount })
      .then((res) => setEstimatedFee(parseFloat(res.estimated_fee)))
      .catch(() => setEstimatedFee(0));
  }, [sendWallet?.id, sendTo, sendAmount]);

  // Swap quote
  useEffect(() => {
    if (!convertAmount || !fromAsset || !toAsset || fromAsset === toAsset) { setSwapQuote(null); return; }
    const t = setTimeout(() => {
      wallets.swapQuote({ from_asset: fromAsset, to_asset: toAsset, amount: convertAmount })
        .then(setSwapQuote)
        .catch(() => setSwapQuote(null));
    }, 500);
    return () => clearTimeout(t);
  }, [fromAsset, toAsset, convertAmount]);

  if (isLoading) return <PageSkeleton />;

  const wList = portfolio?.wallets ?? [];
  const assetList = assets ?? portfolio?.assets ?? [];
  const totalUsd = portfolio?.total_balance_usd ?? 0;
  const pnl = portfolio?.total_pnl_24h ?? 0;
  const pnlPct = portfolio?.total_pnl_pct ?? 0;

  const filteredAssets = assetList.filter((a) => {
    const matchSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchChain = selectedChainFilter === "all" || a.chain === selectedChainFilter;
    return matchSearch && matchChain;
  });

  const handleWalletConnected = (wallet: { label: string; chain: ChainId; address: string; type: "hot" | "cold"; connection_method: string }) => {
    if (wallet.connection_method === "generated") {
      // Wallet already created server-side by /v1/wallets/generate
      qc.invalidateQueries({ queryKey: ["merchant-wallets-portfolio"] });
      qc.invalidateQueries({ queryKey: ["merchant-wallets-assets"] });
      qc.invalidateQueries({ queryKey: ["merchant-wallet-tx"] });
      return;
    }
    addMut.mutate({ label: wallet.label, chain: wallet.chain, address: wallet.address, type: wallet.type });
  };

  return (
    <div className="space-y-6" data-testid="page:dashboard-wallets">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" />
            {t("wallets.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("wallets.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["merchant-wallets-portfolio"] })}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" onClick={() => setShowConnect(true)}>
            <Link2 className="mr-1.5 h-4 w-4" />{t("wallets.connectWallet")}
          </Button>
          <Button className="bg-gradient-gold text-primary-foreground font-semibold" onClick={() => setShowConnect(true)}>
            <PlusCircle className="mr-1.5 h-4 w-4" />{t("wallets.addWallet")}
          </Button>
        </div>
      </div>

      {/* ── Portfolio Banner ── */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-br from-card via-card to-primary/5 p-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">{t("wallets.totalPortfolio")}</p>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-display font-bold tracking-tight">${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <Badge className={`text-xs font-mono ${pnl >= 0 ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                  {pnl >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}% (${Math.abs(pnl).toLocaleString()})
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Wallets", value: wList.length, icon: <Wallet className="h-4 w-4" /> },
                { label: "Hot Wallets", value: portfolio?.total_hot_wallets ?? 0, icon: <Zap className="h-4 w-4 text-warning" /> },
                { label: "Cold Storage", value: portfolio?.total_cold_wallets ?? 0, icon: <Lock className="h-4 w-4 text-info" /> },
                { label: "Networks", value: new Set(wList.map((w) => w.chain)).size, icon: <Globe className="h-4 w-4 text-primary" /> },
              ].map((s) => (
                <div key={s.label} className="bg-background/60 backdrop-blur-sm rounded-xl p-3 border border-border/30">
                  <div className="flex items-center gap-1.5 mb-1">{s.icon}<p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p></div>
                  <p className="text-xl font-bold font-display">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Main Navigation Tabs ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as WalletTab)}>
        <TabsList className="bg-card border border-border/50 h-11">
          <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-primary/10"><BarChart3 className="h-3.5 w-3.5" />Assets</TabsTrigger>
          <TabsTrigger value="send" className="gap-1.5 data-[state=active]:bg-primary/10"><ArrowUp className="h-3.5 w-3.5" />Send</TabsTrigger>
          <TabsTrigger value="receive" className="gap-1.5 data-[state=active]:bg-primary/10"><ArrowDown className="h-3.5 w-3.5" />Receive</TabsTrigger>
          <TabsTrigger value="convert" className="gap-1.5 data-[state=active]:bg-primary/10"><ArrowDownUp className="h-3.5 w-3.5" />Convert</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 data-[state=active]:bg-primary/10"><History className="h-3.5 w-3.5" />History</TabsTrigger>
        </TabsList>

        {/* ═══════ OVERVIEW TAB ═══════ */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Search + Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search assets..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={selectedChainFilter} onValueChange={setSelectedChainFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Networks</SelectItem>
                {Object.entries(CHAINS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asset Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 pl-4">Asset</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Price</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">24h Change</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Balance</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Value</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.length ? filteredAssets.map((asset) => {
                    const chain = CHAINS[asset.chain];
                    return (
                      <tr key={`${asset.chain}-${asset.symbol}`} className="border-b border-border/20 hover:bg-muted/20 transition-colors group">
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-3">
                            <CryptoIcon chain={asset.chain} size={40} />
                            <div>
                              <p className="font-semibold text-sm">{asset.name}</p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">{asset.symbol}</span>
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{chain?.label ?? asset.chain}</Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-sm font-mono font-medium">${asset.price_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: asset.price_usd < 1 ? 6 : 2 })}</span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={`text-sm font-mono font-medium flex items-center justify-end gap-1 ${asset.change_24h >= 0 ? "text-success" : "text-destructive"}`}>
                            {asset.change_24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {asset.change_24h >= 0 ? "+" : ""}{asset.change_24h.toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-sm font-mono font-medium">{asset.balance}</span>
                          <p className="text-[10px] text-muted-foreground">{asset.symbol}</p>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-sm font-bold">${asset.balance_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setActiveTab("send"); setFromAsset(asset.symbol); }}>
                              <ArrowUp className="h-3 w-3 mr-1" />Send
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setActiveTab("receive"); setReceiveChain(asset.chain); }}>
                              <ArrowDown className="h-3 w-3 mr-1" />Receive
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setActiveTab("convert"); setFromAsset(asset.symbol); }}>
                              <ArrowDownUp className="h-3 w-3 mr-1" />Swap
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-muted-foreground">
                        <Coins className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No assets found</p>
                        <Button variant="outline" className="mt-4" onClick={() => setShowConnect(true)}>
                          <PlusCircle className="mr-1.5 h-4 w-4" />Add Wallet
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Connected Wallets */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Connected Wallets</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {wList.map((w) => {
                const chain = CHAINS[w.chain];
                return (
                  <Card key={w.id} className="group hover:border-primary/30 transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <CryptoIcon chain={w.chain} size={44} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{w.label}</span>
                              <Badge variant="outline" className="text-[10px]">{w.type === "hot" ? "🔥 Hot" : "🧊 Cold"}</Badge>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <code className="text-[11px] text-muted-foreground font-mono truncate max-w-[180px]">{w.address}</code>
                              <CopyButton value={w.address} />
                            </div>
                            <Badge className={`mt-1.5 text-[10px] ${statusStyles[w.status]}`}>{w.status}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold font-display text-sm">{w.balance}</p>
                          <p className="text-xs text-muted-foreground">${w.balance_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/30">
                        <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => setSendWallet(w)}><Send className="h-3 w-3 mr-1" />Send</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => { setActiveTab("receive"); setReceiveChain(w.chain); }}><Download className="h-3 w-3 mr-1" />Receive</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedWallet(w)}><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => removeMut.mutate(w.id)}><Unplug className="h-3 w-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ═══════ SEND TAB ═══════ */}
        <TabsContent value="send" className="mt-4">
          <div className="max-w-lg mx-auto">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
                <CardTitle className="flex items-center gap-2 text-lg"><ArrowUp className="h-5 w-5 text-primary" />Send Crypto</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Select wallet */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">From Wallet</Label>
                  <Select value={sendWallet?.id ?? ""} onValueChange={(v) => setSendWallet(wList.find((w) => w.id === v) ?? null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {wList.filter((w) => w.status === "active").map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          <div className="flex items-center gap-2">
                            <CryptoIcon chain={w.chain} size={18} />
                            <span>{w.label}</span>
                            <span className="text-muted-foreground text-xs ml-auto">{w.balance}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {sendWallet && (
                    <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Available Balance</p>
                        <p className="text-lg font-bold font-display">{sendWallet.balance} <span className="text-xs text-muted-foreground">${sendWallet.balance_usd.toLocaleString()}</span></p>
                      </div>
                      <Badge variant="outline">{sendWallet.type === "hot" ? "🔥 Hot" : "🧊 Cold"}</Badge>
                    </div>
                  )}
                </div>

                {sendWallet?.type === "cold" && (
                  <div className="bg-info/10 border border-info/20 rounded-lg p-3 flex items-start gap-2">
                    <Usb className="h-4 w-4 text-info shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-info">Hardware signing required</strong> — this transaction must be approved on your device.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t("wallets.recipientAddress")}</Label>
                  <Input placeholder="0x..., bc1..., T..." value={sendTo} onChange={(e) => setSendTo(e.target.value)} className="font-mono text-sm" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t("table.amount")}</Label>
                  <div className="relative">
                    <Input type="number" step="any" placeholder="0.00" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} className="pr-16 text-lg font-mono" />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-8 text-xs text-primary font-bold" onClick={() => sendWallet && setSendAmount(sendWallet.balance)}>
                      MAX
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t("wallets.memo")}</Label>
                  <Input placeholder="Optional note..." value={sendMemo} onChange={(e) => setSendMemo(e.target.value)} />
                </div>

                {sendTo && sendAmount && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Network Fee (est.)</span><span className="font-mono">~{estimatedFee}</span></div>
                    <Separator />
                    <div className="flex justify-between font-semibold"><span>Total</span><span className="font-mono">{(parseFloat(sendAmount || "0") + estimatedFee).toFixed(6)}</span></div>
                  </div>
                )}

                {!sendConfirm ? (
                  <Button className="w-full h-11 bg-gradient-gold text-primary-foreground font-semibold" disabled={!sendWallet || !sendTo || !sendAmount} onClick={() => setSendConfirm(true)}>
                    <ArrowUpRight className="mr-1.5 h-4 w-4" />{t("wallets.reviewWithdrawal")}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">{t("wallets.irreversible")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setSendConfirm(false)}>Back</Button>
                      <Button className="flex-1 bg-gradient-gold text-primary-foreground font-semibold" disabled={sendMut.isPending} onClick={() => sendMut.mutate()}>
                        <ShieldCheck className="mr-1.5 h-4 w-4" />{sendWallet?.type === "cold" ? "Sign on Device" : t("wallets.confirmSend")}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════ RECEIVE TAB ═══════ */}
        <TabsContent value="receive" className="mt-4">
          <div className="max-w-lg mx-auto">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-success/5 to-transparent pb-4">
                <CardTitle className="flex items-center gap-2 text-lg"><ArrowDown className="h-5 w-5 text-success" />Receive Crypto</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Select Network</Label>
                  <Select value={receiveChain} onValueChange={setReceiveChain}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHAINS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          <div className="flex items-center gap-2">
                            <span className={v.color}>{v.icon}</span>
                            <span>{v.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {depositInfo ? (
                  <>
                    <div className="flex justify-center p-6 bg-background rounded-xl border border-border/50">
                      <QRCodeSVG value={depositInfo.address} size={200} level="H" className="rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Deposit Address</Label>
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3 border border-border/30">
                        <code className="text-xs font-mono break-all flex-1">{depositInfo.address}</code>
                        <CopyButton value={depositInfo.address} />
                      </div>
                    </div>
                    {depositInfo.memo && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Memo / Tag</Label>
                        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3 border border-border/30">
                          <code className="text-xs font-mono flex-1">{depositInfo.memo}</code>
                          <CopyButton value={depositInfo.memo} />
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">Min Deposit</p>
                        <p className="text-sm font-bold">{depositInfo.min_deposit}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">Confirmations</p>
                        <p className="text-sm font-bold">{depositInfo.confirmations_required}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">Est. Time</p>
                        <p className="text-sm font-bold">{depositInfo.estimated_time}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-center p-6">
                    <div className="text-center text-muted-foreground">
                      <QrCode className="h-16 w-16 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Select a network to generate deposit address</p>
                    </div>
                  </div>
                )}

                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Only send <strong>{CHAINS[receiveChain]?.label}</strong> network tokens to this address. Sending other tokens may result in permanent loss.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════ CONVERT TAB ═══════ */}
        <TabsContent value="convert" className="mt-4">
          <div className="max-w-lg mx-auto">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-info/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg"><ArrowDownUp className="h-5 w-5 text-primary" />Convert / Swap</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* From */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">From</Label>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <Select value={fromAsset} onValueChange={setFromAsset}>
                        <SelectTrigger className="w-[140px] border-0 bg-transparent p-0 h-auto font-bold text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["BTC","ETH","BNB","USDT","USDC","SOL","TRX","MATIC","DOGE","LTC","AVAX"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" step="any" placeholder="0.00" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} className="text-right text-xl font-mono font-bold border-0 bg-transparent w-[180px] p-0 h-auto focus-visible:ring-0" />
                    </div>
                    {assetList.find((a) => a.symbol === fromAsset) && (
                      <p className="text-xs text-muted-foreground">Balance: {assetList.find((a) => a.symbol === fromAsset)?.balance} {fromAsset}</p>
                    )}
                  </div>
                </div>

                {/* Swap button */}
                <div className="flex justify-center -my-2">
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-2 border-primary/30 bg-background hover:bg-primary/10" onClick={() => { setFromAsset(toAsset); setToAsset(fromAsset); }}>
                    <ArrowDownUp className="h-4 w-4 text-primary" />
                  </Button>
                </div>

                {/* To */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">To</Label>
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center justify-between">
                      <Select value={toAsset} onValueChange={setToAsset}>
                        <SelectTrigger className="w-[140px] border-0 bg-transparent p-0 h-auto font-bold text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["BTC","ETH","BNB","USDT","USDC","SOL","TRX","MATIC","DOGE","LTC","AVAX"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xl font-mono font-bold text-muted-foreground">{swapQuote?.to_amount ?? "0.00"}</p>
                    </div>
                  </div>
                </div>

                {/* Quote details */}
                {swapQuote && (
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-xs border border-border/30">
                    <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-mono">1 {fromAsset} = {swapQuote.rate} {toAsset}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span className="font-mono">{swapQuote.fee} ({swapQuote.fee_usd})</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Slippage</span><span className="font-mono">{swapQuote.slippage}%</span></div>
                  </div>
                )}

                <Button className="w-full h-11 bg-gradient-gold text-primary-foreground font-semibold" disabled={!swapQuote || !convertAmount || swapMut.isPending || fromAsset === toAsset} onClick={() => swapMut.mutate()}>
                  <ArrowDownUp className="mr-1.5 h-4 w-4" />
                  {swapMut.isPending ? "Swapping..." : `Convert ${fromAsset} → ${toAsset}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════ HISTORY TAB ═══════ */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 pl-4">Type</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Asset</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Amount</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Date</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3 pr-4">TX</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx?.data?.length ? recentTx.data.map((tx) => (
                    <tr key={tx.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="p-3 pl-4">
                        <Badge variant="outline" className={`text-[10px] ${tx.direction === "receive" ? "border-success/30 text-success" : tx.direction === "swap" ? "border-primary/30 text-primary" : "border-destructive/30 text-destructive"}`}>
                          {tx.direction === "receive" ? <ArrowDown className="h-3 w-3 mr-1" /> : tx.direction === "swap" ? <ArrowDownUp className="h-3 w-3 mr-1" /> : <ArrowUp className="h-3 w-3 mr-1" />}
                          {tx.direction === "receive" ? "Receive" : tx.direction === "swap" ? "Swap" : "Send"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <CryptoIcon chain={tx.chain} size={20} />
                          <span className="text-sm font-medium">{tx.asset}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`text-sm font-mono font-medium ${tx.direction === "receive" ? "text-success" : ""}`}>
                          {tx.direction === "receive" ? "+" : "-"}{tx.amount}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge className={`text-[10px] border-0 ${tx.status === "confirmed" ? "bg-success/10 text-success" : tx.status === "pending" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</span>
                      </td>
                      <td className="p-3 pr-4 text-right">
                        {tx.tx_hash && (
                          <a href={tx.explorer_url ?? `#`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-mono">
                            {tx.tx_hash.slice(0, 8)}…<ExternalLink className="h-3 w-3 inline ml-1" />
                          </a>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-muted-foreground">
                        <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No transactions yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Security Notice ── */}
      <Card className="border-primary/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-xs font-medium">Enterprise Security:</p>
              {[
                { icon: <Shield className="h-3 w-3" />, text: "AES-256-GCM encryption" },
                { icon: <Lock className="h-3 w-3" />, text: "Hardware wallet isolation" },
                { icon: <Key className="h-3 w-3" />, text: "Multi-sig support" },
                { icon: <AlertTriangle className="h-3 w-3" />, text: "2FA + anomaly detection" },
              ].map((s) => (
                <Badge key={s.text} variant="outline" className="text-[10px] gap-1">{s.icon}{s.text}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Dialogs ── */}
      <WalletConnectPanel open={showConnect} onOpenChange={setShowConnect} onWalletConnected={handleWalletConnected} />

      {/* Direct Send Dialog (when clicking send on a specific wallet) */}
      <Dialog open={!!sendWallet && activeTab === "overview"} onOpenChange={() => { setSendWallet(null); setSendTo(""); setSendAmount(""); setSendConfirm(false); setSendMemo(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" />{t("wallets.sendWithdraw")}</DialogTitle>
            <DialogDescription>Send from {sendWallet?.label}</DialogDescription>
          </DialogHeader>
          {sendWallet && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-lg font-bold font-display">{sendWallet.balance}</p>
                </div>
                <Badge variant="outline">{sendWallet.type === "hot" ? "🔥 Hot" : "🧊 Cold"}</Badge>
              </div>
              <div className="space-y-2"><Label>To</Label><Input placeholder="0x..." value={sendTo} onChange={(e) => setSendTo(e.target.value)} className="font-mono text-sm" /></div>
              <div className="space-y-2"><Label>Amount</Label>
                <div className="relative">
                  <Input type="number" step="any" placeholder="0.00" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} className="pr-16" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-8 text-xs text-primary" onClick={() => setSendAmount(sendWallet.balance)}>MAX</Button>
                </div>
              </div>
              <Button className="w-full bg-gradient-gold text-primary-foreground font-semibold" disabled={!sendTo || !sendAmount || sendMut.isPending} onClick={() => sendMut.mutate()}>
                <ShieldCheck className="mr-1.5 h-4 w-4" />{t("wallets.confirmSend")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Wallet Detail Dialog */}
      <Dialog open={!!selectedWallet} onOpenChange={() => { setSelectedWallet(null); setShowPrivateKey(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />{selectedWallet?.label}</DialogTitle>
            <DialogDescription>Wallet details & key management</DialogDescription>
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
                    <Badge variant="outline">{selectedWallet.type}</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Address</Label>
                <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                  <code className="text-xs font-mono break-all flex-1">{selectedWallet.address}</code>
                  <CopyButton value={selectedWallet.address} />
                </div>
              </div>
              {selectedWallet.xpub && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">xpub</Label>
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                    <code className="text-xs font-mono break-all flex-1 truncate">{selectedWallet.xpub}</code>
                    <CopyButton value={selectedWallet.xpub} />
                  </div>
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Key className="h-3 w-3" />Private Key</Label>
                  <Button variant="ghost" size="sm" onClick={() => setShowPrivateKey(!showPrivateKey)} className="text-xs">
                    {showPrivateKey ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}{showPrivateKey ? "Hide" : "Reveal"}
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  {showPrivateKey ? (
                    <div className="space-y-2">
                      <code className="text-xs font-mono break-all text-destructive">Private key stored encrypted in HSM. Export requires 2FA + admin approval.</code>
                      <Button variant="destructive" size="sm" className="w-full"><Lock className="mr-1.5 h-3.5 w-3.5" />Request Export (2FA Required)</Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">Click "Reveal" to view options</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}