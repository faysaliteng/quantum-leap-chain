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
  ArrowRight, RefreshCw, MonitorSmartphone,
} from "lucide-react";
import type { ChainId } from "@/lib/types";

const chainLabels: Record<string, string> = {
  btc: "Bitcoin", eth: "Ethereum", arbitrum: "Arbitrum", optimism: "Optimism", polygon: "Polygon",
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

type ConnectMethod = "walletconnect" | "hardware" | "manual";
type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

interface WalletConnectPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletConnected: (wallet: {
    label: string;
    chain: ChainId;
    address: string;
    type: "hot" | "cold";
    connection_method: string;
  }) => void;
}

// Detect if an EIP-1193 provider is available
function getEthereumProvider(): any | null {
  if (typeof window === "undefined") return null;
  // EIP-6963 multi-provider or legacy
  return (window as any).ethereum ?? null;
}

export function WalletConnectPanel({ open, onOpenChange, onWalletConnected }: WalletConnectPanelProps) {
  const [method, setMethod] = useState<ConnectMethod>("walletconnect");
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
      // Request account access via EIP-1193
      const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned. User may have rejected the request.");
      }

      const address = accounts[0];
      setConnectedAddress(address);
      setStatus("connected");
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      const msg = err?.code === 4001
        ? "Connection rejected by user."
        : err?.message || "Failed to connect wallet. Please try again.";
      setErrorMessage(msg);
      setStatus("error");
    }
  }, []);

  const connectHardwareWallet = useCallback(async (walletName: string, protocol: string) => {
    // Hardware wallets connect through browser extensions (MetaMask + Ledger/Trezor, etc.)
    const provider = getEthereumProvider();
    if (!provider) {
      setErrorMessage(
        `Hardware wallets connect through browser extensions. Please:\n1. Install MetaMask\n2. Connect your ${walletName} in MetaMask settings\n3. Try again`
      );
      setStatus("error");
      return;
    }

    setStatus("connecting");
    setConnectedWalletName(walletName);
    setSelectedHW(protocol);
    setErrorMessage("");

    try {
      const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned.");
      }
      setConnectedAddress(accounts[0]);
      setStatus("connected");
    } catch (err: any) {
      console.error("Hardware wallet connection failed:", err);
      const msg = err?.code === 4001
        ? "Connection rejected by user."
        : err?.message || "Failed to connect. Ensure your hardware wallet is unlocked and connected.";
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
            <Link2 className="h-5 w-5 text-primary" />Connect Wallet
          </DialogTitle>
          <DialogDescription>
            Connect a hot wallet via browser extension, plug in a hardware wallet, or import manually
          </DialogDescription>
        </DialogHeader>

        <Tabs value={method} onValueChange={(v) => { setMethod(v as ConnectMethod); resetState(); }}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="walletconnect" className="text-xs gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />Web3 Wallet
            </TabsTrigger>
            <TabsTrigger value="hardware" className="text-xs gap-1.5">
              <Usb className="h-3.5 w-3.5" />Hardware
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs gap-1.5">
              <Wallet className="h-3.5 w-3.5" />Manual
            </TabsTrigger>
          </TabsList>

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
                    <button
                      key={w.name}
                      onClick={() => connectInjectedWallet(w.name)}
                      disabled={!hasProvider}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
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
                      <p className="text-muted-foreground">
                        Install MetaMask and connect your hardware wallet in its settings first.
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  {hardwareWallets.map((hw) => (
                    <button
                      key={hw.protocol}
                      onClick={() => connectHardwareWallet(hw.name, hw.protocol)}
                      disabled={!hasProvider}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-info/40 hover:bg-info/5 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
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

        {/* Supported protocols footer */}
        <div className="border-t border-border pt-3 mt-2">
          <p className="text-xs text-muted-foreground text-center">
            Supported: EIP-1193 · MetaMask · Coinbase Wallet · Ledger · Trezor · Trust Wallet · 100+ injected wallets
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
