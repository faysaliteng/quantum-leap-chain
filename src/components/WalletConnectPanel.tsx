import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Wallet, Usb, QrCode, Smartphone, Shield, ShieldCheck, Lock,
  ExternalLink, AlertTriangle, Check, Loader2, Link2, Unplug,
  ArrowRight, RefreshCw, MonitorSmartphone, Plus, Eye, EyeOff, Copy, Download,
} from "lucide-react";
import { wallets, admin } from "@/lib/api-client";
import type { ChainId } from "@/lib/types";

const chainLabels: Record<string, string> = {
  btc: "Bitcoin", eth: "Ethereum", bsc: "BNB Chain", polygon: "Polygon",
  arbitrum: "Arbitrum", optimism: "Optimism", solana: "Solana", tron: "Tron",
  ltc: "Litecoin", doge: "Dogecoin", avax: "Avalanche", fantom: "Fantom", base: "Base",
};

const chainIcons: Record<string, string> = {
  btc: "₿", eth: "Ξ", bsc: "🔶", polygon: "🟣",
  arbitrum: "🔵", optimism: "🔴", solana: "◎", tron: "♦",
  ltc: "Ł", doge: "🐕", avax: "🔺", fantom: "👻", base: "🔵",
};

// Wallets that inject window.ethereum (EIP-1193)
const injectedWallets = [
  { name: "MetaMask", icon: "🦊", desc: "Browser extension & mobile wallet", rdns: "io.metamask" },
  { name: "Coinbase Wallet", icon: "🔵", desc: "Self-custody by Coinbase", rdns: "com.coinbase.wallet" },
  { name: "Trust Wallet", icon: "🛡️", desc: "Mobile-first multi-chain wallet", rdns: "com.trustwallet.app" },
  { name: "Phantom", icon: "👻", desc: "Multi-chain DeFi wallet", rdns: "app.phantom" },
  { name: "OKX Wallet", icon: "⭕", desc: "Multi-chain Web3 gateway", rdns: "com.okex.wallet" },
  { name: "Rainbow", icon: "🌈", desc: "Beautiful Ethereum wallet", rdns: "me.rainbow" },
];

const hardwareWallets = [
  { name: "Ledger (via MetaMask)", icon: "🔐", desc: "Connect Ledger through MetaMask or Ledger Live browser extension", protocol: "ledger" },
  { name: "Trezor (via MetaMask)", icon: "🛡️", desc: "Connect Trezor through MetaMask's hardware wallet integration", protocol: "trezor" },
  { name: "Keystone (via QR)", icon: "📱", desc: "Air-gapped signing — connect via MetaMask QR-based integration", protocol: "keystone" },
  { name: "GridPlus Lattice1", icon: "🔲", desc: "Enterprise hardware — connect via MetaMask's Lattice integration", protocol: "gridplus" },
];

type ConnectMethod = "create" | "walletconnect" | "hardware" | "manual";
type ConnectionStatus = "idle" | "connecting" | "connected" | "error";
type PanelContext = "merchant" | "admin";

interface WalletConnectPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: PanelContext;
  onWalletConnected: (wallet: {
    label: string;
    chain: ChainId;
    address: string;
    type: "hot" | "cold";
    connection_method: string;
  }) => void;
}

function getEthereumProvider(): any | null {
  if (typeof window === "undefined") return null;
  return (window as any).ethereum ?? null;
}

/* ── Create Wallet Sub-component ── */
function CreateWalletTab({ onWalletConnected, onClose, context = "merchant" }: {
  onWalletConnected: WalletConnectPanelProps["onWalletConnected"];
  onClose: () => void;
  context?: PanelContext;
}) {
  const [step, setStep] = useState<"select" | "generating" | "reveal">("select");
  const [chain, setChain] = useState("eth");
  const [label, setLabel] = useState("");
  const [result, setResult] = useState<{
    address: string; private_key: string; mnemonic: string | null;
  } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!label.trim()) return;
    setStep("generating");
    setError("");
    try {
      const generateFn = context === "admin" ? admin.wallets.generate : wallets.generate;
      const res = await generateFn({ label: label.trim(), chain });
      setResult({ address: res.address, private_key: res.private_key, mnemonic: res.mnemonic });
      setStep("reveal");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to generate wallet");
      setStep("select");
    }
  };

  const copyToClipboard = (text: string, what: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${what} copied to clipboard`);
  };

  const handleConfirm = () => {
    if (!result) return;
    onWalletConnected({
      label,
      chain: chain as ChainId,
      address: result.address,
      type: "hot",
      connection_method: "generated",
    });
    toast.success("Wallet created successfully!");
    onClose();
  };

  if (step === "select") {
    return (
      <div className="space-y-4">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-xs flex items-start gap-2">
          <Plus className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <div>
            <p className="font-medium text-foreground">Generate New Wallet</p>
            <p className="text-muted-foreground">
              A real blockchain address will be created. You'll receive your private key and recovery phrase — save them securely. They are shown <strong>once</strong>.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label>Wallet Name</Label>
          <Input
            placeholder="e.g. My ETH Wallet"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Blockchain</Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(chainLabels).map(([key, name]) => (
              <button
                key={key}
                onClick={() => setChain(key)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all ${
                  chain === key
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/30 hover:bg-muted"
                }`}
              >
                <span className="text-lg">{chainIcons[key] || "🔗"}</span>
                <span className="font-medium">{name}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          className="w-full bg-gradient-gold text-primary-foreground"
          onClick={handleGenerate}
          disabled={!label.trim()}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Create {chainLabels[chain]} Wallet
        </Button>
      </div>
    );
  }

  if (step === "generating") {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="relative mx-auto w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="text-4xl">{chainIcons[chain] || "🔗"}</span>
          <div className="absolute inset-0 rounded-2xl border-2 border-primary animate-pulse" />
        </div>
        <div>
          <p className="font-semibold">Generating {chainLabels[chain]} Wallet…</p>
          <p className="text-sm text-muted-foreground">Creating keypair with native {chain.toUpperCase()} cryptography</p>
        </div>
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  // step === "reveal"
  return (
    <div className="space-y-4">
      <div className="text-center py-3">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
          <Check className="h-8 w-8 text-success" />
        </div>
        <p className="font-semibold text-success">Wallet Created!</p>
        <p className="text-xs text-muted-foreground mt-1">{chainLabels[chain]} · {label}</p>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Wallet Address</Label>
        <div className="flex items-center gap-2 bg-muted rounded-lg p-2.5">
          <code className="font-mono text-xs flex-1 break-all">{result?.address}</code>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(result!.address, "Address")}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Private Key */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Private Key</Label>
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-2.5 space-y-2">
          <div className="flex items-center gap-2">
            {showKey ? (
              <code className="font-mono text-xs flex-1 break-all text-destructive">{result?.private_key}</code>
            ) : (
              <span className="flex-1 text-xs text-muted-foreground italic">Hidden — click eye to reveal</span>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            {showKey && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(result!.private_key, "Private key")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mnemonic */}
      {result?.mnemonic && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Recovery Phrase (Mnemonic)</Label>
          <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
            <div className="grid grid-cols-3 gap-1.5">
              {result.mnemonic.split(" ").map((word, i) => (
                <div key={i} className="flex items-center gap-1 bg-background rounded px-2 py-1">
                  <span className="text-[10px] text-muted-foreground w-4">{i + 1}.</span>
                  <span className="font-mono text-xs">{word}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => copyToClipboard(result!.mnemonic!, "Recovery phrase")}>
              <Copy className="mr-1 h-3 w-3" /> Copy Recovery Phrase
            </Button>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold text-destructive">Save your keys NOW!</p>
          <p className="text-muted-foreground">
            This is the <strong>only time</strong> your private key and recovery phrase will be shown.
            Store them in a secure location. If you lose them, your funds cannot be recovered.
          </p>
        </div>
      </div>

      {/* Confirm checkbox */}
      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-1 accent-primary" />
        <span className="text-xs text-muted-foreground">
          I have securely saved my private key and recovery phrase. I understand they will not be shown again.
        </span>
      </label>

      <Button
        className="w-full bg-gradient-gold text-primary-foreground"
        onClick={handleConfirm}
        disabled={!saved}
      >
        <ShieldCheck className="mr-1.5 h-4 w-4" /> I've Saved My Keys — Continue
      </Button>
    </div>
  );
}

/* ── Main Panel ── */
export function WalletConnectPanel({ open, onOpenChange, onWalletConnected, context = "merchant" }: WalletConnectPanelProps) {
  const [method, setMethod] = useState<ConnectMethod>("create");
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [selectedHW, setSelectedHW] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({ label: "", chain: "eth" as ChainId, address: "", type: "hot" as "hot" | "cold", xpub: "" });
  const [connectedAddress, setConnectedAddress] = useState("");
  const [connectedWalletName, setConnectedWalletName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const resetState = () => {
    setStatus("idle");
    setSelectedHW(null);
    setConnectedAddress("");
    setConnectedWalletName("");
    setErrorMessage("");
    setManualForm({ label: "", chain: "eth", address: "", type: "hot", xpub: "" });
  };

  const connectInjectedWallet = useCallback(async (walletName: string) => {
    const provider = getEthereumProvider();
    if (!provider) {
      setErrorMessage(`No wallet extension detected. Please install ${walletName} browser extension and refresh the page.`);
      setStatus("error");
      return;
    }
    setStatus("connecting");
    setConnectedWalletName(walletName);
    setErrorMessage("");
    try {
      const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) throw new Error("No accounts returned. User may have rejected the request.");
      setConnectedAddress(accounts[0]);
      setStatus("connected");
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      const msg = err?.code === 4001 ? "Connection rejected by user." : err?.message || "Failed to connect wallet. Please try again.";
      setErrorMessage(msg);
      setStatus("error");
    }
  }, []);

  const connectHardwareWallet = useCallback(async (walletName: string, protocol: string) => {
    const provider = getEthereumProvider();
    if (!provider) {
      setErrorMessage(`Hardware wallets connect through browser extensions. Please:\n1. Install MetaMask\n2. Connect your ${walletName} in MetaMask settings\n3. Try again`);
      setStatus("error");
      return;
    }
    setStatus("connecting");
    setConnectedWalletName(walletName);
    setSelectedHW(protocol);
    setErrorMessage("");
    try {
      const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) throw new Error("No accounts returned.");
      setConnectedAddress(accounts[0]);
      setStatus("connected");
    } catch (err: any) {
      console.error("Hardware wallet connection failed:", err);
      const msg = err?.code === 4001 ? "Connection rejected by user." : err?.message || "Failed to connect. Ensure your hardware wallet is unlocked and connected.";
      setErrorMessage(msg);
      setStatus("error");
    }
  }, []);

  const handleConfirmConnect = (isHardware: boolean) => {
    if (!connectedAddress) return;
    onWalletConnected({
      label: connectedWalletName,
      chain: "eth",
      address: connectedAddress,
      type: isHardware ? "cold" : "hot",
      connection_method: isHardware ? `hardware:${selectedHW}` : "walletconnect",
    });
    toast.success(`${connectedWalletName} connected successfully`);
    resetState();
    onOpenChange(false);
  };

  const handleManualSubmit = () => {
    if (!manualForm.label || !manualForm.address) return;
    onWalletConnected({
      label: manualForm.label,
      chain: manualForm.chain,
      address: manualForm.address,
      type: manualForm.type,
      connection_method: "manual",
    });
    toast.success("Wallet imported successfully");
    resetState();
    onOpenChange(false);
  };

  const hasProvider = typeof window !== "undefined" && !!(window as any).ethereum;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />Wallet Manager
          </DialogTitle>
          <DialogDescription>
            Create a new wallet, connect via browser extension, hardware device, or import manually
          </DialogDescription>
        </DialogHeader>

        <Tabs value={method} onValueChange={(v) => { setMethod(v as ConnectMethod); resetState(); }}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="create" className="text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />Create
            </TabsTrigger>
            <TabsTrigger value="walletconnect" className="text-xs gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />Web3
            </TabsTrigger>
            <TabsTrigger value="hardware" className="text-xs gap-1.5">
              <Usb className="h-3.5 w-3.5" />Hardware
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs gap-1.5">
              <Wallet className="h-3.5 w-3.5" />Import
            </TabsTrigger>
          </TabsList>

          {/* ── Create New Wallet Tab ── */}
          <TabsContent value="create" className="space-y-4 mt-4">
            <CreateWalletTab
              onWalletConnected={onWalletConnected}
              onClose={() => { resetState(); onOpenChange(false); }}
              context={context}
            />
          </TabsContent>

          {/* ── Web3 Wallet Tab ── */}
          <TabsContent value="walletconnect" className="space-y-4 mt-4">
            {status === "idle" && (
              <>
                {!hasProvider && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                    <div>
                      <p className="font-medium text-foreground">No Wallet Detected</p>
                      <p className="text-muted-foreground">Install a Web3 wallet extension (e.g. MetaMask) to connect. Or use Manual Import below.</p>
                    </div>
                  </div>
                )}
                <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground flex items-start gap-2">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">EIP-1193 Provider</p>
                    <p>Connect any injected Web3 wallet. Your private keys never leave your wallet.</p>
                  </div>
                </div>
                <div className="grid gap-2">
                  {injectedWallets.map((w) => (
                    <button key={w.name} onClick={() => connectInjectedWallet(w.name)} disabled={!hasProvider}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="text-2xl">{w.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{w.name}</p>
                        <p className="text-xs text-muted-foreground">{w.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {status === "connecting" && (
              <div className="text-center py-8 space-y-4">
                <div className="relative mx-auto w-24 h-24 rounded-2xl bg-muted flex items-center justify-center">
                  <Smartphone className="h-10 w-10 text-muted-foreground" />
                  <div className="absolute inset-0 rounded-2xl border-2 border-primary animate-pulse" />
                </div>
                <div>
                  <p className="font-semibold">Connecting to {connectedWalletName}…</p>
                  <p className="text-sm text-muted-foreground">Approve the connection request in your wallet</p>
                </div>
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-3">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="font-semibold text-destructive">Connection Failed</p>
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{errorMessage}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={resetState}>
                  <RefreshCw className="mr-1.5 h-4 w-4" /> Try Again
                </Button>
              </div>
            )}

            {status === "connected" && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
                    <Check className="h-8 w-8 text-success" />
                  </div>
                  <p className="font-semibold text-success">Connected to {connectedWalletName}</p>
                </div>
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Address</span>
                    <code className="font-mono text-xs truncate max-w-[220px]">{connectedAddress}</code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <Badge className="bg-success/10 text-success border-0">Hot Wallet</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Protocol</span>
                    <Badge variant="outline">EIP-1193</Badge>
                  </div>
                </div>
                <Button className="w-full bg-gradient-gold text-primary-foreground" onClick={() => handleConfirmConnect(false)}>
                  <ShieldCheck className="mr-1.5 h-4 w-4" />Confirm & Add Wallet
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Hardware Wallet Tab ── */}
          <TabsContent value="hardware" className="space-y-4 mt-4">
            {status === "idle" && (
              <>
                <div className="bg-info/10 border border-info/20 rounded-lg p-3 text-xs flex items-start gap-2">
                  <Usb className="h-4 w-4 shrink-0 mt-0.5 text-info" />
                  <div>
                    <p className="font-medium text-foreground">Hardware Wallet Connection</p>
                    <p className="text-muted-foreground">
                      Hardware wallets connect through your browser extension (e.g. MetaMask with Ledger/Trezor).
                      Private keys never leave the device.
                    </p>
                  </div>
                </div>
                {!hasProvider && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                    <div>
                      <p className="font-medium text-foreground">Extension Required</p>
                      <p className="text-muted-foreground">Install MetaMask and connect your hardware wallet in its settings first.</p>
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  {hardwareWallets.map((hw) => (
                    <button key={hw.protocol} onClick={() => connectHardwareWallet(hw.name, hw.protocol)} disabled={!hasProvider}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-info/40 hover:bg-info/5 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="text-2xl">{hw.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{hw.name}</p>
                        <p className="text-xs text-muted-foreground">{hw.desc}</p>
                      </div>
                      <Usb className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {status === "connecting" && (
              <div className="text-center py-8 space-y-4">
                <div className="relative mx-auto w-24 h-24 rounded-2xl bg-info/10 flex items-center justify-center">
                  <Usb className="h-10 w-10 text-info" />
                  <div className="absolute inset-0 rounded-2xl border-2 border-info animate-pulse" />
                </div>
                <div>
                  <p className="font-semibold">Connecting to {connectedWalletName}…</p>
                  <p className="text-sm text-muted-foreground">Approve the connection in your wallet extension. Ensure your device is unlocked.</p>
                </div>
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-info" />
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-3">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="font-semibold text-destructive">Connection Failed</p>
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{errorMessage}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={resetState}>
                  <RefreshCw className="mr-1.5 h-4 w-4" /> Try Again
                </Button>
              </div>
            )}

            {status === "connected" && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
                    <ShieldCheck className="h-8 w-8 text-success" />
                  </div>
                  <p className="font-semibold text-success">{connectedWalletName} Connected</p>
                  <p className="text-xs text-muted-foreground">Private keys remain on your hardware device</p>
                </div>
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Address</span>
                    <code className="font-mono text-xs truncate max-w-[220px]">{connectedAddress}</code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <Badge className="bg-info/10 text-info border-0">Cold Wallet</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Device</span>
                    <Badge variant="outline">{connectedWalletName}</Badge>
                  </div>
                </div>
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-2">
                  <Lock className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Transactions will require physical confirmation on your hardware device. Keys never leave the device.
                  </p>
                </div>
                <Button className="w-full bg-gradient-gold text-primary-foreground" onClick={() => handleConfirmConnect(true)}>
                  <ShieldCheck className="mr-1.5 h-4 w-4" />Confirm & Add Wallet
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Manual Import Tab ── */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Wallet Label</Label>
              <Input placeholder="e.g. Treasury Cold Storage" value={manualForm.label} onChange={(e) => setManualForm((f) => ({ ...f, label: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Chain</Label>
                <Select value={manualForm.chain} onValueChange={(v) => setManualForm((f) => ({ ...f, chain: v as ChainId }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(chainLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={manualForm.type} onValueChange={(v) => setManualForm((f) => ({ ...f, type: v as "hot" | "cold" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot">🔥 Hot Wallet</SelectItem>
                    <SelectItem value="cold">🧊 Cold Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <Input placeholder="0x... or bc1..." value={manualForm.address} onChange={(e) => setManualForm((f) => ({ ...f, address: e.target.value }))} className="font-mono text-sm" />
            </div>
            {manualForm.type === "cold" && (
              <div className="space-y-2">
                <Label>XPUB (Optional)</Label>
                <Input placeholder="xpub6..." value={manualForm.xpub} onChange={(e) => setManualForm((f) => ({ ...f, xpub: e.target.value }))} className="font-mono text-xs" />
                <p className="text-xs text-muted-foreground">For HD wallet address derivation (watch-only)</p>
              </div>
            )}
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-warning">Watch-only mode:</strong> Manually imported wallets are watch-only unless you provide signing authority through a connected Web3 wallet or hardware device.
              </p>
            </div>
            <Button className="w-full" onClick={handleManualSubmit} disabled={!manualForm.label.trim() || !manualForm.address.trim()}>
              Import Wallet
            </Button>
          </TabsContent>
        </Tabs>

        <div className="border-t border-border pt-3 mt-2">
          <p className="text-xs text-muted-foreground text-center">
            Supported: EIP-1193 · MetaMask · Coinbase Wallet · Ledger · Trezor · Trust Wallet · 100+ injected wallets
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
